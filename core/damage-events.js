// ============================================================
// core/damage-events.js
// Damage-event queue för floating numbers och hit-effects.
// STUB — koppla till damage-numbers.js vid expansion.
// ============================================================

const _queue = [];

export function pushDamageEvent(x, y, amount, type = 'physical') {
    _queue.push({ x, y, amount, type, age: 0 });
}

export function updateDamageNumbers(deltaSeconds) {
    for (let i = _queue.length - 1; i >= 0; i--) {
        _queue[i].age += deltaSeconds;
        if (_queue[i].age > 1.5) _queue.splice(i, 1);
    }
}

export function getDamageEvents() { return _queue; }
