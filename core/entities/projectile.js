// ============================================================
// core/entities/projectile.js
// Extraherat ur index.html — ren klass, inga externa deps.
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../data/world-config.js';

export class Projectile {
    constructor(x, y, vx, vy, damage) {
        this.x      = x;
        this.y      = y;
        this.vx     = vx;
        this.vy     = vy;
        this.damage = damage;
        this.radius = 5;
        this.ttl    = 100;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.ttl--;
    }

    isAlive() {
        return this.ttl > 0 &&
            this.x >= -50 && this.x <= CANVAS_WIDTH  + 50 &&
            this.y >= -50 && this.y <= CANVAS_HEIGHT + 50;
    }

    isCollidingWith(target) {
        if (target.isDead) return false;
        return Math.hypot(this.x - target.x, this.y - target.y)
            < this.radius + target.radius;
    }

    draw(ctx, time = 0) {
        // Importeras och ritas av canvas-renderer via drawMagicProjectile
        // Denna fallback används om inget annat render-anrop görs
    }
}
