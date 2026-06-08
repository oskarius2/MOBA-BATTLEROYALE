// ============================================================
// ui/damage-numbers.js
// Floating damage numbers overlay (screen-space).
// ============================================================

const COLORS = {
    physical: '#f0e6c8',
    magic:    '#7ec8ff',
    true:     '#ffffff',
    heal:     '#3dba6a',
    blight:   '#c0392b',
};

let _overlay = null;
let _ctx     = null;
let _numbers = [];

export function resizeDamageOverlay() {
    _overlay = document.getElementById('damage-overlay');
    if (!_overlay) return;
    _overlay.width  = window.innerWidth;
    _overlay.height = window.innerHeight;
    _ctx = _overlay.getContext('2d');
}

export function spawnDamageNumber(worldX, worldY, amount, type = 'physical') {
    const rounded = Math.round(amount);
    if (rounded <= 0 && type !== 'heal') return;
    _numbers.push({
        worldX,
        worldY,
        amount: rounded,
        type,
        age: 0,
        driftX: (Math.random() - 0.5) * 24,
    });
}

export function renderDamageNumbers(camera, viewW, viewH) {
    if (!_ctx) resizeDamageOverlay();
    if (!_ctx || !_overlay) return;

    _ctx.clearRect(0, 0, _overlay.width, _overlay.height);

    for (const n of _numbers) {
        const screenX = n.worldX - camera.x + n.driftX * n.age;
        const screenY = n.worldY - camera.y - n.age * 42;
        if (screenX < -40 || screenX > viewW + 40 || screenY < -40 || screenY > viewH + 40) continue;

        const alpha = Math.max(0, 1 - n.age / 1.2);
        const scale = 1 + Math.min(n.age * 0.4, 0.25);
        const color = COLORS[n.type] ?? COLORS.physical;
        const prefix = n.type === 'heal' ? '+' : '';

        _ctx.save();
        _ctx.globalAlpha = alpha;
        _ctx.translate(screenX, screenY);
        _ctx.scale(scale, scale);
        _ctx.font = `700 ${n.amount >= 50 ? 18 : 15}px Montserrat, sans-serif`;
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        _ctx.lineWidth = 3;
        _ctx.strokeText(`${prefix}${n.amount}`, 0, 0);
        _ctx.fillStyle = color;
        _ctx.fillText(`${prefix}${n.amount}`, 0, 0);
        _ctx.restore();
    }
}

export function tickDamageNumbers(deltaSeconds) {
    for (let i = _numbers.length - 1; i >= 0; i--) {
        _numbers[i].age += deltaSeconds;
        if (_numbers[i].age > 1.5) _numbers.splice(i, 1);
    }
}
