// ============================================================
// core/entities/item.js
// Droppade items på marken. Extraherat ur index.html.
// ============================================================

const ITEM_COLORS = {
    GOLD:       '#c8a840',
    LEGENDARY:  '#c8a840',
    PURPLE:     '#6a4a8a',
    EPIC:       '#7a55aa',
    OFFENSIVE:  '#c04040',
    DEFENSIVE:  '#4060c0',
    UTILITY:    '#40a060',
    SHOP:       '#c9a227',
    COMMON:     '#6a706a',
    UNCOMMON:   '#4a7a4a',
    RARE:       '#4a4a9a',
};

export class DroppedItem {
    constructor(x, y, loot) {
        this.x           = x;
        this.y           = y;
        this.type        = loot.type;
        this.name        = loot.name;
        this.mapPresence = loot.mapPresence ?? false;
        this.power       = loot.power       ?? 1;
        this.stats       = loot.stats       ?? {};
        this.archetype   = loot.archetype   ?? null;
        this.radius      = 10;
        this.isCollected = false;
    }

    draw(ctx) {
        if (this.isCollected) return;

        const color = ITEM_COLORS[this.type] ?? '#6a4a8a';
        ctx.beginPath();
        ctx.rect(
            this.x - this.radius,
            this.y - this.radius,
            this.radius * 2,
            this.radius * 2
        );
        ctx.fillStyle   = color;
        ctx.strokeStyle = '#4a5a4a';
        ctx.lineWidth   = 2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#8fbc8f';
        ctx.font      = '10px Courier New';
        ctx.fillText(this.name, this.x - 20, this.y + 3);
    }
}
