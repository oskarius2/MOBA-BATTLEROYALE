// ============================================================
// core/rendering/ground-textures.js
// Mark-texturer för skogsunderlaget (world-space).
// ============================================================

const MOSS_PATCHES = [];
let _patchesReady = false;

function initMossPatches() {
    if (_patchesReady) return;
    for (let i = 0; i < 180; i++) {
        MOSS_PATCHES.push({
            x: Math.random() * 6000,
            y: Math.random() * 6000,
            r: 40 + Math.random() * 90,
            hue: 95 + Math.random() * 25,
            alpha: 0.04 + Math.random() * 0.06,
        });
    }
    _patchesReady = true;
}

/**
 * @param {CanvasRenderingContext2D} ctx — world-space
 */
export function drawGroundLayer(ctx, camera, viewW, viewH) {
    initMossPatches();

    const x0 = camera.x;
    const y0 = camera.y;

    ctx.save();

    // Bas — mörk djungelbotten
    const grad = ctx.createLinearGradient(x0, y0, x0, y0 + viewH);
    grad.addColorStop(0, '#0c140a');
    grad.addColorStop(0.5, '#0a0f09');
    grad.addColorStop(1, '#070b07');
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y0, viewW, viewH);

    // Rutnät för djup
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#1a2a1a';
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = Math.floor(x0 / step) * step; x < x0 + viewW; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y0 + viewH);
        ctx.stroke();
    }
    for (let y = Math.floor(y0 / step) * step; y < y0 + viewH; y += step) {
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x0 + viewW, y);
        ctx.stroke();
    }

    // Mossfläckar
    const pad = 120;
    for (const patch of MOSS_PATCHES) {
        if (patch.x < x0 - pad || patch.x > x0 + viewW + pad ||
            patch.y < y0 - pad || patch.y > y0 + viewH + pad) continue;
        ctx.globalAlpha = patch.alpha;
        ctx.beginPath();
        ctx.ellipse(patch.x, patch.y, patch.r, patch.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${patch.hue}, 28%, 14%)`;
        ctx.fill();
    }

    // Vattenzoner (enkel markering)
    ctx.globalAlpha = 0.12;
    const waterZones = [
        { x: 900, y: 4200, rx: 320, ry: 200 },
        { x: 5100, y: 1800, rx: 280, ry: 240 },
    ];
    for (const w of waterZones) {
        if (w.x + w.rx < x0 - pad || w.x - w.rx > x0 + viewW + pad ||
            w.y + w.ry < y0 - pad || w.y - w.ry > y0 + viewH + pad) continue;
        ctx.beginPath();
        ctx.ellipse(w.x, w.y, w.rx, w.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1a3040';
        ctx.fill();
    }

    ctx.restore();
}
