import { AbilityCommand } from '../command-base.js';
import { EffectBuilder } from '../effect-builder.js';
import { applyConeDamage } from '../damage-applier.js';
import { playerDamage } from '../utils.js';

export class TankVikingQCommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const angle = this._getAimAngle(player, pointerWorld);
        const damage = playerDamage(player) * config.GROUND_SLAM_DAMAGE_MULT;

        new EffectBuilder(context.effectManager)
            .type('cone')
            .origin(player.x, player.y)
            .cone(angle, config.GROUND_SLAM_CONE_ANGLE, config.GROUND_SLAM_LENGTH)
            .duration(0.3)
            .color('rgba(0, 150, 255, 0.4)')
            .build();

        applyConeDamage(
            context.queryEngine,
            player.x,
            player.y,
            angle,
            config.GROUND_SLAM_CONE_ANGLE,
            config.GROUND_SLAM_LENGTH,
            damage
        );
        return true;
    }
}

export class TankVikingWCommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        player.isShielded = true;

        new EffectBuilder(context.effectManager)
            .type('circle')
            .origin(player.x, player.y)
            .circle(50, false)
            .duration(config.SHIELD_DURATION)
            .color('rgba(33, 150, 243, 0.3)')
            .onTick((deltaTime, projectilesOut, effect) => {
                this._syncEffectToPlayer(effect, player);
            })
            .onComplete(() => {
                player.isShielded = false;
            })
            .build();

        return true;
    }
}

export class TankVikingECommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        if (player.baseSpeed === undefined) {
            player.baseSpeed = player.speed;
        }

        player.valhallaRefCount = (player.valhallaRefCount || 0) + 1;
        if (player.valhallaRefCount === 1) {
            player.valhallaActive = true;
            player.speed = player.baseSpeed * config.VALHALLA_BUFF_SPEED;
        }

        new EffectBuilder(context.effectManager)
            .type('circle')
            .origin(player.x, player.y)
            .circle(10, true)
            .duration(config.VALHALLA_DURATION)
            .color('rgba(33, 150, 243, 0.15)')
            .onTick((deltaTime, projectilesOut, effect) => {
                this._syncEffectToPlayer(effect, player);
                effect.radius += deltaTime * 80;
            })
            .onComplete(() => {
                player.valhallaRefCount = Math.max(0, (player.valhallaRefCount || 1) - 1);
                if (player.valhallaRefCount === 0) {
                    player.valhallaActive = false;
                    player.speed = player.baseSpeed;
                }
            })
            .build();

        return true;
    }
}
