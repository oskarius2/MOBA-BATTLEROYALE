// ============================================================
// core/entities/bot.js
// Bot-entitet — AI-kontrollerad spelare-liknande enhet.
// Använder BotBrain för FSM-baserad AI-logik.
// ============================================================

import { BotBrain } from './bot-brain.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../data/world-config.js';

/**
 * Bot — en AI-kontrollerad enhet som använder BotBrain för beslutsfattande.
 *
 * En bot har samma struktur som en Player, men med:
 *   - BotBrain för AI-logik istället för keyboard input
 *   - seed för deterministisk rörelse
 *   - färgat efter sitt lag (senare)
 */
export class Bot {
    constructor(x, y, heroClass = 'Warrior', seed = 1) {
        // Position & fysik
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 26;
        this.speed = 3.6;

        // Stats
        this.maxHp = 130;
        this.hp = 130;
        this.level = 1;
        this.heroClass = heroClass;
        this.isDead = false;

        // Combat
        this.projectileDamage = 26;
        this.baseArmor = 3;
        this.lastDamageTaken = 0;

        // AI
        this.brain = new BotBrain(this);
        this.seed = seed; // För deterministisk AI

        // Rendering
        this.facingAngle = 0;
        this.fillColor = this._getColorForClass(heroClass);
        this.strokeColor = '#fff';
    }

    /**
     * Uppdatera bot-staten (kallas från game-loop)
     * @param {Object} gameState - { circleCenter, circleRadius, circleShrinking, players, bots, tick, ... }
     */
    update(gameState) {
        if (this.isDead) return;

        // Låt hjärnan beräkna rörelsen
        this.brain.update(gameState);

        // Clamp HP
        if (this.hp <= 0) {
            this.isDead = true;
            this.hp = 0;
        }
    }

    /**
     * Ta skada
     */
    takeDamage(amount) {
        if (this.isDead) return;
        this.hp = Math.max(0, this.hp - amount);
        this.lastDamageTaken = amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    /**
     * Ritning (enkelt proceduralt)
     */
    draw(ctx, camera) {
        if (this.isDead) return;

        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Cirkulär kropp
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.fillColor;
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Riktningsindikator
        const arrowLen = this.radius * 1.2;
        const arrowX = screenX + Math.cos(this.facingAngle) * arrowLen;
        const arrowY = screenY + Math.sin(this.facingAngle) * arrowLen;

        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(arrowX, arrowY);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // HP-bar
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const hpPercent = this.hp / this.maxHp;

        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.radius - 12, barWidth, barHeight);

        ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        ctx.fillRect(screenX - barWidth / 2, screenY - this.radius - 12, barWidth * hpPercent, barHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - barWidth / 2, screenY - this.radius - 12, barWidth, barHeight);
    }

    /**
     * Returnera färg baserat på hero-klass
     */
    _getColorForClass(heroClass) {
        const colors = {
            'Warrior':      '#d4691f',  // Orange-brun
            'Tank-Viking':  '#8b4513',  // Mörkare brun
            'Mage':         '#6666ff',  // Blå
            'Ranger':       '#66ff66',  // Grön
            'Hybrid':       '#ff66ff',  // Magenta
        };
        return colors[heroClass] ?? '#999';
    }

    /**
     * Gilla som Player: levelUp
     */
    levelUp() {
        this.level += 1;
        this.maxHp += 20;
        this.hp = this.maxHp;
        this.projectileDamage += 2;
    }
}
