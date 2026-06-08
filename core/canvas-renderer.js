import { GlobalParticles } from './ability-engine.js';
import { drawGroundLayer } from './rendering/ground-textures.js';
import { drawWeaponArcs } from './rendering/weapon-arc-renderer.js';
import { VISION_RADIUS, CANVAS_WIDTH } from '../data/world-config.js';

const WORLD_SIZE = CANVAS_WIDTH;
const FOG_TPL_MAX_W = 4000;
const FOG_TPL_MAX_H = 3000;

let forestObstacles = [];
let gradientCache = {
    viewW: 0,
    viewH: 0,
    fogStops: null,
};

let fogTemplateCache = {
    viewW: 0,
    viewH: 0,
    canvas: null,
    tplW: 0,
    tplH: 0,
    maxR: 0,
};

function rebuildFogTemplateCache(viewW, viewH) {
    if (fogTemplateCache.viewW === viewW && fogTemplateCache.viewH === viewH && fogTemplateCache.canvas) {
        return;
    }

    rebuildFogStopsCache(viewW, viewH);

    let maxR = Math.hypot(viewW, viewH) * 0.75;
    let tplW = Math.min(Math.ceil(viewW + maxR * 2), FOG_TPL_MAX_W);
    let tplH = Math.min(Math.ceil(viewH + maxR * 2), FOG_TPL_MAX_H);
    const cx = tplW / 2;
    const cy = tplH / 2;
    maxR = Math.min(maxR, cx - 1, cy - 1);
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = tplW;
    fogCanvas.height = tplH;
    const fctx = fogCanvas.getContext('2d');

    const fog = fctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    const stops = gradientCache.fogStops;
    for (const stop of stops) {
        fog.addColorStop(Math.min(stop.pos / maxR, 1), stop.color);
    }
    fog.addColorStop(1, '#030704');

    fctx.fillStyle = fog;
    fctx.fillRect(0, 0, tplW, tplH);
    fctx.fillStyle = 'rgba(3, 7, 4, 0.45)';
    fctx.fillRect(0, 0, tplW, tplH);

    fogTemplateCache.viewW = viewW;
    fogTemplateCache.viewH = viewH;
    fogTemplateCache.canvas = fogCanvas;
    fogTemplateCache.tplW = tplW;
    fogTemplateCache.tplH = tplH;
    fogTemplateCache.maxR = maxR;
}

function rebuildFogStopsCache(viewW, viewH) {
    if (gradientCache.viewW === viewW && gradientCache.viewH === viewH) return;

    gradientCache.viewW = viewW;
    gradientCache.viewH = viewH;
    gradientCache.fogStops = [
        { pos: 0, color: 'rgba(3, 7, 4, 0)' },
        { pos: VISION_RADIUS * 0.35, color: 'rgba(3, 7, 4, 0)' },
        { pos: VISION_RADIUS * 0.7, color: 'rgba(3, 7, 4, 0.12)' },
        { pos: VISION_RADIUS, color: 'rgba(3, 7, 4, 0.55)' },
        { pos: VISION_RADIUS + 80, color: 'rgba(3, 7, 4, 0.88)' },
        { pos: VISION_RADIUS + 200, color: '#030704' },
    ];
}

export function initForestEnvironment(worldWidth = WORLD_SIZE, worldHeight = WORLD_SIZE, count = 300) {
    forestObstacles = [];
    for (let i = 0; i < count; i++) {
        const isTree = Math.random() < 0.72;
        forestObstacles.push({
            x: 80 + Math.random() * (worldWidth - 160),
            y: 80 + Math.random() * (worldHeight - 160),
            type: isTree ? 'tree' : 'boulder',
            scale: 0.55 + Math.random() * 0.9,
            rotation: Math.random() * Math.PI * 2,
            canopyHue: 8 + Math.random() * 22,
            trunkWidth: 5 + Math.random() * 5,
            radius: isTree ? 18 + Math.random() * 22 : 14 + Math.random() * 18,
        });
    }
}

function isInView(wx, wy, camera, viewW, viewH, pad = 60) {
    return (
        wx >= camera.x - pad &&
        wx <= camera.x + viewW + pad &&
        wy >= camera.y - pad &&
        wy <= camera.y + viewH + pad
    );
}

export function drawForestBackground(ctx, camera, viewW, viewH) {
    drawGroundLayer(ctx, camera, viewW, viewH);
}

const GLOW_RGBA = {
    '#00e5ff': [0, 229, 255],
    '#ff44aa': [255, 68, 170],
    '#ff8800': [255, 136, 0],
    '#ffcc44': [255, 204, 68],
};

function drawGlowRing(c, x, y, radius, color, lineWidth, layers = 3) {
    const rgb = GLOW_RGBA[color] || [200, 200, 200];
    for (let i = layers; i >= 1; i--) {
        c.beginPath();
        c.arc(x, y, radius + i * 2, 0, Math.PI * 2);
        c.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.06 * i})`;
        c.lineWidth = lineWidth + i;
        c.stroke();
    }
}

function drawRuneGlow(c, x, y, radius, time, colorInner, colorOuter) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.004);
    c.beginPath();
    c.arc(x, y, radius * (0.9 + pulse * 0.1), 0, Math.PI * 2);
    c.strokeStyle = colorOuter;
    c.globalAlpha = 0.25 + pulse * 0.15;
    c.lineWidth = 3;
    c.stroke();
    c.beginPath();
    c.arc(x, y, radius * 0.55, 0, Math.PI * 2);
    c.strokeStyle = colorInner;
    c.globalAlpha = 0.45 + pulse * 0.25;
    c.lineWidth = 1.5;
    c.stroke();
    c.globalAlpha = 1;
}

function drawTree(ctx, obs, time) {
    const s = obs.scale;
    const tw = obs.trunkWidth * s;

    ctx.save();
    ctx.translate(obs.x, obs.y);
    ctx.rotate(obs.rotation);

    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(-tw * 0.5, 0, tw, 22 * s);

    const canopyR = obs.radius * s;
    const hue = obs.canopyHue;
    ctx.beginPath();
    ctx.moveTo(0, -canopyR * 1.1);
    ctx.lineTo(canopyR * 0.85, -canopyR * 0.1);
    ctx.lineTo(canopyR * 0.55, canopyR * 0.55);
    ctx.lineTo(-canopyR * 0.55, canopyR * 0.55);
    ctx.lineTo(-canopyR * 0.85, -canopyR * 0.1);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue}, 42%, 12%)`;
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue}, 30%, 8%)`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -canopyR * 0.35, canopyR * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue + 8}, 35%, 16%, 0.7)`;
    ctx.fill();

    const mossPulse = 0.4 + 0.3 * Math.sin(time * 0.0015 + obs.x);
    ctx.beginPath();
    ctx.ellipse(canopyR * 0.3, canopyR * 0.15, 6 * s, 3 * s, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(30, 55, 22, ${mossPulse})`;
    ctx.fill();

    ctx.restore();
}

function drawBoulder(ctx, obs, time) {
    const s = obs.scale;
    const r = obs.radius * s;

    ctx.save();
    ctx.translate(obs.x, obs.y);
    ctx.rotate(obs.rotation);

    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1814';
    ctx.fill();
    ctx.strokeStyle = '#2a2620';
    ctx.lineWidth = 2;
    ctx.stroke();

    const lichen = 0.35 + 0.25 * Math.sin(time * 0.001 + obs.y);
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.1, r * 0.35, r * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(28, 48, 24, ${lichen})`;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(r * 0.2, r * 0.05, r * 0.25, r * 0.15, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(22, 38, 20, ${lichen * 0.8})`;
    ctx.fill();

    ctx.restore();
}

export function drawEnvironmentObstacles(ctx, camera, viewW, viewH, visibilityFn, time = 0) {
    for (const obs of forestObstacles) {
        if (!visibilityFn(obs, camera)) continue;
        if (!isInView(obs.x, obs.y, camera, viewW, viewH, obs.radius + 20)) continue;
        if (obs.type === 'tree') drawTree(ctx, obs, time);
        else drawBoulder(ctx, obs, time);
    }
}

export function drawFogOfWar(ctx, playerX, playerY, camera, viewW, viewH) {
    rebuildFogTemplateCache(viewW, viewH);

    const screenX = playerX - camera.x;
    const screenY = playerY - camera.y;
    const { canvas: tpl, tplW, tplH } = fogTemplateCache;

    ctx.save();
    const destX = screenX - tplW / 2;
    const destY = screenY - tplH / 2;
    ctx.drawImage(tpl, destX, destY);
    ctx.restore();
}

function withOrientation(ctx, x, y, angle, drawFn) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    drawFn(ctx);
    ctx.restore();
}

export function drawHeroPyromancer(ctx, x, y, angle, speed = 0, time = 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
    const robeLen = 20;
    const shoulderW = 14;

    drawRuneGlow(ctx, x, y - 8, 38 + pulse * 6, time, 'rgba(0, 220, 255, 0.7)', 'rgba(0, 140, 180, 0.35)');

    withOrientation(ctx, x, y, angle, (c) => {
        c.beginPath();
        c.moveTo(robeLen, 0);
        c.lineTo(-robeLen * 0.6, shoulderW);
        c.lineTo(-robeLen, shoulderW * 0.4);
        c.lineTo(-robeLen, -shoulderW * 0.4);
        c.lineTo(-robeLen * 0.6, -shoulderW);
        c.closePath();
        c.fillStyle = '#1a1030';
        c.fill();
        c.strokeStyle = '#3a2860';
        c.lineWidth = 2;
        c.stroke();

        c.beginPath();
        c.arc(6, 0, 7, 0, Math.PI * 2);
        c.fillStyle = '#2a1848';
        c.fill();

        c.beginPath();
        c.arc(8, -2, 2.5, 0, Math.PI * 2);
        c.fillStyle = '#00e5ff';
        c.fill();
        c.beginPath();
        c.arc(8, 2, 2.5, 0, Math.PI * 2);
        c.fillStyle = '#00e5ff';
        c.fill();

        c.beginPath();
        c.moveTo(robeLen + 4, 0);
        c.lineTo(robeLen + 18, 0);
        c.strokeStyle = '#5a4080';
        c.lineWidth = 3;
        c.stroke();

        const staffTip = robeLen + 18;
        drawGlowRing(c, staffTip, 0, 4, '#00e5ff', 1, 4);
        c.beginPath();
        c.arc(staffTip, 0, 4 + pulse * 2, 0, Math.PI * 2);
        c.fillStyle = `rgba(0, 229, 255, ${0.6 + pulse * 0.3})`;
        c.fill();

        for (let i = 0; i < 3; i++) {
            const runeAngle = time * 0.003 + i * (Math.PI * 2 / 3);
            const rx = Math.cos(runeAngle) * 16;
            const ry = Math.sin(runeAngle) * 10;
            c.beginPath();
            c.arc(rx, ry, 2, 0, Math.PI * 2);
            c.fillStyle = `rgba(0, 200, 255, ${0.3 + pulse * 0.4})`;
            c.fill();
        }

        if (speed > 0.5) {
            const trailLen = Math.min(speed * 4, 18);
            c.beginPath();
            c.moveTo(-robeLen, 0);
            c.lineTo(-robeLen - trailLen, 0);
            c.strokeStyle = `rgba(0, 180, 220, ${0.25 + pulse * 0.15})`;
            c.lineWidth = 4;
            c.stroke();
        }
    });
}

export const drawHeroMage = drawHeroPyromancer;

export function drawHeroWarrior(ctx, x, y, angle, speed = 0, time = 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.006);

    withOrientation(ctx, x, y, angle, (c) => {
        const bodyR = 18;
        c.beginPath();
        c.ellipse(0, 0, bodyR, bodyR * 0.85, 0, 0, Math.PI * 2);
        c.fillStyle = '#2a1810';
        c.fill();
        c.strokeStyle = '#5a3828';
        c.lineWidth = 2;
        c.stroke();

        drawGlowRing(c, 22, -2, 3, '#ff8800', 2, 3);
        c.beginPath();
        c.moveTo(8, 0);
        c.lineTo(34, -2);
        c.lineTo(38, 0);
        c.lineTo(34, 2);
        c.closePath();
        c.fillStyle = '#3a2818';
        c.fill();
        c.strokeStyle = `rgba(255, 136, 0, ${0.8 + pulse * 0.2})`;
        c.lineWidth = 2;
        c.stroke();

        c.beginPath();
        c.arc(bodyR * 0.35, 0, 5, 0, Math.PI * 2);
        c.fillStyle = '#aa5522';
        c.fill();

        if (speed > 0.5) {
            c.beginPath();
            c.moveTo(-bodyR, 0);
            c.lineTo(-bodyR - Math.min(speed * 3, 14), 0);
            c.strokeStyle = `rgba(255, 120, 40, ${0.3 + pulse * 0.15})`;
            c.lineWidth = 5;
            c.stroke();
        }
    });
}

export function drawHeroRanger(ctx, x, y, angle, speed = 0, time = 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.007);

    withOrientation(ctx, x, y, angle, (c) => {
        c.beginPath();
        c.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
        c.fillStyle = '#142014';
        c.fill();
        c.strokeStyle = '#3a5a3a';
        c.lineWidth = 2;
        c.stroke();

        c.beginPath();
        c.arc(14, 0, 14, -Math.PI * 0.55, Math.PI * 0.55);
        c.strokeStyle = '#6a9a5a';
        c.lineWidth = 2;
        c.stroke();
        c.beginPath();
        c.moveTo(14, -14);
        c.lineTo(14, 14);
        c.strokeStyle = '#8fbc8f';
        c.lineWidth = 1.5;
        c.stroke();

        c.beginPath();
        c.moveTo(14, 0);
        c.lineTo(28, 0);
        c.strokeStyle = '#c8d8b8';
        c.lineWidth = 1;
        c.stroke();

        drawGlowRing(c, 6, -4, 2, '#6a9a5a', 1, 2);
        c.beginPath();
        c.arc(6, -4, 2, 0, Math.PI * 2);
        c.fillStyle = `rgba(143, 188, 143, ${0.7 + pulse * 0.3})`;
        c.fill();

        if (speed > 0.5) {
            c.beginPath();
            c.moveTo(-12, 0);
            c.lineTo(-12 - Math.min(speed * 3, 12), 0);
            c.strokeStyle = `rgba(106, 154, 90, ${0.25 + pulse * 0.15})`;
            c.lineWidth = 3;
            c.stroke();
        }
    });
}

export function drawHeroViking(ctx, x, y, angle, speed = 0, time = 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.004);

    drawRuneGlow(ctx, x, y, 44, time, 'rgba(200, 180, 120, 0.45)', 'rgba(160, 140, 80, 0.2)');

    withOrientation(ctx, x, y, angle, (c) => {
        const bodyR = 22;
        c.beginPath();
        c.ellipse(0, 0, bodyR, bodyR * 0.9, 0, 0, Math.PI * 2);
        c.fillStyle = '#2a2418';
        c.fill();
        c.strokeStyle = '#5a4a30';
        c.lineWidth = 4;
        c.stroke();

        c.beginPath();
        c.moveTo(-bodyR * 0.3, -bodyR * 0.8);
        c.lineTo(bodyR * 0.3, -bodyR * 0.8);
        c.lineTo(bodyR * 0.15, -bodyR * 1.2);
        c.lineTo(-bodyR * 0.15, -bodyR * 1.2);
        c.closePath();
        c.fillStyle = '#4a4030';
        c.fill();

        c.beginPath();
        c.moveTo(-18, -8);
        c.lineTo(-18, 18);
        c.quadraticCurveTo(-8, 22, 0, 18);
        c.lineTo(0, -8);
        c.closePath();
        c.fillStyle = '#3a3428';
        c.fill();
        c.strokeStyle = `rgba(255, 204, 68, ${0.6 + pulse * 0.3})`;
        c.lineWidth = 3;
        c.stroke();

        c.beginPath();
        c.moveTo(10, -6);
        c.lineTo(32, -10);
        c.lineTo(30, 6);
        c.lineTo(12, 4);
        c.closePath();
        c.fillStyle = '#5a4830';
        c.fill();

        if (speed > 0.5) {
            c.beginPath();
            c.moveTo(-bodyR, 0);
            c.lineTo(-bodyR - Math.min(speed * 2.5, 10), 0);
            c.strokeStyle = `rgba(200, 180, 100, ${0.2 + pulse * 0.1})`;
            c.lineWidth = 6;
            c.stroke();
        }
    });
}

export function drawHeroHybrid(ctx, x, y, angle, speed = 0, time = 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
    const morph = 0.5 + 0.5 * Math.sin(time * 0.002);

    withOrientation(ctx, x, y, angle, (c) => {
        c.beginPath();
        c.ellipse(0, 0, 16, 14 + morph * 4, 0, 0, Math.PI * 2);
        c.fillStyle = morph > 0.5 ? '#1a1428' : '#142018';
        c.fill();
        c.strokeStyle = morph > 0.5 ? '#6a4a8a' : '#4a7a5a';
        c.lineWidth = 2;
        c.stroke();

        c.beginPath();
        c.moveTo(16, 0);
        c.lineTo(26 + pulse * 4, -4 - morph * 3);
        c.lineTo(26 + pulse * 4, 4 + morph * 3);
        c.closePath();
        c.fillStyle = morph > 0.5 ? '#3a2850' : '#284030';
        c.fill();

        drawGlowRing(c, 5, -3, 2, morph > 0.5 ? '#ff44aa' : '#6a9a5a', 1, 2);
        c.beginPath();
        c.arc(5, -3, 2, 0, Math.PI * 2);
        c.fillStyle = morph > 0.5 ? '#ff66cc' : '#8fbc8f';
        c.fill();
        drawGlowRing(c, 5, 3, 2, morph > 0.5 ? '#00e5ff' : '#ff8800', 1, 2);
        c.beginPath();
        c.arc(5, 3, 2, 0, Math.PI * 2);
        c.fillStyle = morph > 0.5 ? '#00e5ff' : '#ffaa44';
        c.fill();

        if (speed > 0.5) {
            const trailLen = Math.min(speed * 3, 14);
            c.beginPath();
            c.moveTo(-16, 0);
            c.lineTo(-16 - trailLen, 0);
            c.strokeStyle = `rgba(120, 100, 180, ${0.2 + pulse * 0.15})`;
            c.lineWidth = 4;
            c.stroke();
        }
    });
}

export function drawScoutSprite(ctx, x, y, angle, time = 0, hpRatio = 1) {
    const eyePulse = 0.5 + 0.5 * Math.sin(time * 0.008);

    withOrientation(ctx, x, y, angle, (c) => {
        const bodyW = 10;
        const bodyH = 7;

        c.beginPath();
        c.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(8, 6, 14, 0.92)';
        c.fill();
        c.strokeStyle = 'rgba(40, 30, 55, 0.8)';
        c.lineWidth = 1.5;
        c.stroke();

        c.beginPath();
        c.moveTo(bodyW, 0);
        c.lineTo(bodyW + 8, -4);
        c.lineTo(bodyW + 8, 4);
        c.closePath();
        c.fillStyle = 'rgba(12, 8, 18, 0.9)';
        c.fill();

        c.beginPath();
        c.moveTo(-bodyW, -bodyH * 0.5);
        c.quadraticCurveTo(-bodyW - 10, -bodyH - 4, -bodyW - 6, 0);
        c.quadraticCurveTo(-bodyW - 10, bodyH + 4, -bodyW, bodyH * 0.5);
        c.fillStyle = 'rgba(6, 4, 10, 0.85)';
        c.fill();

        drawGlowRing(c, 4, -3, 2.5, '#ff44aa', 1, 3);
        c.beginPath();
        c.arc(4, -3, 2 + eyePulse * 1.2, 0, Math.PI * 2);
        c.fillStyle = `rgba(255, 50, 180, ${0.75 + eyePulse * 0.25})`;
        c.fill();

        drawGlowRing(c, 4, 3, 2.5, '#ff44aa', 1, 3);
        c.beginPath();
        c.arc(4, 3, 2 + eyePulse * 1.2, 0, Math.PI * 2);
        c.fillStyle = `rgba(255, 50, 180, ${0.75 + eyePulse * 0.25})`;
        c.fill();

        drawHpBar(c, 0, -bodyH - 10, bodyW * 2, 3, hpRatio, '#ff4488');
    });
}

export function drawWarriorBeast(ctx, x, y, angle, time = 0, hpRatio = 1) {
    const bladePulse = 0.5 + 0.5 * Math.sin(time * 0.006);

    withOrientation(ctx, x, y, angle, (c) => {
        const bodyR = 16;

        c.beginPath();
        c.ellipse(0, 0, bodyR, bodyR * 0.8, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(22, 16, 12, 0.95)';
        c.fill();
        c.strokeStyle = '#3a3028';
        c.lineWidth = 3;
        c.stroke();

        c.beginPath();
        c.moveTo(bodyR * 0.5, -bodyR * 0.5);
        c.lineTo(bodyR + 10, -bodyR * 0.3);
        c.lineTo(bodyR + 6, 0);
        c.lineTo(bodyR + 10, bodyR * 0.3);
        c.lineTo(bodyR * 0.5, bodyR * 0.5);
        c.closePath();
        c.fillStyle = 'rgba(30, 22, 16, 0.9)';
        c.fill();

        for (let side = -1; side <= 1; side += 2) {
            const bx = bodyR * 0.3;
            const by = side * bodyR * 0.55;
            c.save();
            c.translate(bx, by);
            c.rotate(side * 0.4);
            drawGlowRing(c, 14, 0, 3, '#ff8800', 2, 4);
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(22, -3);
            c.lineTo(26, 0);
            c.lineTo(22, 3);
            c.closePath();
            c.fillStyle = `rgba(50, 35, 20, 0.95)`;
            c.fill();
            c.strokeStyle = `rgba(255, 136, 0, ${0.7 + bladePulse * 0.3})`;
            c.lineWidth = 2;
            c.stroke();
            c.beginPath();
            c.moveTo(20, 0);
            c.lineTo(28, 0);
            c.strokeStyle = `rgba(255, 170, 50, ${0.8 + bladePulse * 0.2})`;
            c.lineWidth = 3;
            c.stroke();
            c.restore();
        }

        c.beginPath();
        c.arc(bodyR * 0.4, 0, 4, 0, Math.PI * 2);
        c.fillStyle = '#ff6600';
        c.fill();

        drawHpBar(c, 0, -bodyR - 12, bodyR * 2, 4, hpRatio, '#ff6644');
    });
}

export function drawAncientGolem(ctx, x, y, angle, time = 0, hpRatio = 1) {
    const shieldSpin = time * 0.001;
    const corePulse = 0.6 + 0.4 * Math.sin(time * 0.003);

    drawRuneGlow(ctx, x, y, 72, time, 'rgba(255, 210, 60, 0.5)', 'rgba(255, 180, 40, 0.2)');

    withOrientation(ctx, x, y, angle, (c) => {
        const hullR = 38;
        const shieldR = hullR + 16;

        c.beginPath();
        c.moveTo(-hullR * 0.6, -hullR);
        c.lineTo(hullR * 0.5, -hullR * 0.9);
        c.lineTo(hullR, -hullR * 0.2);
        c.lineTo(hullR * 0.8, hullR * 0.7);
        c.lineTo(0, hullR);
        c.lineTo(-hullR * 0.9, hullR * 0.5);
        c.lineTo(-hullR, -hullR * 0.3);
        c.closePath();
        c.fillStyle = '#2a2218';
        c.fill();
        c.strokeStyle = '#4a3c28';
        c.lineWidth = 5;
        c.stroke();

        drawGlowRing(c, 0, 0, shieldR, '#ffcc44', 4, 2);

        for (let s = 0; s < 4; s++) {
            const start = shieldSpin + s * (Math.PI / 2);
            const end = start + Math.PI * 0.42;
            const segPulse = 0.45 + 0.25 * Math.sin(time * 0.004 + s);
            c.beginPath();
            c.arc(0, 0, shieldR, start, end);
            c.strokeStyle = `rgba(255, 210, 60, ${segPulse})`;
            c.lineWidth = 6;
            c.stroke();

            const mid = (start + end) / 2;
            const rx = Math.cos(mid) * shieldR;
            const ry = Math.sin(mid) * shieldR;
            c.save();
            c.translate(rx, ry);
            c.rotate(mid + Math.PI / 2);
            c.strokeStyle = `rgba(255, 230, 120, ${segPulse})`;
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(-4, 0);
            c.lineTo(4, 0);
            c.moveTo(0, -4);
            c.lineTo(0, 4);
            c.stroke();
            c.restore();
        }

        c.beginPath();
        c.arc(0, -hullR * 0.15, 12 * corePulse, 0, Math.PI * 2);
        c.fillStyle = `rgba(255, 200, 50, ${0.75 * corePulse})`;
        c.fill();
        drawGlowRing(c, 0, -hullR * 0.15, 14, '#ffcc44', 2, 5);

        c.beginPath();
        c.arc(-10, -hullR * 0.55, 5, 0, Math.PI * 2);
        c.arc(10, -hullR * 0.55, 5, 0, Math.PI * 2);
        c.fillStyle = '#1a1408';
        c.fill();

        drawHpBar(c, 0, -hullR - 18, hullR * 2, 6, hpRatio, { fillColor: '#ffcc00', isBoss: true });
    });
}

export function drawCreepModel(ctx, creep, time = 0) {
    const hpRatio = creep.hp / creep.maxHp;
    const angle = creep.facingAngle ?? 0;

    if (creep.state === 'AGGRO') {
        ctx.save();
        ctx.translate(creep.x, creep.y);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#8b2020';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, creep.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    switch (creep.typeKey) {
        case 'scout':
            drawScoutSprite(ctx, creep.x, creep.y, angle, time, hpRatio);
            break;
        case 'warrior':
            drawWarriorBeast(ctx, creep.x, creep.y, angle, time, hpRatio);
            break;
        case 'ancient':
            drawAncientGolem(ctx, creep.x, creep.y, angle, time, hpRatio);
            break;
        default:
            drawWarriorBeast(ctx, creep.x, creep.y, angle, time, hpRatio);
    }
}

export function drawHpBar(c, cx, topY, width, height, ratio, options = {}) {
    const {
        fillColor = '#ff6644',
        isBoss = false,
    } = typeof options === 'string' ? { fillColor: options } : options;

    const barW = isBoss ? width * 1.4 : width;
    const barH = isBoss ? Math.max(height, 6) : height;
    const borderColor = isBoss ? 'rgba(201, 162, 39, 0.7)' : 'rgba(80, 90, 75, 0.6)';
    const clamped = Math.max(0, Math.min(1, ratio));

    c.save();
    c.translate(cx - barW / 2, topY);

    c.fillStyle = 'rgba(3, 7, 4, 0.92)';
    c.fillRect(-1, -1, barW + 2, barH + 2);

    c.strokeStyle = borderColor;
    c.lineWidth = 1;
    c.strokeRect(0, 0, barW, barH);

    if (clamped > 0) {
        const grad = c.createLinearGradient(0, 0, barW * clamped, 0);
        grad.addColorStop(0, fillColor);
        grad.addColorStop(1, isBoss ? '#e74c3c' : adjustColor(fillColor, -30));
        c.fillStyle = grad;
        c.fillRect(0, 0, barW * clamped, barH);
    }

    c.restore();
}

function adjustColor(hex, amount) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
}

const BOT_CLASS_COLORS = {
    Warrior:      '#d4691f',
    'Tank-Viking':'#8b4513',
    Mage:         '#6666ff',
    Ranger:       '#66ff66',
    Hybrid:       '#ff66ff',
};

/**
 * Passive observer draw for AI bots — world-space coords (camera translate active).
 */
export function drawBotModel(ctx, bot) {
    if (!bot?.isAlive) return;

    const { x, y, radius, facingAngle, heroClass, hp, maxHp } = bot;
    const fillColor = BOT_CLASS_COLORS[heroClass] ?? '#999999';

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(240, 230, 200, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const arrowLen = radius * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
        x + Math.cos(facingAngle) * arrowLen,
        y + Math.sin(facingAngle) * arrowLen
    );
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const hpRatio = maxHp > 0 ? hp / maxHp : 0;
    drawHpBar(ctx, x, y - radius - 10, radius * 2, 4, hpRatio, '#ff6644');
}

/**
 * Legacy arcane projectile entry — delegates to the shared decorated renderer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} proj — projectile state (world coords)
 * @param {object} camera
 * @param {number} [time=0] — retained for API compatibility
 */
export function drawMagicProjectile(ctx, proj, camera, time = 0) {
    void time;
    drawDecoratedProjectile(ctx, { type: 'firebolt', ...proj }, camera);
}

export function drawBlightZone(ctx, cx, cy, radius, time = 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.002);

    ctx.save();
    ctx.strokeStyle = `rgba(120, 30, 30, ${0.6 + pulse * 0.2})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = `rgba(180, 50, 40, ${0.4 + pulse * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.08 + pulse * 0.04;
    ctx.fillStyle = 'rgba(80, 15, 15, 0.5)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function resolveFacingAngle(vx, vy, fallbackAngle = 0) {
    const mag = Math.hypot(vx, vy);
    if (mag < 0.01) return fallbackAngle;
    return Math.atan2(vy, vx);
}

let visualAnimationTick = 0;

/**
 * Main Terrain and Biome Renderer Pass with strict Viewport Culling.
 * Expects world-space coordinates (call inside a camera-translated context).
 */
export function drawTerrainBiomes(ctx, camera, canvasW, canvasH, deltaTime) {
    visualAnimationTick += deltaTime;

    const viewMinX = camera.x - 200;
    const viewMaxX = camera.x + canvasW + 200;
    const viewMinY = camera.y - 200;
    const viewMaxY = camera.y + canvasH + 200;

    if (viewMinY < 4400 && viewMaxY > 4000) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = `hsl(180, 70%, ${40 + Math.sin(visualAnimationTick * 3) * 15}%)`;
        ctx.lineWidth = 2;

        const renderStartY = Math.max(4000, viewMinY);
        const renderHeight = Math.min(4400, viewMaxY) - renderStartY;

        for (let yStep = renderStartY; yStep < renderStartY + renderHeight; yStep += 35) {
            const currentOffset = Math.cos(yStep / 150 + visualAnimationTick * 2) * 60;

            ctx.beginPath();
            for (let xStep = viewMinX - 60; xStep < viewMaxX + 60; xStep += 80) {
                const drawX = xStep + currentOffset;
                const drawY = yStep;
                ctx.moveTo(drawX, drawY);
                ctx.lineTo(drawX + 40, drawY + 4);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    const staticGrassClusters = [
        { x: 400, y: 3800, radius: 45 },
        { x: 1200, y: 4100, radius: 55 },
        { x: 2800, y: 3950, radius: 50 },
        { x: 4500, y: 4200, radius: 60 },
    ];

    staticGrassClusters.forEach(grass => {
        if (grass.x > viewMinX && grass.x < viewMaxX && grass.y > viewMinY && grass.y < viewMaxY) {
            ctx.save();
            ctx.globalAlpha = 0.65;
            ctx.fillStyle = '#1a431e';
            ctx.beginPath();
            ctx.arc(grass.x, grass.y, grass.radius, 0, Math.PI * 2);
            ctx.arc(grass.x - 25, grass.y, grass.radius * 0.8, 0, Math.PI * 2);
            ctx.arc(grass.x + 25, grass.y, grass.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });

    if (viewMaxX > 4500 && viewMinY < 1500) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#3c2d4a';

        const bX = Math.max(4500, viewMinX);
        const bY = Math.max(0, viewMinY);
        const bW = Math.min(6000, viewMaxX) - bX;
        const bH = Math.min(1500, viewMaxY) - bY;
        ctx.fillRect(bX, bY, bW, bH);

        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#5a4d75';
        ctx.lineWidth = 4;

        for (let i = 0; i < 8; i++) {
            const treeX = 4700 + (i * 160);
            if (treeX > viewMinX && treeX < viewMaxX) {
                ctx.beginPath();
                ctx.moveTo(treeX, 200);
                const wobbleX = Math.sin(visualAnimationTick + i) * 12;
                ctx.lineTo(treeX + wobbleX, 450);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

/**
 * Renders class-specific basic attack swing indicators (screen-space).
 */
export function drawWeaponSwingVisuals(ctx, player, camera) {
    drawWeaponArcs(ctx, player, camera);
}

/**
 * Decorated projectile renderer with ember trails (screen-space).
 */
export function drawDecoratedProjectile(ctx, proj, camera) {
    const sX = proj.x - camera.x;
    const sY = proj.y - camera.y;

    ctx.save();
    if (proj.type === 'firebolt') {
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.arc(sX, sY, proj.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFDE7';
        ctx.beginPath();
        ctx.arc(sX, sY, proj.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        if (Math.random() < 0.3) {
            GlobalParticles.addParticle(
                proj.x - proj.vx,
                proj.y - proj.vy,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                Math.random() * 2 + 1,
                0.2,
                '#FF5722'
            );
        }
    } else if (proj.type === 'arrow') {
        const projAngle = Math.atan2(proj.vy, proj.vx);
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = proj.color || '#81C784';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sX, sY);
        ctx.lineTo(sX - Math.cos(projAngle) * 15, sY - Math.sin(projAngle) * 15);
        ctx.stroke();
    } else {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = proj.color ?? '#FF4500';
        ctx.beginPath();
        ctx.arc(sX, sY, proj.radius ?? 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

export { WORLD_SIZE as RENDERER_WORLD_SIZE };
