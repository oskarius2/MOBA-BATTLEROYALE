// ============================================================
// core/bot-manager.js
// AI-bot-hantering för battle royale-simulering.
// ============================================================

import { Bot } from './entities/bot.js';

export let Bots = [];

// Spawn-positioner skalade för 10 000×10 000 karta
const DEFAULT_SPAWNS = [
    { x: 1500,  y: 1500,  heroClass: 'Warrior',     seed: 101 },
    { x: 8500,  y: 1500,  heroClass: 'Mage',        seed: 102 },
    { x: 1500,  y: 8500,  heroClass: 'Ranger',      seed: 103 },
    { x: 8500,  y: 8500,  heroClass: 'Tank-Viking', seed: 104 },
    { x: 5000,  y: 1500,  heroClass: 'Hybrid',      seed: 105 },
    { x: 1500,  y: 5000,  heroClass: 'Warrior',     seed: 106 },
    { x: 8500,  y: 5000,  heroClass: 'Mage',        seed: 107 },
    { x: 5000,  y: 8500,  heroClass: 'Ranger',      seed: 108 },
    { x: 2500,  y: 2500,  heroClass: 'Hybrid',      seed: 109 },
    { x: 7500,  y: 7500,  heroClass: 'Tank-Viking', seed: 110 },
];

export function resetBots() {
    Bots = [];
}

/**
 * @param {number} [count=8] — antal bots att spawna
 */
export function spawnBots(count = 8) {
    Bots = [];
    const slots = DEFAULT_SPAWNS.slice(0, Math.max(0, count));
    for (const pos of slots) {
        Bots.push(new Bot(pos.x, pos.y, pos.heroClass, pos.seed));
    }
}
