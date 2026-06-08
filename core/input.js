// ============================================================
// core/input.js
// Tangentbord- och musinput. Extraherat ur index.html.
// ============================================================

export const keysPressed = {};
export const pointerWorld = { x: 0, y: 0 };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Function} getCamera        — () => camera
 * @param {Function} onAbility        — (slot) => void
 * @param {Function} onBasicAttack    — () => void
 * @param {Function} onShopToggle     — () => void
 * @param {Function} isShopOpen       — () => bool
 * @param {Function} getWorldCoords   — (event, canvas) => {x,y}
 */
export function initInput(canvas, {
    getCamera,
    onAbility,
    onBasicAttack,
    onShopToggle,
    isShopOpen,
    getWorldCoords,
}) {
    canvas.addEventListener('mousemove', (event) => {
        const coords = getWorldCoords(event, canvas);
        pointerWorld.x = coords.x;
        pointerWorld.y = coords.y;
    });

    window.addEventListener('mousedown', (event) => {
        if (isShopOpen() || event.button !== 0) return;
        onBasicAttack();
    });

    const ABILITY_MAP = { '1': 'q', '2': 'w', '3': 'e' };

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keysPressed[key] = true;

        if (key === 'b') { onShopToggle(); return; }

        if (ABILITY_MAP[key] && !isShopOpen()) {
            onAbility(ABILITY_MAP[key]);
        }

        if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.key.toLowerCase()] = false;
    });
}
