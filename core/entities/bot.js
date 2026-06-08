// ============================================================
// core/entities/bot.js
// Bot-entitet — ren data + AI-delegering till BotBrain.
// Rendering sker i canvas-renderer.js (drawBotModel).
// ============================================================

import { BotBrain } from './bot-brain.js';
import { emitDamageNumber } from '../damage-events.js';
import { HERO_ROSTER } from '../../data/hero-roster.js';

const HERO_KEYS = Object.keys(HERO_ROSTER);

function heroKeyForClass(heroClass) {
    for (const key of HERO_KEYS) {
        if (HERO_ROSTER[key].classKey === heroClass) return key;
    }
    return 'warrior';
}

export class Bot {
    constructor(x, y, heroClass = 'Warrior', seed = 1) {
        const heroKey = heroKeyForClass(heroClass);
        const hero = HERO_ROSTER[heroKey];

        this.id = `bot-${seed}`;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = hero?.radius ?? 26;
        this.mass = hero?.mass ?? 2;
        this.speed = hero?.speed ?? 3.6;

        this.maxHp = hero?.maxHp ?? 130;
        this.hp = this.maxHp;
        this.level = 1;
        this.heroClass = heroClass;
        this.isDead = false;

        this.projectileDamage = hero?.projectileDamage ?? 26;
        this.baseArmor = 3;
        this.attackTimer = 0;

        this.brain = new BotBrain(this);
        this.seed = seed;
        this.facingAngle = 0;
    }

    get isAlive() {
        return !this.isDead && this.hp > 0;
    }

    /**
     * @param {Object} gameState
     */
    update(gameState) {
        if (!this.isAlive) return;

        const dtSec = (gameState.deltaTime ?? 16) / 1000;
        if (this.attackTimer > 0) {
            this.attackTimer = Math.max(0, this.attackTimer - dtSec);
        }

        this.brain.update(gameState);

        if (this.hp <= 0) {
            this.isDead = true;
            this.hp = 0;
        }
    }

    takeDamage(amount, damageType = 'physical') {
        if (!this.isAlive) return;
        if (amount > 0) {
            emitDamageNumber(this.x, this.y - this.radius, amount, damageType);
        }
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    levelUp() {
        this.level += 1;
        this.maxHp += 20;
        this.hp = this.maxHp;
        this.projectileDamage += 2;
    }
}
