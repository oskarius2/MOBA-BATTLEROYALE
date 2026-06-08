/**
 * Fetch all traced modules + index via local HTTP — verifies 200 responses.
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.AUDIT_PORT || 8765);
const BASE = `http://127.0.0.1:${PORT}`;

function resolveImport(fromFile, spec) {
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

const visited = new Set();
const queue = ['index.html'];
while (queue.length) {
    const rel = queue.shift();
    if (visited.has(rel)) continue;
    visited.add(rel);
    if (!existsSync(join(root, rel))) continue;
    const src = readFileSync(join(root, rel), 'utf8');
    for (const line of src.split('\n')) {
        const m = line.match(/^\s*import\s+.+\s+from\s+['"](\.\.?\/[^'"]+)['"]/);
        if (!m) continue;
        const target = resolveImport(rel, m[1]);
        if (target && !visited.has(target)) queue.push(target);
    }
}

const paths = ['index.html', 'ui/hud-tokens.css', 'assets/manifest.json', ...[...visited].filter(p => p.endsWith('.js'))];
let failed = 0;

for (const p of paths) {
    const url = `${BASE}/${p.replace(/\\/g, '/')}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`FAIL ${res.status} ${p}`);
            failed++;
        }
    } catch (e) {
        console.log(`FAIL fetch ${p}: ${e.message}`);
        failed++;
    }
}

console.log(`HTTP assets: ${paths.length} checked, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
