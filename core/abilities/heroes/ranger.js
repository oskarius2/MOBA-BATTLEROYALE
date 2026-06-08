import { AbilityCommand } from '../command-base.js';
import { EffectBuilder } from '../effect-builder.js';
import { playerDamage } from '../utils.js';

export class RangerQCommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const angle = this._getAimAngle(player, pointerWorld);
        const arrowCount = 5;
        const step = config.VOLLEY_ARROW_SPREAD / (arrowCount - 1);
        const startOffset = -config.VOLLEY_ARROW_SPREAD / 2;

        for (let i = 0; i < arrowCount; i++) {
            const a = angle + startOffset + step * i;
            context.projectileFactory.createLinear(
                player.x,
                player.y,
                player.x + Math.cos(a) * 100,
                player.y + Math.sin(a) * 100,
                playerDamage(player) * 0.7,
                '#4CAF50',
                4
            );
        }
        return true;
    }
}

export class RangerWCommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const startX = player.x;
        const startY = player.y;
        const angle = this._getAimAngle(player, pointerWorld);
        const end = this._movePlayerByVector(player, config.TUMBLE_DISTANCE, angle);

        new EffectBuilder(context.effectManager)
            .type('line')
            .origin(startX, startY)
            .line(startX, startY, end.x, end.y, 8)
            .duration(0.15)
            .color('rgba(76, 175, 80, 0.5)')
            .build();

        return true;
    }
}

export class RangerECommand extends AbilityCommand {
    execute(player, pointerWorld, context, config) {
        const ptr = this._normalizePointer(pointerWorld);
        const tx = this._clampMapCoord(ptr.worldX);
        const ty = this._clampMapCoord(ptr.worldY);
        const arrowDamage = playerDamage(player) * config.ARROW_RAIN_DAMAGE_MULT;
        const projectileFactory = context.projectileFactory;

        new EffectBuilder(context.effectManager)
            .type('circle')
            .origin(tx, ty)
            .circle(100, true)
            .duration(config.ARROW_RAIN_DURATION)
            .color('rgba(76, 175, 80, 0.15)')
            .withCustomProp('spawnAccumulator', 0)
            .onTick((deltaTime, outProjectiles, effect) => {
                effect.spawnAccumulator += deltaTime;
                const spawnInterval = 1 / 3;
                while (effect.spawnAccumulator >= spawnInterval) {
                    effect.spawnAccumulator -= spawnInterval;
                    const arrowsThisTick = 2 + Math.floor(Math.random() * 2);
                    for (let k = 0; k < arrowsThisTick; k++) {
                        projectileFactory.createPositional(
                            tx + (Math.random() - 0.5) * 160,
                            ty + (Math.random() - 0.5) * 160,
                            0,
                            2,
                            arrowDamage,
                            '#81C784',
                            2,
                            Math.ceil(0.3 * 60),
                            0.3
                        );
                    }
                }
            })
            .build();

        return true;
    }
}
