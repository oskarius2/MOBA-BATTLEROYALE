// ============================================================
// core/rendering/creep-sprite-model.js
// Per-creep visual sprite model (world-space draw).
// ============================================================

import { ANIM_FPS, FACING_LERP } from './render-config.js';
import {
    resolveAnimState,
    animStateToAction,
    frameIndexFromTime,
} from './animation-state-machine.js';

const CREEP_DRAW_SCALE = 0.45;

export class CreepSpriteModel {
    /**
     * @param {object} creep — Creep entity
     * @param {import('./sprite-sheet-manager.js').SpriteSheetManager} sheetManager
     */
    constructor(creep, sheetManager) {
        this.creep = creep;
        this.sheetManager = sheetManager;
        this.visualFacingAngle = creep.facingAngle ?? 0;
        this.animationFrameTimer = 0;
        this.currentAnimState = 'IDLE';
        this.stateEnteredAt = 0;
    }

    isReady() {
        return this.sheetManager.isReady('creep', this.creep.typeKey);
    }

    update(deltaTime, now = performance.now()) {
        const creep = this.creep;
        const speed = Math.hypot(creep.vx ?? 0, creep.vy ?? 0);
        const snapshot = {
            speed,
            attackTimer: creep.state === 'AGGRO' && speed > 0.1 ? 0.15 : 0,
            stance: 'MELEE',
            stanceChangedAt: 0,
        };

        const nextState = resolveAnimState(snapshot, now);
        if (nextState !== this.currentAnimState) {
            this.currentAnimState = nextState;
            this.stateEnteredAt = now;
            this.animationFrameTimer = 0;
        } else {
            this.animationFrameTimer += deltaTime;
        }

        const targetAngle = creep.facingAngle ?? 0;
        let diff = targetAngle - this.visualFacingAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.visualFacingAngle += diff * FACING_LERP;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx — world-space context
     * @param {number} time
     */
    draw(ctx, time = 0) {
        const creep = this.creep;
        const action = animStateToAction(this.currentAnimState);
        const entry = this.sheetManager.cache[`creep:${creep.typeKey}`];
        const framesPerAction = entry?.framesPerAction ?? 4;
        const frameIdx = frameIndexFromTime(this.animationFrameTimer, framesPerAction, ANIM_FPS);

        const frame = this.sheetManager.getFrame('creep', creep.typeKey, action, frameIdx);

        ctx.save();
        ctx.translate(creep.x, creep.y);
        ctx.rotate(this.visualFacingAngle);

        if (frame?.image) {
            const scale = CREEP_DRAW_SCALE * (creep.radius / 16);
            const dw = frame.sw * scale;
            const dh = frame.sh * scale;
            ctx.drawImage(
                frame.image,
                frame.sx, frame.sy, frame.sw, frame.sh,
                -dw / 2, -dh / 2, dw, dh
            );
        }

        if (creep.state === 'AGGRO') {
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, creep.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        const hpRatio = creep.hp / creep.maxHp;
        if (hpRatio < 1) {
            const barW = creep.radius * 2;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(-barW / 2, -creep.radius - 10, barW, 4);
            ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : '#f44336';
            ctx.fillRect(-barW / 2, -creep.radius - 10, barW * hpRatio, 4);
        }

        ctx.restore();
    }
}
