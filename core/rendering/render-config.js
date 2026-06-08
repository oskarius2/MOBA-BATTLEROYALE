// Feature flag — auto-enabled when real PNG spritesheets load (not placeholders).
// Procedural drawHero* / drawCreepModel are the default visual path.
export let USE_SPRITE_RENDERING = false;

export function setSpriteRendering(enabled) {
    USE_SPRITE_RENDERING = !!enabled;
}

export const ANIM_FPS = 10;
export const STANCE_TRANSITION_MS = 300;
export const FACING_LERP = 0.15;
