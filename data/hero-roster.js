// ============================================================
// data/hero-roster.js
// HERO ROSTER — klassdefinitioner för alla 5 hjältar.
//
// Extraherat ur index.html (var inline i <script type="module">).
// Importeras av index.html:
//   import { HERO_ROSTER, STAT_MAX, getLevelUpGrowth } from './data/hero-roster.js';
//
// Vad som ändrades vs gamla inline-definitionen:
//   ✓ Tank-Viking maxHp:            180 → 160  (proportionskorrigering)
//   ✓ Tank-Viking projectileDamage:  14 →  50  (var 14 DPS, ska vara ~50 DPS)
//   ✓ Mage        projectileDamage:  24 →  19  (var 60 DPS, ska vara ~48 DPS)
//   ✓ Ranger      projectileDamage:  18 →  16  (var 56 DPS, ska vara ~50 DPS)
//   ✓ Hybrid      projectileDamage:  20 →  35  (var 36 DPS, ska vara ~63 DPS)
//   ✓ STAT_MAX uppdaterad (Tank är nu högst på attack)
//   ✓ levelGrowth tillagt per hjälte (används av Player.levelUp() i index.html)
//
// Oförändrat: classKey, role, title, speed, radius, skills — index.html påverkas ej.
// ============================================================

import {
    HERO_BASE_STATS,
    HERO_LEVEL_GROWTH,
} from '../core/balance-config.js';

// ─── HERO ROSTER ────────────────────────────────────────────────────────────
//
// Shape matchar exakt vad applyHeroConfig() och initHeroSelectMenu() förväntar sig.
// Ny property `levelGrowth` ignoreras av befintlig kod men används av
// den uppdaterade Player.levelUp() (implementeras i index.html-steget).

export const HERO_ROSTER = {
    warrior: {
        classKey:         'Warrior',
        role:             'Warrior',
        title:            'Bladed Duelist',
        maxHp:             HERO_BASE_STATS.Warrior.maxHp,            // 130
        speed:             HERO_BASE_STATS.Warrior.speed,             // 3.6
        projectileDamage:  HERO_BASE_STATS.Warrior.projectileDamage,  //  26
        radius:            HERO_BASE_STATS.Warrior.radius,            //  26
        levelGrowth:       HERO_LEVEL_GROWTH.Warrior,
        skills: {
            skill1: 'Dash Strike',
            skill2: 'Blade Whirl',
            ult:    'Bladestorm',
        },
    },

    ranger: {
        classKey:         'Ranger',
        role:             'Ranger',
        title:            'Swift Archer',
        maxHp:             HERO_BASE_STATS.Ranger.maxHp,              // 100
        speed:             HERO_BASE_STATS.Ranger.speed,              //   4.2
        projectileDamage:  HERO_BASE_STATS.Ranger.projectileDamage,   //  16  (var 18)
        radius:            HERO_BASE_STATS.Ranger.radius,             //  24
        levelGrowth:       HERO_LEVEL_GROWTH.Ranger,
        skills: {
            skill1: 'Volley',
            skill2: 'Tumble',
            ult:    'Arrow Rain',
        },
    },

    tank: {
        classKey:         'Tank-Viking',
        role:             'Tank-Viking',
        title:            'Nord Vanguard',
        maxHp:             HERO_BASE_STATS['Tank-Viking'].maxHp,             // 160  (var 180)
        speed:             HERO_BASE_STATS['Tank-Viking'].speed,              //   3.0
        projectileDamage:  HERO_BASE_STATS['Tank-Viking'].projectileDamage,   //  50  (var 14)
        radius:            HERO_BASE_STATS['Tank-Viking'].radius,             //  28
        shieldHp:          HERO_BASE_STATS['Tank-Viking'].shieldHp,           //  20  (nytt)
        levelGrowth:       HERO_LEVEL_GROWTH['Tank-Viking'],
        skills: {
            skill1: 'Ground Slam',
            skill2: 'Iron Shield',
            ult:    "Valhalla's Call",
        },
    },

    hybrid: {
        classKey:         'Hybrid',
        role:             'Hybrid',
        title:            'Shapeshifter',
        maxHp:             HERO_BASE_STATS.Hybrid.maxHp,              // 110
        speed:             HERO_BASE_STATS.Hybrid.speed,               //   4.0
        projectileDamage:  HERO_BASE_STATS.Hybrid.projectileDamage,    //  35  (var 20)
        radius:            HERO_BASE_STATS.Hybrid.radius,              //  25
        levelGrowth:       HERO_LEVEL_GROWTH.Hybrid,
        skills: {
            skill1: 'Stance Swap',
            skill2: 'Shadow Dash',
            ult:    'Equilibrium',
        },
    },

    mage: {
        classKey:         'Mage',
        role:             'Mage',
        title:            'Pyromancer',
        maxHp:             HERO_BASE_STATS.Mage.maxHp,                //  95  (var 90)
        speed:             HERO_BASE_STATS.Mage.speed,                 //   3.8
        projectileDamage:  HERO_BASE_STATS.Mage.projectileDamage,      //  19  (var 24)
        radius:            HERO_BASE_STATS.Mage.radius,                //  23
        levelGrowth:       HERO_LEVEL_GROWTH.Mage,
        skills: {
            skill1: 'Fireball',
            skill2: 'Flame Dash',
            ult:    'Meteor Strike',
        },
    },
};

// ─── STAT_MAX ────────────────────────────────────────────────────────────────
//
// Används av menu-interface.js för att skala stat-barer i hero-select UI.
// Ska alltid vara det HÖGSTA värdet i HERO_ROSTER för respektive stat.
//
// Ny kalibrering:
//   maxHp:            160  Tank-Viking   (var 180)
//   speed:            4.2  Ranger        (oförändrat)
//   projectileDamage:  50  Tank-Viking   (var 26 Warrior)
//
// OBS: menu-interface.js har en lokalt definierad STAT_MAX (rad 654).
// Den ersätts med import från denna fil i menu-interface-steget.

export const STAT_MAX = {
    maxHp:            160,
    speed:            4.2,
    projectileDamage:  50,
};

// ─── LEVEL-UP HELPER ─────────────────────────────────────────────────────────
//
// Ersätter den platta `this.maxHp += 25` i Player.levelUp() (index.html).
// Returnerar klassspecifik tillväxt per level för den aktiva hjälten.
//
// Användning i Player.levelUp() (index.html-steget):
//   const growth = getLevelUpGrowth(this.heroClass);
//   this.maxHp            += growth.hp;
//   this.projectileDamage  += growth.damage;
//   this.baseSpeed         += growth.speed;

export function getLevelUpGrowth(heroClass) {
    return HERO_LEVEL_GROWTH[heroClass] ?? { hp: 20, damage: 2.0, speed: 0.30 };
}

// ─── UTILITY ──────────────────────────────────────────────────────────────────

/** Returnerar hero-definition. Kastar om nyckeln är okänd. */
export function getHero(heroKey) {
    const hero = HERO_ROSTER[heroKey];
    if (!hero) {
        throw new Error(
            `Okänd heroKey: "${heroKey}". Giltiga: ${Object.keys(HERO_ROSTER).join(', ')}`
        );
    }
    return hero;
}
