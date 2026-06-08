// ============================================================
// core/vision-grid.js
// Utforskad vision-grid för minimap/fog (single-player).
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/world-config.js';

const CELL = 120;
const COLS = Math.ceil(CANVAS_WIDTH / CELL);
const ROWS = Math.ceil(CANVAS_HEIGHT / CELL);

let _revealed = null;

function ensureGrid() {
    if (_revealed) return;
    _revealed = new Uint8Array(COLS * ROWS);
}

export function resetVision() {
    _revealed = new Uint8Array(COLS * ROWS);
}

/**
 * Markera synlighet runt en world-position.
 */
export function revealVision(x, y, radius) {
    ensureGrid();
    const r2 = radius * radius;
    const minCx = Math.max(0, Math.floor((x - radius) / CELL));
    const maxCx = Math.min(COLS - 1, Math.floor((x + radius) / CELL));
    const minCy = Math.max(0, Math.floor((y - radius) / CELL));
    const maxCy = Math.min(ROWS - 1, Math.floor((y + radius) / CELL));

    for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
            const wx = cx * CELL + CELL * 0.5;
            const wy = cy * CELL + CELL * 0.5;
            if ((wx - x) ** 2 + (wy - y) ** 2 <= r2) {
                _revealed[cy * COLS + cx] = 1;
            }
        }
    }
}

export function isVisible(x, y) {
    ensureGrid();
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
    return _revealed[cy * COLS + cx] === 1;
}

export function getVisionGrid() {
    ensureGrid();
    return { cols: COLS, rows: ROWS, cell: CELL, revealed: _revealed };
}
