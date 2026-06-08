// ============================================================
// core/world/blight.js
// Blight-zone (storm) state och logik.
// Extraherat ur index.html.
// ============================================================

import { BLIGHT_CONFIG } from '../../data/world-config.js';

export const Blight = {
    center:        { ...BLIGHT_CONFIG.center },
    initialRadius: BLIGHT_CONFIG.initialRadius,
    currentRadius: BLIGHT_CONFIG.initialRadius,
    damagePerTick: BLIGHT_CONFIG.damagePerTick,
    shrinkSpeed:   BLIGHT_CONFIG.shrinkSpeed,
};

export function resetBlight() {
    Blight.currentRadius = Blight.initialRadius;
}

export function updateBlight(deltaTime) {
    Blight.currentRadius = Math.max(
        0,
        Blight.currentRadius - (deltaTime / 1000) * Blight.shrinkSpeed
    );
}

export function isOutsideBlight(x, y) {
    return Math.hypot(x - Blight.center.x, y - Blight.center.y) > Blight.currentRadius;
}
