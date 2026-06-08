// ============================================================
// core/rendering/character-sprite-model.js
// Per-player visual model: facing lerp, animation, sprite draw.
// Screen-space coordinates (screenX, screenY passed from Player.draw).
// ============================================================

import { ANIM_FPS, FACING_LERP } from './render-config.js';
import {
    resolveAnimState,
    animStateToAction,
    frameIndexFromTime,
    AnimState,
} from './animation-state-machine.js';

const HERO_DRAW_SCALE = 0.55;

/** Ellips-skugga under fötter (origo = fotposition, ritas före rotate). */
function _drawFootShadow(ctx, radius) {
    const rx = Math.max(10, (radius ?? 24) * 0.55);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 3, rx, rx * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export class CharacterSpriteModel {
    /**
     * @param {object} player — Player entity (read-only for visuals)
     * @param {import('./sprite-sheet-manager.js').SpriteSheetManager} sheetManager
     */
    constructor(player, sheetManager) {
        this.player = player;
        this.sheetManager = sheetManager;
        this.visualFacingAngle = player.facingAngle ?? 0;
        this.currentAnimState = AnimState.IDLE;
        this.stateEnteredAt = 0;
        this.animationFrameTimer = 0;
        this._lastStance = player.stance ?? 'MELEE';
        this._stanceChangedAt = 0;
    }

    isReady() {
        return this.sheetManager.isReady('hero', this.player.heroClass);
    }

    /**
     * Called each frame before draw — updates animation state and facing.
     * @param {number} deltaTime — ms
     * @param {number} [now] — timestamp for stance transition
     */
    update(deltaTime, now = performance.now()) {
        const player = this.player;

        if (player.stance !== this._lastStance) {
            this._lastStance = player.stance;
            this._stanceChangedAt = now;
        }

        const speed = Math.hypot(player.vx ?? 0, player.vy ?? 0);
        const snapshot = {
            speed,
            attackTimer: player.attackTimer ?? 0,
            stance: player.stance,
            stanceChangedAt: this._stanceChangedAt,
        };

        const nextState = resolveAnimState(snapshot, now);
        if (nextState !== this.currentAnimState) {
            this.currentAnimState = nextState;
            this.stateEnteredAt = now;
            this.animationFrameTimer = 0;
        } else {
            this.animationFrameTimer += deltaTime;
        }

        const targetAngle = player.facingAngle ?? 0;
        let diff = targetAngle - this.visualFacingAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.visualFacingAngle += diff * FACING_LERP;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} screenX
     * @param {number} screenY
     * @param {number} time
     */
    draw(ctx, screenX, screenY, time = 0) {
        const player = this.player;
        const heroClass = player.heroClass;
        const action = animStateToAction(this.currentAnimState);
        const entry = this.sheetManager.cache[`hero:${heroClass}`];
        const framesPerAction = entry?.framesPerAction ?? 6;
        const frameIdx = frameIndexFromTime(this.animationFrameTimer, framesPerAction, ANIM_FPS);

        const frame = this.sheetManager.getFrame(
            'hero',
            heroClass,
            action,
            frameIdx,
            player.stance
        );

        ctx.save();
        // 1. Flytta till karaktärens skärmkoordinat (fötternas position)
        ctx.translate(screenX, screenY);
        _drawFootShadow(ctx, player.radius);
        // 2. Rotera runt fötterna (origo vid fötter)
        ctx.rotate(this.visualFacingAngle);

        if (frame?.image) {
            const scale = HERO_DRAW_SCALE;
            const dw = frame.sw * scale;
            const dh = frame.sh * scale;
            const bobAmplitude = this.currentAnimState === AnimState.WALK
                ? Math.sin(time * 0.008) * 3
                : 0;

            // 3. Rita spriten uppåt från fot-origo: centrerad i X, hela höjden ovanför fötter
            ctx.drawImage(
                frame.image,
                frame.sx, frame.sy, frame.sw, frame.sh,
                -dw / 2, -dh + bobAmplitude, dw, dh
            );

            if (this.currentAnimState === AnimState.ATTACK) {
                this._drawAttackGlow(ctx, dw, dh, time);
            }
        }

        if (heroClass === 'Hybrid') {
            this._drawHybridWeaponOverlay(ctx, time);
        }

        ctx.restore();
    }

    _drawAttackGlow(ctx, dw, dh, time) {
        const pulse = 0.3 + Math.abs(Math.sin(time * 0.02)) * 0.2;
        const bodyCy = -dh * 0.45;
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, bodyCy, dw * 0.55, dh * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    _drawHybridWeaponOverlay(ctx, time) {
        const isMelee = this.player.stance === 'MELEE';
        const daggerColor = '156, 39, 176';
        const bowColor = '141, 110, 99';
        const bodyLift = -35;

        if (isMelee) {
            const yOffset = bodyLift + Math.cos(time * 0.05) * 5;
            ctx.strokeStyle = `rgba(${daggerColor}, ${0.5 + Math.abs(Math.sin(time * 0.02)) * 0.4})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-32, yOffset);
            ctx.lineTo(-58, yOffset - 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(32, yOffset);
            ctx.lineTo(58, yOffset - 10);
            ctx.stroke();
        } else {
            ctx.strokeStyle = `rgba(${bowColor}, 0.9)`;
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.ellipse(20, bodyLift, 45, 12, Math.PI / 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = `rgba(${bowColor}, 0.7)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-5, bodyLift - 15);
            ctx.lineTo(15, bodyLift - 12);
            ctx.stroke();
        }
    }
}
