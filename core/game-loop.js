// ============================================================
// core/game-loop.js
// updateGameLogic, renderGame, gameLoop.
// Extraherat ur index.html — orkestreraren som håller ihop allt.
// ============================================================

import { camera, updateCamera, isObjectVisible } from './camera.js';
import AbilityEngine, { CooldownState, ActiveAbilityEffects, GlobalParticles } from './ability-engine.js';
import { Blight, updateBlight, isOutsideBlight } from './world/blight.js';
import { getTerrainType } from './ability-engine.js';
import {
    drawForestBackground, drawTerrainBiomes, drawEnvironmentObstacles,
    drawBlightZone, drawFogOfWar, drawWeaponSwingVisuals,
    drawDecoratedProjectile, drawBotModel,
} from './canvas-renderer.js';
import { Bots } from './bot-manager.js';
import { tickWeaponArcAnimation } from './rendering/weapon-arc-renderer.js';
import { DroppedItem } from './entities/item.js';
import { rollDrop, playerLootState } from './economy-engine.js';
import { calculateFarmGold, calculateBounty } from './economy-engine.js';
import { collectItem } from './inventory.js';
import { updateHud, showLevelUpFlash, markHudDirty } from '../ui/hud.js';
import { updateMinimap } from '../ui/minimap.js';
import { renderDamageNumbers, resizeDamageOverlay } from '../ui/damage-numbers.js';
import { revealVision } from './vision-grid.js';
import { updateDamageNumbers } from './damage-events.js';
import { XP_PER_LEVEL, VISION_RADIUS, JUNGLE_CAMP_LOCATIONS } from '../data/world-config.js';

// Game-state — exporteras så game-init och inventory kan läsa/skriva
export const gameState = {
    running:          false,
    selectedClass:    null,
    selectedHeroKey:  null,
    lastTime:         0,
    tick:             0,
    xp:               0,
    gold:             0,
    totalFarmed:      0,
};

// Globala arrays — exporteras för rendering och kollision
export let Projectiles = [];
export let Creeps      = [];
export let ItemPool    = [];

export function resetArrays() {
    Projectiles = [];
    Creeps      = [];
    ItemPool    = [];
}

// Referens till spelarinstansen — sätts av game-init
let _player = null;
let _canvas = null;
let _ctx    = null;
let _viewportWidth  = 0;
let _viewportHeight = 0;
let _playerClass    = 'Ranger';

export function setGameLoopRefs({ player, canvas, ctx, getViewport, getPlayerClass }) {
    _player      = player;
    _canvas      = canvas;
    _ctx         = ctx;
    _viewportWidth  = getViewport().width;
    _viewportHeight = getViewport().height;
    _playerClass    = getPlayerClass();
}

export function updateViewport(w, h) {
    _viewportWidth  = w;
    _viewportHeight = h;
}

export function setPlayerClass(cls) { _playerClass = cls; }

// ─── KILL REWARDS ────────────────────────────────────────────

function grantKillRewards(creep) {
    gameState.xp += creep.xpReward;

    const mobPayload      = { name: creep.name, goldReward: creep.goldReward };
    const avgGold         = 80 + _player.level * 30;
    const farmGold        = calculateFarmGold(creep.goldReward, gameState.totalFarmed, avgGold, mobPayload);
    const goldGain        = calculateBounty(gameState.gold, farmGold * 5, farmGold, mobPayload);
    gameState.gold       += goldGain;
    gameState.totalFarmed += goldGain;

    while (gameState.xp >= XP_PER_LEVEL) {
        gameState.xp -= XP_PER_LEVEL;
        _player.levelUp();
        showLevelUpFlash();
    }

    markHudDirty();
}

// ─── UPDATE ──────────────────────────────────────────────────

export function updateGameLogic(deltaTime) {
    if (!gameState.running) return;

    AbilityEngine.update(deltaTime / 1000, Projectiles, Creeps);

    if (_player.attackTimer > 0) {
        _player.attackTimer = Math.max(0, _player.attackTimer - deltaTime / 1000);
    }

    _player.speedModifier = getTerrainType(_player.x, _player.y) === 'WATER' ? 0.7 : 1.0;
    _player.update(keysRef());

    updateBlight(deltaTime);

    gameState.tick += 1;
    const botGameState = {
        circleShrinking: true,
        circleCenter:    Blight.center,
        circleRadius:    Blight.currentRadius,
        players:         _player.isAlive ? [_player] : [],
        bots:            Bots,
        creeps:          Creeps,
        deltaTime,
        tick:            gameState.tick,
    };

    for (let i = Bots.length - 1; i >= 0; i--) {
        const bot = Bots[i];
        if (!bot.isAlive) {
            Bots.splice(i, 1);
            continue;
        }
        bot.update(botGameState);

        if (_player.isAlive &&
            Math.hypot(_player.x - bot.x, _player.y - bot.y) < _player.radius + bot.radius) {
            _player.takeDamage(bot.projectileDamage * 0.05 * deltaTime / 1000);
        }
    }

    // Creep-uppdatering (pass deltaTime in seconds for frame-independent movement)
    for (let i = Creeps.length - 1; i >= 0; i--) {
        const creep = Creeps[i];
        creep.update(_player, deltaTime / 1000);

        // Projektil-kollision
        for (let j = Projectiles.length - 1; j >= 0; j--) {
            const proj = Projectiles[j];
            const hit  = typeof proj.isCollidingWith === 'function'
                ? proj.isCollidingWith(creep)
                : Math.hypot(proj.x - creep.x, proj.y - creep.y) < proj.radius + creep.radius;

            if (hit && !creep.isDead) {
                creep.takeDamage(proj.damage, (dead) => {
                    const loot = rollDrop(playerLootState, { name: dead.name, goldReward: dead.goldReward });
                    ItemPool.push(new DroppedItem(dead.x, dead.y, loot));
                    grantKillRewards(dead);
                });
                Projectiles.splice(j, 1);
                continue;
            }

            for (let k = Bots.length - 1; k >= 0; k--) {
                const bot = Bots[k];
                if (!bot.isAlive) continue;
                const botHit = Math.hypot(proj.x - bot.x, proj.y - bot.y) < proj.radius + bot.radius;
                if (botHit) {
                    bot.takeDamage(proj.damage);
                    Projectiles.splice(j, 1);
                    break;
                }
            }
        }
    }

    // Projektil-uppdatering
    for (let i = Projectiles.length - 1; i >= 0; i--) {
        const proj = Projectiles[i];
        if (proj.isAbilityProjectile) {
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.ttl -= 1;
            if (proj.ttl <= 0 || proj.x < -50 || proj.x > 6050 || proj.y < -50 || proj.y > 6050) {
                Projectiles.splice(i, 1);
            }
        } else {
            proj.update();
            if (!proj.isAlive()) Projectiles.splice(i, 1);
        }
    }

    // Item-pickup
    for (let i = ItemPool.length - 1; i >= 0; i--) {
        const item = ItemPool[i];
        if (!item.isCollected && Math.hypot(_player.x - item.x, _player.y - item.y) < 35) {
            item.isCollected = true;
            collectItem(item, markHudDirty);
            ItemPool.splice(i, 1);
        }
    }

    revealVision(_player.x, _player.y, VISION_RADIUS);
    updateDamageNumbers(deltaTime / 1000);

    // Blight-skada
    if (isOutsideBlight(_player.x, _player.y)) {
        _player.takeDamage(Blight.damagePerTick * deltaTime / 100, 'blight');
    }

    // --- SANITIZED CREEP CONTACT DAMAGE LOOP ---
    for (const creep of Creeps) {
        if (!creep || creep.isDead) continue;

        // Guard: Ensure coordinates exist to avoid computing floats against NaN ghost positions
        if (creep.x === undefined || creep.y === undefined) continue;

        // Establish ironclad radius fallbacks if configuration data drifts
        const pRadius = _player.radius || 20;
        const cRadius = creep.radius || 15;

        // Calculate strict absolute world distance
        const distance = Math.hypot(_player.x - creep.x, _player.y - creep.y);

        // Only process damage if the physical bounds are explicitly overlapping
        if (distance < (pRadius + cRadius)) {
            // Safe, stable deltaTime scaling
            _player.takeDamage(creep.contactDamage * deltaTime / 1000);
        }
    }

    updateHud(
        _player, gameState, CooldownState,
        Creeps.filter(c => !c.isDead).length,
        countActiveCamps(),
        XP_PER_LEVEL,
        false,
        { blight: Blight }
    );

    _player?.updateVisuals?.(deltaTime);
    for (const creep of Creeps) {
        if (!creep.isDead) creep.updateVisuals?.(deltaTime);
    }
}

function countActiveCamps() {
    const campIndices = new Set(Creeps.filter(c => !c.isDead).map(c => c.campIndex));
    return campIndices.size;
}

// Tangentbord-referens injiceras av input.js (cirkulär dep undviks med lazy ref)
let _keysRef = () => ({});
export function setKeysRef(fn) { _keysRef = fn; }
function keysRef() { return _keysRef(); }

// ─── RENDER ──────────────────────────────────────────────────

export function renderGame(deltaTime, time = 0) {
    tickWeaponArcAnimation(deltaTime / 1000);
    _ctx.clearRect(0, 0, _viewportWidth, _viewportHeight);
    _ctx.save();
    _ctx.translate(-camera.x, -camera.y);

    drawForestBackground(_ctx, camera, _viewportWidth, _viewportHeight);
    drawTerrainBiomes(_ctx, camera, _viewportWidth, _viewportHeight, deltaTime / 1000);

    // Ability-effekter
    ActiveAbilityEffects.forEach(effect => {
        _ctx.save();
        if (effect.type === 'line') {
            _ctx.beginPath();
            _ctx.moveTo(effect.startX, effect.startY);
            _ctx.lineTo(effect.endX,   effect.endY);
            _ctx.strokeStyle = effect.color;
            _ctx.lineWidth   = effect.width;
            _ctx.lineCap     = 'round';
            _ctx.stroke();
        } else if (effect.type === 'circle') {
            _ctx.beginPath();
            _ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            if (effect.fill) { _ctx.fillStyle = effect.color; _ctx.fill(); }
            else             { _ctx.strokeStyle = effect.color; _ctx.lineWidth = 3; _ctx.stroke(); }
        } else if (effect.type === 'cone') {
            _ctx.beginPath();
            _ctx.moveTo(effect.x, effect.y);
            _ctx.arc(effect.x, effect.y, effect.radius,
                     effect.angle - effect.spread / 2,
                     effect.angle + effect.spread / 2);
            _ctx.closePath();
            _ctx.fillStyle = effect.color;
            _ctx.fill();
        } else if (effect.type === 'bladestorm') {
            const sweepCount = effect.sweepCount ?? 4;
            for (let ring = 1; ring <= sweepCount; ring++) {
                const r = Math.sin((effect.internalTime ?? 0) * 10) * 5 + ring * 25;
                _ctx.beginPath();
                _ctx.arc(effect.x, effect.y, r, 0, Math.PI * 2);
                _ctx.strokeStyle = `rgba(255,165,0,${ring * 0.08})`;
                _ctx.lineWidth   = 3;
                _ctx.stroke();
            }
        }
        _ctx.restore();
    });

    drawEnvironmentObstacles(_ctx, camera, _viewportWidth, _viewportHeight, (o) => isObjectVisible(o, _viewportWidth, _viewportHeight), time);
    drawBlightZone(_ctx, Blight.center.x, Blight.center.y, Blight.currentRadius, time);

    // Creeps
    for (const c of Creeps) {
        if (!c.isDead && isObjectVisible(c, _viewportWidth, _viewportHeight)) c.draw(_ctx, time);
    }

    // Bots
    for (const bot of Bots) {
        if (bot.isAlive && isObjectVisible(bot, _viewportWidth, _viewportHeight)) {
            drawBotModel(_ctx, bot);
        }
    }

    // Items
    for (const item of ItemPool) {
        if (!item.isCollected && isObjectVisible(item, _viewportWidth, _viewportHeight)) item.draw(_ctx);
    }

    // Projektiler
    for (const p of Projectiles) {
        if (p.isDead) continue;
        if (!isObjectVisible(p, _viewportWidth, _viewportHeight)) continue;
        if (p.type === 'firebolt' || p.type === 'arrow') {
            drawDecoratedProjectile(_ctx, p, camera);
        } else {
            _ctx.beginPath();
            _ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            _ctx.fillStyle = p.color ?? '#FF4500';
            _ctx.fill();
        }
    }

    _ctx.restore();

    GlobalParticles.draw(_ctx, camera, _viewportWidth, _viewportHeight);
    drawWeaponSwingVisuals(_ctx, _player, camera);
    _player.draw(_ctx, camera, time);
    drawFogOfWar(_ctx, _player.x, _player.y, camera, _viewportWidth, _viewportHeight);

    renderDamageNumbers(camera, _viewportWidth, _viewportHeight);
    updateMinimap({
        player: _player,
        blight: Blight,
        camps: JUNGLE_CAMP_LOCATIONS,
        creeps: Creeps,
        time: performance.now(),
    });
}

export function onViewportResize() {
    resizeDamageOverlay();
}

// ─── GAME LOOP ────────────────────────────────────────────────

export function gameLoop(timestamp) {
    const deltaTime = gameState.lastTime ? timestamp - gameState.lastTime : 16;
    gameState.lastTime = timestamp;

    if (gameState.running) {
        updateCamera(_player, _viewportWidth, _viewportHeight);
        updateGameLogic(deltaTime);
        renderGame(deltaTime, timestamp);
        requestAnimationFrame(gameLoop);
    }
}
