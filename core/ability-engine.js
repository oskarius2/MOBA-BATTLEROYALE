/**
 * core/ability-engine.js
 * Senior Gameplay Engineering - MOBA Ability System
 * Implementation uses pure canvas geometry and state machine principles.
 */

const MAP_MIN = 32;
const MAP_MAX = 5968;


// ABILITY_CONFIG importeras från balance-config.js (single source of truth).
// Ersätter det gamla lokala blocket (rad 10-72 i originalfilen).
import { ABILITY_CONFIG } from './balance-config.js';

export { ABILITY_CONFIG };

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.MAX_PARTICLES = 400;
    }
    addParticle(x, y, vx, vy, size, life, color) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        this.particles.push({ x, y, vx, vy, size, lifeRemaining: life, maxLife: life, color });
    }
    update(deltaTime) {
        let i = this.particles.length;
        while (i--) {
            const p = this.particles[i];
            p.lifeRemaining -= deltaTime;
            if (p.lifeRemaining <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.x += p.vx * deltaTime * 60;
            p.y += p.vy * deltaTime * 60;
        }
    }
    draw(ctx, camera, viewW = 1920, viewH = 1080) {
        ctx.save();
        let i = this.particles.length;
        while (i--) {
            const p = this.particles[i];

            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;

            if (screenX < -50 || screenX > viewW + 50 || screenY < -50 || screenY > viewH + 50) {
                continue;
            }

            const opacity = p.lifeRemaining / p.maxLife;
            ctx.globalAlpha = opacity * 0.8;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size * opacity, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }
        ctx.restore();
    }
}

export const GlobalParticles = new ParticleSystem();

export function getTerrainType(x, y) {
    // Riverbed cutting through the jungle between Y: 4000 and 4400
    if (y > 4000 && y < 4400 && x > 200 && x < 5800) return 'WATER';
    return 'GRASS';
}

export const CooldownState = { q: 0, w: 0, e: 0 };
export let ActiveAbilityEffects = [];

let projectileIdCounter = 0;

function normalizePointer(pointerWorld) {
    if (!pointerWorld) return { worldX: 0, worldY: 0 };
    return {
        worldX: pointerWorld.worldX ?? pointerWorld.x ?? 0,
        worldY: pointerWorld.worldY ?? pointerWorld.y ?? 0,
    };
}

export function playerDamage(player) {
    return player.damage ?? player.projectileDamage ?? 20;
}

function pushBasicAttackProjectile(projectilesArray, player, angle, speed, damage, radius, color, type) {
    projectileIdCounter += 1;
    projectilesArray.push({
        id: Date.now() + Math.random(),
        owner: 'player',
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage,
        radius,
        type,
        isDead: false,
        color,
        ttl: 120,
        isAbilityProjectile: true,
    });
}

function processBasicAttack(player, pointerWorld, projectilesArray, creepsArray) {
    if (player.attackTimer > 0) return false;

    const heroClass = player.heroClass;
    const cfg = ABILITY_CONFIG[heroClass];
    if (!cfg) return false;

    const ptr = normalizePointer(pointerWorld);
    const angle = Math.atan2(ptr.worldY - player.y, ptr.worldX - player.x);

    player.attackTimer = (heroClass === 'Hybrid'
        ? (player.stance === 'MELEE' ? cfg.ATTACK_SPEED_MELEE : cfg.ATTACK_SPEED_RANGED)
        : cfg.ATTACK_SPEED) / 1000;

    if (heroClass === 'Warrior') {
        const halfSpread = (Math.PI / 4) / 2;
        creepsArray.forEach(creep => {
            if (!creep.isDead) {
                const dist = Math.hypot(creep.x - player.x, creep.y - player.y);
                if (dist < cfg.ATTACK_RANGE + (creep.radius || 15)) {
                    const targetAngle = Math.atan2(creep.y - player.y, creep.x - player.x);
                    let angleDiff = Math.abs(angle - targetAngle);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                    if (angleDiff <= halfSpread) {
                        creep.takeDamage(playerDamage(player) * cfg.BASE_DAMAGE_MULTIPLIER);
                    }
                }
            }
        });
    } else if (heroClass === 'Tank-Viking') {
        let closestCreep = null;
        let minDist = cfg.ATTACK_RANGE;
        creepsArray.forEach(creep => {
            if (!creep.isDead) {
                const dist = Math.hypot(creep.x - player.x, creep.y - player.y) - (creep.radius || 15);
                if (dist < minDist) {
                    minDist = dist;
                    closestCreep = creep;
                }
            }
        });
        if (closestCreep) {
            closestCreep.takeDamage(playerDamage(player) * 0.8);
        }
    } else if (heroClass === 'Mage') {
        pushBasicAttackProjectile(
            projectilesArray,
            player,
            angle,
            12,
            playerDamage(player),
            5,
            '#FF9800',
            'firebolt'
        );
    } else if (heroClass === 'Ranger') {
        pushBasicAttackProjectile(
            projectilesArray,
            player,
            angle,
            16,
            playerDamage(player) * 1.1,
            3,
            '#81C784',
            'arrow'
        );
    } else if (heroClass === 'Hybrid') {
        const isMelee = player.stance === 'MELEE';
        if (isMelee) {
            const halfSpread = (Math.PI / 2) / 2;
            creepsArray.forEach(creep => {
                if (!creep.isDead) {
                    const dist = Math.hypot(creep.x - player.x, creep.y - player.y);
                    if (dist < cfg.ATTACK_RANGE_MELEE + (creep.radius || 15)) {
                        const targetAngle = Math.atan2(creep.y - player.y, creep.x - player.x);
                        let angleDiff = Math.abs(angle - targetAngle);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (angleDiff <= halfSpread) {
                            creep.takeDamage(playerDamage(player) * 0.9);
                        }
                    }
                }
            });
        } else {
            pushBasicAttackProjectile(
                projectilesArray,
                player,
                angle,
                13,
                playerDamage(player) * 0.9,
                3,
                '#BA68C8',
                'arrow'
            );
        }
    }

    return true;
}

function clampMapCoord(value) {
    return Math.max(MAP_MIN, Math.min(MAP_MAX, value));
}

function clampPlayerPosition(player, x, y) {
    return {
        x: clampMapCoord(x),
        y: clampMapCoord(y),
    };
}

function getAimAngle(player, pointerWorld) {
    const ptr = normalizePointer(pointerWorld);
    const dx = ptr.worldX - player.x;
    const dy = ptr.worldY - player.y;
    if (Math.hypot(dx, dy) < 1) {
        return player.facingAngle ?? 0;
    }
    return Math.atan2(dy, dx);
}

function movePlayerByVector(player, distance, angle) {
    const next = clampPlayerPosition(
        player,
        player.x + Math.cos(angle) * distance,
        player.y + Math.sin(angle) * distance
    );
    player.x = next.x;
    player.y = next.y;
    return next;
}

function teleportPlayer(player, x, y) {
    const next = clampPlayerPosition(player, x, y);
    player.x = next.x;
    player.y = next.y;
    return next;
}

function applyCircleDamage(creeps, x, y, radius, damage) {
    if (!creeps || damage <= 0) return;
    for (let i = 0; i < creeps.length; i++) {
        const creep = creeps[i];
        if (creep.isDead) continue;
        const dist = Math.hypot(creep.x - x, creep.y - y);
        if (dist < radius + creep.radius) {
            creep.takeDamage(damage);
        }
    }
}

function applyConeDamage(creeps, originX, originY, angle, spread, length, damage) {
    if (!creeps || damage <= 0) return;
    const halfSpread = spread / 2;
    for (let i = 0; i < creeps.length; i++) {
        const creep = creeps[i];
        if (creep.isDead) continue;
        const dx = creep.x - originX;
        const dy = creep.y - originY;
        const dist = Math.hypot(dx, dy);
        if (dist > length + creep.radius) continue;
        const creepAngle = Math.atan2(dy, dx);
        let angleDiff = creepAngle - angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        if (Math.abs(angleDiff) <= halfSpread) {
            creep.takeDamage(damage);
        }
    }
}

function syncEffectToPlayer(effect, player) {
    effect.x = player.x;
    effect.y = player.y;
}

function getCooldownForSlot(heroClass, slot) {
    const cfg = ABILITY_CONFIG[heroClass];
    if (!cfg) return 4;
    if (slot === 'q') return cfg.q_cd ?? 4;
    if (slot === 'w') return cfg.w_cd ?? 6;
    if (slot === 'e') return cfg.e_cd ?? 10;
    return 4;
}

function updateAbilityEngine(deltaTime, GlobalProjectilesArray, CreepsArray) {
    GlobalParticles.update(deltaTime);

    let i = ActiveAbilityEffects.length;
    while (i--) {
        const effect = ActiveAbilityEffects[i];
        effect.duration -= deltaTime;

        if (effect.internalTime !== undefined) {
            effect.internalTime += deltaTime;
        }

        if (effect.onTick && !effect.isFinished) {
            effect.onTick(deltaTime, GlobalProjectilesArray, effect, CreepsArray);
        }

        if (effect.duration <= 0 || effect.isCompleted) {
            if (effect.onComplete) {
                effect.onComplete(deltaTime, GlobalProjectilesArray, CreepsArray);
            }
            ActiveAbilityEffects.splice(i, 1);
        }
    }

    if (CooldownState.q > 0) CooldownState.q = Math.max(0, CooldownState.q - deltaTime);
    if (CooldownState.w > 0) CooldownState.w = Math.max(0, CooldownState.w - deltaTime);
    if (CooldownState.e > 0) CooldownState.e = Math.max(0, CooldownState.e - deltaTime);
}

function addActiveAbilityEffect(config) {
    const newEffect = Object.assign({ duration: 0, isFinished: false, isCompleted: false, internalTime: 0 }, config);
    ActiveAbilityEffects.push(newEffect);
    return newEffect;
}

function createProjectile(startX, startY, endX, endY, damage, color = '#ffffff', radius = 4) {
    const distance = Math.hypot(endX - startX, endY - startY);
    if (distance === 0) return null;

    const speed = 10;
    const vx = ((endX - startX) / distance) * speed;
    const vy = ((endY - startY) / distance) * speed;

    projectileIdCounter += 1;
    return {
        id: projectileIdCounter,
        x: startX,
        y: startY,
        vx,
        vy,
        ttl: Math.ceil(1.5 * 60),
        lifeTime: 1.5,
        damage,
        color,
        radius,
        isDead: false,
        isAbilityProjectile: true,
    };
}

function castAbility(slot, player, pointerWorld, GlobalProjectilesArray, CreepsArray) {
    const normalizedSlot = slot.toLowerCase();
    if (CooldownState[normalizedSlot] > 0) return false;

    if (player.stance !== 'MELEE' && player.stance !== 'RANGED') {
        player.stance = 'MELEE';
    }

    const ptr = normalizePointer(pointerWorld);
    const heroClass = player.heroClass;
    let success = false;

    switch (normalizedSlot) {
        case 'q':
            if (heroClass === 'Warrior') success = castWarriorQ(player, ptr, CreepsArray);
            if (heroClass === 'Ranger') success = castRangerQ(player, ptr, GlobalProjectilesArray);
            if (heroClass === 'Tank-Viking') success = castVikingQ(player, ptr, CreepsArray);
            if (heroClass === 'Hybrid') success = castHybridQ(player);
            if (heroClass === 'Mage') success = castMageQ(player, ptr, GlobalProjectilesArray);
            if (success) CooldownState.q = getCooldownForSlot(heroClass, 'q');
            break;

        case 'w':
            if (heroClass === 'Warrior') success = castWarriorW(player, CreepsArray);
            if (heroClass === 'Ranger') success = castRangerW(player, ptr);
            if (heroClass === 'Tank-Viking') success = castVikingW(player);
            if (heroClass === 'Hybrid') success = castHybridW(player, ptr);
            if (heroClass === 'Mage') success = castMageW(player, ptr, CreepsArray);
            if (success) CooldownState.w = getCooldownForSlot(heroClass, 'w');
            break;

        case 'e':
            if (heroClass === 'Warrior') success = castWarriorE(player, CreepsArray);
            if (heroClass === 'Ranger') success = castRangerE(player, ptr, GlobalProjectilesArray);
            if (heroClass === 'Tank-Viking') success = castVikingE(player);
            if (heroClass === 'Hybrid') success = castHybridE(player, CreepsArray);
            if (heroClass === 'Mage') success = castMageE(player, ptr, CreepsArray);
            if (success) CooldownState.e = getCooldownForSlot(heroClass, 'e');
            break;

        default:
            return false;
    }

    return success;
}

function castWarriorQ(player, pointerWorld, creeps) {
    const cfg = ABILITY_CONFIG.Warrior;
    const startX = player.x;
    const startY = player.y;
    const ptr = normalizePointer(pointerWorld);
    const angle = getAimAngle(player, ptr);
    const pointerDist = Math.hypot(ptr.worldX - startX, ptr.worldY - startY);
    const dashDist = Math.min(cfg.DASH_STRIKE_DISTANCE, pointerDist || cfg.DASH_STRIKE_DISTANCE);
    const end = movePlayerByVector(player, dashDist, angle);

    if (getTerrainType(player.x, player.y) === 'WATER') {
        for (let i = 0; i < 20; i++) {
            GlobalParticles.addParticle(
                player.x,
                player.y,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                Math.random() * 4 + 2,
                0.4,
                'rgba(135, 206, 235, 0.8)'
            );
        }
    }

    addActiveAbilityEffect({
        type: 'line',
        x: startX,
        y: startY,
        duration: 0.15,
        color: 'rgba(255, 140, 0, 0.6)',
        startX,
        startY,
        endX: end.x,
        endY: end.y,
        width: 20,
    });

    applyCircleDamage(
        creeps,
        end.x,
        end.y,
        40,
        playerDamage(player) * cfg.BASE_DAMAGE_MULTIPLIER
    );
    return true;
}

function castWarriorW(player, creeps) {
    const cfg = ABILITY_CONFIG.Warrior;
    const damage = playerDamage(player) * cfg.BASE_DAMAGE_MULTIPLIER;

    addActiveAbilityEffect({
        type: 'circle',
        x: player.x,
        y: player.y,
        duration: 0.2,
        color: 'rgba(255, 69, 0, 0.4)',
        radius: cfg.BLADE_WHIRL_RADIUS,
        fill: true,
    });

    applyCircleDamage(creeps, player.x, player.y, cfg.BLADE_WHIRL_RADIUS, damage);
    return true;
}

function castWarriorE(player, creeps) {
    const cfg = ABILITY_CONFIG.Warrior;
    const tickDamage = playerDamage(player) * cfg.BASE_DAMAGE_MULTIPLIER * 0.5;
    const maxRadius = cfg.SWEEP_COUNT * 25 + 5;

    addActiveAbilityEffect({
        type: 'bladestorm',
        x: player.x,
        y: player.y,
        duration: cfg.BLADESTORM_DURATION,
        color: 'rgba(255, 165, 0, 0.4)',
        sweepCount: cfg.SWEEP_COUNT,
        damageTimer: 0,
        onTick: (deltaTime, projectilesOut, effect, creepList) => {
            syncEffectToPlayer(effect, player);
            effect.damageTimer += deltaTime;
            if (effect.damageTimer >= 0.3) {
                effect.damageTimer = 0;
                applyCircleDamage(creepList, player.x, player.y, maxRadius, tickDamage);
            }
        },
    });
    return true;
}

function castRangerQ(player, pointerWorld, projectilesOut) {
    const cfg = ABILITY_CONFIG.Ranger;
    const angle = getAimAngle(player, pointerWorld);
    const arrowCount = 5;
    const step = cfg.VOLLEY_ARROW_SPREAD / (arrowCount - 1);
    const startOffset = -cfg.VOLLEY_ARROW_SPREAD / 2;

    for (let i = 0; i < arrowCount; i++) {
        const a = angle + startOffset + step * i;
        const proj = createProjectile(
            player.x,
            player.y,
            player.x + Math.cos(a) * 100,
            player.y + Math.sin(a) * 100,
            playerDamage(player) * 0.7,
            '#4CAF50',
            4
        );
        if (proj) projectilesOut.push(proj);
    }
    return true;
}

function castRangerW(player, pointerWorld) {
    const cfg = ABILITY_CONFIG.Ranger;
    const startX = player.x;
    const startY = player.y;
    const angle = getAimAngle(player, pointerWorld);
    const end = movePlayerByVector(player, cfg.TUMBLE_DISTANCE, angle);

    addActiveAbilityEffect({
        type: 'line',
        x: startX,
        y: startY,
        duration: 0.15,
        color: 'rgba(76, 175, 80, 0.5)',
        startX,
        startY,
        endX: end.x,
        endY: end.y,
        width: 8,
    });
    return true;
}

function castRangerE(player, pointerWorld, projectilesOut) {
    const cfg = ABILITY_CONFIG.Ranger;
    const ptr = normalizePointer(pointerWorld);
    const tx = clampMapCoord(ptr.worldX);
    const ty = clampMapCoord(ptr.worldY);
    const arrowDamage = playerDamage(player) * cfg.ARROW_RAIN_DAMAGE_MULT;

    addActiveAbilityEffect({
        type: 'circle',
        x: tx,
        y: ty,
        duration: cfg.ARROW_RAIN_DURATION,
        color: 'rgba(76, 175, 80, 0.15)',
        radius: 100,
        fill: true,
        spawnAccumulator: 0,
        onTick: (deltaTime, outProjectiles, effect) => {
            effect.spawnAccumulator += deltaTime;
            const spawnInterval = 1 / 3;
            while (effect.spawnAccumulator >= spawnInterval) {
                effect.spawnAccumulator -= spawnInterval;
                const arrowsThisTick = 2 + Math.floor(Math.random() * 2);
                for (let k = 0; k < arrowsThisTick; k++) {
                    projectileIdCounter += 1;
                    outProjectiles.push({
                        id: projectileIdCounter,
                        x: tx + (Math.random() - 0.5) * 160,
                        y: ty + (Math.random() - 0.5) * 160,
                        vx: 0,
                        vy: 2,
                        ttl: Math.ceil(0.3 * 60),
                        lifeTime: 0.3,
                        damage: arrowDamage,
                        color: '#81C784',
                        radius: 2,
                        isDead: false,
                        isAbilityProjectile: true,
                    });
                }
            }
        },
    });
    return true;
}

function castVikingQ(player, pointerWorld, creeps) {
    const cfg = ABILITY_CONFIG['Tank-Viking'];
    const angle = getAimAngle(player, pointerWorld);
    const damage = playerDamage(player) * cfg.GROUND_SLAM_DAMAGE_MULT;

    addActiveAbilityEffect({
        type: 'cone',
        x: player.x,
        y: player.y,
        duration: 0.3,
        color: 'rgba(0, 150, 255, 0.4)',
        angle,
        spread: cfg.GROUND_SLAM_CONE_ANGLE,
        radius: cfg.GROUND_SLAM_LENGTH,
    });

    applyConeDamage(
        creeps,
        player.x,
        player.y,
        angle,
        cfg.GROUND_SLAM_CONE_ANGLE,
        cfg.GROUND_SLAM_LENGTH,
        damage
    );
    return true;
}

function castVikingW(player) {
    const cfg = ABILITY_CONFIG['Tank-Viking'];
    player.isShielded = true;

    addActiveAbilityEffect({
        type: 'circle',
        x: player.x,
        y: player.y,
        duration: cfg.SHIELD_DURATION,
        color: 'rgba(33, 150, 243, 0.3)',
        radius: 50,
        fill: false,
        onTick: (deltaTime, projectilesOut, effect) => {
            syncEffectToPlayer(effect, player);
        },
        onComplete: () => {
            player.isShielded = false;
        },
    });
    return true;
}

function castVikingE(player) {
    const cfg = ABILITY_CONFIG['Tank-Viking'];
    if (player.baseSpeed === undefined) {
        player.baseSpeed = player.speed;
    }

    player.valhallaRefCount = (player.valhallaRefCount || 0) + 1;
    if (player.valhallaRefCount === 1) {
        player.valhallaActive = true;
        player.speed = player.baseSpeed * cfg.VALHALLA_BUFF_SPEED;
    }

    addActiveAbilityEffect({
        type: 'circle',
        x: player.x,
        y: player.y,
        duration: cfg.VALHALLA_DURATION,
        color: 'rgba(33, 150, 243, 0.15)',
        radius: 10,
        fill: true,
        onTick: (deltaTime, projectilesOut, effect) => {
            syncEffectToPlayer(effect, player);
            effect.radius += deltaTime * 80;
        },
        onComplete: () => {
            player.valhallaRefCount = Math.max(0, (player.valhallaRefCount || 1) - 1);
            if (player.valhallaRefCount === 0) {
                player.valhallaActive = false;
                player.speed = player.baseSpeed;
            }
        },
    });
    return true;
}

function castHybridQ(player) {
    player.stance = player.stance === 'MELEE' ? 'RANGED' : 'MELEE';
    return true;
}

function castHybridW(player, pointerWorld) {
    const oldX = player.x;
    const oldY = player.y;
    const ptr = normalizePointer(pointerWorld);
    const targetX = clampMapCoord(ptr.worldX);
    const targetY = clampMapCoord(ptr.worldY);
    const next = teleportPlayer(player, targetX, targetY);

    addActiveAbilityEffect({
        type: 'circle',
        x: oldX,
        y: oldY,
        duration: 2.0,
        color: 'rgba(156, 39, 176, 0.4)',
        radius: 25,
        fill: true,
    });
    return true;
}

function castHybridE(player, creeps) {
    const cfg = ABILITY_CONFIG.Hybrid;
    const radius = 60;
    const stanceBonus = player.stance === 'MELEE' ? cfg.MELEE_BONUS : cfg.RANGED_BONUS;
    const damage = playerDamage(player) + stanceBonus;

    addActiveAbilityEffect({
        type: 'circle',
        x: player.x,
        y: player.y,
        duration: 1.2,
        color: 'rgba(156, 39, 176, 0.35)',
        radius,
        fill: true,
    });

    applyCircleDamage(creeps, player.x, player.y, radius, damage);
    return true;
}

function castMageQ(player, pointerWorld, projectilesOut) {
    const cfg = ABILITY_CONFIG.Mage;
    const ptr = normalizePointer(pointerWorld);
    const proj = createProjectile(
        player.x,
        player.y,
        ptr.worldX,
        ptr.worldY,
        playerDamage(player) * cfg.BURST_DAMAGE_MULTIPLIER,
        '#FF4500',
        cfg.FIREBALL_RADIUS
    );
    if (proj) projectilesOut.push(proj);
    return true;
}

function castMageW(player, pointerWorld, creeps) {
    const cfg = ABILITY_CONFIG.Mage;
    const startX = player.x;
    const startY = player.y;
    const angle = getAimAngle(player, pointerWorld);
    const end = movePlayerByVector(player, cfg.FLAME_DASH_DISTANCE, angle);
    const burnDamage = playerDamage(player) * cfg.BURNING_DAMAGE_MULT;

    for (let j = 0; j < 3; j++) {
        const circleX = startX + Math.cos(angle) * (j * 40);
        const circleY = startY + Math.sin(angle) * (j * 40);
        addActiveAbilityEffect({
            type: 'circle',
            x: circleX,
            y: circleY,
            duration: cfg.BURNING_CIRCLE_DURATION,
            color: 'rgba(255, 69, 0, 0.3)',
            radius: cfg.BURNING_CIRCLE_RADIUS,
            fill: true,
        });
        applyCircleDamage(creeps, circleX, circleY, cfg.BURNING_CIRCLE_RADIUS, burnDamage);
    }

    addActiveAbilityEffect({
        type: 'line',
        x: startX,
        y: startY,
        duration: 0.15,
        color: 'rgba(255, 69, 0, 0.5)',
        startX,
        startY,
        endX: end.x,
        endY: end.y,
        width: 12,
    });
    return true;
}

function castMageE(player, pointerWorld, creeps) {
    const cfg = ABILITY_CONFIG.Mage;
    const ptr = normalizePointer(pointerWorld);
    const tx = clampMapCoord(ptr.worldX);
    const ty = clampMapCoord(ptr.worldY);
    const explosionDamage = playerDamage(player) * cfg.BURST_DAMAGE_MULTIPLIER;

    addActiveAbilityEffect({
        type: 'circle',
        x: tx,
        y: ty,
        duration: cfg.METEOR_DELAY,
        color: 'rgba(255, 80, 0, 0.4)',
        radius: 25,
        fill: true,
        onComplete: (deltaTime, projectilesOut, creepList) => {
            addActiveAbilityEffect({
                type: 'circle',
                x: tx,
                y: ty,
                duration: 0.4,
                color: 'rgba(230, 30, 0, 0.7)',
                radius: cfg.METEOR_EXPLOSION_RADIUS,
                fill: true,
            });
            applyCircleDamage(
                creepList,
                tx,
                ty,
                cfg.METEOR_EXPLOSION_RADIUS,
                explosionDamage
            );
        },
    });
    return true;
}

export function resetAbilityState() {
    CooldownState.q = 0;
    CooldownState.w = 0;
    CooldownState.e = 0;
    ActiveAbilityEffects.length = 0;
    GlobalParticles.particles.length = 0;
    projectileIdCounter = 0;
}

const AbilityEngine = {
    update: (deltaTime, projectilesArray, creepsArray) =>
        updateAbilityEngine(deltaTime, projectilesArray, creepsArray),
    cast: (slot, player, pointerWorld, projectilesArray, creepsArray) =>
        castAbility(slot, player, pointerWorld, projectilesArray, creepsArray),

    /**
     * Executes deterministic player basic weapon swings and projectile spawns
     * @returns {boolean} True if the swing successfully executed and triggered swing cooldowns
     */
    basicAttack: (player, pointerWorld, projectilesArray, creepsArray) =>
        processBasicAttack(player, pointerWorld, projectilesArray, creepsArray),
};

export default AbilityEngine;
