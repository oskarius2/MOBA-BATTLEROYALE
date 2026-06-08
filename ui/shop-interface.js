// ============================================================
// DARK FANTASY — SHOP & MAP PRESENCE UI
// ============================================================

const SHOP_STYLES = `
    #shop-overlay {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9) translateY(20px);
        width: min(680px, 94vw);
        max-height: min(560px, 88vh);
        background: linear-gradient(165deg, rgba(10, 20, 12, 0.97) 0%, rgba(3, 7, 4, 0.98) 100%);
        border: 2px solid rgba(139, 105, 20, 0.55);
        border-radius: 12px;
        box-shadow:
            0 0 0 1px rgba(201, 162, 39, 0.12),
            0 24px 80px rgba(0, 0, 0, 0.8),
            0 0 60px rgba(0, 0, 0, 0.4),
            inset 0 0 60px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        color: #d4cfc4;
        font-family: 'Montserrat', 'Segoe UI', sans-serif;
        display: flex;
        flex-direction: column;
        padding: 0;
        z-index: 150;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: 
            opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            visibility 0.35s cubic-bezier(0.4, 0, 0.2, 1),
            transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1);
        overflow: hidden;
        backdrop-filter: blur(20px) saturate(1.3);
        -webkit-backdrop-filter: blur(20px) saturate(1.3);
    }

    #shop-overlay.shop-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translate(-50%, -50%) scale(1) translateY(0);
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
        border-radius: 8px;
        padding: 18px 14px;
        background: linear-gradient(160deg, rgba(12, 22, 14, 0.92), rgba(5, 12, 7, 0.88));
        text-align: center;
        transition: 
            border-color 0.25s ease,
            box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1),
            background 0.25s ease;
        overflow: hidden;
    }

    .shop-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            135deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.04) 50%,
            transparent 60%,
            transparent 100%
        );
        transform: translateX(-100%);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
    }

    .shop-card:hover::before {
        transform: translateX(100%);
    }

    .shop-card:hover {
        border-color: rgba(201, 162, 39, 0.65);
        box-shadow: 
            0 0 24px rgba(201, 162, 39, 0.2),
            0 12px 32px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        transform: translateY(-4px) scale(1.01);
        background: linear-gradient(160deg, rgba(16, 28, 18, 0.95), rgba(8, 16, 10, 0.9));
    }

    .shop-card:active {
        transform: translateY(-1px) scale(0.99);
        transition: transform 0.1s ease;
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
        padding: 11px 14px;
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        background: linear-gradient(180deg, #8b6914 0%, #6b5010 50%, #5a4310 100%);
        border: 1px solid #c9a227;
        border-radius: 4px;
        color: #f0e6c8;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: 
            background 0.25s ease,
            box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            transform 0.2s cubic-bezier(0.34, 1.4, 0.64, 1),
            border-color 0.2s ease;
    }

    .shop-buy-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            105deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 60%,
            transparent 100%
        );
        transform: translateX(-100%);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .shop-buy-btn:hover::before {
        transform: translateX(100%);
    }

    .shop-buy-btn:hover {
        background: linear-gradient(180deg, #a07a18 0%, #8b6914 50%, #7a5a12 100%);
        box-shadow: 
            0 0 20px rgba(201, 162, 39, 0.4),
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
        border-color: #e8d48a;
    }

    .shop-buy-btn:active {
        transform: translateY(0) scale(0.97);
        transition: transform 0.1s ease;
        box-shadow: 0 0 10px rgba(201, 162, 39, 0.3);
    }

    .shop-buy-btn:focus-visible {
        outline: 2px solid #c9a227;
        outline-offset: 2px;
    }

    .shop-tooltip {
        position: absolute;
        bottom: calc(100% + 12px);
        left: 50%;
        transform: translateX(-50%) translateY(8px) scale(0.95);
        width: max-content;
        max-width: 240px;
        padding: 12px 14px;
        background: linear-gradient(
            165deg,
            rgba(8, 16, 10, 0.98) 0%,
            rgba(3, 7, 4, 0.99) 100%
        );
        border: 1px solid rgba(201, 162, 39, 0.45);
        border-radius: 6px;
        font-size: 11px;
        line-height: 1.55;
        color: #c8d0c0;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: 
            opacity 0.2s ease,
            transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1),
            visibility 0.2s;
        z-index: 10;
        text-align: left;
        box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.65),
            0 0 0 1px rgba(255, 255, 255, 0.03) inset;
        backdrop-filter: blur(12px) saturate(1.3);
        -webkit-backdrop-filter: blur(12px) saturate(1.3);
    }

    .shop-tooltip::before {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        margin-left: -6px;
        width: 12px;
        height: 12px;
        background: inherit;
        border: 1px solid rgba(201, 162, 39, 0.45);
        border-top: none;
        border-left: none;
        transform: rotate(45deg);
    }

    .shop-card:hover .shop-tooltip,
    .shop-card:focus-within .shop-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0) scale(1);
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

let shopScrim = null;
let shopOverlay = null;
let _mounted = false;

function ensureShopMounted() {
    if (_mounted) return;
    _mounted = true;

    const style = document.createElement('style');
    style.textContent = SHOP_STYLES;
    document.head.appendChild(style);

    shopScrim = document.createElement('div');
    shopScrim.id = 'shop-scrim';
    shopScrim.addEventListener('click', () => closeShopUI());
    document.body.appendChild(shopScrim);

    shopOverlay = document.createElement('div');
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
}

export { checkMapPresenceUI } from './map-presence.js';

export function isShopOpen() {
    ensureShopMounted();
    return shopOverlay.classList.contains('shop-open');
}

export function openShopUI() {
    ensureShopMounted();
    shopOverlay.classList.add('shop-open');
    shopScrim.classList.add('shop-open');
}

export function closeShopUI() {
    if (!shopOverlay) return;
    shopOverlay.classList.remove('shop-open');
    shopScrim.classList.remove('shop-open');
}

export function toggleShopUI() {
    if (isShopOpen()) closeShopUI();
    else openShopUI();
}

export function updateShopUI(itemsCatalog, playerClass, costCalculator) {
    ensureShopMounted();
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

        const description = item.description || 'A mysterious artifact from the dark jungle.';

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

