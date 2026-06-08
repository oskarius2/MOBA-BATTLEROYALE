/**
 * @file particles.js
 * ParticleSystem for combat VFX (water splash, etc.)
 */

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
