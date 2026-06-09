// ============================================================
// DARK FANTASY — SHOP & MAP PRESENCE UI
// ============================================================

const style = document.createElement('style');
style.innerHTML = `
    #shop-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.96);
        width: min(640px, 94vw);
        max-height: min(520px, 88vh);
        background: linear-gradient(165deg, rgba(10, 20, 12, 0.97) 0%, rgba(3, 7, 4, 0.98) 100%);
        border: 2px solid rgba(139, 105, 20, 0.55);
        box-shadow:
            0 0 0 1px rgba(201, 162, 39, 0.12),
            0 8px 48px rgba(0, 0, 0, 0.75),
            inset 0 0 60px rgba(0, 0, 0, 0.35);
        color: #d4cfc4;
        font-family: 'Montserrat', 'Segoe UI', sans-serif;
        display: flex;
        flex-direction: column;
        padding: 0;
        z-index: 150;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    }

    #shop-overlay.shop-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translate(-50%, -50%) scale(1);
    }

    #shop-scrim {
        position: fixed;
        inset: 0;
        background: rgba(2, 5, 3, 0.72);
        z-index: 149;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s;
    }

    #shop-scrim.shop-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
    }

    .shop-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px 16px;
        border-bottom: 1px solid rgba(139, 105, 20, 0.3);
        background: linear-gradient(180deg, rgba(139, 105, 20, 0.08), transparent);
    }

    .shop-header-text {
        font-family: 'Cinzel', Georgia, serif;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #d4cfc4;
        text-shadow: 0 0 20px rgba(201, 162, 39, 0.25);
    }

    .shop-header-sub {
        font-size: 10px;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: #7a8a72;
        margin-top: 4px;
    }

    .shop-close-btn {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(139, 105, 20, 0.45);
        color: #c9a227;
        font-size: 18px;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s, color 0.2s;
        font-family: inherit;
        flex-shrink: 0;
    }

    .shop-close-btn:hover {
        background: rgba(139, 105, 20, 0.2);
        border-color: #c9a227;
        color: #e8d48a;
    }

    .shop-close-btn:focus-visible {
        outline: 2px solid #c9a227;
        outline-offset: 2px;
    }

    .shop-body {
        padding: 20px 24px 24px;
        overflow-y: auto;
        flex: 1;
    }

    .item-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 14px;
    }

    .shop-card {
        position: relative;
        border: 1px solid rgba(139, 105, 20, 0.35);
        padding: 16px 14px;
        background: linear-gradient(160deg, rgba(12, 22, 14, 0.9), rgba(5, 12, 7, 0.85));
        text-align: center;
        transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
    }

    .shop-card:hover {
        border-color: rgba(201, 162, 39, 0.6);
        box-shadow: 0 0 20px rgba(201, 162, 39, 0.15);
        transform: translateY(-2px);
    }

    .shop-card h4 {
        margin: 0 0 8px;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.06em;
        color: #d4cfc4;
    }

    .shop-card-price {
        font-size: 13px;
        font-variant-numeric: tabular-nums;
        margin-bottom: 12px;
    }

    .shop-card .discount { color: #3dba6a; }
    .shop-card .markup { color: #c0392b; }

    .shop-buy-btn {
        width: 100%;
        padding: 10px 12px;
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        background: linear-gradient(180deg, #8b6914, #6b5010);
        border: 1px solid #c9a227;
        color: #f0e6c8;
        cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s;
    }

    .shop-buy-btn:hover {
        background: linear-gradient(180deg, #a07a18, #8b6914);
        box-shadow: 0 0 16px rgba(201, 162, 39, 0.35);
    }

    .shop-tooltip {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        width: max-content;
        max-width: 220px;
        padding: 10px 12px;
        background: rgba(3, 7, 4, 0.97);
        border: 1px solid rgba(139, 105, 20, 0.5);
        font-size: 11px;
        line-height: 1.5;
        color: #a8b0a0;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.2s, transform 0.2s, visibility 0.2s;
        z-index: 10;
        text-align: left;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    }

    .shop-card:hover .shop-tooltip,
    .shop-card:focus-within .shop-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
    }

    #map-presence-alert {
        position: fixed;
        top: 72px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(80, 12, 20, 0.85);
        border: 1px solid rgba(192, 57, 43, 0.6);
        color: #e8a090;
        padding: 10px 24px;
        font-family: 'Montserrat', sans-serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        display: none;
        z-index: 99;
        box-shadow: 0 0 24px rgba(192, 57, 43, 0.25);
        animation: presencePulse 2s ease-in-out infinite;
    }

    @keyframes presencePulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.65; }
    }

    @media (prefers-reduced-motion: reduce) {
        #shop-overlay, #shop-scrim, .shop-card, #map-presence-alert { transition-duration: 0.01ms; animation: none; }
    }
`;
document.head.appendChild(style);

const shopScrim = document.createElement('div');
shopScrim.id = 'shop-scrim';
shopScrim.addEventListener('click', () => closeShopUI());
document.body.appendChild(shopScrim);

const shopOverlay = document.createElement('div');
shopOverlay.id = 'shop-overlay';
shopOverlay.innerHTML = `
    <div class="shop-header">
        <div>
            <div class="shop-header-text">Merchant's Cache</div>
            <div class="shop-header-sub">Press [B] to close</div>
        </div>
        <button type="button" class="shop-close-btn" id="shop-close-btn" aria-label="Close shop">✕</button>
    </div>
    <div class="shop-body">
        <div class="item-grid" id="shop-item-list"></div>
    </div>
`;
document.body.appendChild(shopOverlay);

document.getElementById('shop-close-btn')?.addEventListener('click', () => closeShopUI());

const ITEM_DESCRIPTIONS = {
    armor: 'Reinforced plate that shrugs off creep claws. Favored by frontline champions.',
    bow: 'A composite bow strung with sinew. Extends your kill range in the canopy.',
    scroll: 'Arcane parchment humming with latent fire. Channels spell power for casters.',
};

export function isShopOpen() {
    return shopOverlay.classList.contains('shop-open');
}

export function openShopUI() {
    shopOverlay.classList.add('shop-open');
    shopScrim.classList.add('shop-open');
}

export function closeShopUI() {
    shopOverlay.classList.remove('shop-open');
    shopScrim.classList.remove('shop-open');
}

export function toggleShopUI() {
    if (isShopOpen()) closeShopUI();
    else openShopUI();
}

export function updateShopUI(itemsCatalog, playerClass, costCalculator) {
    const grid = document.getElementById('shop-item-list');
    if (!grid) return;
    grid.innerHTML = '';

    itemsCatalog.forEach(item => {
        const finalCost = costCalculator(item.baseCost, item.category, playerClass);
        let priceClass = '';
        let hint = '';

        if (finalCost < item.baseCost) {
            priceClass = 'discount';
            hint = ' (Class discount)';
        } else if (finalCost > item.baseCost) {
            priceClass = 'markup';
            hint = ' (Premium for your class)';
        }

        const description = item.description || ITEM_DESCRIPTIONS[item.id] || 'A mysterious artifact from the dark jungle.';

        const card = document.createElement('div');
        card.className = 'shop-card';
        card.tabIndex = 0;
        card.innerHTML = `
            <div class="shop-tooltip">${description}</div>
            <h4>${item.name}</h4>
            <p class="shop-card-price ${priceClass}">${finalCost} Gold${hint}</p>
            <button type="button" class="shop-buy-btn" data-item-id="${item.id}">Acquire</button>
        `;
        card.querySelector('.shop-buy-btn')?.addEventListener('click', () => {
            window.buyItem?.(item.id);
        });
        grid.appendChild(card);
    });
}

export function checkMapPresenceUI(playerInventory) {
    const hasLegendary = playerInventory.some(item => item && item.mapPresence === true);
    const alert = document.getElementById('map-presence-alert');
    if (alert) alert.style.display = hasLegendary ? 'block' : 'none';
}

const alertBox = document.createElement('div');
alertBox.id = 'map-presence-alert';
alertBox.innerText = 'Map Presence Active — You Are Revealed';
document.body.appendChild(alertBox);
