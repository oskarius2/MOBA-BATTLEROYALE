// ============================================================
// data/world-config.js
// WORLD DATA — creep-typer, jungle camps, Blight-config.
// Extraherat ur index.html. Importeras av core/entities/creep.js
// och core/world/blight.js.
// ============================================================

export const CANVAS_WIDTH  = 6000;
export const CANVAS_HEIGHT = 6000;
export const PATROL_RADIUS = 400;
export const AGGRO_RANGE   = 1000;
export const XP_PER_LEVEL  = 100;

export const CREEP_TYPES = {
    scout: {
        name: 'Scout',
        maxHp: 40,
        radius: 10,
        speed: 3.2,
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
        speed: 1.6,
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
        speed: 0.7,
        contactDamage: 0.45,
        xpReward: 60,
        goldReward: 30,
        fillColor: '#ffcc44',
        strokeColor: '#ffee88',
    },
};

export const JUNGLE_CAMP_LOCATIONS = [
    { x: 1600, y: 1600 },
    { x: 4400, y: 3600 },
    { x: 3000, y: 800  },
    { x: 1200, y: 4400 },
];

export const BLIGHT_CONFIG = {
    center:        { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    initialRadius: 2800,
    damagePerTick: 1.5,
    shrinkSpeed:   5,
};

// Synfält-radie för spelarens fog-of-war
export const VISION_RADIUS = 700;   // px
