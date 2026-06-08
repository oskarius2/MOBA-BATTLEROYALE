/**
 * core/ability-engine.js
 * Thin facade — re-exports from core/abilities/ for stable import paths.
 */

export { default } from './abilities/index.js';
export {
    ABILITY_CONFIG,
    CooldownState,
    ActiveAbilityEffects,
    GlobalParticles,
    resetAbilityState,
    getTerrainType,
    playerDamage,
} from './abilities/index.js';
