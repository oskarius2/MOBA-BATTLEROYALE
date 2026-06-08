/**
 * @file projectile-factory.js
 * Centralized projectile creation.
 */

let projectileIdCounter = 0;

export function resetProjectileIdCounter() {
    projectileIdCounter = 0;
}

export class ProjectileFactory {
    constructor(projectilesArray) {
        this.projectiles = projectilesArray;
    }

    createLinear(startX, startY, endX, endY, damage, color = '#ffffff', radius = 4) {
        const distance = Math.hypot(endX - startX, endY - startY);
        if (distance === 0) return null;

        const speed = 10;
        const vx = ((endX - startX) / distance) * speed;
        const vy = ((endY - startY) / distance) * speed;

        projectileIdCounter += 1;
        const proj = {
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
        this.projectiles.push(proj);
        return proj;
    }

    createPositional(x, y, vx, vy, damage, color, radius, ttlFrames, lifeTimeSecs) {
        projectileIdCounter += 1;
        const proj = {
            id: projectileIdCounter,
            x,
            y,
            vx,
            vy,
            ttl: ttlFrames,
            lifeTime: lifeTimeSecs,
            damage,
            color,
            radius,
            isDead: false,
            isAbilityProjectile: true,
        };
        this.projectiles.push(proj);
        return proj;
    }

    createBasicAttack(player, angle, speed, damage, radius, color, type) {
        projectileIdCounter += 1;
        this.projectiles.push({
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
}
