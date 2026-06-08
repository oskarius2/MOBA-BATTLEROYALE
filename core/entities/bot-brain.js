// ============================================================
// core/entities/bot-brain.js
// Deterministic Finite State Machine for bot AI.
// No Math.random() in loops — seeded, tick-based movement.
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT, JUNGLE_CAMP_LOCATIONS } from '../../data/world-config.js';
import { isOutsideBlight } from '../world/blight.js';

const BOT_STATE = {
    CIRCLE_ESCAPE: 'CIRCLE_ESCAPE',
    PLAYER_AGGRO:  'PLAYER_AGGRO',
    JUNGLE_FARM:   'JUNGLE_FARM',
    WANDERING:     'WANDERING',
};

const BOT_CONFIG = {
    VISION_RANGE: 1000,
    ATTACK_RANGE: 150,
    TARGET_SWITCH_DELAY: 500,
    WANDER_WAYPOINT_DISTANCE: 800,
    WANDER_ROTATE_INTERVAL: 3000,
};

/**
 * @class BotBrain
 * Deterministic AI controller for bot entities.
 * Uses seeded pseudo-random for waypoint selection (not per-frame randomness).
 */
export class BotBrain {
    /**
     * @param {object} bot — Bot entity with x, y, vx, vy, speed, radius, seed, heroClass
     */
    constructor(bot) {
        this.bot = bot;
        this.currentState = BOT_STATE.WANDERING;
        this.stateEnteredAt = 0;
        this.lastTargetSwitchAt = 0;
        this.currentTarget = null;
        this.wanderWaypoint = this._generateWanderWaypoint(0);
        this.wanderRotateAt = BOT_CONFIG.WANDER_ROTATE_INTERVAL;
        this.tick = 0;
    }

    /**
     * Seeded pseudo-random (deterministic based on seed + tick).
     * @param {number} seed
     * @returns {number} [0, 1)
     */
    _seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Generate deterministic waypoint for wandering state.
     * @param {number} tick
     * @returns {{ x: number, y: number }}
     */
    _generateWanderWaypoint(tick) {
        const angle = this._seededRandom(this.bot.seed + tick * 0.001) * Math.PI * 2;
        const dist = BOT_CONFIG.WANDER_WAYPOINT_DISTANCE;
        const baseX = CANVAS_WIDTH / 2;
        const baseY = CANVAS_HEIGHT / 2;
        return {
            x: baseX + Math.cos(angle) * dist,
            y: baseY + Math.sin(angle) * dist,
        };
    }

    /**
     * Find nearest jungle camp (for JUNGLE_FARM state).
     * @returns {{ x: number, y: number } | null}
     */
    _findNearestCamp() {
        let nearest = null;
        let minDist = Infinity;
        for (const camp of JUNGLE_CAMP_LOCATIONS) {
            const dist = Math.hypot(camp.x - this.bot.x, camp.y - this.bot.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = camp;
            }
        }
        return nearest;
    }

    /**
     * Find all entities (players/bots) within vision range.
     * @param {Array} allBots
     * @param {object} player
     * @returns {Array} [{ entity, distance }]
     */
    _findVisibleEnemies(allBots, player) {
        const enemies = [];

        if (player && !player.isDead) {
            const dist = Math.hypot(player.x - this.bot.x, player.y - this.bot.y);
            if (dist < BOT_CONFIG.VISION_RANGE) {
                enemies.push({ entity: player, distance: dist, isPlayer: true });
            }
        }

        for (const otherBot of allBots) {
            if (otherBot === this.bot || otherBot.isDead) continue;
            const dist = Math.hypot(otherBot.x - this.bot.x, otherBot.y - this.bot.y);
            if (dist < BOT_CONFIG.VISION_RANGE) {
                enemies.push({ entity: otherBot, distance: dist, isPlayer: false });
            }
        }

        return enemies.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Move towards a target position.
     * @param {number} targetX
     * @param {number} targetY
     * @param {number} maxSpeed — clamp movement speed
     */
    _moveTowards(targetX, targetY, maxSpeed) {
        const dx = targetX - this.bot.x;
        const dy = targetY - this.bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 1) {
            this.bot.vx = 0;
            this.bot.vy = 0;
            return;
        }

        this.bot.vx = (dx / dist) * maxSpeed;
        this.bot.vy = (dy / dist) * maxSpeed;
    }

    /**
     * Clamp position to world bounds.
     */
    _clampWorldBounds() {
        const margin = this.bot.radius + 10;
        this.bot.x = Math.max(margin, Math.min(CANVAS_WIDTH - margin, this.bot.x));
        this.bot.y = Math.max(margin, Math.min(CANVAS_HEIGHT - margin, this.bot.y));
    }

    /**
     * Main update loop — called every frame from game-loop.
     * @param {object} gameState — { running, deltaTime, ... }
     * @param {Array} allBots — all bot entities
     * @param {object} player — player entity
     * @param {object} blight — Blight zone state
     */
    update(gameState, allBots, player, blight) {
        this.tick++;
        const now = Date.now();
        const deltaTime = gameState.deltaTime || 16;
        const speed = this.bot.speed || 2;

        const now_ms = now;
        const isOutsideZone = isOutsideBlight(this.bot.x, this.bot.y);
        const visibleEnemies = this._findVisibleEnemies(allBots, player);

        let nextState = this.currentState;

        if (isOutsideZone) {
            nextState = BOT_STATE.CIRCLE_ESCAPE;
        } else if (visibleEnemies.length > 0) {
            nextState = BOT_STATE.PLAYER_AGGRO;
        } else {
            nextState = this.currentState === BOT_STATE.JUNGLE_FARM
                ? BOT_STATE.JUNGLE_FARM
                : BOT_STATE.WANDERING;
        }

        if (nextState !== this.currentState) {
            this.currentState = nextState;
            this.stateEnteredAt = now_ms;
            this.currentTarget = null;
        }

        switch (this.currentState) {
            case BOT_STATE.CIRCLE_ESCAPE:
                this._updateCircleEscape(blight, speed);
                break;

            case BOT_STATE.PLAYER_AGGRO:
                this._updatePlayerAggro(visibleEnemies, speed, now_ms);
                break;

            case BOT_STATE.JUNGLE_FARM:
                this._updateJungleFarm(speed);
                break;

            case BOT_STATE.WANDERING:
            default:
                this._updateWandering(speed);
                break;
        }

        this.bot.x += this.bot.vx;
        this.bot.y += this.bot.vy;
        this._clampWorldBounds();

        if (this.bot.getPointer) {
            const ptr = this.bot.getPointer();
            if (ptr) {
                this.bot.facingAngle = Math.atan2(ptr.y - this.bot.y, ptr.x - this.bot.x);
            }
        }
    }

    /**
     * CIRCLE_ESCAPE: Run towards center of shrinking zone.
     * Highest priority — prevents getting stuck in storm.
     */
    _updateCircleEscape(blight, speed) {
        const safeRadius = blight.currentRadius * 0.8;
        const targetDist = Math.hypot(
            blight.center.x - this.bot.x,
            blight.center.y - this.bot.y
        );

        if (targetDist > safeRadius) {
            this._moveTowards(blight.center.x, blight.center.y, speed * 1.2);
        } else {
            this.bot.vx *= 0.9;
            this.bot.vy *= 0.9;
        }
    }

    /**
     * PLAYER_AGGRO: Chase and attack the nearest visible enemy.
     */
    _updatePlayerAggro(visibleEnemies, speed, now) {
        if (visibleEnemies.length === 0) {
            this.currentTarget = null;
            this.bot.vx = 0;
            this.bot.vy = 0;
            return;
        }

        const targetEnemy = visibleEnemies[0];
        this.currentTarget = targetEnemy.entity;

        const dist = targetEnemy.distance;
        if (dist < BOT_CONFIG.ATTACK_RANGE) {
            this.bot.vx = 0;
            this.bot.vy = 0;
        } else {
            this._moveTowards(this.currentTarget.x, this.currentTarget.y, speed);
        }
    }

    /**
     * JUNGLE_FARM: Head to nearest jungle camp for XP/gold.
     */
    _updateJungleFarm(speed) {
        if (!this.currentTarget) {
            this.currentTarget = this._findNearestCamp();
        }

        if (!this.currentTarget) {
            this.currentState = BOT_STATE.WANDERING;
            return;
        }

        const dist = Math.hypot(
            this.currentTarget.x - this.bot.x,
            this.currentTarget.y - this.bot.y
        );

        if (dist < 100) {
            this.currentTarget = null;
        } else {
            this._moveTowards(this.currentTarget.x, this.currentTarget.y, speed);
        }
    }

    /**
     * WANDERING: Patrol deterministically towards seeded waypoints.
     * No per-frame randomness — all movement is tick-based.
     */
    _updateWandering(speed) {
        const dist = Math.hypot(
            this.wanderWaypoint.x - this.bot.x,
            this.wanderWaypoint.y - this.bot.y
        );

        if (dist < 150 || this.tick > this.wanderRotateAt) {
            this.wanderWaypoint = this._generateWanderWaypoint(this.tick);
            this.wanderRotateAt = this.tick + BOT_CONFIG.WANDER_ROTATE_INTERVAL;
        }

        this._moveTowards(this.wanderWaypoint.x, this.wanderWaypoint.y, speed * 0.7);
    }

    /**
     * Get current state for debugging/UI.
     */
    getState() {
        return this.currentState;
    }

    /**
     * Get target if any (for visualization).
     */
    getTarget() {
        return this.currentTarget;
    }
}
