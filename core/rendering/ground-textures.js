// ============================================================
// core/rendering/ground-textures.js
// Tiled ground + riverbed overlay with viewport culling.
// ============================================================

const WORLD_SIZE = 6000;
const RIVER_Y_MIN = 4000;
const RIVER_Y_MAX = 4400;
const RIVER_X_MIN = 200;
const RIVER_X_MAX = 5800;

const mapTextureCache = {
    groundTileCanvas: null,
    riverOverlayCanvas: null,
};

function rebuildGroundTextureCache() {
    if (mapTextureCache.groundTileCanvas && mapTextureCache.riverOverlayCanvas) {
        return;
    }

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 256;
    tileCanvas.height = 256;
    const tctx = tileCanvas.getContext('2d');

    const ground = tctx.createLinearGradient(0, 0, 256, 256);
    ground.addColorStop(0, '#0a1208');
    ground.addColorStop(0.35, '#0d1a0a');
    ground.addColorStop(0.65, '#081008');
    ground.addColorStop(1, '#050a06');
    tctx.fillStyle = ground;
    tctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 40; i++) {
        const gx = Math.random() * 256;
        const gy = Math.random() * 256;
        const gr = 8 + Math.random() * 28;
        const patch = tctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        patch.addColorStop(0, `rgba(${12 + Math.random() * 18}, ${28 + Math.random() * 20}, ${8 + Math.random() * 10}, 0.35)`);
        patch.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tctx.fillStyle = patch;
        tctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }

    const riverOverlay = document.createElement('canvas');
    riverOverlay.width = 256;
    riverOverlay.height = 256;
    const rctx = riverOverlay.getContext('2d');
    rctx.fillStyle = '#4e415f';
    rctx.fillRect(0, 0, 256, 256);
    rctx.globalAlpha = 0.5;
    rctx.fillStyle = 'rgba(30, 20, 40, 1)';
    rctx.fillRect(0, 0, 256, 256);
    rctx.globalAlpha = 1;

    mapTextureCache.groundTileCanvas = tileCanvas;
    mapTextureCache.riverOverlayCanvas = riverOverlay;
}

function isRiverTile(tx, ty) {
    return ty + 256 > RIVER_Y_MIN && ty < RIVER_Y_MAX
        && tx + 256 > RIVER_X_MIN && tx < RIVER_X_MAX;
}

/**
 * Draws tiled ground with optional riverbed overlay. World-space context.
 */
export function drawGroundLayer(ctx, camera, viewW, viewH) {
    rebuildGroundTextureCache();

    const tile = mapTextureCache.groundTileCanvas;
    const riverTile = mapTextureCache.riverOverlayCanvas;
    const tileSize = tile.width;

    const startX = Math.floor(camera.x / tileSize) * tileSize;
    const startY = Math.floor(camera.y / tileSize) * tileSize;

    for (let ty = startY - tileSize; ty < camera.y + viewH + tileSize; ty += tileSize) {
        for (let tx = startX - tileSize; tx < camera.x + viewW + tileSize; tx += tileSize) {
            if (tx < -50 || ty < -50 || tx > WORLD_SIZE + 50 || ty > WORLD_SIZE + 50) continue;

            ctx.drawImage(tile, tx, ty);

            if (isRiverTile(tx, ty)) {
                ctx.drawImage(riverTile, tx, ty);
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(100, 150, 255, 0.08)';
                ctx.fillRect(tx, ty + tileSize * 0.3, tileSize, tileSize * 0.4);
                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
            }
        }
    }

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#030704';
    ctx.fillRect(camera.x, camera.y, viewW, viewH);
    ctx.restore();
}

export function invalidateGroundTextureCache() {
    mapTextureCache.groundTileCanvas = null;
    mapTextureCache.riverOverlayCanvas = null;
}
