// ============================================================
// core/entities/bot-brain.js
// AI Brain för bot-entiteter — Finite State Machine (FSM)
// med 4 tillstånd: CIRCLE_ESCAPE, PLAYER_AGGRO, JUNGLE_FARM, WANDERING
// 100% deterministisk, INGEN Math.random() i loopen.
// ============================================================

import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    VISION_RADIUS,
    JUNGLE_CAMP_LOCATIONS,
} from '../../data/world-config.js';

/**
 * States för bot-hjärnan
 */
const FSM_STATES = {
    CIRCLE_ESCAPE:  'CIRCLE_ESCAPE',   // Högst prio: fly från krympande BR-zon
    PLAYER_AGGRO:   'PLAYER_AGGRO',    // Attackera/jaga spelare/bots
    JUNGLE_FARM:    'JUNGLE_FARM',     // Farmra jungle för XP/guld
    WANDERING:      'WANDERING',       // Patrullera deterministiskt
};

/**
 * BotBrain — styr en bot-entitet genom enkel FSM.
 * Uppdateras varje frame via update(gameState).
 *
 * Inputparametrar:
 *   - bot: botentiteten själv (har x, y, vx, vy, speed, radius, seed)
 *   - gameState: { circleShrinking, circleCenter, circleRadius, players, bots, jungleCamps, deltaTime, tick }
 *
 * Output:
 *   - bot.vx, bot.vy sätts baserat på FSM-tillståndet
 *   - bot.x, bot.y uppdateras med de nya hastighetskomponenterna
 */
export class BotBrain {
    constructor(bot) {
        this.bot = bot;

        // FSM state
        this.currentState = FSM_STATES.WANDERING;
        this.stateTimer = 0;          // ticks i nuvarande state

        // Targets
        this.aggroTarget = null;      // { x, y, type: 'player'|'bot' }
        this.jungleCampTarget = null; // index in JUNGLE_CAMP_LOCATIONS

        // Deterministic wandering state
        this.patrolAngle = 0;
        this.patrolAngleSpeed = 0.02; // rad/tick
        this.patrolRadius = 400;      // pixels
    }

    /**
     * Huvuduppdaterings-metod. Kallas varje frame från game-loop.
     *
     * @param {Object} gameState - { circleShrinking, circleCenter, circleRadius, players, bots, jungleCamps, deltaTime, tick, allCreeps }
     */
    update(gameState) {
        const { circleShrinking, circleCenter, circleRadius, players, bots, deltaTime, tick } = gameState;

        // ─── DECISION LOGIC: Evaluera vilka targets som är tillgängliga ──────

        const botDistToCircle = Math.hypot(
            gameState.circleCenter.x - this.bot.x,
            gameState.circleCenter.y - this.bot.y
        );
        const isOutsideCircle = botDistToCircle > gameState.circleRadius + this.bot.radius;

        // Hitta närmaste synlig spelare/bot inom VISION_RADIUS
        const visibleEnemies = this._findVisibleEnemies(players, bots);

        // Hitta närmaste jungle camp
        const nearestCamp = this._findNearestJungleCamp();

        // ─── FSM STATE TRANSITIONS ─────────────────────────────────────────

        if (isOutsideCircle && circleShrinking) {
            // CIRCLE_ESCAPE har högst prio
            this.currentState = FSM_STATES.CIRCLE_ESCAPE;
        } else if (visibleEnemies.length > 0) {
            // PLAYER_AGGRO om fiende synlig
            this.currentState = FSM_STATES.PLAYER_AGGRO;
            this.aggroTarget = visibleEnemies[0]; // närmaste enemy
            this.stateTimer = 0;
        } else if (nearestCamp && !this._isCampTaken(nearestCamp)) {
            // JUNGLE_FARM om jungle-camp är tillgängligt
            this.currentState = FSM_STATES.JUNGLE_FARM;
            this.jungleCampTarget = nearestCamp;
            this.stateTimer = 0;
        } else {
            // WANDERING fallback
            this.currentState = FSM_STATES.WANDERING;
        }

        // ─── EXECUTE FSM STATE ────────────────────────────────────────────

        switch (this.currentState) {
            case FSM_STATES.CIRCLE_ESCAPE:
                this._executeCircleEscape(gameState);
                break;

            case FSM_STATES.PLAYER_AGGRO:
                this._executePlayerAggro(gameState, visibleEnemies);
                break;

            case FSM_STATES.JUNGLE_FARM:
                this._executeJungleFarm(gameState);
                break;

            case FSM_STATES.WANDERING:
            default:
                this._executeWandering(gameState, tick);
                break;
        }

        // ─── APPLY MOVEMENT ───────────────────────────────────────────────

        // Normalisera rörelsevektorn så det inte går snabbare diagonalt
        const mag = Math.hypot(this.bot.vx, this.bot.vy);
        if (mag > 0) {
            const moveSpeed = this.bot.speed ?? 3.5;
            this.bot.vx = (this.bot.vx / mag) * moveSpeed;
            this.bot.vy = (this.bot.vy / mag) * moveSpeed;
        }

        // Uppdatera position
        this.bot.x += this.bot.vx;
        this.bot.y += this.bot.vy;

        // Clamp till kartgränser
        const MAP_MIN = 32;
        const MAP_MAX = Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) - 32;
        this.bot.x = Math.max(MAP_MIN, Math.min(MAP_MAX, this.bot.x));
        this.bot.y = Math.max(MAP_MIN, Math.min(MAP_MAX, this.bot.y));

        this.stateTimer++;
    }

    /**
     * CIRCLE_ESCAPE: Rör sig mot cirkelns mitt om den är utanför
     */
    _executeCircleEscape(gameState) {
        const { circleCenter } = gameState;
        const dx = circleCenter.x - this.bot.x;
        const dy = circleCenter.y - this.bot.y;
        const mag = Math.hypot(dx, dy);

        if (mag > 0) {
            this.bot.vx = dx / mag;
            this.bot.vy = dy / mag;
        }
    }

    /**
     * PLAYER_AGGRO: Chasar närmaste synlig fiende
     */
    _executePlayerAggro(gameState, visibleEnemies) {
        if (!this.aggroTarget || visibleEnemies.length === 0) {
            this.bot.vx = 0;
            this.bot.vy = 0;
            return;
        }

        const target = this.aggroTarget;
        const dx = target.x - this.bot.x;
        const dy = target.y - this.bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.bot.vx = dx / dist;
            this.bot.vy = dy / dist;
        }
    }

    /**
     * JUNGLE_FARM: Rör sig mot närmaste jungle camp
     */
    _executeJungleFarm(gameState) {
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

    /**
     * WANDERING: Patrullera deterministiskt utan Math.random()
     * Använder bot.seed + game tick för reproducerbar rörelse.
     */
    _executeWandering(gameState, tick) {
        // Seed-baserad deterministisk patrollering
        const seedModifier = this.bot.seed ?? 1;
        const patrolSpeed = 0.02 + (seedModifier % 100) * 0.0001;

        this.patrolAngle += patrolSpeed;
        if (this.patrolAngle > Math.PI * 2) {
            this.patrolAngle -= Math.PI * 2;
        }

        // Rör sig i en cirkelformad patrull runt startpositionen
        // (eller nuvarande "home base")
        const homeX = (this.bot.seed ?? 1) % CANVAS_WIDTH;
        const homeY = ((this.bot.seed ?? 1) * 71) % CANVAS_HEIGHT;

        const circleX = homeX + Math.cos(this.patrolAngle) * this.patrolRadius;
        const circleY = homeY + Math.sin(this.patrolAngle) * this.patrolRadius;

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
     * Hitta alla synliga fiender (spelare + andra bots) inom VISION_RADIUS
     * Sorterad efter distans.
     *
     * @returns {Array<{ x: number, y: number, type: string }>}
     */
    _findVisibleEnemies(players, bots) {
        const enemies = [];

        // Alla spelare är fiender för bots
        if (Array.isArray(players)) {
            for (const player of players) {
                if (!player || player.hp <= 0) continue;
                const dist = Math.hypot(player.x - this.bot.x, player.y - this.bot.y);
                if (dist < VISION_RADIUS) {
                    enemies.push({ x: player.x, y: player.y, dist, type: 'player' });
                }
            }
        }

        // Andra bots är också fiender (eller allies beroende på team senare)
        // För nu: alla bots är potentiella targets
        if (Array.isArray(bots)) {
            for (const bot of bots) {
                if (!bot || bot === this.bot || bot.hp <= 0) continue;
                const dist = Math.hypot(bot.x - this.bot.x, bot.y - this.bot.y);
                if (dist < VISION_RADIUS) {
                    enemies.push({ x: bot.x, y: bot.y, dist, type: 'bot' });
                }
            }
        }

        // Sortera efter distans, närmaste först
        enemies.sort((a, b) => a.dist - b.dist);
        return enemies;
    }

    /**
     * Hitta närmaste jungle camp
     *
     * @returns {number|null} index i JUNGLE_CAMP_LOCATIONS, eller null
     */
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

        // Om närmaste camp är väldigt långt bort, ignorera
        if (nearestDist > 2000) return null;

        return nearest;
    }

    /**
     * Dummy-check: är campet redan taget/farmrat?
     * (Kommer implementeras senare när vi kopplar in creep-system)
     *
     * @returns {boolean}
     */
    _isCampTaken(campIndex) {
        // TODO: Kolla om campet har creeps eller är cooldown
        return false;
    }
}

export const FSM_STATES_EXPORT = FSM_STATES;
