// ============================================================
// core/entities/bot-brain.js
// AI Brain — FSM med deterministisk, deltaTime-baserad rörelse.
// ============================================================

import { ABILITY_CONFIG } from '../balance-config.js';
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    VISION_RADIUS,
    JUNGLE_CAMP_LOCATIONS,
} from '../../data/world-config.js';

const MAP_MIN = 32;
const MAP_MAX = 5968;

const FSM_STATES = {
    CIRCLE_ESCAPE: 'CIRCLE_ESCAPE',
    PLAYER_AGGRO:  'PLAYER_AGGRO',
    JUNGLE_FARM:   'JUNGLE_FARM',
    WANDERING:     'WANDERING',
};

export class BotBrain {
    constructor(bot) {
        this.bot = bot;
        this.currentState = FSM_STATES.WANDERING;
        this.aggroTarget = null;
        this.jungleCampTarget = null;
        this.patrolRadius = 400;
    }

    /**
     * @param {Object} gameState
     */
    update(gameState) {
        if (!this.bot?.isAlive) return;

        const { deltaTime, tick, creeps } = gameState;

        const botDistToCircle = Math.hypot(
            gameState.circleCenter.x - this.bot.x,
            gameState.circleCenter.y - this.bot.y
        );
        const isOutsideCircle = botDistToCircle > gameState.circleRadius + this.bot.radius;

        const nearestEnemy = this._getNearestVisibleEnemy(gameState);
        const nearestCamp = this._findNearestJungleCamp();

        if (isOutsideCircle && gameState.circleShrinking) {
            this.currentState = FSM_STATES.CIRCLE_ESCAPE;
            this.aggroTarget = null;
        } else if (nearestEnemy) {
            this.currentState = FSM_STATES.PLAYER_AGGRO;
            this.aggroTarget = nearestEnemy;
        } else if (nearestCamp !== null && !this._isCampTaken(nearestCamp, creeps)) {
            this.currentState = FSM_STATES.JUNGLE_FARM;
            this.jungleCampTarget = nearestCamp;
            this.aggroTarget = null;
        } else {
            this.currentState = FSM_STATES.WANDERING;
            this.aggroTarget = null;
        }

        switch (this.currentState) {
            case FSM_STATES.CIRCLE_ESCAPE:
                this._executeCircleEscape(gameState);
                break;
            case FSM_STATES.PLAYER_AGGRO:
                this._executePlayerAggro(gameState);
                break;
            case FSM_STATES.JUNGLE_FARM:
                this._executeJungleFarm();
                break;
            case FSM_STATES.WANDERING:
            default:
                this._executeWandering(tick);
                break;
        }

        this._normalizeVelocity();
        this._executeMovementAndFacing(deltaTime);
    }

    _normalizeVelocity() {
        const mag = Math.hypot(this.bot.vx, this.bot.vy);
        if (mag > 0) {
            const moveSpeed = this.bot.speed ?? 3.5;
            this.bot.vx = (this.bot.vx / mag) * moveSpeed;
            this.bot.vy = (this.bot.vy / mag) * moveSpeed;
        }
    }

    _executeMovementAndFacing(deltaTime) {
        if (!this.bot?.isAlive) return;

        const dtSec = (deltaTime ?? 16) / 1000;

        if (this.bot.vx !== 0 || this.bot.vy !== 0) {
            this.bot.x += this.bot.vx * dtSec * 60;
            this.bot.y += this.bot.vy * dtSec * 60;
            this.bot.facingAngle = Math.atan2(this.bot.vy, this.bot.vx);
        }

        this.bot.x = Math.max(MAP_MIN, Math.min(MAP_MAX, this.bot.x));
        this.bot.y = Math.max(MAP_MIN, Math.min(MAP_MAX, this.bot.y));
    }

    _executeCircleEscape(gameState) {
        const dx = gameState.circleCenter.x - this.bot.x;
        const dy = gameState.circleCenter.y - this.bot.y;
        const mag = Math.hypot(dx, dy);
        if (mag > 0) {
            this.bot.vx = dx / mag;
            this.bot.vy = dy / mag;
        }
    }

    _executePlayerAggro(gameState) {
        const target = this.aggroTarget;
        if (!target?.isAlive) {
            this.bot.vx = 0;
            this.bot.vy = 0;
            return;
        }

        const dx = target.x - this.bot.x;
        const dy = target.y - this.bot.y;
        const dist = Math.hypot(dx, dy);
        const attackRange = this._getAttackRange() + (target.radius ?? 25);

        if (dist <= attackRange && (this.bot.attackTimer ?? 0) <= 0) {
            const damage = this.bot.projectileDamage ?? 20;
            if (typeof target.takeDamage === 'function') {
                target.takeDamage(damage, 'physical');
            }
            this.bot.attackTimer = this._getAttackCooldownSec();
            this.bot.vx = 0;
            this.bot.vy = 0;
            return;
        }

        if (dist > 0) {
            this.bot.vx = dx / dist;
            this.bot.vy = dy / dist;
        }
    }

    _executeJungleFarm() {
        if (this.jungleCampTarget === null) {
            this.bot.vx = 0;
            this.bot.vy = 0;
            return;
        }

        const camp = JUNGLE_CAMP_LOCATIONS[this.jungleCampTarget];
        const dx = camp.x - this.bot.x;
        const dy = camp.y - this.bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.bot.vx = dx / dist;
            this.bot.vy = dy / dist;
        }
    }

    _executeWandering(tick) {
        const seedModifier = this.bot.seed ?? 1;
        const patrolSpeed = 0.02 + (seedModifier % 100) * 0.0001;
        const patrolAngle = ((seedModifier * 0.017) + (tick ?? 0) * patrolSpeed) % (Math.PI * 2);

        const homeX = seedModifier % CANVAS_WIDTH;
        const homeY = (seedModifier * 71) % CANVAS_HEIGHT;

        const circleX = homeX + Math.cos(patrolAngle) * this.patrolRadius;
        const circleY = homeY + Math.sin(patrolAngle) * this.patrolRadius;

        const dx = circleX - this.bot.x;
        const dy = circleY - this.bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            this.bot.vx = dx / dist;
            this.bot.vy = dy / dist;
        } else {
            this.bot.vx = 0;
            this.bot.vy = 0;
        }
    }

    /**
     * O(n) nearest-neighbor scan — no sort.
     */
    _getNearestVisibleEnemy(gameState) {
        let nearestEnemy = null;
        let minDist = VISION_RADIUS;

        const players = gameState.players ?? [];
        const bots = gameState.bots ?? [];

        for (let i = 0; i < players.length; i++) {
            const target = players[i];
            if (!target || target.id === this.bot.id || !target.isAlive) continue;

            const dist = Math.hypot(target.x - this.bot.x, target.y - this.bot.y);
            if (dist < minDist) {
                minDist = dist;
                nearestEnemy = target;
            }
        }

        for (let i = 0; i < bots.length; i++) {
            const target = bots[i];
            if (!target || target.id === this.bot.id || !target.isAlive) continue;

            const dist = Math.hypot(target.x - this.bot.x, target.y - this.bot.y);
            if (dist < minDist) {
                minDist = dist;
                nearestEnemy = target;
            }
        }

        return nearestEnemy;
    }

    _findNearestJungleCamp() {
        let nearest = null;
        let nearestDist = Infinity;

        for (let i = 0; i < JUNGLE_CAMP_LOCATIONS.length; i++) {
            const camp = JUNGLE_CAMP_LOCATIONS[i];
            const dist = Math.hypot(camp.x - this.bot.x, camp.y - this.bot.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = i;
            }
        }

        if (nearestDist > 2000) return null;
        return nearest;
    }

    /**
     * Camp is "taken" when no living creeps remain at that camp index.
     */
    _isCampTaken(campIndex, creeps) {
        if (!Array.isArray(creeps)) return true;
        for (let i = 0; i < creeps.length; i++) {
            const creep = creeps[i];
            if (!creep.isDead && creep.campIndex === campIndex) {
                return false;
            }
        }
        return true;
    }

    _getAttackRange() {
        const cfg = ABILITY_CONFIG[this.bot.heroClass];
        if (!cfg) return 90;
        if (this.bot.heroClass === 'Hybrid') {
            return cfg.ATTACK_RANGE_MELEE ?? 65;
        }
        return cfg.ATTACK_RANGE ?? 280;
    }

    _getAttackCooldownSec() {
        const cfg = ABILITY_CONFIG[this.bot.heroClass];
        if (!cfg) return 0.6;
        const ms = cfg.ATTACK_SPEED ?? cfg.ATTACK_SPEED_MELEE ?? 600;
        return ms / 1000;
    }
}

export const FSM_STATES_EXPORT = FSM_STATES;
