/**
 * @file damage-applier.js
 * Applies ability damage via QueryEngine (creeps + bots).
 */

export function applyCircleDamage(queryEngine, x, y, radius, damage) {
    if (!queryEngine || damage <= 0) return;
    const targets = queryEngine.findTargetsInRadius(x, y, radius);
    for (let i = 0; i < targets.length; i++) {
        targets[i].takeDamage(damage);
    }
}

export function applyConeDamage(queryEngine, originX, originY, angle, spread, length, damage) {
    if (!queryEngine || damage <= 0) return;
    const targets = queryEngine.findTargetsInCone(originX, originY, angle, spread, length);
    for (let i = 0; i < targets.length; i++) {
        targets[i].takeDamage(damage);
    }
}
