// ============================================================
// core/rendering/animation-state-machine.js
// Visual-only animation states — reads player state, never mutates combat.
// ============================================================

import { STANCE_TRANSITION_MS } from './render-config.js';

export const AnimState = {
    IDLE:       'IDLE',
    WALK:       'WALK',
    ATTACK:     'ATTACK',
    TRANSITION: 'TRANSITION',
};

/**
 * Derives visual animation state from read-only entity snapshot.
 * @param {object} snapshot
 * @param {number} snapshot.speed
 * @param {number} snapshot.attackTimer
 * @param {string} snapshot.stance
 * @param {number} snapshot.stanceChangedAt
 * @param {number} now — performance.now() or Date.now()
 */
export function resolveAnimState(snapshot, now) {
    const { speed, attackTimer, stanceChangedAt } = snapshot;

    if (stanceChangedAt > 0 && now - stanceChangedAt < STANCE_TRANSITION_MS) {
        return AnimState.TRANSITION;
    }
    if (attackTimer > 0) {
        return AnimState.ATTACK;
    }
    if (speed >= 0.5) {
        return AnimState.WALK;
    }
    return AnimState.IDLE;
}

/**
 * Maps animation state to spritesheet action name.
 */
export function animStateToAction(state) {
    switch (state) {
        case AnimState.WALK:       return 'walk';
        case AnimState.ATTACK:     return 'attack';
        case AnimState.TRANSITION: return 'transition';
        case AnimState.IDLE:
        default:                   return 'idle';
    }
}

/**
 * Frame index from elapsed animation time.
 */
export function frameIndexFromTime(elapsedMs, framesPerAction, fps = 10) {
    const frameDuration = 1000 / fps;
    return Math.floor(elapsedMs / frameDuration) % framesPerAction;
}
