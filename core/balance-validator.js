// ============================================================
// core/balance-validator.js
// SELF-VALIDATING BALANCE CHECKER
//
// Kör invariant-checkar mot all balansdata och returnerar en rapport.
// Tänk "unit tests för game design" — om en siffra spränger ett band
// fångas det här innan det når spelarna.
//
// Användning (browser console):
//   import { runBalanceReport } from './core/balance-validator.js';
//   runBalanceReport();
//
// Användning (CI / Node):
//   node --input-type=module -e "
//     import('./core/balance-validator.js').then(m => m.runBalanceReport());
//   "
//
// Importerar: balance-config.js, data/hero-roster.js
// Importeras av: ingen (standalone — körs on-demand)
// ============================================================

import {
    RARITY_TABLE,
    SHOP_CATALOG,
    HERO_BASE_STATS,
    ABILITY_CONFIG,
    ECONOMY_CONFIG,
    CLASS_AFFINITIES,
    MAX_ITEM_SLOTS,
    computeBounty,
    damageReduction,
} from './balance-config.js';

import {
    HERO_ROSTER,
    STAT_MAX,
    getLevelUpGrowth,
} from '../data/hero-roster.js';

// ─── KONSTANTER ─────────────────────────────────────────────────────────────

// Multipliers för basic attacks — implementerade i core/abilities/basic-attack.js.
// Ability AoE/cone (Q/W/E) träffar creeps + bots via QueryEngine/damage-applier.js.
// TODO: flytta BASIC_ATTACK_MULT in i ABILITY_CONFIG.
const BASIC_ATTACK_MULT = {
    Warrior:      1.2,   // cfg.BASE_DAMAGE_MULTIPLIER
    'Tank-Viking':0.8,   // hårdkodad i processBasicAttack
    Mage:         1.0,   // ingen multiplikator
    Ranger:       1.1,   // hårdkodad
    Hybrid:       0.9,   // melee stance
};

const RARITY_ORDER = ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY'];

// DPS-band för game-unit scale (kalibrerat mot korrekt DPS efter balansfix)
const DPS_MIN = 40;
const DPS_MAX = 70;

// Per-klass mirror-TTK band (basic-only, level 1, game-unit scale)
// Tank tillåts längre — två tanks som basic-attackar varandra SKA ta lång tid.
const MIRROR_TTK_BOUNDS = {
    Warrior:      { min: 2, max: 5  },
    'Tank-Viking':{ min: 3, max: 9  },
    Mage:         { min: 2, max: 5  },
    Ranger:       { min: 2, max: 5  },
    Hybrid:       { min: 1.5, max: 5 }, // hög DPS skirmisher — snabba mirror-dueller är by design
};

// ─── BERÄKNINGS-HJÄLPARE ───────────────────────────────────────────────────

function basicDps(heroClass) {
    const stats = HERO_BASE_STATS[heroClass];
    const cfg   = ABILITY_CONFIG[heroClass];
    if (!stats || !cfg) return 0;
    const dmg      = stats.projectileDamage;
    const mult     = BASIC_ATTACK_MULT[heroClass] ?? 1.0;
    const intervalS = heroClass === 'Hybrid'
        ? cfg.ATTACK_SPEED_MELEE / 1000
        : cfg.ATTACK_SPEED / 1000;
    return (dmg * mult) / intervalS;
}

function mirrorTtk(heroClass) {
    const stats  = HERO_BASE_STATS[heroClass];
    const armor  = stats.baseArmor ?? 2;
    const dr     = damageReduction(armor);
    const dps    = basicDps(heroClass);
    const mitigatedDps = dps * (1 - dr);
    const netDps = Math.max(0.1, mitigatedDps);
    return stats.maxHp / netDps;
}

// ─── INVARIANT-CHECKAR ────────────────────────────────────────────────────

function checkRaritySum() {
    const sum = RARITY_TABLE.reduce((s, r) => s + r.dropRate, 0);
    return {
        check:  'Rarity dropRate summerar till 1.0',
        pass:   Math.abs(sum - 1) < 1e-6,
        detail: `summa = ${sum.toFixed(4)}`,
    };
}

function checkPowerGap() {
    const leg = RARITY_TABLE.find(r => r.rarity === 'LEGENDARY')?.powerCeiling ?? 0;
    const com = RARITY_TABLE.find(r => r.rarity === 'COMMON')?.powerCeiling ?? 0;
    const gap = leg - com;
    return {
        check:  'Power-gap legendary vs common ≤ 30% (anti-P2W)',
        pass:   gap <= 0.30 + 1e-9,
        detail: `gap = ${(gap*100).toFixed(1)}% (cap 30%)`,
    };
}

function checkPowerMonotonic() {
    let ok = true;
    let prev = -Infinity;
    for (const def of RARITY_TABLE) {
        if (def.powerCeiling < prev) ok = false;
        prev = def.powerCeiling;
    }
    return {
        check:  'powerCeiling stiger monotont med rarity',
        pass:   ok,
        detail: RARITY_TABLE.map(r => `${r.rarity}:${r.powerCeiling}`).join(' '),
    };
}

function checkBountyCap() {
    const huge = computeBounty(1000000);
    return {
        check:  'Kill-bounty cappas vid 240g',
        pass:   huge <= ECONOMY_CONFIG.killBountyCap,
        detail: `computeBounty(1M) = ${huge}g (cap ${ECONOMY_CONFIG.killBountyCap}g)`,
    };
}

function checkClassDps() {
    return Object.keys(HERO_BASE_STATS).map(cls => {
        const dps  = basicDps(cls);
        const pass = dps >= DPS_MIN && dps <= DPS_MAX;
        return {
            check:  `DPS i [${DPS_MIN}-${DPS_MAX}]: ${cls}`,
            pass,
            detail: `${dps.toFixed(1)} DPS`,
        };
    });
}

function checkMirrorTtk() {
    return Object.keys(MIRROR_TTK_BOUNDS).map(cls => {
        const ttk    = mirrorTtk(cls);
        const bounds = MIRROR_TTK_BOUNDS[cls];
        const pass   = ttk >= bounds.min && ttk <= bounds.max;
        return {
            check:  `Mirror-TTK [${bounds.min}-${bounds.max}s]: ${cls}`,
            pass,
            detail: `${ttk.toFixed(2)}s`,
        };
    });
}

function checkItemIds() {
    const ids    = SHOP_CATALOG.map(i => i.id);
    const unique = new Set(ids);
    return {
        check:  'Alla item-id är unika',
        pass:   unique.size === ids.length,
        detail: `${ids.length} items, ${unique.size} unika`,
    };
}

function checkArchetypeCoverage() {
    const found   = new Set(SHOP_CATALOG.map(i => i.archetype));
    const missing = ['offensive','defensive','utility'].filter(a => !found.has(a));
    return {
        check:  'Alla 3 arketyper finns i shoppen',
        pass:   missing.length === 0,
        detail: missing.length === 0 ? 'offensive / defensive / utility ✓' : `saknar: ${missing.join(', ')}`,
    };
}

function checkSlotRule() {
    return {
        check:  '3-slot-regeln intakt (MAX_ITEM_SLOTS === 3)',
        pass:   MAX_ITEM_SLOTS === 3,
        detail: `MAX_ITEM_SLOTS = ${MAX_ITEM_SLOTS}`,
    };
}

function checkHeroRoster() {
    const expected = ['warrior','ranger','tank','hybrid','mage'];
    const missing  = expected.filter(k => !HERO_ROSTER[k]);
    return {
        check:  'Alla 5 hjältenycklar finns i HERO_ROSTER',
        pass:   missing.length === 0,
        detail: missing.length === 0
            ? Object.keys(HERO_ROSTER).join(', ')
            : `saknar: ${missing.join(', ')}`,
    };
}

function checkStatMax() {
    const heroes = Object.values(HERO_ROSTER);
    const actualMaxHp  = Math.max(...heroes.map(h => h.maxHp));
    const actualMaxSpd = Math.max(...heroes.map(h => h.speed));
    const actualMaxAtk = Math.max(...heroes.map(h => h.projectileDamage));
    const ok = STAT_MAX.maxHp === actualMaxHp
            && STAT_MAX.speed === actualMaxSpd
            && STAT_MAX.projectileDamage === actualMaxAtk;
    return {
        check:  'STAT_MAX matchar faktiska max-värden i HERO_ROSTER',
        pass:   ok,
        detail: `STAT_MAX hp:${STAT_MAX.maxHp}/${actualMaxHp} spd:${STAT_MAX.speed}/${actualMaxSpd} atk:${STAT_MAX.projectileDamage}/${actualMaxAtk}`,
    };
}

function checkLevelGrowth() {
    const classes = Object.keys(HERO_BASE_STATS);
    const bad = classes.filter(cls => {
        const g = getLevelUpGrowth(cls);
        return g.hp <= 0 || g.damage <= 0 || g.speed <= 0;
    });
    return {
        check:  'Level-growth-värden är positiva för alla klasser',
        pass:   bad.length === 0,
        detail: bad.length === 0 ? 'ok' : `problem: ${bad.join(', ')}`,
    };
}

function checkClassAffinities() {
    const classes    = ['Warrior','Tank-Viking','Mage','Ranger','Hybrid'];
    const archetypes = ['offensive','defensive','utility'];
    const bad = [];
    for (const cls of classes) {
        for (const arch of archetypes) {
            const v = CLASS_AFFINITIES[cls]?.[arch];
            if (v === undefined) bad.push(`${cls}.${arch}`);
        }
    }
    return {
        check:  'CLASS_AFFINITIES täcker alla klass × arketyp-kombinationer',
        pass:   bad.length === 0,
        detail: bad.length === 0 ? '15/15 kombinationer OK' : `saknar: ${bad.join(', ')}`,
    };
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export function runBalanceChecks() {
    return [
        checkRaritySum(),
        checkPowerGap(),
        checkPowerMonotonic(),
        checkBountyCap(),
        ...checkClassDps(),
        ...checkMirrorTtk(),
        checkItemIds(),
        checkArchetypeCoverage(),
        checkSlotRule(),
        checkHeroRoster(),
        checkStatMax(),
        checkLevelGrowth(),
        checkClassAffinities(),
    ];
}

export function validateBalance() {
    const results = runBalanceChecks();
    const failed  = results.filter(r => !r.pass).length;
    return {
        passed:    results.length - failed,
        failed,
        total:     results.length,
        allPassed: failed === 0,
        results,
    };
}

/** Skriver rapporten till console. Returnerar true om alla checkar passerade. */
export function runBalanceReport() {
    const report = validateBalance();
    const SEP    = '─'.repeat(64);

    console.log(SEP);
    console.log(`⚔  BALANCE VALIDATOR — ${report.passed}/${report.total} passerade`);
    console.log(SEP);

    for (const r of report.results) {
        const icon   = r.pass ? '✓' : '✗';
        const prefix = r.pass ? '%c✓' : '%c✗';
        const style  = r.pass ? 'color:green' : 'color:red;font-weight:bold';
        console.log(`  ${prefix}  ${r.check}  →  ${r.detail}`, style);
    }

    console.log(SEP);
    if (report.allPassed) {
        console.log('%c✓ Alla balans-invarianter passerade.', 'color:green;font-weight:bold');
    } else {
        console.warn(`✗ ${report.failed} invariant(er) bröts — fixa innan release.`);
    }
    console.log(SEP);

    return report.allPassed;
}
