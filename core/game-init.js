// ============================================================
// core/game-init.js
// Spel-bootstrap: initializeGame, setupCreeps, applyHeroConfig.
// Extraherat ur index.html.
// ============================================================

import { HERO_ROSTER }             from '../data/hero-roster.js';
import { SHOP_CATALOG }            from '../data/shop-catalog.js';
import { JUNGLE_CAMP_LOCATIONS }   from '../data/world-config.js';
import { Creep }                   from './entities/creep.js';
import { resetBlight, Blight }       from './world/blight.js';
import { camera, updateCamera }    from './camera.js';
import { resetAbilityState }       from './ability-engine.js';
import { playerLootState }         from './economy-engine.js';
import { calculateItemCost }       from './economy-engine.js';
import { initForestEnvironment }   from './canvas-renderer.js';
import { preloadAllSprites, SpriteSheetManager } from './rendering/sprite-sheet-manager.js';
import { updateShopUI, checkMapPresenceUI } from '../ui/shop-interface.js';
import { markHudDirty, updateHud } from '../ui/hud.js';
import { initMinimap } from '../ui/minimap.js';
import { initDamageOverlay } from '../ui/damage-numbers.js';
import { resetVisionGrid } from './vision-grid.js';
import { resetDamageNumbers } from './damage-events.js';
import { resetInventory, inventorySlotsArray } from './inventory.js';
import {
    gameState, resetArrays, Creeps,
    setGameLoopRefs, setPlayerClass, gameLoop,
} from './game-loop.js';
import { initializeBots, resetBots } from './bot-manager.js';
import { CooldownState } from './ability-engine.js';
import { XP_PER_LEVEL, CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/world-config.js';

let _player      = null;
let _playerClass = 'Ranger';
let _getViewport = () => ({ width: window.innerWidth, height: window.innerHeight });
let _spriteLoadPromise = null;

export function ensureSpritesLoaded() {
    if (!_spriteLoadPromise) {
        _spriteLoadPromise = preloadAllSprites().catch((err) => {
            console.warn('[Sprite preload]', err);
        });
    }
    return _spriteLoadPromise;
}

export function initEntityVisuals() {
    const sheetManager = SpriteSheetManager.getInstance();
    _player?.initVisuals(sheetManager);
    for (const creep of Creeps) {
        creep.initVisuals(sheetManager);
    }
}

export function setGameInitRefs({ player, getViewport }) {
    _player      = player;
    _getViewport = getViewport;
}

export function getPlayerClass() { return _playerClass; }

export function applyHeroConfig(heroKey) {
    const hero = HERO_ROSTER[heroKey];
    if (!hero || !_player) return;

    gameState.selectedHeroKey = heroKey;
    gameState.selectedClass   = hero.classKey;
    _playerClass              = hero.classKey;

    _player.maxHp            = hero.maxHp;
    _player.hp               = hero.maxHp;
    _player.speed            = hero.speed;
    _player.projectileDamage = hero.projectileDamage;
    _player.radius           = hero.radius;
    _player.skills           = { ...hero.skills };
    _player.heroTitle        = hero.title;
    _player.heroRole         = hero.role;
    _player.heroKey          = heroKey;
    _player.heroClass        = hero.classKey;
    _player.stance           = 'MELEE';
    _player.isShielded       = false;
    _player.baseSpeed        = hero.speed;
    _player.valhallaActive   = false;
    _player.valhallaRefCount = 0;

    setPlayerClass(hero.classKey);
    _player?.initVisuals(SpriteSheetManager.getInstance());
}

export function setupCreeps() {
    // Creeps-arrayen töms via resetArrays() i initializeGame
    JUNGLE_CAMP_LOCATIONS.forEach((loc, campIndex) => {
        for (let i = 0; i < 2; i++) {
            Creeps.push(new Creep(
                loc.x + Math.random() * 60 - 30,
                loc.y + Math.random() * 60 - 30,
                'scout', campIndex
            ));
        }
        for (let i = 0; i < 2; i++) {
            Creeps.push(new Creep(
                loc.x + Math.random() * 80 - 40,
                loc.y + Math.random() * 80 - 40,
                'warrior', campIndex
            ));
        }
        Creeps.push(new Creep(
            loc.x + Math.random() * 40 - 20,
            loc.y + Math.random() * 40 - 20,
            'ancient', campIndex
        ));
    });
}

export function initializeGame() {
    const viewport = _getViewport();

    gameState.running      = true;
    gameState.lastTime     = 0;
    gameState.tick         = 0;
    gameState.xp           = 0;
    gameState.gold         = 0;
    gameState.totalFarmed  = 0;

    playerLootState.luckDebt           = 0;
    playerLootState.consecutiveDryRuns = 0;
    playerLootState.dryKills           = 0;

    resetAbilityState();

    if (gameState.selectedHeroKey) applyHeroConfig(gameState.selectedHeroKey);

    _player.x           = CANVAS_WIDTH  / 2;
    _player.y           = CANVAS_HEIGHT / 2;
    _player.level       = 1;
    _player.attackTimer = 0;
    _player.vx          = 0;
    _player.vy          = 0;
    _player.facingAngle = 0;

    updateCamera(_player, viewport.width, viewport.height);

    resetBlight();
    resetArrays();
    resetBots();
    resetVisionGrid();
    resetDamageNumbers();
    resetInventory(markHudDirty);

    initMinimap();
    initDamageOverlay();

    initForestEnvironment(CANVAS_WIDTH, CANVAS_HEIGHT, 300);
    setupCreeps();
    initializeBots();
    initEntityVisuals();
    markHudDirty();
    updateHud(_player, gameState, CooldownState, Creeps.length, 4, XP_PER_LEVEL, true, { blight: Blight });
    updateShopUI(SHOP_CATALOG, _playerClass, calculateItemCost);
    checkMapPresenceUI(inventorySlotsArray());

    document.getElementById('game-over-screen')?.classList.remove('visible');

    requestAnimationFrame(gameLoop);
}

export function showGameOver() {
    document.getElementById('game-over-screen')?.classList.add('visible');
    gameState.running = false;
}

export function resetGame(showMenuFn) {
    gameState.running         = false;
    gameState.selectedHeroKey = null;
    document.getElementById('game-over-screen')?.classList.remove('visible');
    if (showMenuFn) showMenuFn({ skipWelcome: true });
}
