// ============================================================
// core/entities/creep.js
// Extraherat ur index.html.
// Beroenden skickas som argument till takeDamage (ingen global state).
// ============================================================

import { CREEP_TYPES, PATROL_RADIUS, AGGRO_RANGE } from '../../data/world-config.js';
import { drawCreepModel }  from '../canvas-renderer.js';
import { resolveFacingAngle } from '../canvas-renderer.js';

export class Creep {
    constructor(x, y, typeKey, campIndex = 0) {
        const type       = CREEP_TYPES[typeKey];
        this.spawnX      = x;
        this.spawnY      = y;
        this.x           = x;
        this.y           = y;
        this.campIndex   = campIndex;
        this.typeKey     = typeKey;
        this.maxHp       = type.maxHp;
        this.hp          = type.maxHp;
        this.radius      = type.radius;
        this.speed       = type.speed;
        this.contactDamage = type.contactDamage;
        this.xpReward    = type.xpReward;
        this.goldReward  = type.goldReward;
        this.fillColor   = type.fillColor;
        this.strokeColor = type.strokeColor;
        this.name        = type.name;
        this.isDead      = false;
        this.state       = 'PATROL';
        this.patrolTarget = this.pickPatrolPoint();
        this.vx          = 0;
        this.vy          = 0;
        this.facingAngle = 0;
        this.prevX       = x;
        this.prevY       = y;
    }

    pickPatrolPoint() {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * PATROL_RADIUS;
        return {
            x: this.spawnX + Math.cos(angle) * dist,
            y: this.spawnY + Math.sin(angle) * dist,
        };
    }

    distanceToPlayer(player) {
        return Math.hypot(player.x - this.x, player.y - this.y);
    }

    enterAggro() { this.state = 'AGGRO'; }

    update(player) {
        if (this.isDead) return;
        this.prevX = this.x;
        this.prevY = this.y;

        if (this.state === 'PATROL' && this.distanceToPlayer(player) <= AGGRO_RANGE) {
            this.enterAggro();
        }

        if (this.state === 'AGGRO') {
            const dx   = player.x - this.x;
            const dy   = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 1) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        } else {
            const dx   = this.patrolTarget.x - this.x;
            const dy   = this.patrolTarget.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 8) {
                this.patrolTarget = this.pickPatrolPoint();
            } else {
                this.x += (dx / dist) * this.speed * 0.6;
                this.y += (dy / dist) * this.speed * 0.6;
            }
            const distFromSpawn = Math.hypot(this.x - this.spawnX, this.y - this.spawnY);
            if (distFromSpawn > PATROL_RADIUS) {
                const bx = this.spawnX - this.x;
                const by = this.spawnY - this.y;
                const bd = Math.hypot(bx, by);
                this.x += (bx / bd) * this.speed * 0.8;
                this.y += (by / bd) * this.speed * 0.8;
            }
        }

        this.vx = this.x - this.prevX;
        this.vy = this.y - this.prevY;
        const toPlayerAngle = Math.atan2(player.y - this.y, player.x - this.x);
        this.facingAngle = resolveFacingAngle(this.vx, this.vy, toPlayerAngle);
    }

    /**
     * @param {number} amount
     * @param {Function} onDeath  — callback(creep) när hp ≤ 0
     */
    takeDamage(amount, onDeath = null) {
        if (this.isDead) return;
        this.enterAggro();
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
            if (onDeath) onDeath(this);
        }
    }

    draw(ctx, time = 0) {
        if (this.isDead) return;
        drawCreepModel(ctx, this, time);
    }
}
