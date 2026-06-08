// ============================================================
// core/damage-events.js
// Damage-event queue för floating numbers och hit-effects.
// ============================================================

import { spawnDamageNumber, tickDamageNumbers as tickFloatingNumbers } from '../ui/damage-numbers.js';

const _queue = [];
const MAX_AGE = 1.5;

export function pushDamageEvent(x, y, amount, type = 'physical') {
    if (amount <= 0) return;
    _queue.push({ x, y, amount, type, age: 0 });
    spawnDamageNumber(x, y, amount, type);
}

export const emitDamageNumber = pushDamageEvent;

export function updateDamageNumbers(deltaSeconds) {
    tickFloatingNumbers(deltaSeconds);
    for (let i = _queue.length - 1; i >= 0; i--) {
        _queue[i].age += deltaSeconds;
        if (_queue[i].age > MAX_AGE) _queue.splice(i, 1);
    }
}

export function getDamageEvents() { return _queue; }

export function clearDamageEvents() { _queue.length = 0; }
