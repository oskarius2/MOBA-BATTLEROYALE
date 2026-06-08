// ============================================================
// core/rendering/ground-textures.js
// Mark-texturer för skogsunderlaget.
// STUB — expandera med detaljerade texturer vid behov.
// ============================================================

export function drawGroundLayer(ctx, camera, viewW, viewH) {
    ctx.save();
    ctx.fillStyle = '#0a0f09';
    ctx.fillRect(camera.x, camera.y, viewW, viewH);

    // Subtila bård-linjer för djupkänsla
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#1a2a1a';
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = Math.floor(camera.x / step) * step; x < camera.x + viewW; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, camera.y);
        ctx.lineTo(x, camera.y + viewH);
        ctx.stroke();
    }
    for (let y = Math.floor(camera.y / step) * step; y < camera.y + viewH; y += step) {
        ctx.beginPath();
        ctx.moveTo(camera.x, y);
        ctx.lineTo(camera.x + viewW, y);
        ctx.stroke();
    }
    ctx.restore();
}
