// ============================================================
// data/world-config.js
// WORLD DATA — 10 000 × 10 000 px karta
// ============================================================

export const CANVAS_WIDTH  = 10000;
export const CANVAS_HEIGHT = 10000;
export const PATROL_RADIUS = 500;
export const AGGRO_RANGE   = 1200;
export const XP_PER_LEVEL  = 100;
export const VISION_RADIUS = 850;   // px, lite mer synfält på stor karta

export const CREEP_TYPES = {
    scout: {
        name: 'Scout',
        maxHp: 40,
        radius: 10,
        mass: 1,
        speed: 2.4,           // var 3.2 — segare
        contactDamage: 0.08,
        xpReward: 15,
        goldReward: 5,
        fillColor: '#ff44aa',
        strokeColor: '#ff66cc',
    },
    warrior: {
        name: 'Warrior',
        maxHp: 90,
        radius: 16,
        mass: 3,
        speed: 1.2,           // var 1.6 — segare
        contactDamage: 0.12,
        xpReward: 25,
        goldReward: 10,
        fillColor: '#ff8800',
        strokeColor: '#ffaa44',
    },
    ancient: {
        name: 'Ancient Boss',
        maxHp: 350,
        radius: 38,
        mass: 10,
        speed: 0.55,          // var 0.7
        contactDamage: 0.45,
        xpReward: 60,
        goldReward: 30,
        fillColor: '#ffcc44',
        strokeColor: '#ffee88',
    },
};

// 8 läger utspridda på 10k karta
export const JUNGLE_CAMP_LOCATIONS = [
    { x: 1500, y: 1500 },
    { x: 5000, y: 1200 },
    { x: 8500, y: 1500 },
    { x: 1200, y: 5000 },
    { x: 8800, y: 5000 },
    { x: 1500, y: 8500 },
    { x: 5000, y: 8800 },
    { x: 8500, y: 8500 },
];

export const BLIGHT_CONFIG = {
    center:        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    initialRadius: 4800,     // proportionellt större (var 2800 på 6k)
    damagePerTick: 1.5,
    shrinkSpeed:   3.5,      // lite långsammare krympning → mer tid att spela
};
