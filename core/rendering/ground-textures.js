// ============================================================
// core/rendering/ground-textures.js
// Mark-texturer för skogsunderlaget (world-space).
// ============================================================

export const RIVER_BOUNDS = { x0: 200, x1: 5800, y0: 4000, y1: 4400 };

const MOSS_PATCHES = [];
const DIRT_PATHS = [];
let _patchesReady = false;

function initMossPatches() {
    if (_patchesReady) return;
    for (let i = 0; i < 220; i++) {
        MOSS_PATCHES.push({
            x: Math.random() * 6000,
            y: Math.random() * 6000,
            r: 40 + Math.random() * 90,
            hue: 95 + Math.random() * 25,
            alpha: 0.04 + Math.random() * 0.06,
        });
    }
    for (let i = 0; i < 12; i++) {
        DIRT_PATHS.push({
            x: 400 + Math.random() * 5200,
            y: 600 + Math.random() * 5200,
            w: 120 + Math.random() * 280,
            h: 40 + Math.random() * 60,
            rot: Math.random() * Math.PI,
        });
    }
    _patchesReady = true;
}

function drawRiverBand(ctx, camera, viewW, viewH, time = 0) {
    const pad = 100;
    const vx0 = camera.x - pad;
    const vy0 = camera.y - pad;
    const vx1 = camera.x + viewW + pad;
    const vy1 = camera.y + viewH + pad;
    const { x0, x1, y0, y1 } = RIVER_BOUNDS;

    if (vx1 < x0 || vx0 > x1 || vy1 < y0 || vy0 > y1) return;

    const pulse = 0.5 + 0.5 * Math.sin(time * 0.0018);
    const cx = (x0 + x1) * 0.5;

    ctx.save();

    const waterGrad = ctx.createLinearGradient(cx, y0, cx, y1);
    waterGrad.addColorStop(0, '#081820');
    waterGrad.addColorStop(0.35, '#122c3a');
    waterGrad.addColorStop(0.5, `rgba(26, 72, 96, ${0.88 + pulse * 0.08})`);
    waterGrad.addColorStop(0.65, '#143040');
    waterGrad.addColorStop(1, '#081820');
    ctx.fillStyle = waterGrad;
    ctx.globalAlpha = 0.92;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

    ctx.globalAlpha = 0.22 + pulse * 0.12;
    ctx.strokeStyle = '#5a9ab8';
    ctx.lineWidth = 1.5;
    for (let yStep = y0 + 8; yStep < y1; yStep += 22) {
        const wave = Math.sin(yStep * 0.008 + time * 0.002) * 35;
        ctx.beginPath();
        for (let xStep = x0; xStep < x1; xStep += 60) {
            const drawX = xStep + wave + Math.cos(xStep * 0.003 + time * 0.0015) * 18;
            const drawY = yStep + Math.sin(xStep * 0.006 + time * 0.002) * 3;
            if (xStep === x0) ctx.moveTo(drawX, drawY);
            else ctx.lineTo(drawX, drawY);
        }
        ctx.stroke();
    }

    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#2a5a40';
    ctx.lineWidth = 6;
    for (const edgeY of [y0 + 4, y1 - 4]) {
        ctx.beginPath();
        for (let xStep = x0; xStep < x1; xStep += 40) {
            const bump = Math.sin(xStep * 0.02 + time * 0.001) * 5;
            if (xStep === x0) ctx.moveTo(xStep, edgeY + bump);
            else ctx.lineTo(xStep, edgeY + bump);
        }
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx — world-space
 */
export function drawGroundLayer(ctx, camera, viewW, viewH, time = 0) {
    initMossPatches();

    const x0 = camera.x;
    const y0 = camera.y;

    ctx.save();

    const grad = ctx.createLinearGradient(x0, y0, x0, y0 + viewH);
    grad.addColorStop(0, '#0c140a');
    grad.addColorStop(0.5, '#0a0f09');
    grad.addColorStop(1, '#070b07');
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y0, viewW, viewH);

    drawRiverBand(ctx, camera, viewW, viewH, time);

    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#1a2a1a';
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = Math.floor(x0 / step) * step; x < x0 + viewW; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y0 + viewH);
        ctx.stroke();
    }
    for (let y = Math.floor(y0 / step) * step; y < y0 + viewH; y += step) {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + viewW, y);
        ctx.stroke();
    }

    const pad = 120;
    for (const path of DIRT_PATHS) {
        if (path.x < x0 - pad || path.x > x0 + viewW + pad ||
            path.y < y0 - pad || path.y > y0 + viewH + pad) continue;
        ctx.save();
        ctx.translate(path.x, path.y);
        ctx.rotate(path.rot);
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = '#1a140c';
        ctx.beginPath();
        ctx.ellipse(0, 0, path.w, path.h, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (const patch of MOSS_PATCHES) {
        if (patch.x < x0 - pad || patch.x > x0 + viewW + pad ||
            patch.y < y0 - pad || patch.y > y0 + viewH + pad) continue;
        ctx.globalAlpha = patch.alpha;
        ctx.beginPath();
        ctx.ellipse(patch.x, patch.y, patch.r, patch.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${patch.hue}, 28%, 14%)`;
        ctx.fill();
    }

    ctx.restore();
}
