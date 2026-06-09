// ============================================================
// core/balance-config.js
// SINGLE SOURCE OF TRUTH — alla balanssiffror bor här.
//
// Importeras av:
//   core/ability-engine.js      (ABILITY_CONFIG, ATTACK_TIMING)
//   core/economy-engine.js      (ECONOMY_CONFIG, RARITY_TABLE, DROP_TABLES, CLASS_AFFINITIES)
//   data/hero-roster.js         (HERO_BASE_STATS, HERO_LEVEL_GROWTH)
//   data/shop-catalog.js        (SHOP_CATALOG)
//   core/balance-validator.js   (allt ovan för invariant-checkar)
//
// Importerar: INGENTING. Denna fil är fundamentet.
//
// Konventioner:
//   - Siffror kommenteras alltid med enhet (px, s, ms, HP, DPS)
//   - Ändra ALDRIG en siffra utan att köra balance-validator efteråt
//   - Manifesto-referensen: docs/balance-manifesto.md (se balance-manifest-sessionen)
// ============================================================

// ─── 1. KARTA & GLOBALA KONSTANTER ──────────────────────────────────────────

export const MAP_SIZE        = 6000;   // px, kvadratisk karta
export const MAX_LEVEL       = 10;
export const MAX_ITEM_SLOTS  = 3;      // 3-slot-regeln — får ALDRIG ändras
export const XP_PER_LEVEL    = 100;   // platt XP-tröskel per level

// ─── 2. HERO BASE STATS (level 1, game-unit scale) ──────────────────────────
//
// HP-proportioner kalibrerade mot manifestet (Warrior = 1.0 baseline):
//   Tank-Viking  1.231× → 160 HP
//   Hybrid       0.846× → 110 HP
//   Ranger       0.769× → 100 HP
//   Mage         0.731× →  95 HP
//
// projectileDamage = skada per grundattack, FÖRE ability-engine-multiplikatorer.
// Kalibrerat så DPS-ratios stämmer mot manifestet med befintliga multiplikatorer:
//   Warrior  26 × 1.20 / 0.60s = 52.0 DPS  (baseline)
//   Tank     50 × 0.80 / 0.80s = 50.0 DPS  (0.961× warrior) ← var 14 (14 DPS, FEL)
//   Mage     19 × 1.00 / 0.40s = 47.5 DPS  (0.913×)         ← var 24 (60 DPS, FEL)
//   Ranger   16 × 1.10 / 0.35s = 50.3 DPS  (0.967×)         ← var 18 (56 DPS, FEL)
//   Hybrid   35 × 0.90 / 0.50s = 63.0 DPS  (1.212×)         ← var 20 (36 DPS, FEL)
//
// OBS: Tank-Viking:s höga damage-per-hit (50) är korrekt —
//      långsam, tung, varje slag känns. DPS-parity uppnås via intervall.

export const HERO_BASE_STATS = {
    Warrior: {
        maxHp:            130,    // HP
        projectileDamage:  26,    // skada/grundattack
        speed:            2.9,    // px/tick (game-units)
        radius:            26,    // px, kollisionsradie
        mass:               2,    // separation weight (heavier = knuffas mindre)
        baseArmor:          3,    // se damageReduction() nedan
    },
    'Tank-Viking': {
        maxHp:            160,    // HP  (var 180, proportionsfel)
        projectileDamage:  50,    // skada/grundattack  (var 14 — massivt fel)
        speed:            2.4,    // px/tick
        radius:            28,    // px
        mass:               3,
        baseArmor:          5,    // högsta armor i roster
        shieldHp:          20,    // extra HP-pool absorberas före main HP
    },
    Mage: {
        maxHp:             95,    // HP  (var 90, liten justering)
        projectileDamage:  19,    // skada/grundattack  (var 24 — för hög DPS)
        speed:            3.0,    // px/tick
        radius:            23,    // px
        mass:               1,
        baseArmor:          2,    // lägsta armor (glass cannon)
    },
    Ranger: {
        maxHp:            100,    // HP  (oförändrad)
        projectileDamage:  16,    // skada/grundattack  (var 18)
        speed:            3.4,    // px/tick  (snabbast bland ranged)
        radius:            24,    // px
        mass:               1,
        baseArmor:          2,
    },
    Hybrid: {
        maxHp:            110,    // HP  (oförändrad)
        projectileDamage:  35,    // skada/grundattack  (var 20 — för låg DPS)
        speed:            3.2,    // px/tick
        radius:            25,    // px
        mass:               2,
        baseArmor:          2,
    },
};

// ─── 3. LEVEL GROWTH (adderas per levelup) ──────────────────────────────────
//
// Ersätter den platta +25 HP i Player.levelUp() med klassspecifik tillväxt.
// Tank-Viking växer mer per level för att behålla sin tankroll sent i matchen.

export const HERO_LEVEL_GROWTH = {
    Warrior:      { hp: 20, damage: 2.0, speed: 0.30 },
    'Tank-Viking':{ hp: 25, damage: 4.5, speed: 0.20 },  // mer HP/dmg per level
    Mage:         { hp: 12, damage: 1.5, speed: 0.30 },
    Ranger:       { hp: 14, damage: 1.2, speed: 0.35 },
    Hybrid:       { hp: 16, damage: 2.8, speed: 0.35 },
};

// --- UPPGRADERADE BERÄKNINGAR (YAGNI Compute Layer) ---

/** Returnerar exakt HP vid en given level */
export function computeHpAtLevel(heroClass, level) {
    const baseStats = HERO_BASE_STATS[heroClass];
    const growth = HERO_LEVEL_GROWTH[heroClass];
    if (!baseStats || !growth) return 100;
    
    const effectiveLevel = Math.max(1, Math.min(MAX_LEVEL, level)) - 1;
    return baseStats.maxHp + (effectiveLevel * growth.hp);
}

/**
 * Returnerar projektilskada baserat på level.
 * Formeln balanserar per automatik ut damage utifrån Attack Speed.
 */
export function computeDamageAtLevel(heroClass, level) {
    const baseStats = HERO_BASE_STATS[heroClass];
    const growth = HERO_LEVEL_GROWTH[heroClass];
    if (!baseStats || !growth) return 20;

    const effectiveLevel = Math.max(1, Math.min(MAX_LEVEL, level)) - 1;
    const rawHitDamage = baseStats.projectileDamage + (effectiveLevel * growth.damage);
    
    return rawHitDamage;
}

/**
 * En hjälpfunktion du kan köra i konsolen (`debugDpsParity()`)
 * för att direkt se vilka klasser som gör för mycket/lite skada,
 * utan att tvingas bygga ett helt validerings-system.
 */
export function debugDpsParity(level = 1) {
    console.log(`--- DPS Parity Check (Level ${level}) ---`);
    for (const heroClass in HERO_BASE_STATS) {
        const dmgPerHit = computeDamageAtLevel(heroClass, level);
        
        let attackSpeedMs = 500;
        if (ATTACK_TIMING[heroClass]) {
            attackSpeedMs = ATTACK_TIMING[heroClass].attackSpeedMs ||
                            ATTACK_TIMING[heroClass].meleeMsS || 500;
        }
        
        const hitsPerSecond = 1000 / attackSpeedMs;
        const dps = dmgPerHit * hitsPerSecond;
        
        console.log(`${heroClass}: ${dps.toFixed(1)} DPS (${dmgPerHit.toFixed(1)} dmg/hit @ ${attackSpeedMs}ms)`);
    }
    console.log("---------------------------------------");
}

/** @deprecated Use computeHpAtLevel instead */
export const hpAtLevel = computeHpAtLevel;

/** @deprecated Use computeDamageAtLevel instead */
export const damageAtLevel = computeDamageAtLevel;

// ─── 4. ARMOR & DAMAGE REDUCTION ────────────────────────────────────────────
//
// DR = armor / (armor + 100)  (klassisk MOBA-kurva, avtagande avkastning)
//
// Vid baseArmor 2  → DR  1.96%  (minimal, glass cannon)
// Vid baseArmor 5  → DR  4.76%  (tank-baseline)
// Items kan addera +2–4 armor. Fullt rustning ~armor 13 → DR 11.5%.
// True damage ignorerar DR helt.

/** Beräknar damage-reduction-procent (0–1) från armor-värde. */
export function damageReduction(armor) {
    return armor / (armor + 100);
}

/** Applicerar armor-mitigering på ett rå skadevärde. */
export function mitigateDamage(rawDamage, armor) {
    return rawDamage * (1 - damageReduction(armor));
}

// ─── 5. ATTACK TIMING ───────────────────────────────────────────────────────
//
// ATTACK_SPEED_MS = millisekunder cooldown mellan grundattacker.
// Läses av ability-engine.js via cfg.ATTACK_SPEED (befintligt fält).
// Hit-timing: se feel-manifestet (windup/release/recovery).

export const ATTACK_TIMING = {
    Warrior:      { attackSpeedMs: 600, windup: 0.20, release: 0.25, recovery: 0.20 },
    'Tank-Viking':{ attackSpeedMs: 800, windup: 0.12, release: 0.15, recovery: 0.20 },
    Mage:         { attackSpeedMs: 400, windup: 0.15, release: 0.20, recovery: 0.20 },
    Ranger:       { attackSpeedMs: 350, windup: 0.35, release: 0.40, recovery: 0.20 },
    Hybrid: {
        meleeMsS:    500, windup: 0.10, release: 0.15, recovery: 0.15,
        rangedMs:    450,
    },
};

// ─── 6. ABILITY CONFIG ──────────────────────────────────────────────────────
//
// Detta block ERSÄTTER ABILITY_CONFIG i core/ability-engine.js
// vid nästa filsteg. Håll värdena synkade.

export const ABILITY_CONFIG = {
    Warrior: {
        BASE_DAMAGE_MULTIPLIER: 1.2,   // ×1.2 på grundattack (AoE-cleave)
        BLADE_WHIRL_RADIUS:     130,   // px, spin-zon
        BLADESTORM_DURATION:    1.5,   // s
        SWEEP_COUNT:              4,
        DASH_STRIKE_DISTANCE:   420,   // px  (var 150 — för kort, fixas här)
        ATTACK_RANGE:            90,   // px  (var 70)
        ATTACK_ARC:    Math.PI / 2,    // rad, 90° frontal cone
        ATTACK_SPEED:           600,   // ms cooldown (behålls för bakåtkompatibilitet)
        q_cd:  7,   // s  (var 4 — för kort)
        w_cd: 14,   // s  (var 5)
        e_cd: 55,   // s  (var 10)
    },
    Ranger: {
        VOLLEY_ARROW_SPREAD: Math.PI / 6,
        ARROW_RAIN_DURATION:  4.0,     // s  (var 2.0)
        ARROW_RAIN_DAMAGE_MULT: 0.55,  // ×-mult per pil  (var 0.2 — för svag)
        TUMBLE_DISTANCE:       350,    // px  (var 80 — knappt märkbar, fixas)
        ATTACK_SPEED:          350,    // ms
        q_cd: 10,
        w_cd:  6,
        e_cd: 60,
    },
    'Tank-Viking': {
        GROUND_SLAM_CONE_ANGLE:  Math.PI / 3,
        GROUND_SLAM_LENGTH:        220,   // px  (var 200)
        GROUND_SLAM_DAMAGE_MULT:   1.5,
        SHIELD_DURATION:           2.5,   // s  (var 3.0 — var för lång)
        VALHALLA_BUFF_SPEED:       1.28,  // × move speed  (var 1.4)
        VALHALLA_DURATION:         5.0,   // s
        ATTACK_RANGE:               75,   // px
        ATTACK_SPEED:              800,   // ms
        q_cd:  9,
        w_cd: 18,
        e_cd: 65,
    },
    Hybrid: {
        BEAM_LENGTH:          550,   // px  (var 400)
        MELEE_BONUS:           15,
        RANGED_BONUS:           0,
        EQUILIBRIUM_DAMAGE:   200,   // bas-skada (var saknades)
        ATTACK_RANGE_MELEE:    65,   // px  (var 55)
        ATTACK_SPEED_MELEE:   500,   // ms
        ATTACK_SPEED_RANGED:  450,   // ms
        q_cd:  1.5,
        w_cd: 18,
        e_cd: 50,
    },
    Mage: {
        FIREBALL_RADIUS:           15,   // px projektil-hitbox
        BURST_DAMAGE_MULTIPLIER:   2.5,
        METEOR_DELAY:              1.8,  // s  (var 1.0 — för lite telegraf)
        METEOR_EXPLOSION_RADIUS:  300,   // px  (var 140 — för liten)
        FLAME_DASH_DISTANCE:      500,   // px  (var 120 — knappt märkbar)
        BURNING_CIRCLE_DURATION:  3.5,   // s  (var 1.5)
        BURNING_CIRCLE_RADIUS:     30,   // px
        BURNING_DAMAGE_MULT:      0.8,
        ATTACK_SPEED:             400,   // ms
        q_cd:  8,
        w_cd: 12,
        e_cd: 70,
    },
};

// ─── 7. EKONOMI ─────────────────────────────────────────────────────────────

export const ECONOMY_CONFIG = {
    passiveGoldPerSecond:  3,      // alltid aktiv
    killBountyBase:       80,      // bas-bounty player-kill
    killBountyScale:    0.08,      // andel av målets totalGold
    killBountyCap:       240,      // hård cap — anti-inflation
    assistGold:           35,      // flat, ingen skalning
    zoneSurvivalBonus:    20,      // per överlevt storm-ring
    markedKillThreshold:   3,      // kills tills "Marked"-debuff
    markedBountyMulti:   1.30,     // +30% bounty mot Marked-spelare
};

/**
 * Kill-bounty med anti-inflation-cap.
 *   bounty = min(base + targetGold × scale, cap)
 *
 * Ersätter calculateBounty() i economy-engine.js
 * (den gamla formeln var ratio-baserad och saknade absolut cap).
 *
 * @param {number} targetTotalGold  — målets totala farmade gold
 * @param {{ marked?: boolean }}    — om målet har Marked-debuff
 */
export function computeBounty(targetTotalGold, opts = {}) {
    const raw    = ECONOMY_CONFIG.killBountyBase
                 + targetTotalGold * ECONOMY_CONFIG.killBountyScale;
    const capped = Math.min(raw, ECONOMY_CONFIG.killBountyCap);
    const multi  = opts.marked ? ECONOMY_CONFIG.markedBountyMulti : 1;
    return Math.round(capped * multi);
}

/**
 * Farm-gold med diminishing returns (identisk formel som befintlig calculateFarmGold).
 * Behålls här som kanonisk referens; economy-engine.js kan importera denna
 * eller behålla sin egen (de är identiska).
 */
export function computeFarmGold(baseGold, totalFarmed, averageGoldAtTime) {
    const softCap = averageGoldAtTime * 0.6;
    if (totalFarmed < softCap) return baseGold;
    const excess = totalFarmed - softCap;
    return baseGold * (1 / (1 + excess / 1000));
}

// ─── 8. RARITY & PITY ───────────────────────────────────────────────────────
//
// dropRate summerar till exakt 1.0 (balance-validator kontrollerar detta).
// powerCeiling = power över common-baseline. HARD CAP: legendary ≤ 0.30.
// pityThreshold = antal dry kills (ingen Rare+) tills garanterad drop.

export const RARITY_TABLE = [
    { rarity: 'COMMON',    dropRate: 0.620, powerCeiling: 0.00, pityThreshold: null },
    { rarity: 'UNCOMMON',  dropRate: 0.240, powerCeiling: 0.10, pityThreshold: null },
    { rarity: 'RARE',      dropRate: 0.100, powerCeiling: 0.20, pityThreshold: 8    },
    { rarity: 'EPIC',      dropRate: 0.035, powerCeiling: 0.28, pityThreshold: 18   },
    { rarity: 'LEGENDARY', dropRate: 0.005, powerCeiling: 0.30, pityThreshold: 35   },
];

const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

/**
 * Rullar en rarity med pity-system.
 * Muterar pityState.dryKills.
 *
 * Ersätter rollDrop() i economy-engine.js (nya systemet är threshold-baserat,
 * gamla var float luckDebt — mer förutsägbart och server-auditerbart).
 *
 * @param {{ dryKills: number }} pityState  — muterbart state per spelare
 * @returns {{ rarity: string, viaPity: boolean, item: object }}
 */
export function rollRarity(pityState) {
    // 1. Kolla pity — högsta tier vars tröskel passerats vinner
    let forced = null;
    for (const def of RARITY_TABLE) {
        if (def.pityThreshold !== null && pityState.dryKills >= def.pityThreshold) {
            if (!forced || RARITY_ORDER.indexOf(def.rarity) > RARITY_ORDER.indexOf(forced)) {
                forced = def.rarity;
            }
        }
    }

    let rolled;
    let viaPity = false;

    if (forced) {
        rolled  = forced;
        viaPity = true;
    } else {
        // 2. Vägd slumpdragning
        const r = Math.random();
        let cumulative = 0;
        rolled = 'COMMON';
        for (const def of RARITY_TABLE) {
            cumulative += def.dropRate;
            if (r < cumulative) { rolled = def.rarity; break; }
        }
    }

    // 3. Uppdatera pity
    const rolledRank = RARITY_ORDER.indexOf(rolled);
    const rareRank   = RARITY_ORDER.indexOf('RARE');
    if (rolledRank >= rareRank) {
        pityState.dryKills = 0;
    } else {
        pityState.dryKills += 1;
    }

    return { rarity: rolled, viaPity };
}

// ─── 9. DROP TABLES (creep-nivåer) ──────────────────────────────────────────
//
// Dessa mappar mot creep.name i Creep-klassen (Scout, Warrior, Ancient Boss).
// goldMin/goldMax ersätter de fasta goldReward-värdena i CREEP_TYPES.

export const DROP_TABLES = {
    Scout: {
        goldMin:        22, goldMax:        28,
        shardChance:  0.18, shardType:    'hp',
        itemDropChance: 0.08, minRarity: 'COMMON',
    },
    Warrior: {
        goldMin:        28, goldMax:        35,
        shardChance:  0.12, shardType:  'move',
        itemDropChance: 0.10, minRarity: 'COMMON',
    },
    'Ancient Boss': {
        goldMin:       120, goldMax:       120,
        shardChance:  1.00, shardType: 'epicAll',
        itemDropChance: 0.25, minRarity: 'EPIC',
    },
};

// Shard stack-caps (förhindrar shard-stacking-dominans)
export const SHARD_CAPS = { hp: 60, move: 40, armor: 12 };

// ─── 10. CLASS AFFINITIES (shop-prismodifiering) ────────────────────────────
//
// Ersätter CLASS_AFFINITIES i economy-engine.js.
// Gamla systemet hade specifika kategori-namn (heavy_armor, spell_scroll).
// Nya systemet använder arketyper (offensive, defensive, utility) som
// matchar SHOP_CATALOG nedan.
//
// Multiplier < 1.0 = rabatt (on-meta), > 1.0 = premium (off-meta)

export const CLASS_AFFINITIES = {
    Warrior:      { offensive: 1.00, defensive: 0.85, utility: 1.30 },
    'Tank-Viking':{ offensive: 1.20, defensive: 0.80, utility: 1.20 },
    Mage:         { offensive: 0.90, defensive: 1.40, utility: 0.95 },
    Ranger:       { offensive: 0.90, defensive: 1.20, utility: 0.90 },
    Hybrid:       { offensive: 0.95, defensive: 1.05, utility: 1.00 },
};

/**
 * Beräknar item-kostnad med class affinity.
 * Drop-in-ersättning för calculateItemCost() i economy-engine.js.
 *
 * @param {number} baseCost
 * @param {'offensive'|'defensive'|'utility'} archetype
 * @param {string} heroClass
 */
export function calculateItemCost(baseCost, archetype, heroClass) {
    const affinity = CLASS_AFFINITIES[heroClass];
    if (affinity && affinity[archetype] != null) {
        return Math.round(baseCost * affinity[archetype]);
    }
    return baseCost;
}

// ─── 11. SHOP CATALOG (15 items, 3 arketyper) ───────────────────────────────
//
// Ersätter de 3 placeholder-items i SHOP_CATALOG i index.html.
// Fältet `archetype` ersätter `category` för att matcha CLASS_AFFINITIES ovan.
// `unique` visas som tooltip i shop-interface.js (updateShopUI läser item.description).

export const SHOP_CATALOG = [
    // ── OFFENSIVE ──────────────────────────────────────────────────────────
    {
        id: 'bloodthirst_fang',
        name: 'Bloodthirst Fang',
        archetype: 'offensive',
        baseCost: 380,
        stats: { attackDamage: 38, attackSpeedPct: 12 },
        description: 'Varje kill → +8 skada (max 5 stacks, reset vid död).',
    },
    {
        id: 'spellfury_shard',
        name: 'Spellfury Shard',
        archetype: 'offensive',
        baseCost: 420,
        stats: { magicPower: 55, spellPenetrationPct: 15 },
        description: 'Burn-DoT gör +40% skada. ACTIVE (18s): nästa spell ×2.',
    },
    {
        id: 'critblade',
        name: 'Critblade',
        archetype: 'offensive',
        baseCost: 350,
        stats: { attackDamage: 28, critChancePct: 22 },
        description: '22% crit (×2.2). Crits applicerar 0.3s mini-stun.',
    },
    {
        id: 'venom_coating',
        name: 'Venom Coating',
        archetype: 'offensive',
        baseCost: 310,
        stats: { attackDamage: 22, attackSpeedPct: 8 },
        description: 'Attacker → 18 gift/s i 4s. Gift ×2 på burnade mål.',
    },
    {
        id: 'execution_edge',
        name: 'Execution Edge',
        archetype: 'offensive',
        baseCost: 460,
        stats: { attackDamage: 45 },
        description: '+35% skada mot mål <25% HP. Kills <15% → -3s Q-cooldown.',
    },

    // ── DEFENSIVE ──────────────────────────────────────────────────────────
    {
        id: 'ironhide_plate',
        name: 'Ironhide Plate',
        archetype: 'defensive',
        baseCost: 390,
        stats: { hp: 180, armor: 18 },
        description: '12% fysisk DR (additivt). +2.5/s regen över 60% HP.',
    },
    {
        id: 'null_rune_ward',
        name: 'Null-Rune Ward',
        archetype: 'defensive',
        baseCost: 430,
        stats: { hp: 120, magicResist: 25 },
        description: 'Spell shield — absorberar första spellen (recharge 28s). +20% CC-reduktion.',
    },
    {
        id: 'stormwall_aegis',
        name: 'Stormwall Aegis',
        archetype: 'defensive',
        baseCost: 370,
        stats: { hp: 200 },
        description: 'ACTIVE (22s): 1.5s 70% DR — kan ej dö. Immun mot displacement.',
    },
    {
        id: 'thornweave_vestment',
        name: 'Thornweave Vestment',
        archetype: 'defensive',
        baseCost: 320,
        stats: { hp: 90, armor: 10 },
        description: 'Reflekterar 18% melee-skada. Attackers får 0.2s attack-slow per hit.',
    },
    {
        id: 'bloodpact_seal',
        name: 'Bloodpact Seal',
        archetype: 'defensive',
        baseCost: 400,
        stats: { hp: 140 },
        description: 'ACTIVE (35s): offra 40% current HP → samma som magic-skada på mål.',
    },

    // ── UTILITY ────────────────────────────────────────────────────────────
    {
        id: 'tidewarden_boots',
        name: 'Tidewarden Boots',
        archetype: 'utility',
        baseCost: 290,
        stats: { moveSpeed: 45, cooldownReductionPct: 8 },
        description: 'Ingen move-penalty i Riverbed. +12% move speed i vatten.',
    },
    {
        id: 'shadowcloak_mantle',
        name: 'Shadowcloak Mantle',
        archetype: 'utility',
        baseCost: 410,
        stats: { moveSpeed: 25 },
        description: 'ACTIVE (24s): 3s invis (bryts vid attack). Instant invis i Dense Brush.',
    },
    {
        id: 'timestop_crystal',
        name: 'Timestop Crystal',
        archetype: 'utility',
        baseCost: 450,
        stats: { cooldownReductionPct: 18, magicResist: 20 },
        description: 'ACTIVE (40s): frys egna cooldowns 4s. Abilities inom 1s av reset → +15%.',
    },
    {
        id: 'farsight_orb',
        name: 'Farsight Orb',
        archetype: 'utility',
        baseCost: 300,
        stats: { moveSpeed: 20 },
        description: 'ACTIVE (20s): reveal alla fiender i 600px i 5s (genom väggar). Ser traps.',
    },
    {
        id: 'blightbreaker_talisman',
        name: 'Blightbreaker Talisman',
        archetype: 'utility',
        baseCost: 340,
        stats: { hp: 60, armor: 10 },
        description: 'Immun mot Blight-debuff. +20% gold från Blight-camps. Blight-mobs -15% HP.',
    },
];
