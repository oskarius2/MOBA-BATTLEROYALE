// ============================================================
// ui/damage-numbers.js
// Renders floating damage numbers on a screen-space overlay canvas.
// ============================================================

import { DamageNumberQueue } from '../core/damage-events.js';

const TYPE_COLORS = {
    physical: '#f0e6c8',
    crit:     '#ffcc44',
    blight:   '#9b59b6',
    heal:     '#3dba6a',
};

let _canvas = null;
let _ctx = null;

export function initDamageOverlay() {
    const container = document.getElementById('game-container');
    if (!container) return;

    _canvas = document.getElementById('damage-overlay');
    if (!_canvas) {
        _canvas = document.createElement('canvas');
        _canvas.id = 'damage-overlay';
        container.appendChild(_canvas);
    }
    resizeDamageOverlay();
    _ctx = _canvas.getContext('2d');
}

export function resizeDamageOverlay() {
    if (!_canvas) return;
    _canvas.width  = window.innerWidth;
    _canvas.height = window.innerHeight;
    _canvas.style.width  = '100%';
    _canvas.style.height = '100%';
}

export function renderDamageNumbers(camera, viewW, viewH) {
    if (!_ctx || DamageNumberQueue.length === 0) {
        if (_ctx) _ctx.clearRect(0, 0, viewW, viewH);
        return;
    }

    _ctx.clearRect(0, 0, viewW, viewH);

    for (const n of DamageNumberQueue) {
        const alpha = Math.min(1, n.life / (n.maxLife * 0.4));
        const screenX = n.x - camera.x + n.offsetX;
        const screenY = n.y - camera.y;

        if (screenX < -50 || screenX > viewW + 50 || screenY < -50 || screenY > viewH + 50) continue;

        const color = TYPE_COLORS[n.type] ?? TYPE_COLORS.physical;
        const fontSize = n.type === 'crit' ? 18 : 14;

        _ctx.save();
        _ctx.globalAlpha = alpha;
        _ctx.font = `700 ${fontSize}px Montserrat, sans-serif`;
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillStyle = color;
        _ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        _ctx.lineWidth = 3;
        const text = n.type === 'heal' ? `+${n.amount}` : `${n.amount}`;
        _ctx.strokeText(text, screenX, screenY);
        _ctx.fillText(text, screenX, screenY);
        _ctx.restore();
    }
}
