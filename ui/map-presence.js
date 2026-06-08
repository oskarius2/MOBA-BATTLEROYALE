// ============================================================
// ui/map-presence.js — legendary reveal alert (decoupled from shop)
// ============================================================

let _alertEl = null;
let _stylesInjected = false;

function ensureStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
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
            #map-presence-alert { transition-duration: 0.01ms; animation: none; }
        }
    `;
    document.head.appendChild(style);
}

function ensureAlert() {
    ensureStyles();
    if (_alertEl) return _alertEl;
    _alertEl = document.createElement('div');
    _alertEl.id = 'map-presence-alert';
    _alertEl.innerText = 'Map Presence Active — You Are Revealed';
    document.body.appendChild(_alertEl);
    return _alertEl;
}

export function checkMapPresenceUI(playerInventory) {
    const hasLegendary = playerInventory.some(item => item && item.mapPresence === true);
    const alert = ensureAlert();
    alert.style.display = hasLegendary ? 'block' : 'none';
}
