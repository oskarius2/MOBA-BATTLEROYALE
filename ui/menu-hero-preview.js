// ============================================================
// ui/menu-hero-preview.js — top-down procedural previews in class menu
// Uses the same drawHero* renderers as in-game (not side-view sprites).
// ============================================================

import {
    drawHeroWarrior,
    drawHeroMage,
    drawHeroRanger,
    drawHeroViking,
    drawHeroHybrid,
} from '../core/canvas-renderer.js';

const KEY_TO_CLASS = {
    warrior: 'Warrior',
    ranger: 'Ranger',
    tank: 'Tank-Viking',
    hybrid: 'Hybrid',
    mage: 'Mage',
};

const HERO_ACCENTS = {
    Warrior: '#e8721a',
    Ranger: '#3dba6a',
    'Tank-Viking': '#4a9fd4',
    Hybrid: '#9b59b6',
    Mage: '#c0392b',
};

const HERO_DRAW_FNS = {
    Warrior: drawHeroWarrior,
    Mage: drawHeroMage,
    Ranger: drawHeroRanger,
    'Tank-Viking': drawHeroViking,
    Hybrid: drawHeroHybrid,
};

/** Face upward in preview cards (matches top-down “forward = up” read). */
const PREVIEW_FACING = -Math.PI / 2;

let _animId = null;
let _animTime = 0;

export function heroClassForKey(heroKey) {
    return KEY_TO_CLASS[heroKey] ?? null;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} heroClass — e.g. Warrior
 * @param {{ time?: number, angle?: number }} [opts]
 */
export function drawMenuHeroPreview(canvas, heroClass, opts = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !heroClass) return false;

    const w = canvas.width;
    const h = canvas.height;
    const accent = HERO_ACCENTS[heroClass] ?? '#c9a227';
    const drawFn = HERO_DRAW_FNS[heroClass];
    const time = opts.time ?? performance.now();
    const angle = opts.angle ?? PREVIEW_FACING;

    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, 'rgba(12, 22, 14, 0.15)');
    bg.addColorStop(0.55, 'rgba(6, 12, 8, 0.35)');
    bg.addColorStop(1, 'rgba(2, 5, 3, 0.55)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 10, w * 0.32, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (!drawFn) {
        _drawFallback(ctx, w, h, heroClass, accent);
        return false;
    }

    const cx = w / 2;
    const cy = h * 0.54;
    const scale = Math.min(w, h) / 88;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    drawFn(ctx, 0, 0, angle, 0, time);
    ctx.restore();
    return true;
}

function _drawFallback(ctx, w, h, heroClass, accent) {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.35;
    ctx.font = `700 ${Math.floor(h * 0.32)}px Cinzel, Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(heroClass[0] ?? '?', w / 2, h * 0.46);
    ctx.globalAlpha = 1;
}

function _paintAllPreviews() {
    document.querySelectorAll('.hero-preview-canvas').forEach((canvas) => {
        const cls = canvas.dataset.heroClass;
        if (cls) drawMenuHeroPreview(canvas, cls, { time: _animTime });
    });

    const detail = document.querySelector('.hero-detail-canvas');
    if (detail?.dataset.heroClass) {
        drawMenuHeroPreview(detail, detail.dataset.heroClass, { time: _animTime });
    }
}

export function refreshDetailPreview(heroKey) {
    const detail = document.querySelector('.hero-detail-canvas');
    const cls = heroClassForKey(heroKey);
    if (!detail || !cls) return;
    detail.dataset.heroClass = cls;
    drawMenuHeroPreview(detail, cls, { time: _animTime });
}

export function initMenuHeroPreviews() {
    stopMenuPreviewAnimation();
    _animTime = performance.now();
    _paintAllPreviews();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tick = (now) => {
        _animTime = now;
        _paintAllPreviews();
        _animId = requestAnimationFrame(tick);
    };
    _animId = requestAnimationFrame(tick);
}

export function stopMenuPreviewAnimation() {
    if (_animId) cancelAnimationFrame(_animId);
    _animId = null;
}
