// ============================================================
// core/camera.js
// Kamera-logik och koordinatkonvertering.
// Extraherat ur index.html.
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/world-config.js';
import { isScreenShakeEnabled } from '../ui/game-settings.js';

export const camera = { x: 0, y: 0 };

let _shakeIntensity = 0;

export function triggerScreenShake(intensity = 6) {
    if (!isScreenShakeEnabled()) return;
    _shakeIntensity = Math.max(_shakeIntensity, intensity);
}

export function updateScreenShake(deltaSeconds) {
    if (_shakeIntensity <= 0) return;
    _shakeIntensity = Math.max(0, _shakeIntensity - deltaSeconds * 28);
}

export function getCameraOffset() {
    if (_shakeIntensity <= 0) return { x: 0, y: 0 };
    const mag = _shakeIntensity;
    return {
        x: (Math.random() - 0.5) * mag * 2,
        y: (Math.random() - 0.5) * mag * 2,
    };
}

function clampCameraAxis(playerCoord, viewportSize, canvasSize) {
    if (viewportSize >= canvasSize) return canvasSize / 2;
    const half    = viewportSize / 2;
    const maxOff  = canvasSize - half;
    return Math.max(Math.min(playerCoord, maxOff), half);
}

export function updateCamera(player, viewportWidth, viewportHeight) {
    camera.x = clampCameraAxis(player.x, viewportWidth,  CANVAS_WIDTH)  - viewportWidth  / 2;
    camera.y = clampCameraAxis(player.y, viewportHeight, CANVAS_HEIGHT) - viewportHeight / 2;
}

export function getWorldCoordinates(event, canvasEl) {
    const rect   = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width  / rect.width;
    const scaleY = canvasEl.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX + camera.x,
        y: (event.clientY - rect.top)  * scaleY + camera.y,
    };
}

export function isObjectVisible(obj, viewportWidth, viewportHeight) {
    const pad = obj.radius ?? 20;
    return obj.x + pad >= camera.x &&
           obj.x - pad <= camera.x + viewportWidth &&
           obj.y + pad >= camera.y &&
           obj.y - pad <= camera.y + viewportHeight;
}
