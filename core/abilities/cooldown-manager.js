/**
 * @file cooldown-manager.js
 * Encapsulates ability cooldown state with HUD sync.
 */

export class CooldownManager {
    constructor() {
        /** @private */
        this.timers = new Map();
    }

    getRemaining(entityId, slot) {
        const key = `${entityId}:${slot}`;
        return this.timers.get(key) || 0;
    }

    setCooldown(entityId, slot, duration) {
        this.timers.set(`${entityId}:${slot}`, duration);
    }

    isReady(entityId, slot) {
        return this.getRemaining(entityId, slot) <= 0;
    }

    update(deltaTime) {
        for (const [key, time] of this.timers.entries()) {
            if (time > 0) {
                const newTime = Math.max(0, time - deltaTime);
                if (newTime === 0) {
                    this.timers.delete(key);
                } else {
                    this.timers.set(key, newTime);
                }
            }
        }
    }

    syncToHudObject(hudObject, entityId) {
        hudObject.q = this.getRemaining(entityId, 'q');
        hudObject.w = this.getRemaining(entityId, 'w');
        hudObject.e = this.getRemaining(entityId, 'e');
    }

    reset() {
        this.timers.clear();
    }
}
