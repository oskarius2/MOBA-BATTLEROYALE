// ============================================================
// core/game-loop.js
// updateGameLogic, renderGame, gameLoop.
//
// RENDERING-PIPELINE (viktigt för agenter):
//   1. _ctx.save()
//   2.   blur-fill (screen-space, INNAN translate)
//   3.   _ctx.translate(-camera.x, -camera.y)   ← WORLD-SPACE börjar
//   4.   [alla world-space draws: forest, terrain, blight, creeps, items, projektiler]
//   5. _ctx.restore()                             ← SCREEN-SPACE börjar
//   6. [alla screen-space draws: partiklar, fog, HUD]
//        GlobalParticles, drawFogOfWar, _player.draw, drawWeaponSwingVisuals
//        — dessa tar camera som argument och konverterar world→screen INTERNT.
//        — de ritas KORREKT i screen-space, EFTER restore().
//
// Code Police-åtgärder (2025-06):
//   FIX: Alla importerade moduler existerar (stubs skapade)
//   FIX: _player.isAlive → _player.hp > 0
//   FIX: drawDecoratedProjectile importeras korrekt
//   FIX: Rendering-pipeline verifierad (world/screen-space separation korrekt)
// ============================================================

import { camera, updateCamera, isObjectVisible } from './camera.js';
import AbilityEngine, {
    CooldownState, ActiveAbilityEffects, GlobalParticles,
} from './ability-engine.js';
import { Blight, updateBlight, isOutsideBlight } from './world/blight.js';
import { getTerrainType } from './ability-engine.js';
import {
    drawForestBackground, drawTerrainBiomes, drawEnvironmentObstacles,
    drawBlightZone, drawFogOfWar, drawWeaponSwingVisuals,
    drawDecoratedProjectile, drawBotModel,
} from './canvas-renderer.js';
import { Bots }                    from './bot-manager.js';
import { tickWeaponArcAnimation }  from './rendering/weapon-arc-renderer.js';
import { DroppedItem }             from './entities/item.js';
import { rollDrop, playerLootState }           from './economy-engine.js';
import { calculateFarmGold, calculateBounty }  from './economy-engine.js';
import { collectItem }             from './inventory.js';
import { updateHud, showLevelUpFlash, markHudDirty } from '../ui/hud.js';
import { updateMinimap }           from '../ui/minimap.js';
import { renderDamageNumbers, resizeDamageOverlay } from '../ui/damage-numbers.js';
import { revealVision }            from './vision-grid.js';
import { updateDamageNumbers }     from './damage-events.js';
import {
    XP_PER_LEVEL, VISION_RADIUS, JUNGLE_CAMP_LOCATIONS,
} from '../data/world-config.js';

// ─── GAME STATE ───────────────────────────────────────────────

export const gameState = {
    running:         false,
    selectedClass:   null,
    selectedHeroKey: null,
    lastTime:        0,
    tick:            0,
    xp:              0,
    gold:            0,
    totalFarmed:     0,
};

export let Projectiles = [];
export let Creeps      = [];
export let ItemPool    = [];

export function resetArrays() {
    Projectiles = [];
    Creeps      = [];
    ItemPool    = [];
}

let _player         = null;
let _canvas         = null;
let _ctx            = null;
let _viewportWidth  = 0;
let _viewportHeight = 0;
let _playerClass    = 'Ranger';

export function setGameLoopRefs({ player, canvas, ctx, getViewport, getPlayerClass }) {
    _player         = player;
    _canvas         = canvas;
    _ctx            = ctx;
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
    gameState.gold        += Math.round(goldGain);
    gameState.totalFarmed += Math.round(goldGain);

    while (gameState.xp >= XP_PER_LEVEL) {
        gameState.xp -= XP_PER_LEVEL;
        _player.levelUp();
        showLevelUpFlash();
    }
    markHudDirty();
}

// ─── UPDATE ──────────────────────────────────────────────────

export function updateGameLogic(deltaTime) {
    if (!gameState.running || !_player) return;

    AbilityEngine.update(deltaTime / 1000, Projectiles, Creeps);

    if (_player.attackTimer > 0) {
        _player.attackTimer = Math.max(0, _player.attackTimer - deltaTime / 1000);
    }

    _player.speedModifier = getTerrainType(_player.x, _player.y) === 'WATER' ? 0.7 : 1.0;
    _player.update(keysRef());

    updateCamera(_player, _viewportWidth, _viewportHeight);
    updateBlight(deltaTime);
    gameState.tick += 1;

    // Bot-uppdatering
    const playerAlive = _player.hp > 0;   // FIX: var _player.isAlive (existerar inte)
    const botContext = {
        circleShrinking: true,
        circleCenter:    Blight.center,
        circleRadius:    Blight.currentRadius,
        players:         playerAlive ? [_player] : [],
        bots:            Bots,
        creeps:          Creeps,
        deltaTime,
        tick:            gameState.tick,
    };

    for (let i = Bots.length - 1; i >= 0; i--) {
        const bot = Bots[i];
        if (!bot.isAlive) { Bots.splice(i, 1); continue; }
        bot.update(botContext);
        if (playerAlive && Math.hypot(_player.x - bot.x, _player.y - bot.y) < _player.radius + bot.radius) {
            _player.takeDamage(bot.projectileDamage * 0.05 * deltaTime / 1000);
        }
    }

    // Creep-uppdatering + projektilkollision
    for (let i = Creeps.length - 1; i >= 0; i--) {
        const creep = Creeps[i];
        creep.update(_player, deltaTime / 1000);

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

            // Bot-kollision med projektil
            for (let k = Bots.length - 1; k >= 0; k--) {
                const bot = Bots[k];
                if (!bot.isAlive) continue;
                if (Math.hypot(proj.x - bot.x, proj.y - bot.y) < proj.radius + bot.radius) {
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
            proj.x   += proj.vx;
            proj.y   += proj.vy;
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
        _player.takeDamage(Blight.damagePerTick * deltaTime / 100);
    }

    // Creep-kontaktskada (defensiv guard mot NaN/undefined-coords)
    for (const creep of Creeps) {
        if (!creep || creep.isDead) continue;
        if (creep.x === undefined || creep.y === undefined) continue;
        const dist = Math.hypot(_player.x - creep.x, _player.y - creep.y);
        if (dist < (_player.radius || 20) + (creep.radius || 15)) {
            _player.takeDamage(creep.contactDamage * (deltaTime / 16));
        }
    }

    updateHud(
        _player, gameState, CooldownState,
        Creeps.filter(c => !c.isDead).length,
        countActiveCamps(),
        XP_PER_LEVEL
    );

    _player?.updateVisuals?.(deltaTime);
}

function countActiveCamps() {
    return new Set(Creeps.filter(c => !c.isDead).map(c => c.campIndex)).size;
}

let _keysRef = () => ({});
export function setKeysRef(fn) { _keysRef = fn; }
function keysRef() { return _keysRef(); }

// ─── RENDER ──────────────────────────────────────────────────
//
// LAGER-ORDNING:
//   [A] Blur-fill     screen-space, INNAN translate
//   [B] World-space   EFTER translate, INNAN restore
//   [C] Screen-space  EFTER restore (alla funktioner konverterar world→screen internt)

export function renderGame(deltaTime, time = 0) {
    tickWeaponArcAnimation(deltaTime / 1000);

    // ── [A] SAVE + BLUR (screen-space) ──────────────────────
    _ctx.save();
    _ctx.globalAlpha = 0.08;
    _ctx.fillStyle   = '#010315';
    _ctx.fillRect(0, 0, _viewportWidth, _viewportHeight);
    _ctx.globalAlpha = 1.0;

    // ── [B] WORLD-SPACE (camera translate aktiv) ─────────────
    _ctx.translate(-camera.x, -camera.y);

    drawForestBackground(_ctx, camera, _viewportWidth, _viewportHeight);
    drawTerrainBiomes(_ctx, camera, _viewportWidth, _viewportHeight, deltaTime / 1000);

    // Ability-effekter
    for (const effect of ActiveAbilityEffects) {
        _ctx.save();
        switch (effect.type) {
            case 'line':
                _ctx.beginPath();
                _ctx.moveTo(effect.startX, effect.startY);
                _ctx.lineTo(effect.endX, effect.endY);
                _ctx.strokeStyle = effect.color;
                _ctx.lineWidth   = effect.width;
                _ctx.lineCap     = 'round';
                _ctx.stroke();
                break;
            case 'circle':
                _ctx.beginPath();
                _ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                if (effect.fill) { _ctx.fillStyle = effect.color; _ctx.fill(); }
                else             { _ctx.strokeStyle = effect.color; _ctx.lineWidth = 3; _ctx.stroke(); }
                break;
            case 'cone':
                _ctx.beginPath();
                _ctx.moveTo(effect.x, effect.y);
                _ctx.arc(effect.x, effect.y, effect.radius,
                    effect.angle - effect.spread / 2, effect.angle + effect.spread / 2);
                _ctx.closePath();
                _ctx.fillStyle = effect.color; _ctx.fill();
                break;
            case 'bladestorm': {
                const sweepCount = effect.sweepCount ?? 4;
                for (let ring = 1; ring <= sweepCount; ring++) {
                    const r = Math.sin((effect.internalTime ?? 0) * 10) * 5 + ring * 25;
                    _ctx.beginPath();
                    _ctx.arc(effect.x, effect.y, r, 0, Math.PI * 2);
                    _ctx.strokeStyle = `rgba(255,165,0,${ring * 0.08})`;
                    _ctx.lineWidth   = 3;
                    _ctx.stroke();
                }
                break;
            }
        }
        _ctx.restore();
    }

    drawEnvironmentObstacles(
        _ctx, camera, _viewportWidth, _viewportHeight,
        (o) => isObjectVisible(o, _viewportWidth, _viewportHeight), time
    );
    drawBlightZone(_ctx, Blight.center.x, Blight.center.y, Blight.currentRadius, time);

    for (const c of Creeps) {
        if (!c.isDead && isObjectVisible(c, _viewportWidth, _viewportHeight)) c.draw(_ctx, time);
    }

    for (const bot of Bots) {
        if (bot.isAlive && isObjectVisible(bot, _viewportWidth, _viewportHeight)) drawBotModel(_ctx, bot);
    }

    for (const item of ItemPool) {
        if (!item.isCollected && isObjectVisible(item, _viewportWidth, _viewportHeight)) item.draw(_ctx);
    }

    for (const p of Projectiles) {
        if (p.isDead) continue;
        if (!isObjectVisible(p, _viewportWidth, _viewportHeight)) continue;
        if (p.type === 'firebolt' || p.type === 'arrow') {
            drawDecoratedProjectile(_ctx, p);          // FIX: importerades inte i gamla versionen
        } else {
            _ctx.beginPath();
            _ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            _ctx.fillStyle = p.color ?? '#FF4500';
            _ctx.fill();
        }
    }

    // ── [C] SCREEN-SPACE (efter restore) ─────────────────────
    // OBS: restore() tar bort camera-translationen.
    // Funktionerna nedan konverterar world→screen INTERNT via camera-argumentet.
    _ctx.restore();

    GlobalParticles.draw(_ctx, camera, _viewportWidth, _viewportHeight);
    drawWeaponSwingVisuals(_ctx, _player, camera);
    _player?.draw(_ctx, camera, time);
    drawFogOfWar(_ctx, _player.x, _player.y, camera, _viewportWidth, _viewportHeight);

    // Crosshair (screen-space)
    const input = _keysRef?.input;
    if (input?.mouseScreenX !== undefined) {
        _ctx.save();
        _ctx.translate(input.mouseScreenX, input.mouseScreenY);
        _ctx.shadowColor              = '#00ffff';
        _ctx.shadowBlur               = 15 + Math.sin(time * 0.005) * 3;
        _ctx.globalCompositeOperation = 'lighter';
        _ctx.strokeStyle = '#00ffff';
        _ctx.lineWidth   = 1.5;
        _ctx.beginPath();
        _ctx.arc(0, 0, 12 + Math.sin(time * 0.005) * 2, 0, Math.PI * 2);
        _ctx.stroke();
        _ctx.fillStyle = '#ffffff';
        _ctx.beginPath();
        _ctx.arc(0, 0, 2, 0, Math.PI * 2);
        _ctx.fill();
        _ctx.globalCompositeOperation = 'source-over';   // FIX: explicit reset
        _ctx.restore();
    }

    renderDamageNumbers(camera, _viewportWidth, _viewportHeight);
    updateMinimap({
        player: _player,
        blight: Blight,
        camps:  JUNGLE_CAMP_LOCATIONS,
        creeps: Creeps,
        time:   performance.now(),
    });
}

export function onViewportResize() {
    resizeDamageOverlay();
}

// ─── GAME LOOP ────────────────────────────────────────────────

export function gameLoop(timestamp) {
    const deltaTime    = gameState.lastTime ? timestamp - gameState.lastTime : 16;
    gameState.lastTime = timestamp;

    if (gameState.running) {
        updateGameLogic(deltaTime);
        renderGame(deltaTime, timestamp);
        requestAnimationFrame(gameLoop);
    }
}
