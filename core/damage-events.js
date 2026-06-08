// ============================================================
// core/damage-events.js
// Floating damage number queue (core state, no DOM).
// ============================================================

const MAX_DAMAGE_NUMBERS = 40;
const LIFETIME = 1.2;

export const DamageNumberQueue = [];

export function emitDamageNumber(x, y, amount, type = 'physical') {
    if (amount <= 0) return;
    if (DamageNumberQueue.length >= MAX_DAMAGE_NUMBERS) {
        DamageNumberQueue.shift();
    }
    DamageNumberQueue.push({
        x,
        y,
        amount: Math.round(amount),
        type,
        life: LIFETIME,
        maxLife: LIFETIME,
        vy: -40,
        offsetX: (Math.random() - 0.5) * 20,
    });
}

export function updateDamageNumbers(dt) {
    for (let i = DamageNumberQueue.length - 1; i >= 0; i--) {
        const n = DamageNumberQueue[i];
        n.life -= dt;
        n.y += n.vy * dt;
        if (n.life <= 0) DamageNumberQueue.splice(i, 1);
    }
}

export function resetDamageNumbers() {
    DamageNumberQueue.length = 0;
}
