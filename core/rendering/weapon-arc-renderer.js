// ============================================================
// core/rendering/weapon-arc-renderer.js
// Class-specific basic attack swing visuals (screen-space).
// ============================================================

let visualAnimationTick = 0;

export function tickWeaponArcAnimation(deltaTimeSec) {
    visualAnimationTick += deltaTimeSec;
}

/**
 * @param {CanvasRenderingContext2D} ctx — screen space
 * @param {object} player
 * @param {object} camera
 */
export function drawWeaponArcs(ctx, player, camera) {
    if (!player?.attackTimer || player.attackTimer <= 0) return;

    const pScreenX = player.x - camera.x;
    const pScreenY = player.y - camera.y;
    const angle = player.facingAngle ?? 0;

    ctx.save();

    if (player.heroClass === 'Warrior') {
        _drawWarriorBezierArc(ctx, pScreenX, pScreenY, angle, player.attackTimer);
    } else if (player.heroClass === 'Tank-Viking') {
        _drawVikingThrust(ctx, pScreenX, pScreenY, angle, player);
    } else if (player.heroClass === 'Hybrid' && player.stance === 'MELEE') {
        _drawHybridDaggerArc(ctx, pScreenX, pScreenY, angle, player.attackTimer);
    }

    ctx.restore();
}

function _drawWarriorBezierArc(ctx, sx, sy, angle, attackTimer) {
    const maxTimer = 0.6;
    const t = 1 - Math.min(attackTimer / maxTimer, 1);

    ctx.translate(sx, sy);
    ctx.rotate(angle);

    const gradient = ctx.createRadialGradient(0, 0, 20, 0, 0, 90);
    gradient.addColorStop(0, `rgba(255, 60, 0, ${0.8 - t * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');

    ctx.globalAlpha = 0.75 - t * 0.2;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 22 - t * 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-90 * (1 - t * 0.5), 0);
    ctx.bezierCurveTo(-45, -25, 45, -35, 90 * (1 - t * 0.3), -8);
    ctx.stroke();

    ctx.globalAlpha = 0.5 - t * 0.3;
    ctx.strokeStyle = `rgba(255, 140, 0, ${Math.max(0.1, 0.8 - t * 0.5)})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 4 + t * 3, 0, Math.PI * 2);
    ctx.stroke();
}

function _drawVikingThrust(ctx, sx, sy, angle, player) {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = 'rgba(180, 230, 255, 0.9)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * 55, sy + Math.sin(angle) * 55);
    ctx.stroke();

    if (player.isShielded) {
        ctx.strokeStyle = `rgba(33, 150, 243, ${0.4 + Math.sin(visualAnimationTick * 8) * 0.3})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(sx, sy, 35, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function _drawHybridDaggerArc(ctx, sx, sy, angle, attackTimer) {
    const t = 1 - Math.min(attackTimer / 0.5, 1);
    const daggerColor = '156, 39, 176';

    ctx.translate(sx, sy);
    ctx.rotate(angle);

    ctx.strokeStyle = `rgba(${daggerColor}, ${0.6 + t * 0.3})`;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(20, -5);
    ctx.bezierCurveTo(40, -20, 55, -15, 65, 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(20, 5);
    ctx.bezierCurveTo(40, 20, 55, 15, 65, -5);
    ctx.stroke();
}
