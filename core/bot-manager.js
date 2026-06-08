// ============================================================
// core/bot-manager.js
// Bot spawn lifecycle — injected into game-loop.
// ============================================================

import { Bot } from './entities/bot.js';

export let Bots = [];

const BOT_SPAWNS = [
    { x: 1800, y: 4200, heroClass: 'Warrior',      seed: 101 },
    { x: 4200, y: 1800, heroClass: 'Ranger',       seed: 202 },
    { x: 3200, y: 3200, heroClass: 'Mage',         seed: 303 },
    { x: 1500, y: 1500, heroClass: 'Tank-Viking',  seed: 404 },
    { x: 4500, y: 4500, heroClass: 'Hybrid',       seed: 505 },
];

export function initializeBots() {
    Bots = BOT_SPAWNS.map((spawn) =>
        new Bot(spawn.x, spawn.y, spawn.heroClass, spawn.seed)
    );
}

export function resetBots() {
    Bots = [];
}
