import { AbilityCommand } from '../command-base.js';
import { EffectBuilder } from '../effect-builder.js';
import { applyCircleDamage } from '../damage-applier.js';
import { getTerrainType } from '../terrain.js';
import { playerDamage } from '../utils.js';

export class WarriorQCommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const startX = player.x;
        const startY = player.y;
        const ptr = this._normalizePointer(pointerWorld);
        const angle = this._getAimAngle(player, ptr);
        const pointerDist = Math.hypot(ptr.worldX - startX, ptr.worldY - startY);
        const dashDist = Math.min(config.DASH_STRIKE_DISTANCE, pointerDist || config.DASH_STRIKE_DISTANCE);
        const end = this._movePlayerByVector(player, dashDist, angle);

        if (getTerrainType(player.x, player.y) === 'WATER') {
            for (let i = 0; i < 20; i++) {
                context.particles.addParticle(
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

        new EffectBuilder(context.effectManager)
            .type('line')
            .origin(startX, startY)
            .line(startX, startY, end.x, end.y, 20)
            .duration(0.15)
            .color('rgba(255, 140, 0, 0.6)')
            .build();

        applyCircleDamage(
            context.queryEngine,
            end.x,
            end.y,
            40,
            playerDamage(player) * config.BASE_DAMAGE_MULTIPLIER
        );
        return true;
    }
}

export class WarriorWCommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const damage = playerDamage(player) * config.BASE_DAMAGE_MULTIPLIER;

        new EffectBuilder(context.effectManager)
            .type('circle')
            .origin(player.x, player.y)
            .circle(config.BLADE_WHIRL_RADIUS, true)
            .duration(0.2)
            .color('rgba(255, 69, 0, 0.4)')
            .build();

        applyCircleDamage(
            context.queryEngine,
            player.x,
            player.y,
            config.BLADE_WHIRL_RADIUS,
            damage
        );
        return true;
    }
}

export class WarriorECommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const tickDamage = playerDamage(player) * config.BASE_DAMAGE_MULTIPLIER * 0.5;
        const maxRadius = config.SWEEP_COUNT * 25 + 5;
        const queryEngine = context.queryEngine;

        new EffectBuilder(context.effectManager)
            .type('bladestorm')
            .origin(player.x, player.y)
            .duration(config.BLADESTORM_DURATION)
            .color('rgba(255, 165, 0, 0.4)')
            .withCustomProp('sweepCount', config.SWEEP_COUNT)
            .withCustomProp('damageTimer', 0)
            .onTick((deltaTime, projectilesOut, effect) => {
                this._syncEffectToPlayer(effect, player);
                effect.damageTimer += deltaTime;
                if (effect.damageTimer >= 0.3) {
                    effect.damageTimer = 0;
                    applyCircleDamage(queryEngine, player.x, player.y, maxRadius, tickDamage);
                }
            })
            .build();

        return true;
    }
}
