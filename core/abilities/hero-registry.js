/**
 * @file hero-registry.js
 * Maps heroes to their command instances.
 */

import { WarriorQCommand, WarriorWCommand, WarriorECommand } from './heroes/warrior.js';
import { RangerQCommand, RangerWCommand, RangerECommand } from './heroes/ranger.js';
import { TankVikingQCommand, TankVikingWCommand, TankVikingECommand } from './heroes/tank-viking.js';
import { HybridQCommand, HybridWCommand, HybridECommand } from './heroes/hybrid.js';
import { MageQCommand, MageWCommand, MageECommand } from './heroes/mage.js';

export const HeroRegistry = {
    Warrior: {
        q: new WarriorQCommand(),
        w: new WarriorWCommand(),
        e: new WarriorECommand(),
    },
    Ranger: {
        q: new RangerQCommand(),
        w: new RangerWCommand(),
        e: new RangerECommand(),
    },
    'Tank-Viking': {
        q: new TankVikingQCommand(),
        w: new TankVikingWCommand(),
        e: new TankVikingECommand(),
    },
    Hybrid: {
        q: new HybridQCommand(),
        w: new HybridWCommand(),
        e: new HybridECommand(),
    },
    Mage: {
        q: new MageQCommand(),
        w: new MageWCommand(),
        e: new MageECommand(),
    },
};
