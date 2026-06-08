/**
 * @file basic-attack.js
 * Player basic weapon swings and projectile spawns.
 */

import { ABILITY_CONFIG } from '../balance-config.js';
import { triggerWeaponSwing } from '../rendering/weapon-arc-renderer.js';
import { Bots } from '../bot-manager.js';
import { normalizePointer, playerDamage } from './utils.js';
import { QueryEngine } from './query-engine.js';
import { ProjectileFactory } from './projectile-factory.js';

export function processBasicAttack(player, pointerWorld, projectilesArray, creepsArray, botsArray = Bots) {
    if (player.attackTimer > 0) return false;

    const heroClass = player.heroClass;
    const cfg = ABILITY_CONFIG[heroClass];
    if (!cfg) return false;

    const ptr = normalizePointer(pointerWorld);
    const angle = Math.atan2(ptr.worldY - player.y, ptr.worldX - player.x);

    const attackCdSec = (heroClass === 'Hybrid'
        ? (player.stance === 'MELEE' ? cfg.ATTACK_SPEED_MELEE : cfg.ATTACK_SPEED_RANGED)
        : cfg.ATTACK_SPEED) / 1000;
    player.attackTimer = attackCdSec;
    triggerWeaponSwing(player, Math.min(attackCdSec, 0.35));

    const queryEngine = new QueryEngine(creepsArray, botsArray);
    const projectileFactory = new ProjectileFactory(projectilesArray);

    if (heroClass === 'Warrior') {
        const halfSpread = (Math.PI / 4) / 2;
        const dmg = playerDamage(player) * cfg.BASE_DAMAGE_MULTIPLIER;
        queryEngine.forEachMeleeTarget(player, angle, cfg.ATTACK_RANGE, halfSpread, (t) => t.takeDamage(dmg));
    } else if (heroClass === 'Tank-Viking') {
        const closest = queryEngine.findClosestTarget(player, cfg.ATTACK_RANGE);
        if (closest) closest.takeDamage(playerDamage(player) * 0.8);
    } else if (heroClass === 'Mage') {
        projectileFactory.createBasicAttack(player, angle, 12, playerDamage(player), 5, '#FF9800', 'firebolt');
    } else if (heroClass === 'Ranger') {
        projectileFactory.createBasicAttack(
            player, angle, 16, playerDamage(player) * 1.1, 3, '#81C784', 'arrow'
        );
    } else if (heroClass === 'Hybrid') {
        const isMelee = player.stance === 'MELEE';
        if (isMelee) {
            const halfSpread = (Math.PI / 2) / 2;
            const dmg = playerDamage(player) * 0.9;
            queryEngine.forEachMeleeTarget(player, angle, cfg.ATTACK_RANGE_MELEE, halfSpread, (t) => t.takeDamage(dmg));
        } else {
            projectileFactory.createBasicAttack(
                player, angle, 13, playerDamage(player) * 0.9, 3, '#BA68C8', 'arrow'
            );
        }
    }

    return true;
}
