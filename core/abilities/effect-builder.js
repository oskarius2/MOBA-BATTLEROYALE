/**
 * @file effect-builder.js
 * Fluent API + EffectManager for renderable gameplay effects.
 */

export class EffectManager {
    constructor() {
        /** @type {Array<Object>} Same array exported as ActiveAbilityEffects */
        this.activeEffects = [];
    }

    addEffect(config) {
        const newEffect = Object.assign(
            { duration: 0, isFinished: false, isCompleted: false, internalTime: 0 },
            config
        );
        this.activeEffects.push(newEffect);
        return newEffect;
    }

    update(deltaTime, projectilesArray, creepsArray) {
        let i = this.activeEffects.length;
        while (i--) {
            const effect = this.activeEffects[i];
            effect.duration -= deltaTime;

            if (effect.internalTime !== undefined) {
                effect.internalTime += deltaTime;
            }

            if (effect.onTick && !effect.isFinished) {
                effect.onTick(deltaTime, projectilesArray, effect, creepsArray);
            }

            if (effect.duration <= 0 || effect.isCompleted) {
                if (effect.onComplete) {
                    effect.onComplete(deltaTime, projectilesArray, creepsArray);
                }
                this.activeEffects.splice(i, 1);
            }
        }
    }

    reset() {
        this.activeEffects.length = 0;
    }
}

export class EffectBuilder {
    constructor(effectManager) {
        this.effectManager = effectManager;
        this.config = {
            duration: 0,
            isFinished: false,
            isCompleted: false,
            internalTime: 0,
        };
    }

    type(typeString) { this.config.type = typeString; return this; }
    origin(x, y) { this.config.x = x; this.config.y = y; return this; }
    line(startX, startY, endX, endY, width) {
        this.config.startX = startX;
        this.config.startY = startY;
        this.config.endX = endX;
        this.config.endY = endY;
        this.config.width = width;
        return this;
    }
    cone(angle, spread, radius) {
        this.config.angle = angle;
        this.config.spread = spread;
        this.config.radius = radius;
        return this;
    }
    circle(radius, fill = true) {
        this.config.radius = radius;
        this.config.fill = fill;
        return this;
    }
    duration(seconds) { this.config.duration = seconds; return this; }
    color(colorString) { this.config.color = colorString; return this; }
    onTick(callback) { this.config.onTick = callback; return this; }
    onComplete(callback) { this.config.onComplete = callback; return this; }
    withCustomProp(key, value) { this.config[key] = value; return this; }

    build() {
        return this.effectManager.addEffect(this.config);
    }
}
