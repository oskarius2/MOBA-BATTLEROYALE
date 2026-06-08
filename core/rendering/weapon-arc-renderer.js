// ============================================================
// core/rendering/weapon-arc-renderer.js
// Vapen-swing-visualer och bågar.
// STUB — koppla in animerade vapen-swings här.
// ============================================================

let _arcTime = 0;

export function tickWeaponArcAnimation(deltaSeconds) {
    _arcTime += deltaSeconds;
}

/**
 * Rita vapen-bågar för spelaren (screen-space — anropas efter ctx.restore()).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} player
 * @param {object} camera
 */
export function drawWeaponArcs(ctx, player, camera) {
    if (!player) return;
    // STUB: lägg till klass-specifika vapen-swings här
    // Ex: Warrior cleave-båge, Ranger bow-draw, osv.
}
