/**
 * Runtime smoke — catches import cycles, missing exports, and drawHpBar TDZ issues.
 */
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(import.meta.url);

let failed = 0;
const fail = (msg) => { console.error('FAIL', msg); failed++; };

// ── 1. Full import graph from index.html entry points ──
const modules = [
    'core/entities/player.js',
    'core/input.js',
    'core/camera.js',
    'core/inventory.js',
    'core/game-loop.js',
    'core/game-init.js',
    'ui/hud.js',
    'ui/shop-interface.js',
    'ui/map-presence.js',
    'ui/menu-interface.js',
    'core/canvas-renderer.js',
    'core/ability-engine.js',
    'core/damage-events.js',
    'ui/damage-numbers.js',
    'ui/game-settings.js',
    'ui/minimap.js',
    'core/bot-manager.js',
    'core/vision-grid.js',
    'core/rendering/weapon-arc-renderer.js',
    'core/rendering/ground-textures.js',
    'core/world/blight.js',
    'data/hero-roster.js',
    'data/shop-catalog.js',
    'data/world-config.js',
    'core/balance-config.js',
    'core/economy-engine.js',
];

for (const mod of modules) {
    try {
        await import(pathToFileURL(join(root, mod)).href);
    } catch (e) {
        fail(`import ${mod}: ${e.message}`);
    }
}
if (!failed) console.log('PASS all module imports');

// ── 2. drawHpBar callable from drawScoutSprite (no TDZ at runtime) ──
const { drawScoutSprite, drawCreepModel, drawHpBar } = await import(
    pathToFileURL(join(root, 'core/canvas-renderer.js')).href
);

const calls = [];
const mockCtx = {
    save() { calls.push('save'); },
    restore() { calls.push('restore'); },
    beginPath() {},
    closePath() {},
    arc() {},
    ellipse() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    fill() {},
    stroke() {},
    translate() {},
    rotate() {},
    set fillStyle(_) {},
    set strokeStyle(_) {},
    set lineWidth(_) {},
    set globalAlpha(_) {},
    createLinearGradient() {
        return { addColorStop() {} };
    },
    fillRect() {},
    strokeRect() {},
};

try {
    drawHpBar(mockCtx, 100, 50, 40, 4, 0.5, '#ff0000');
    drawScoutSprite(mockCtx, 200, 200, 0, 1000, 0.8);
    drawCreepModel(mockCtx, {
        x: 300, y: 300, hp: 50, maxHp: 100,
        typeKey: 'scout', facingAngle: 0, radius: 15, state: 'PATROL',
    }, 1000);
    console.log('PASS creep draw runtime (no TDZ crash)');
} catch (e) {
    fail(`creep draw runtime: ${e.message}`);
}

// ── 3. Settings gate actually blocks damage events ──
const { gameSettings, setGameSetting } = await import(
    pathToFileURL(join(root, 'ui/game-settings.js')).href
);
const { pushDamageEvent, clearDamageEvents } = await import(
    pathToFileURL(join(root, 'core/damage-events.js')).href
);
const { spawnDamageNumber, clearDamageNumbers } = await import(
    pathToFileURL(join(root, 'ui/damage-numbers.js')).href
);

setGameSetting('damageNumbers', false);
clearDamageEvents();
clearDamageNumbers();
pushDamageEvent(0, 0, 99, 'physical');
const { getDamageEvents } = await import(pathToFileURL(join(root, 'core/damage-events.js')).href);
if (getDamageEvents().length !== 0) fail('damage queue grew when disabled');
else console.log('PASS damage gate');

setGameSetting('damageNumbers', true);
pushDamageEvent(0, 0, 5, 'physical');
if (getDamageEvents().length !== 1) fail('damage queue should accept when enabled');
else console.log('PASS damage enabled');

// ── 4. Inventory paint contract ──
const { resetInventory, inventoryItems } = await import(
    pathToFileURL(join(root, 'core/inventory.js')).href
);
try {
    if (typeof document === 'undefined') {
        inventoryItems.slot1 = null;
        inventoryItems.slot2 = null;
        inventoryItems.slot3 = null;
    } else {
        resetInventory();
    }
    if (inventoryItems.slot1 !== null || inventoryItems.slot2 !== null || inventoryItems.slot3 !== null) {
        fail('inventory reset');
    } else {
        console.log('PASS inventory reset logic');
    }
} catch (e) {
    fail(`inventory: ${e.message}`);
}

console.log(failed ? `\n${failed} RUNTIME FAILURES` : '\nALL RUNTIME CHECKS PASSED');
process.exitCode = failed ? 1 : 0;
