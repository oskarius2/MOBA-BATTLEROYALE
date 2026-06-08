// ============================================================
// core/rendering/sprite-sheet-manager.js
// Asset loading and frame extraction from spritesheets.
// No imports from ability-engine or player entities.
// ============================================================

const ASSETS_BASE = 'assets/';

const HERO_COLORS = {
    Warrior:      ['#8b2020', '#c0392b'],
    Mage:         ['#1a3a6a', '#3498db'],
    Ranger:       ['#1a4a2a', '#3dba6a'],
    'Tank-Viking':['#3a3a4a', '#7a8a9a'],
    Hybrid:       ['#4a1a5a', '#9b27b0'],
};

const CREEP_COLORS = {
    scout:   ['#5a1040', '#ff44aa'],
    warrior: ['#5a3010', '#ff8800'],
    ancient: ['#5a5010', '#ffcc44'],
};

let _instance = null;

function _expectedMinSize(category, key, cfg) {
    const f = cfg.frameSize;
    const cols = cfg.framesPerAction;
    const actionRows = 4;
    const stanceRows = (category === 'hero' && cfg.stances) ? 4 : 0;
    const rows = actionRows + stanceRows;
    return { minWidth: f * cols, minHeight: f * rows };
}

function _validateLoadedSheet(img, category, key, cfg) {
    const { minWidth, minHeight } = _expectedMinSize(category, key, cfg);
    const ok = img.naturalWidth >= minWidth && img.naturalHeight >= minHeight;
    if (!ok) {
        console.warn(
            `[SpriteSheetManager] ${category}:${key} rejected — ` +
            `got ${img.naturalWidth}x${img.naturalHeight}, need >= ${minWidth}x${minHeight}`
        );
    }
    return ok;
}

function _createPlaceholderSheet(category, key, cfg) {
    const f = cfg.frameSize;
    const cols = cfg.framesPerAction;
    const rows = category === 'hero' && cfg.stances ? 2 : 1;
    const canvas = document.createElement('canvas');
    canvas.width = f * cols;
    canvas.height = f * rows;
    const ctx = canvas.getContext('2d');
    const palette = category === 'hero'
        ? (HERO_COLORS[key] ?? ['#2a3a2a', '#7a8a72'])
        : (CREEP_COLORS[key] ?? ['#2a2a1a', '#aa8844']);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * f;
            const y = row * f;
            const grad = ctx.createRadialGradient(x + f * 0.5, y + f * 0.55, f * 0.1, x + f * 0.5, y + f * 0.5, f * 0.48);
            grad.addColorStop(0, palette[1]);
            grad.addColorStop(1, palette[0]);
            ctx.fillStyle = grad;
            ctx.fillRect(x + 4, y + 4, f - 8, f - 8);
            ctx.strokeStyle = 'rgba(201, 162, 39, 0.35)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 6, y + 6, f - 12, f - 12);
            ctx.fillStyle = '#f0e6c8';
            ctx.font = `bold ${Math.floor(f * 0.28)}px Montserrat, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = category === 'hero' ? (key[0] ?? '?') : key.slice(0, 2).toUpperCase();
            ctx.fillText(label, x + f * 0.5, y + f * 0.52);
        }
    }
    return canvas;
}

export class SpriteSheetManager {
    constructor() {
        this.cache = {};
        this.manifest = null;
        this._loadPromise = null;
    }

    static getInstance() {
        if (!_instance) _instance = new SpriteSheetManager();
        return _instance;
    }

    /**
     * @param {object} manifest — parsed assets/manifest.json
     * @returns {Promise<void>}
     */
    async loadAll(manifest) {
        if (this._loadPromise) return this._loadPromise;

        this.manifest = manifest;
        const entries = [];

        for (const [heroClass, cfg] of Object.entries(manifest.heroes ?? {})) {
            entries.push(this._loadEntry('hero', heroClass, cfg));
        }
        for (const [typeKey, cfg] of Object.entries(manifest.creeps ?? {})) {
            entries.push(this._loadEntry('creep', typeKey, cfg));
        }

        this._loadPromise = Promise.all(entries).then(() => {});
        return this._loadPromise;
    }

    _loadEntry(category, key, cfg) {
        return new Promise((resolve) => {
            const cacheKey = `${category}:${key}`;
            const img = new Image();
            img.onload = () => {
                const valid = _validateLoadedSheet(img, category, key, cfg);
                this.cache[cacheKey] = {
                    loaded: true,
                    failed: false,
                    placeholder: !valid,
                    invalid: !valid,
                    image: img,
                    frameSize: cfg.frameSize,
                    framesPerAction: cfg.framesPerAction,
                    stances: cfg.stances ?? null,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                };
                resolve();
            };
            img.onerror = () => {
                console.warn(`[SpriteSheetManager] Missing ${cfg.sheet} — using procedural placeholder`);
                const placeholder = _createPlaceholderSheet(category, key, cfg);
                this.cache[cacheKey] = {
                    loaded: true,
                    failed: false,
                    placeholder: true,
                    image: placeholder,
                    frameSize: cfg.frameSize,
                    framesPerAction: cfg.framesPerAction,
                    stances: cfg.stances ?? null,
                    width: placeholder.width,
                    height: placeholder.height,
                };
                resolve();
            };
            img.src = `${ASSETS_BASE}${cfg.sheet}`;
        });
    }

    _resolveKey(category, classOrType) {
        return `${category}:${classOrType}`;
    }

    isReady(category, classOrType) {
        const entry = this.cache[this._resolveKey(category, classOrType)];
        return entry?.loaded === true && !entry?.failed && !entry?.placeholder && !entry?.invalid;
    }

    hasRealAssets(category, classOrType) {
        return this.isReady(category, classOrType);
    }

    /**
     * @param {'hero'|'creep'} category
     * @param {string} classOrType — heroClass or creep typeKey
     * @param {string} action — idle | walk | attack | transition
     * @param {number} frameIndex
     * @param {string} [stance] — optional for Hybrid
     * @returns {{ image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number } | null}
     */
    getFrame(category, classOrType, action, frameIndex, stance = null) {
        const entry = this.cache[this._resolveKey(category, classOrType)];
        if (!entry?.loaded || entry.failed || !entry.image) return null;

        const { frameSize, framesPerAction } = entry;
        const cols = Math.max(1, Math.floor(entry.width / frameSize));
        const actionRow = this._actionRow(action, stance, entry);
        const col = frameIndex % framesPerAction;
        const row = actionRow % Math.max(1, Math.floor(entry.height / frameSize));

        return {
            image: entry.image,
            sx: col * frameSize,
            sy: row * frameSize,
            sw: frameSize,
            sh: frameSize,
        };
    }

    _actionRow(action, stance, entry) {
        const rows = Math.max(1, Math.floor(entry.height / entry.frameSize));
        if (entry.stances && stance === 'RANGED') {
            const rangedBase = Math.min(4, rows - 1);
            switch (action) {
                case 'walk':       return rangedBase;
                case 'attack':     return rangedBase + 1;
                case 'transition': return rangedBase + 2;
                case 'idle':
                default:           return rangedBase;
            }
        }
        switch (action) {
            case 'walk':       return Math.min(1, rows - 1);
            case 'attack':     return Math.min(2, rows - 1);
            case 'transition': return Math.min(3, rows - 1);
            case 'idle':
            default:           return 0;
        }
    }
}

export async function loadSpriteManifest() {
    const res = await fetch(`${ASSETS_BASE}manifest.json`);
    if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
    return res.json();
}

export async function preloadAllSprites() {
    const manifest = await loadSpriteManifest();
    await SpriteSheetManager.getInstance().loadAll(manifest);
    return manifest;
}
