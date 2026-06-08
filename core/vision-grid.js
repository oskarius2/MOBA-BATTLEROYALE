// ============================================================
// core/vision-grid.js
// Explored terrain grid for minimap fog of war.
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/world-config.js';

export const GRID_COLS = 60;
export const GRID_ROWS = 60;
const CELL_W = CANVAS_WIDTH / GRID_COLS;
const CELL_H = CANVAS_HEIGHT / GRID_ROWS;

const explored = new Uint8Array(GRID_COLS * GRID_ROWS);

function cellIndex(col, row) {
    return row * GRID_COLS + col;
}

export function resetVisionGrid() {
    explored.fill(0);
}

export function revealVision(px, py, radius) {
    const minCol = Math.max(0, Math.floor((px - radius) / CELL_W));
    const maxCol = Math.min(GRID_COLS - 1, Math.floor((px + radius) / CELL_W));
    const minRow = Math.max(0, Math.floor((py - radius) / CELL_H));
    const maxRow = Math.min(GRID_ROWS - 1, Math.floor((py + radius) / CELL_H));
    const rSq = radius * radius;

    for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
            const cx = (col + 0.5) * CELL_W;
            const cy = (row + 0.5) * CELL_H;
            if ((cx - px) ** 2 + (cy - py) ** 2 <= rSq) {
                explored[cellIndex(col, row)] = 1;
            }
        }
    }
}

export function isCellExplored(col, row) {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
    return explored[cellIndex(col, row)] === 1;
}

export function isCellVisible(px, py, worldX, worldY, radius) {
    return Math.hypot(worldX - px, worldY - py) <= radius;
}

export function worldToCell(x, y) {
    return {
        col: Math.min(GRID_COLS - 1, Math.max(0, Math.floor(x / CELL_W))),
        row: Math.min(GRID_ROWS - 1, Math.max(0, Math.floor(y / CELL_H))),
    };
}

export function getExploredGrid() {
    return explored;
}
