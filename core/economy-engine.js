// ============================================================
// core/economy-engine.js
// ECONOMY & LOOT ENGINE — v2
//
// Vad som ändrades (2025-06):
//   ✓ Importerar siffror från balance-config.js (single source of truth)
//   ✓ rollDrop()          — ny pity (dryKills-threshold, ej luckDebt-float)
//   ✓ calculateItemCost() — ny arketyp-system (offensive/defensive/utility)
//                           med bakåtkompatibel mapping för gamla kategorier
//   ✓ computePlayerKillBounty() — ny PvP-bounty med absolut cap (240g)
//   ✓ MOB_TIER_CONFIG     — gold-värden uppdaterade till manifesto-värden
//
// Vad som BEHÅLLS OFÖRÄNDRAT (bakåtkompatibilitet mot index.html):
//   ✓ playerLootState     — luckDebt och consecutiveDryRuns kvar (index.html
//                           nollställer dem i initializeGame; dryKills tillagt)
//   ✓ calculateFarmGold() — identisk formel, signatur oförändrad
//   ✓ calculateBounty()   — behålls; används för creep gold i grantKillRewards,
//                           INTE för PvP (se computePlayerKillBounty nedan)
//   ✓ getMobTierConfig()  — oförändrad
//   ✓ resolveMobGold()    — oförändrad
//   ✓ resolveMobBounty()  — oförändrad
// ============================================================

import {
    DROP_TABLES,
    RARITY_TABLE,
    ECONOMY_CONFIG,
    CLASS_AFFINITIES,
    rollRarity,
    computeBounty,
} from './balance-config.js';

// ─── PITY STATE ─────────────────────────────────────────────────────────────
//
// Exporteras för att index.html ska kunna nollställa vid ny match.
// luckDebt och consecutiveDryRuns behålls för bakåtkompatibilitet med
// initializeGame() i index.html — de används INTE längre av rollDrop().
// dryKills är det nya systemet (threshold-baserat, server-auditerbart).

export const playerLootState = {
    dryKills:           0,   // ny — räknas upp vid varje miss utan Rare+
    luckDebt:           0,   // gammal, kvar för compat (resettas av index.html)
    consecutiveDryRuns: 0,   // gammal, kvar för compat (resettas av index.html)
};

// ─── MOB TIER CONFIG ─────────────────────────────────────────────────────────
//
// baseGold uppdaterat till manifesto-värden (goldMin från DROP_TABLES).
// Notera: grantKillRewards i index.html skickar mob.goldReward från CREEP_TYPES —
// de värdena (5/10/30) körs via resolveMobGold och overrider baseGold.
// baseGold är fallback-värde för okända mob-typer.

export const MOB_TIER_CONFIG = {
    Scout: {
        tier:           'COMMON',
        rareChance:      0.02,
        luckDebtOnMiss:  0.25,
        baseGold:           22,   // var 5 — uppdaterat till manifesto (goldMin)
        baseBounty:         30,
    },
    Warrior: {
        tier:           'STANDARD',
        rareChance:      0.08,
        luckDebtOnMiss:  0.50,
        baseGold:           28,   // var 10
        baseBounty:         60,
    },
    'Ancient Boss': {
        tier:           'LEGENDARY',
        rareChance:      0.35,
        luckDebtOnMiss:  0.50,
        baseGold:          120,   // var 30
        baseBounty:        200,
    },
};

const DEFAULT_TIER_CONFIG = MOB_TIER_CONFIG.Warrior;

// ─── TIER-HJÄLPARE (oförändrade) ─────────────────────────────────────────────

export function getMobTierConfig(mob) {
    if (!mob) return DEFAULT_TIER_CONFIG;
    if (mob.name && MOB_TIER_CONFIG[mob.name]) return MOB_TIER_CONFIG[mob.name];
    if (mob.tier) {
        const byTier = Object.values(MOB_TIER_CONFIG)
            .find(cfg => cfg.tier === mob.tier);
        if (byTier) return byTier;
    }
    return DEFAULT_TIER_CONFIG;
}

export function resolveMobGold(mob, fallbackGold = 5) {
    if (!mob) return fallbackGold;
    const cfg = getMobTierConfig(mob);
    return mob.goldReward ?? cfg.baseGold ?? fallbackGold;
}

export function resolveMobBounty(mob, fallbackBounty = 100) {
    if (!mob) return fallbackBounty;
    const cfg = getMobTierConfig(mob);
    return mob.bounty ?? cfg.baseBounty ?? fallbackBounty;
}

// ─── LOOT POOL (ground drops per rarity) ────────────────────────────────────
//
// Dessa är loot-items som droppas på marken när creeps dör.
// INTE samma som SHOP_CATALOG (köpbara artifacts).
// mapPresence: true → LEGENDARY items syns på minimap (anti-P2W-mekanism).

const GROUND_LOOT_POOL = {
    COMMON: [
        { type: 'COMMON', name: 'Scrap Metal',      power: 1.00, mapPresence: false },
        { type: 'COMMON', name: 'Crude Vial',        power: 1.00, mapPresence: false },
    ],
    UNCOMMON: [
        { type: 'UNCOMMON', name: 'Polished Salvage', power: 1.10, mapPresence: false },
        { type: 'UNCOMMON', name: 'Runic Shard',       power: 1.10, mapPresence: false },
    ],
    RARE: [
        { type: 'RARE', name: 'Venom Coating',        power: 1.20, mapPresence: false },
        { type: 'RARE', name: 'Critblade Fragment',    power: 1.20, mapPresence: false },
        { type: 'RARE', name: 'Thornweave Scrap',      power: 1.20, mapPresence: false },
    ],
    EPIC: [
        { type: 'PURPLE', name: 'Spellfury Core',      power: 1.28, mapPresence: false },
        { type: 'PURPLE', name: 'Null-Rune Ward',       power: 1.28, mapPresence: false },
        { type: 'PURPLE', name: 'Stormwall Fragment',   power: 1.28, mapPresence: false },
    ],
    LEGENDARY: [
        { type: 'GOLD', name: 'Legendary Relic',       power: 1.30, mapPresence: true  },
        { type: 'GOLD', name: 'Blightbreaker Seal',     power: 1.30, mapPresence: true  },
    ],
};

function pickFromPool(pool) {
    return { ...pool[Math.floor(Math.random() * pool.length)] };
}

// ─── 1. PITY POOL DROPS (ny implementation) ──────────────────────────────────
//
// Signatur identisk med gamla rollDrop() — index.html ändras ej.
//
// Ändringar vs gamla systemet:
//   GAMMALT: luckDebt (float) adderades per miss, justerade rareChance direkt.
//            Problem: obegränsad debt-ackumulering, ingen garanterad övre gräns.
//   NYTT:    dryKills (räknare). Vid tröskelvärden (8/18/35) tvingas rätt tier fram.
//            Deterministiskt, server-auditerbart, ingen ackumuleringsbugg.
//
// @param {{ dryKills, luckDebt, consecutiveDryRuns }} playerState
// @param {{ name, goldReward }} mob

export function rollDrop(playerState, mob) {
    // Säkerställ att nya fältet finns (backward compat om state skapats gammaldags)
    if (playerState.dryKills === undefined) playerState.dryKills = 0;

    const dropTable = DROP_TABLES[mob?.name] ?? DROP_TABLES.Warrior;

    // Kolla om ett item ska droppas alls för denna mob
    if (Math.random() >= dropTable.itemDropChance) {
        // Ingen item-drop — räkna upp dry runs men returnera common ändå
        // (samma beteende som gamla systemet: alltid returnera något)
        playerState.dryKills += 1;
        playerState.consecutiveDryRuns += 1; // compat
        return pickFromPool(GROUND_LOOT_POOL.COMMON);
    }

    // Rulla rarity med pity
    const { rarity, viaPity } = rollRarity(playerState);

    // Nollställ även gamla fält vid succé (backward compat)
    if (viaPity || ['RARE', 'EPIC', 'LEGENDARY'].includes(rarity)) {
        playerState.luckDebt          = 0;
        playerState.consecutiveDryRuns = 0;
    } else {
        playerState.luckDebt          += 0.25;
        playerState.consecutiveDryRuns += 1;
    }

    const pool = GROUND_LOOT_POOL[rarity] ?? GROUND_LOOT_POOL.COMMON;
    return pickFromPool(pool);
}

// ─── 2. FARM GOLD MED DIMINISHING RETURNS (oförändrad) ───────────────────────
//
// Formeln är identisk med computeFarmGold() i balance-config.js.
// Behålls här med samma signatur för bakåtkompatibilitet (index.html
// kallar calculateFarmGold med 4 argument, inklusive mob-payload).

export function calculateFarmGold(baseGold, totalFarmed, averageGoldAtTime, mob = null) {
    const effectiveBase = mob ? resolveMobGold(mob, baseGold) : baseGold;
    const softCap = averageGoldAtTime * 0.6;
    if (totalFarmed < softCap) return effectiveBase;
    const excess = totalFarmed - softCap;
    return effectiveBase * (1 / (1 + excess / 1000));
}

// ─── 3. BOUNTY-SYSTEM ────────────────────────────────────────────────────────
//
// calculateBounty() — BEHÅLLS med samma signatur.
//   Används i grantKillRewards (index.html) som dynamisk creep-goldmultiplikator.
//   INTE för PvP (missvisande namn — cleanas upp när vi når index.html).
//
// computePlayerKillBounty() — NY, korrekt PvP-bounty med absolut cap.
//   Signatur: (targetTotalGold, { marked? }) → gold
//   Använd denna när multiplayer PvP-kills implementeras.

export function calculateBounty(killerGold, victimGold, baseBounty = 100, mob = null) {
    const effectiveBase = mob ? resolveMobBounty(mob, baseBounty) : baseBounty;
    if (victimGold >= killerGold * 2)   return effectiveBase * 1.35;
    if (victimGold <= killerGold * 0.5) return effectiveBase * 0.80;
    return effectiveBase;
}

/**
 * PvP kill-bounty med anti-inflation cap (manifesto-korrekt).
 *   bounty = min(base + targetGold × 0.08, 240)
 *   Marked-spelare (+30% bounty) aktiveras efter 3+ kills.
 *
 * @param {number} targetTotalGold  – offrets totalt farmade gold
 * @param {{ marked?: boolean }} opts
 */
export function computePlayerKillBounty(targetTotalGold, opts = {}) {
    return computeBounty(targetTotalGold, opts);
}

// ─── 4. CLASS AFFINITY — ny arketyp-baserad ──────────────────────────────────
//
// calculateItemCost() — signatur BEHÅLLS (3 arg: baseCost, category, className).
//   Bakåtkompatibel: stöder både gamla kategorinamn (heavy_armor, ranged_weapon,
//   spell_scroll) och nya arketyper (offensive, defensive, utility).
//   Gamla SHOP_CATALOG (3 items) fortsätter fungera under övergången.
//   Nya SHOP_CATALOG (15 items från balance-config) använder redan arketyper.

const LEGACY_CATEGORY_MAP = {
    heavy_armor:    'defensive',
    ranged_weapon:  'offensive',
    spell_scroll:   'utility',
};

export function calculateItemCost(baseCost, categoryOrArchetype, className) {
    // Översätt gammalt kategorinamn → ny arketyp om nödvändigt
    const archetype = LEGACY_CATEGORY_MAP[categoryOrArchetype] ?? categoryOrArchetype;

    const affinity = CLASS_AFFINITIES[className];
    if (affinity && affinity[archetype] != null) {
        return Math.round(baseCost * affinity[archetype]);
    }
    return baseCost;
}
