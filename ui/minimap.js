// ============================================================
// ui/minimap.js
// Minimap with explored fog — local player only, no other players.
// ============================================================

import {
    GRID_COLS, GRID_ROWS, isCellExplored, isCellVisible, getExploredGrid,
} from '../core/vision-grid.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, VISION_RADIUS } from '../data/world-config.js';

const SIZE = 168;
const THROTTLE_MS = 100;

let _canvas = null;
let _ctx = null;
let _lastRender = 0;

const COLORS = {
    unexplored: '#030704',
    explored:   '#0d1a0a',
    visible:    '#1a3020',
    blight:     'rgba(120, 40, 160, 0.35)',
    blightEdge: 'rgba(155, 89, 182, 0.7)',
    camp:       '#c9a227',
    player:     '#c9a227',
};

export function initMinimap() {
    _canvas = document.getElementById('minimap');
    if (!_canvas) return;
    _canvas.width  = SIZE;
    _canvas.height = SIZE;
    _ctx = _canvas.getContext('2d');
}

export function updateMinimap({ player, blight, camps, creeps, time = 0 }) {
    if (!_ctx || !player) return;
    if (time - _lastRender < THROTTLE_MS) return;
    _lastRender = time;

    const scaleX = SIZE / CANVAS_WIDTH;
    const scaleY = SIZE / CANVAS_HEIGHT;
    const explored = getExploredGrid();

    _ctx.fillStyle = COLORS.unexplored;
    _ctx.fillRect(0, 0, SIZE, SIZE);

    const cellW = SIZE / GRID_COLS;
    const cellH = SIZE / GRID_ROWS;

    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            if (!explored[row * GRID_COLS + col]) continue;

            const worldX = (col + 0.5) * (CANVAS_WIDTH / GRID_COLS);
            const worldY = (row + 0.5) * (CANVAS_HEIGHT / GRID_ROWS);
            const visible = isCellVisible(player.x, player.y, worldX, worldY, VISION_RADIUS);

            _ctx.fillStyle = visible ? COLORS.visible : COLORS.explored;
            _ctx.fillRect(col * cellW, row * cellH, cellW + 0.5, cellH + 0.5);
        }
    }

    if (blight) {
        const bx = blight.center.x * scaleX;
        const by = blight.center.y * scaleY;
        const br = blight.currentRadius * scaleX;

        _ctx.save();
        _ctx.beginPath();
        _ctx.rect(0, 0, SIZE, SIZE);
        _ctx.arc(bx, by, br, 0, Math.PI * 2, true);
        _ctx.fillStyle = COLORS.blight;
        _ctx.fill('evenodd');
        _ctx.restore();

        _ctx.beginPath();
        _ctx.arc(bx, by, br, 0, Math.PI * 2);
        _ctx.strokeStyle = COLORS.blightEdge;
        _ctx.lineWidth = 1.5;
        _ctx.stroke();
    }

    if (camps) {
        for (const camp of camps) {
            if (!isCellVisible(player.x, player.y, camp.x, camp.y, VISION_RADIUS)) continue;
            _ctx.beginPath();
            _ctx.arc(camp.x * scaleX, camp.y * scaleY, 2.5, 0, Math.PI * 2);
            _ctx.fillStyle = COLORS.camp;
            _ctx.fill();
        }
    }

    if (creeps) {
        for (const creep of creeps) {
            if (creep.isDead) continue;
            if (!isCellVisible(player.x, player.y, creep.x, creep.y, VISION_RADIUS)) continue;
            _ctx.beginPath();
            _ctx.arc(creep.x * scaleX, creep.y * scaleY, 1.5, 0, Math.PI * 2);
            _ctx.fillStyle = 'rgba(255, 100, 80, 0.8)';
            _ctx.fill();
        }
    }

    const px = player.x * scaleX;
    const py = player.y * scaleY;
    const angle = player.facingAngle ?? 0;

    _ctx.save();
    _ctx.translate(px, py);
    _ctx.rotate(angle);
    _ctx.beginPath();
    _ctx.moveTo(5, 0);
    _ctx.lineTo(-3, -3.5);
    _ctx.lineTo(-1.5, 0);
    _ctx.lineTo(-3, 3.5);
    _ctx.closePath();
    _ctx.fillStyle = COLORS.player;
    _ctx.fill();
    _ctx.restore();
}
