/**
 * @file terrain.js
 * World terrain lookup for movement modifiers and VFX triggers.
 */

export function getTerrainType(x, y) {
    if (y > 4000 && y < 4400 && x > 200 && x < 5800) return 'WATER';
    return 'GRASS';
}
