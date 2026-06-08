/**
 * Structural parity vs design dumps (not byte-identical — intentional wiring diffs allowed).
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const errors = [];
const ok = (msg) => console.log(`PASS ${msg}`);
const fail = (msg) => { errors.push(msg); console.log(`FAIL ${msg}`); };

function extractExports(src) {
    return [...src.matchAll(/export function (\w+)/g)].map(m => m[1]);
}

function extractIds(html) {
    return new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));
}

// HUD dump vs index.html
const dumpHud = read('dump-hud.txt');
const indexHtml = read('index.html');
const hudIds = extractIds(dumpHud);
const indexIds = extractIds(indexHtml);
for (const id of hudIds) {
    if (!indexIds.has(id)) fail(`HUD dump id missing in index.html: ${id}`);
}
ok(`HUD ids in index (${hudIds.size} checked)`);

const hudFns = ['markHudDirty', 'updateHud', 'showLevelUpFlash'];
for (const fn of hudFns) {
    if (!read('ui/hud.js').includes(`export function ${fn}`)) fail(`hud.js missing ${fn}`);
}
ok('hud.js exports');

// Menu dump — key stage ids
for (const stage of ['welcome', 'main', 'class', 'settings']) {
    const id = `menu-stage-${stage}`;
    if (!indexHtml.includes(id)) fail(`menu stage missing: ${id}`);
}
ok('menu stages in index.html');

// Shop dump — key markers
const shop = read('ui/shop-interface.js');
const dumpShop = read('dump-shop.txt');
for (const marker of ['Merchant\'s Cache', 'shop-card', 'shop-buy-btn', 'ensureShopMounted']) {
    if (!shop.includes(marker)) fail(`shop missing marker: ${marker}`);
}
if (!dumpShop.includes('Merchant\'s Cache')) fail('dump-shop missing Merchant\'s Cache');
ok('shop structural markers');

// Canvas dump — creep sprites
const canvas = read('core/canvas-renderer.js');
for (const fn of ['drawScoutSprite', 'drawWarriorBeast', 'drawAncientGolem', 'initForestEnvironment']) {
    if (!canvas.includes(fn)) fail(`canvas missing ${fn}`);
}
ok('canvas creep sprites');

if (errors.length) {
    console.log(`\nDUMP PARITY: ${errors.length} FAILURES`);
    process.exitCode = 1;
} else {
    console.log('\nDUMP PARITY: ALL PASSED');
}
