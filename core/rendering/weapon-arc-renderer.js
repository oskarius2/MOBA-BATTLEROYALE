// ============================================================
// core/rendering/weapon-arc-renderer.js
// Vapen-swing-visualer och bågar (screen-space).
// ============================================================

const _activeSwings = [];

/**
 * Trigga en vapenbåge vid basic attack.
 * @param {object} player
 * @param {number} [durationSec=0.28]
 */
export function triggerWeaponSwing(player, durationSec = 0.28) {
    if (!player) return;
    _activeSwings.push({
        heroClass: player.heroClass,
        stance: player.stance ?? 'MELEE',
        facingAngle: player.facingAngle ?? 0,
        worldX: player.x,
        worldY: player.y,
        progress: 0,
        duration: durationSec,
    });
}

export function tickWeaponArcAnimation(deltaSeconds) {
    for (let i = _activeSwings.length - 1; i >= 0; i--) {
        _activeSwings[i].progress += deltaSeconds;
        if (_activeSwings[i].progress >= _activeSwings[i].duration) {
            _activeSwings.splice(i, 1);
        }
    }
}

/**
 * Rita vapen-bågar (screen-space — anropas efter ctx.restore()).
 */
export function drawWeaponArcs(ctx, player, camera) {
    if (!player || !camera) return;

    const swings = [..._activeSwings];

    // Pågående melee-swing om attackTimer är aktiv
    if (player.attackTimer > 0 && _isMeleeClass(player.heroClass, player.stance)) {
        swings.push({
            heroClass: player.heroClass,
            stance: player.stance,
            facingAngle: player.facingAngle ?? 0,
            worldX: player.x,
            worldY: player.y,
            progress: 0,
            duration: player.attackTimer,
            live: true,
        });
    }

    for (const swing of swings) {
        const t = swing.live
            ? 1 - (player.attackTimer / Math.max(swing.duration, 0.01))
            : swing.progress / swing.duration;
        if (t < 0 || t > 1) continue;

        const screenX = swing.worldX - camera.x;
        const screenY = swing.worldY - camera.y;
        const cfg = _arcConfig(swing.heroClass, swing.stance);
        const sweep = cfg.startAngle + (cfg.endAngle - cfg.startAngle) * t;
        const alpha = (1 - t) * cfg.alpha;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(swing.facingAngle + cfg.offset);

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = cfg.lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, cfg.radius, cfg.startAngle, sweep);
        ctx.stroke();

        if (cfg.glow) {
            ctx.globalAlpha = alpha * 0.35;
            ctx.lineWidth = cfg.lineWidth + 6;
            ctx.stroke();
        }

        ctx.restore();
    }
}

function _isMeleeClass(heroClass, stance) {
    if (heroClass === 'Warrior' || heroClass === 'Tank-Viking') return true;
    if (heroClass === 'Hybrid') return stance !== 'RANGED';
    return false;
}

function _arcConfig(heroClass, stance) {
    switch (heroClass) {
        case 'Warrior':
            return { startAngle: -0.9, endAngle: 0.9, radius: 52, lineWidth: 5, color: '#c9a227', alpha: 0.85, offset: 0, glow: true };
        case 'Tank-Viking':
            return { startAngle: -1.1, endAngle: 1.1, radius: 48, lineWidth: 7, color: '#7a8a9a', alpha: 0.75, offset: 0, glow: false };
        case 'Hybrid':
            if (stance === 'RANGED') {
                return { startAngle: -0.3, endAngle: 0.3, radius: 44, lineWidth: 3, color: '#8d6e63', alpha: 0.6, offset: 0.4, glow: false };
            }
            return { startAngle: -1.0, endAngle: 1.0, radius: 40, lineWidth: 4, color: '#9b27b0', alpha: 0.8, offset: 0, glow: true };
        default:
            return { startAngle: -0.5, endAngle: 0.5, radius: 36, lineWidth: 3, color: '#aaaaaa', alpha: 0.5, offset: 0, glow: false };
    }
}
