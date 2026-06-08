// ============================================================
// ui/minimap.js
// Minimap-overlay — world overview in top-right HUD.
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/world-config.js';

const MAP_SIZE = 168;
const PAD = 6;

let _canvas = null;
let _ctx    = null;

function ensureCanvas() {
    if (_canvas && _ctx) return true;
    _canvas = document.getElementById('minimap');
    if (!_canvas) return false;
    _ctx = _canvas.getContext('2d');
    return !!_ctx;
}

function worldToMinimap(wx, wy) {
    const inner = MAP_SIZE - PAD * 2;
    return {
        x: PAD + (wx / CANVAS_WIDTH) * inner,
        y: PAD + (wy / CANVAS_HEIGHT) * inner,
    };
}

/**
 * @param {object} opts
 * @param {object} opts.player
 * @param {object} opts.blight
 * @param {Array}  opts.camps
 * @param {Array}  opts.creeps
 * @param {Array}  [opts.bots]
 * @param {Array}  [opts.inventory]
 * @param {number} [opts.time]
 */
export function updateMinimap({ player, blight, camps, creeps, bots = [], inventory = [], time = 0 } = {}) {
    if (!ensureCanvas()) return;

    const inner = MAP_SIZE - PAD * 2;

    _ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Dark jungle base
    _ctx.fillStyle = '#0a1209';
    _ctx.fillRect(PAD, PAD, inner, inner);

    // Subtle grid
    _ctx.strokeStyle = 'rgba(30, 50, 28, 0.35)';
    _ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const t = PAD + (inner * i) / 4;
        _ctx.beginPath();
        _ctx.moveTo(t, PAD);
        _ctx.lineTo(t, PAD + inner);
        _ctx.stroke();
        _ctx.beginPath();
        _ctx.moveTo(PAD, t);
        _ctx.lineTo(PAD + inner, t);
        _ctx.stroke();
    }

    // Blight safe zone
    if (blight) {
        const center = worldToMinimap(blight.center.x, blight.center.y);
        const radiusPx = (blight.currentRadius / CANVAS_WIDTH) * inner;
        _ctx.beginPath();
        _ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
        _ctx.strokeStyle = 'rgba(155, 89, 182, 0.55)';
        _ctx.lineWidth = 1.5;
        _ctx.stroke();
        _ctx.fillStyle = 'rgba(60, 20, 80, 0.12)';
        _ctx.fill();
    }

    // Jungle camps
    if (Array.isArray(camps)) {
        for (const camp of camps) {
            const p = worldToMinimap(camp.x, camp.y);
            _ctx.beginPath();
            _ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            _ctx.fillStyle = 'rgba(201, 162, 39, 0.7)';
            _ctx.fill();
        }
    }

    // Creeps (alive only)
    if (Array.isArray(creeps)) {
        for (const c of creeps) {
            if (c.isDead) continue;
            const p = worldToMinimap(c.x, c.y);
            _ctx.fillStyle = c.typeKey === 'ancient' ? '#ffcc44' : '#ff6688';
            _ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
    }

    // Bots
    for (const bot of bots) {
        if (!bot.isAlive) continue;
        const p = worldToMinimap(bot.x, bot.y);
        _ctx.beginPath();
        _ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        _ctx.fillStyle = '#e74c3c';
        _ctx.fill();
    }

    // Player
    if (player && player.hp > 0) {
        const p = worldToMinimap(player.x, player.y);
        const pulse = 0.7 + Math.sin(time * 0.006) * 0.3;
        const hasMapPresence = inventory.some(item => item?.mapPresence);

        if (hasMapPresence) {
            _ctx.beginPath();
            _ctx.arc(p.x, p.y, 8 + Math.sin(time * 0.01) * 2, 0, Math.PI * 2);
            _ctx.strokeStyle = 'rgba(201, 162, 39, 0.55)';
            _ctx.lineWidth = 2;
            _ctx.stroke();
        }

        _ctx.beginPath();
        _ctx.arc(p.x, p.y, 4 * pulse, 0, Math.PI * 2);
        _ctx.fillStyle = '#3dba6a';
        _ctx.fill();
        _ctx.strokeStyle = '#c9a227';
        _ctx.lineWidth = 1.5;
        _ctx.stroke();
    }
}
