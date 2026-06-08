// ============================================================
// core/rendering/sprite-sheet-manager.js
// Asset loading and frame extraction from spritesheets.
// No imports from ability-engine or player entities.
// ============================================================

const ASSETS_BASE = 'assets/';

let _instance = null;

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
                this.cache[cacheKey] = {
                    loaded: true,
                    failed: false,
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
                console.warn(`[SpriteSheetManager] Failed to load ${cfg.sheet}`);
                this.cache[cacheKey] = {
                    loaded: false,
                    failed: true,
                    image: null,
                    frameSize: cfg.frameSize,
                    framesPerAction: cfg.framesPerAction,
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
        return entry?.loaded === true && !entry?.failed;
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
        if (entry.stances && stance === 'RANGED' && action === 'idle') return 0;
        switch (action) {
            case 'walk':       return 0;
            case 'attack':     return 0;
            case 'transition': return 0;
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
