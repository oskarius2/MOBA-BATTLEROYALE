// ============================================================
// core/bot-manager.js
// AI-bot-hantering för battle royale-simulering.
// ============================================================

import { Bot } from './entities/bot.js';

export let Bots = [];

const DEFAULT_SPAWNS = [
    { x: 1000, y: 1000, heroClass: 'Warrior',     seed: 101 },
    { x: 5000, y: 1000, heroClass: 'Mage',        seed: 102 },
    { x: 1000, y: 5000, heroClass: 'Ranger',      seed: 103 },
    { x: 5000, y: 5000, heroClass: 'Tank-Viking', seed: 104 },
    { x: 3000, y: 1200, heroClass: 'Hybrid',      seed: 105 },
    { x: 2800, y: 4800, heroClass: 'Warrior',     seed: 106 },
];

export function resetBots() {
    Bots = [];
}

/**
 * @param {number} [count=5] — antal bots att spawna
 */
export function spawnBots(count = 5) {
    Bots = [];
    const slots = DEFAULT_SPAWNS.slice(0, Math.max(0, count));
    for (const pos of slots) {
        Bots.push(new Bot(pos.x, pos.y, pos.heroClass, pos.seed));
    }
}
