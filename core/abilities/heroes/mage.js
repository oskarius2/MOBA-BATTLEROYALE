import { AbilityCommand } from '../command-base.js';
import { EffectBuilder } from '../effect-builder.js';
import { applyCircleDamage } from '../damage-applier.js';
import { playerDamage } from '../utils.js';

export class MageQCommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const ptr = this._normalizePointer(pointerWorld);
        context.projectileFactory.createLinear(
            player.x,
            player.y,
            ptr.worldX,
            ptr.worldY,
            playerDamage(player) * config.BURST_DAMAGE_MULTIPLIER,
            '#FF4500',
            config.FIREBALL_RADIUS
        );
        return true;
    }
}

export class MageWCommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const startX = player.x;
        const startY = player.y;
        const angle = this._getAimAngle(player, pointerWorld);
        const end = this._movePlayerByVector(player, config.FLAME_DASH_DISTANCE, angle);
        const burnDamage = playerDamage(player) * config.BURNING_DAMAGE_MULT;

        for (let j = 0; j < 3; j++) {
            const circleX = startX + Math.cos(angle) * (j * 40);
            const circleY = startY + Math.sin(angle) * (j * 40);

            new EffectBuilder(context.effectManager)
                .type('circle')
                .origin(circleX, circleY)
                .circle(config.BURNING_CIRCLE_RADIUS, true)
                .duration(config.BURNING_CIRCLE_DURATION)
                .color('rgba(255, 69, 0, 0.3)')
                .build();

            applyCircleDamage(
                context.queryEngine,
                circleX,
                circleY,
                config.BURNING_CIRCLE_RADIUS,
                burnDamage
            );
        }

        new EffectBuilder(context.effectManager)
            .type('line')
            .origin(startX, startY)
            .line(startX, startY, end.x, end.y, 12)
            .duration(0.15)
            .color('rgba(255, 69, 0, 0.5)')
            .build();

        return true;
    }
}

export class MageECommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const ptr = this._normalizePointer(pointerWorld);
        const tx = this._clampMapCoord(ptr.worldX);
        const ty = this._clampMapCoord(ptr.worldY);
        const explosionDamage = playerDamage(player) * config.BURST_DAMAGE_MULTIPLIER;
        const queryEngine = context.queryEngine;
        const effectManager = context.effectManager;

        new EffectBuilder(effectManager)
            .type('circle')
            .origin(tx, ty)
            .circle(25, true)
            .duration(config.METEOR_DELAY)
            .color('rgba(255, 80, 0, 0.4)')
            .onComplete(() => {
                new EffectBuilder(effectManager)
                    .type('circle')
                    .origin(tx, ty)
                    .circle(config.METEOR_EXPLOSION_RADIUS, true)
                    .duration(0.4)
                    .color('rgba(230, 30, 0, 0.7)')
                    .build();

                applyCircleDamage(
                    queryEngine,
                    tx,
                    ty,
                    config.METEOR_EXPLOSION_RADIUS,
                    explosionDamage
                );
            })
            .build();

        return true;
    }
}
