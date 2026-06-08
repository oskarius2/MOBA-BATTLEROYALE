/**
 * Full cross-reference audit — no browser required.
 */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

let errors = [];
const err = (msg) => errors.push(msg);

function resolveImport(fromFile, spec) {
    if (!spec.startsWith('./') && !spec.startsWith('../')) return null;
    const base = dirname(fromFile);
    const parts = join(base, spec).split(/[/\\]/);
    const out = [];
    for (const p of parts) {
        if (p === '.' || p === '') continue;
        if (p === '..') { out.pop(); continue; }
        out.push(p);
    }
    return out.join('/');
}

// ── 1. DOM id refs ──
const html = read('index.html');
const htmlIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));

const dynamicIds = new Set([
    'shop-overlay', 'shop-scrim', 'shop-item-list', 'shop-close-btn', 'map-presence-alert',
]);

const jsFiles = [
    'ui/hud.js', 'ui/menu-interface.js', 'ui/shop-interface.js', 'ui/minimap.js',
    'ui/damage-numbers.js', 'core/inventory.js', 'core/game-init.js', 'index.html',
];

const refs = new Map();
for (const file of jsFiles) {
    const src = read(file);
    for (const m of src.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)) {
        if (!refs.has(m[1])) refs.set(m[1], []);
        refs.get(m[1]).push(file);
    }
    for (const m of src.matchAll(/\$\(['"]([^'"]+)['"]\)/g)) {
        if (!refs.has(m[1])) refs.set(m[1], []);
        refs.get(m[1]).push(file);
    }
    for (const m of src.matchAll(/menu-stage-(\w[\w-]*)/g)) {
        const id = `menu-stage-${m[1]}`;
        if (!refs.has(id)) refs.set(id, []);
        refs.get(id).push(file);
    }
}

for (const [id, files] of refs) {
    if (!htmlIds.has(id) && !dynamicIds.has(id)) {
        err(`DOM id "${id}" referenced in ${files.join(', ')} but missing from index.html and dynamic set`);
    }
}

// ── 2. Import graph with correct relative resolution ──
const importRe = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
const visited = new Set();
const queue = ['index.html'];

while (queue.length) {
    const rel = queue.shift();
    if (visited.has(rel)) continue;
    visited.add(rel);

    const abs = join(root, rel);
    if (!existsSync(abs)) {
        err(`Missing import target: ${rel}`);
        continue;
    }

    const src = read(rel);
    for (const line of src.split('\n')) {
        const m = line.match(/^\s*import\s+.+\s+from\s+['"](\.\.?\/[^'"]+)['"]/);
        if (!m) continue;
        const target = resolveImport(rel, m[1]);
        if (target && !visited.has(target)) queue.push(target);
    }
}

// ── 3. Design dump parity ──
const canvas = read('core/canvas-renderer.js');
const dumpCanvas = read('dump-canvas.txt');
for (const fn of ['drawScoutSprite', 'drawWarriorBeast', 'drawAncientGolem']) {
    if (!canvas.includes(fn)) err(`canvas-renderer missing ${fn}`);
}
if (canvas.includes('getNeonGradient')) err('Neon creep renderer still present');
if (!dumpCanvas.includes('drawScoutSprite')) err('dump-canvas missing drawScoutSprite reference');

const hudCss = read('ui/hud-tokens.css');
const creepBlock = hudCss.match(/#creep-info,\s*\n#hud-top-right[\s\S]{0,200}/)?.[0] ?? '';
if (/position:\s*relative/.test(creepBlock)) err('HUD creep-info position overridden to relative');

const inv = read('core/inventory.js');
if (inv.includes('[SLOT') || !inv.includes("textContent = '—'")) err('inventory not using design placeholder');
if (inv.includes("from '../ui/shop-interface.js'")) err('inventory still imports shop-interface (should use map-presence)');

// ── 4. Settings wiring ──
if (!read('ui/game-settings.js').includes('damageNumbers: true')) err('damageNumbers default not true');
if (!html.includes('data-setting="damageNumbers"')) err('damageNumbers toggle missing data-setting');
if (!read('ui/menu-interface.js').includes('openInGameSettings')) err('in-game settings missing');
if (!read('ui/menu-interface.js').includes('ensureMenuStyles')) err('menu-interface not lazily styled');
if (!read('core/input.js').includes("key === 'escape'")) err('escape handler missing');
if (!html.includes('registerGamePauseHandler')) err('pause handler not registered in index');
if (!html.includes('isShopOpen()')) err('escape should close shop before settings');
if (!html.includes('isInGameSettingsOpen()')) err('escape should close in-game settings when open');

// ── 5. Damage pipeline gated at both layers ──
if (!read('core/damage-events.js').includes('isDamageNumbersEnabled')) err('damage-events not gated');
if (!read('ui/damage-numbers.js').includes('isDamageNumbersEnabled')) err('damage-numbers spawn not gated');

// ── 6. Forest init only in game-init ──
const forestCalls = (html.match(/initForestEnvironment/g) || []).length;
if (forestCalls > 0) err(`initForestEnvironment still in index.html (${forestCalls}x)`);

// ── 7. Ability slot data-slot in HTML ──
for (const slot of ['q', 'w', 'e', 'aa']) {
    if (!html.includes(`data-slot="${slot}"`)) err(`ability slot ${slot} missing in HTML`);
}

// ── 8. Screen shake chain ──
if (!read('core/camera.js').includes('triggerScreenShake')) err('screen shake missing from camera');
if (!read('core/entities/player.js').includes('triggerScreenShake')) err('player does not trigger shake');

// ── 9. Shop lazy mount ──
if (!read('ui/shop-interface.js').includes('ensureShopMounted')) err('shop-interface not lazily mounted');
if (!read('ui/map-presence.js').includes('checkMapPresenceUI')) err('map-presence module missing');

// ── 10. Syntax check ──
import { execSync } from 'child_process';
for (const f of [
    'core/canvas-renderer.js', 'core/game-loop.js', 'core/game-init.js',
    'ui/hud.js', 'ui/menu-interface.js', 'ui/shop-interface.js', 'ui/map-presence.js',
    'core/inventory.js', 'core/damage-events.js', 'core/input.js', 'core/camera.js',
]) {
    try {
        execSync(`node --check "${join(root, f)}"`, { stdio: 'pipe' });
    } catch {
        err(`Syntax error in ${f}`);
    }
}

console.log(`Import graph: ${visited.size} modules traced`);
console.log(`DOM refs checked: ${refs.size}`);
if (errors.length === 0) {
    console.log('\nFULL AUDIT: 0 ERRORS');
} else {
    console.log(`\nFULL AUDIT: ${errors.length} ERRORS`);
    errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
}
process.exitCode = errors.length ? 1 : 0;
