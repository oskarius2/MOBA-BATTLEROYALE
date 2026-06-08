import { readFileSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(path) {
    return readFileSync(join(root, path), 'utf8');
}

let failed = 0;
const fail = (msg) => { console.log('FAIL', msg); failed++; };
const pass = (msg) => console.log('PASS', msg);

const html = read('index.html');
const htmlIds = new Set([...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]));

const requiredIds = [
    'gameCanvas', 'damage-overlay', 'creeps-count', 'alive-counter', 'minimap', 'hud-blight',
    'hud-portrait-letter', 'hud-level-badge', 'hud-hero-name', 'health-bar', 'xp-bar',
    'hud-gold-value', 'hud-buffs', 'slot-1', 'slot-2', 'slot-3', 'level-up-flash',
    'game-over-screen', 'class-select-overlay', 'hero-card-grid', 'enter-forest-btn',
    'menu-stage-welcome', 'menu-stage-main', 'menu-stage-class-select', 'menu-stage-settings',
];

for (const id of requiredIds) {
    if (!htmlIds.has(id)) fail(`missing HTML id: ${id}`);
}
if (failed === 0) pass('all required HTML ids');

for (const path of [
    'ui/hud.js', 'ui/hud-tokens.css', 'ui/menu-interface.js', 'ui/shop-interface.js', 'ui/map-presence.js',
    'ui/minimap.js', 'ui/damage-numbers.js', 'ui/game-settings.js',
    'core/game-loop.js', 'core/game-init.js', 'core/canvas-renderer.js', 'core/inventory.js',
]) {
    if (!existsSync(join(root, path))) fail(`missing file ${path}`);
}
if (!failed) pass('all module files exist');

const css = read('ui/hud-tokens.css');
const zBlock = css.match(/#creep-info,\s*\n#hud-top-right[\s\S]*?z-index: 20;/)?.[0] ?? '';
if (zBlock.includes('position: relative')) fail('HUD z-index block breaks absolute positioning');
else pass('HUD corner CSS');

const renderer = read('core/canvas-renderer.js');
if (!renderer.includes('drawScoutSprite') || renderer.includes('getNeonGradient')) fail('creep sprites');
else pass('dark-fantasy creeps');

if (!read('core/inventory.js').includes('paintInventorySlot')) fail('inventory');
else pass('inventory slots');

if (!read('core/damage-events.js').includes('isDamageNumbersEnabled')) fail('damage event gate');
else pass('damage numbers gated');

await import(pathToFileURL(join(root, 'core/balance-validator.js')).href);
const { runBalanceReport } = await import(pathToFileURL(join(root, 'core/balance-validator.js')).href);
const balanceOk = runBalanceReport();
if (!balanceOk) fail('balance validator');
else pass('balance 21/21');

console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exitCode = failed ? 1 : 0;
