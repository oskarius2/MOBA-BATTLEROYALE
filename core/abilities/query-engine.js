/**
 * @file query-engine.js
 * Centralized spatial queries for targeting (creeps + bots).
 */

export class QueryEngine {
    constructor(creepsArray, botsArray) {
        this.creeps = creepsArray || [];
        this.bots = botsArray || [];
    }

    _isAlive(entity) {
        return entity && !entity.isDead && (entity.isAlive !== false) && (entity.hp === undefined || entity.hp > 0);
    }

    _getAllActiveEntities() {
        const out = [];
        for (let i = 0; i < this.creeps.length; i++) {
            const e = this.creeps[i];
            if (this._isAlive(e)) out.push(e);
        }
        for (let i = 0; i < this.bots.length; i++) {
            const e = this.bots[i];
            if (this._isAlive(e)) out.push(e);
        }
        return out;
    }

    findTargetsInRadius(x, y, radius) {
        const targets = [];
        const entities = this._getAllActiveEntities();
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const dist = Math.hypot(entity.x - x, entity.y - y);
            if (dist < radius + (entity.radius || 15)) {
                targets.push(entity);
            }
        }
        return targets;
    }

    findTargetsInCone(originX, originY, angle, spread, length) {
        const targets = [];
        const halfSpread = spread / 2;
        const entities = this._getAllActiveEntities();

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const dx = entity.x - originX;
            const dy = entity.y - originY;
            const dist = Math.hypot(dx, dy);
            if (dist > length + (entity.radius || 15)) continue;

            const entityAngle = Math.atan2(dy, dx);
            let angleDiff = entityAngle - angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) <= halfSpread) {
                targets.push(entity);
            }
        }
        return targets;
    }

    forEachMeleeTarget(player, angle, range, halfSpread, onHit) {
        const tryHit = (target) => {
            if (!this._isAlive(target)) return;
            const dist = Math.hypot(target.x - player.x, target.y - player.y);
            if (dist >= range + (target.radius || 15)) return;
            const targetAngle = Math.atan2(target.y - player.y, target.x - player.x);
            let angleDiff = Math.abs(angle - targetAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
            if (angleDiff <= halfSpread) onHit(target);
        };
        this.creeps.forEach(tryHit);
        this.bots.forEach(tryHit);
    }

    findClosestTarget(player, range) {
        let closest = null;
        let minDist = range;
        const tryClosest = (target) => {
            if (!this._isAlive(target)) return;
            const dist = Math.hypot(target.x - player.x, target.y - player.y) - (target.radius || 15);
            if (dist < minDist) {
                minDist = dist;
                closest = target;
            }
        };
        this.creeps.forEach(tryClosest);
        this.bots.forEach(tryClosest);
        return closest;
    }
}
