/**
 * @file index.js
 * Command-based MOBA Ability System — core engine.
 */

import { ABILITY_CONFIG } from '../balance-config.js';
import { Bots } from '../bot-manager.js';
import { HeroRegistry } from './hero-registry.js';
import { CooldownManager } from './cooldown-manager.js';
import { EffectManager } from './effect-builder.js';
import { QueryEngine } from './query-engine.js';
import { ProjectileFactory, resetProjectileIdCounter } from './projectile-factory.js';
import { GlobalParticles } from './particles.js';
import { getTerrainType } from './terrain.js';
import { processBasicAttack } from './basic-attack.js';
import { getCooldownForSlot } from './utils.js';

export { ABILITY_CONFIG };
export { GlobalParticles };
export { getTerrainType };
export { playerDamage } from './utils.js';

/** HUD-facing cooldown object — synced every frame from CooldownManager */
export const CooldownState = { q: 0, w: 0, e: 0 };

const effectManager = new EffectManager();
const cooldownManager = new CooldownManager();

/** Same array reference game-loop renders */
export const ActiveAbilityEffects = effectManager.activeEffects;

const LOCAL_PLAYER_ID = 'player';

class AbilityEngineCore {
    update(deltaTime, projectilesArray, creepsArray) {
        GlobalParticles.update(deltaTime);
        cooldownManager.update(deltaTime);
        effectManager.update(deltaTime, projectilesArray, creepsArray);
        cooldownManager.syncToHudObject(CooldownState, LOCAL_PLAYER_ID);
    }

    cast(slot, player, pointerWorld, projectilesArray, creepsArray, botsArray = Bots) {
        const normalizedSlot = slot.toLowerCase();
        const pid = player.id || LOCAL_PLAYER_ID;

        if (!cooldownManager.isReady(pid, normalizedSlot)) return false;

        if (player.stance !== 'MELEE' && player.stance !== 'RANGED') {
            player.stance = 'MELEE';
        }

        const heroCommands = HeroRegistry[player.heroClass];
        if (!heroCommands || !heroCommands[normalizedSlot]) return false;

        const context = {
            queryEngine: new QueryEngine(creepsArray, botsArray),
            effectManager,
            projectileFactory: new ProjectileFactory(projectilesArray),
            particles: GlobalParticles,
        };

        const config = ABILITY_CONFIG[player.heroClass];
        const command = heroCommands[normalizedSlot];
        const success = command.execute(player, pointerWorld, context, config);

        if (success) {
            cooldownManager.setCooldown(pid, normalizedSlot, getCooldownForSlot(player.heroClass, normalizedSlot));
            cooldownManager.syncToHudObject(CooldownState, LOCAL_PLAYER_ID);
        }

        return success;
    }

    basicAttack(player, pointerWorld, projectilesArray, creepsArray, botsArray = Bots) {
        return processBasicAttack(player, pointerWorld, projectilesArray, creepsArray, botsArray);
    }
}

export function resetAbilityState() {
    CooldownState.q = 0;
    CooldownState.w = 0;
    CooldownState.e = 0;
    cooldownManager.reset();
    effectManager.reset();
    GlobalParticles.particles.length = 0;
    resetProjectileIdCounter();
}

const AbilityEngine = new AbilityEngineCore();
export default AbilityEngine;
