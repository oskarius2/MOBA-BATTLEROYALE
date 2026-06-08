// ============================================================
// core/collision.js — circle separation for solid entities
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/world-config.js';

/**
 * @param {object} entity
 * @returns {number}
 */
export function getEntityMass(entity) {
    if (typeof entity.mass === 'number' && entity.mass > 0) return entity.mass;
    return Math.max(1, (entity.radius ?? 20) / 10);
}

/**
 * @param {object} entity
 * @returns {boolean}
 */
export function isSolidEntity(entity) {
    if (!entity || entity.x == null || entity.y == null) return false;
    if (entity.isDead === true) return false;
    if (entity.hp != null && entity.hp <= 0) return false;
    return (entity.radius ?? 0) > 0;
}

/**
 * @param {object} entity
 */
export function clampEntityToWorld(entity) {
    const r = entity.radius ?? 20;
    entity.x = Math.max(r, Math.min(CANVAS_WIDTH - r, entity.x));
    entity.y = Math.max(r, Math.min(CANVAS_HEIGHT - r, entity.y));
}

/**
 * Mass-weighted circle separation. Heavier entity moves less.
 * @returns {boolean} true if overlap was resolved
 */
export function resolveCircleCollision(entityA, entityB) {
    const dx = entityB.x - entityA.x;
    const dy = entityB.y - entityA.y;
    let dist = Math.hypot(dx, dy);
    const minDist = (entityA.radius ?? 20) + (entityB.radius ?? 20);

    if (dist >= minDist) return false;

    if (dist === 0) {
        entityB.x += 0.01;
        dist = 0.01;
    }

    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;

    const massA = getEntityMass(entityA);
    const massB = getEntityMass(entityB);
    const totalMass = massA + massB;
    const ratioA = massB / totalMass;
    const ratioB = massA / totalMass;

    entityA.x -= nx * overlap * ratioA;
    entityA.y -= ny * overlap * ratioA;
    entityB.x += nx * overlap * ratioB;
    entityB.y += ny * overlap * ratioB;

    return true;
}

/**
 * Pairwise separation (i, j = i + 1) — no duplicate A/B vs B/A checks.
 * @param {object[]} entities
 */
export function resolveAllSolidCollisions(entities) {
    const solids = entities.filter(isSolidEntity);

    for (let i = 0; i < solids.length; i++) {
        for (let j = i + 1; j < solids.length; j++) {
            resolveCircleCollision(solids[i], solids[j]);
        }
    }

    for (const entity of solids) {
        clampEntityToWorld(entity);
    }
}
