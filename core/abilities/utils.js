/**
 * @file utils.js
 * Shared ability-engine helpers.
 */

import { ABILITY_CONFIG } from '../balance-config.js';

export const MAP_MIN = 32;
export const MAP_MAX = 9968;

export function normalizePointer(pointerWorld) {
    if (!pointerWorld) return { worldX: 0, worldY: 0 };
    return {
        worldX: pointerWorld.worldX ?? pointerWorld.x ?? 0,
        worldY: pointerWorld.worldY ?? pointerWorld.y ?? 0,
    };
}

export function playerDamage(player) {
    return player.damage ?? player.projectileDamage ?? 20;
}

export function clampMapCoord(value) {
    return Math.max(MAP_MIN, Math.min(MAP_MAX, value));
}

export function clampPlayerPosition(player, x, y) {
    return {
        x: clampMapCoord(x),
        y: clampMapCoord(y),
    };
}

export function getCooldownForSlot(heroClass, slot) {
    const cfg = ABILITY_CONFIG[heroClass];
    if (!cfg) return 4;
    if (slot === 'q') return cfg.q_cd ?? 4;
    if (slot === 'w') return cfg.w_cd ?? 6;
    if (slot === 'e') return cfg.e_cd ?? 10;
    return 4;
}

export function entityId(player) {
    return player.id || 'local';
}
