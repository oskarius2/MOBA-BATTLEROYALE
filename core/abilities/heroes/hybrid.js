import { AbilityCommand } from '../command-base.js';
import { EffectBuilder } from '../effect-builder.js';
import { applyCircleDamage } from '../damage-applier.js';
import { playerDamage } from '../utils.js';

export class HybridQCommand extends AbilityCommand {
    execute(player) {
        player.stance = player.stance === 'MELEE' ? 'RANGED' : 'MELEE';
        return true;
    }
}

export class HybridWCommand extends AbilityCommand {
    execute(player, pointerWorld, context) {
        const oldX = player.x;
        const oldY = player.y;
        const ptr = this._normalizePointer(pointerWorld);
        this._teleportPlayer(player, this._clampMapCoord(ptr.worldX), this._clampMapCoord(ptr.worldY));

        new EffectBuilder(context.effectManager)
            .type('circle')
            .origin(oldX, oldY)
            .circle(25, true)
            .duration(2.0)
            .color('rgba(156, 39, 176, 0.4)')
            .build();

        return true;
    }
}

export class HybridECommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const radius = 60;
        const stanceBonus = player.stance === 'MELEE' ? config.MELEE_BONUS : config.RANGED_BONUS;
        const damage = playerDamage(player) + stanceBonus;

        new EffectBuilder(context.effectManager)
            .type('circle')
            .origin(player.x, player.y)
            .circle(radius, true)
            .duration(1.2)
            .color('rgba(156, 39, 176, 0.35)')
            .build();

        applyCircleDamage(context.queryEngine, player.x, player.y, radius, damage);
        return true;
    }
}
