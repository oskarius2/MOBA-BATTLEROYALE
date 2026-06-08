// ============================================================
// ui/notifications.js — Premium Notification & Kill Feed System
// Toast notifications, kill feed, and event alerts with animations
// ============================================================

const NOTIFICATION_DURATION = 4000;
const KILL_FEED_DURATION = 5000;
const MAX_NOTIFICATIONS = 4;
const MAX_KILL_ENTRIES = 6;

let notificationContainer = null;
let killFeedContainer = null;
const activeNotifications = [];
const activeKillEntries = [];

const NOTIFICATION_ICONS = {
    gold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5c0-1.5-1.5-2.5-3-2.5s-3 1-3 2.5 1.5 2.5 3 2.5 3 1 3 2.5-1.5 2.5-3 2.5"/></svg>`,
    levelUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    kill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
    item: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
    danger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    blight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`,
};

const WEAPON_ICONS = {
    sword: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>`,
    magic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
};

function ensureContainers() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        notificationContainer.setAttribute('aria-live', 'polite');
        notificationContainer.setAttribute('aria-label', 'Notifications');
        document.body.appendChild(notificationContainer);
    }
    
    if (!killFeedContainer) {
        killFeedContainer = document.createElement('div');
        killFeedContainer.className = 'kill-feed';
        killFeedContainer.setAttribute('aria-live', 'polite');
        killFeedContainer.setAttribute('aria-label', 'Kill feed');
        document.body.appendChild(killFeedContainer);
    }
}

/**
 * Show a toast notification
 * @param {object} options
 * @param {string} options.title - Notification title
 * @param {string} [options.body] - Notification body text
 * @param {string} [options.type='info'] - Type: 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'levelUp'
 * @param {string} [options.icon] - Custom icon key from NOTIFICATION_ICONS
 * @param {number} [options.duration] - Auto-dismiss duration in ms
 */
export function showNotification({
    title,
    body = '',
    type = 'info',
    icon = null,
    duration = NOTIFICATION_DURATION,
}) {
    ensureContainers();
    
    while (activeNotifications.length >= MAX_NOTIFICATIONS) {
        dismissNotification(activeNotifications[0].id);
    }
    
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const iconKey = icon || type;
    const iconSvg = NOTIFICATION_ICONS[iconKey] || NOTIFICATION_ICONS.info;
    
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.id = id;
    el.style.setProperty('--notification-duration', `${duration}ms`);
    el.innerHTML = `
        <div style="display:flex;align-items:flex-start;">
            <div class="notification-icon" style="color:var(--notification-accent);">${iconSvg}</div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(title)}</div>
                ${body ? `<div class="notification-body">${escapeHtml(body)}</div>` : ''}
            </div>
        </div>
        <div class="notification-progress"></div>
    `;
    
    el.addEventListener('click', () => dismissNotification(id));
    notificationContainer.appendChild(el);
    
    const entry = { id, el, timeout: null };
    activeNotifications.push(entry);
    
    if (duration > 0) {
        entry.timeout = setTimeout(() => dismissNotification(id), duration);
    }
    
    return id;
}

/**
 * Dismiss a notification by ID
 */
export function dismissNotification(id) {
    const index = activeNotifications.findIndex(n => n.id === id);
    if (index === -1) return;
    
    const { el, timeout } = activeNotifications[index];
    if (timeout) clearTimeout(timeout);
    
    el.classList.add('exiting');
    setTimeout(() => el.remove(), 300);
    
    activeNotifications.splice(index, 1);
}

/**
 * Add entry to kill feed
 * @param {object} options
 * @param {string} options.killer - Killer name
 * @param {string} options.victim - Victim name
 * @param {string} [options.weapon='sword'] - Weapon icon key
 * @param {boolean} [options.isPlayer=false] - Highlight if involves player
 */
export function addKillFeedEntry({
    killer,
    victim,
    weapon = 'sword',
    isPlayer = false,
}) {
    ensureContainers();
    
    while (activeKillEntries.length >= MAX_KILL_ENTRIES) {
        removeKillEntry(activeKillEntries[0].id);
    }
    
    const id = `kill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const weaponSvg = WEAPON_ICONS[weapon] || WEAPON_ICONS.sword;
    
    const el = document.createElement('div');
    el.className = `kill-entry${isPlayer ? ' player-involved' : ''}`;
    el.id = id;
    el.innerHTML = `
        <span class="killer">${escapeHtml(killer)}</span>
        <span class="weapon-icon">${weaponSvg}</span>
        <span class="victim">${escapeHtml(victim)}</span>
    `;
    
    killFeedContainer.appendChild(el);
    
    const entry = { id, el, timeout: null };
    activeKillEntries.push(entry);
    
    entry.timeout = setTimeout(() => removeKillEntry(id), KILL_FEED_DURATION);
    
    return id;
}

/**
 * Remove kill feed entry by ID
 */
export function removeKillEntry(id) {
    const index = activeKillEntries.findIndex(k => k.id === id);
    if (index === -1) return;
    
    const { el, timeout } = activeKillEntries[index];
    if (timeout) clearTimeout(timeout);
    
    el.classList.add('exiting');
    setTimeout(() => el.remove(), 250);
    
    activeKillEntries.splice(index, 1);
}

/**
 * Show gold pickup notification
 */
export function showGoldPickup(amount) {
    showNotification({
        title: `+${amount} Gold`,
        type: 'gold',
        icon: 'gold',
        duration: 2500,
    });
}

/**
 * Show level up notification
 */
export function showLevelUpNotification(level) {
    showNotification({
        title: `Level ${level}!`,
        body: 'Your power grows stronger',
        type: 'success',
        icon: 'levelUp',
        duration: 3500,
    });
}

/**
 * Show item pickup notification
 */
export function showItemPickup(itemName) {
    showNotification({
        title: `Acquired: ${itemName}`,
        body: 'Check your inventory',
        type: 'success',
        icon: 'item',
        duration: 3000,
    });
}

/**
 * Show blight warning
 */
export function showBlightWarning() {
    showNotification({
        title: 'Blight Approaching',
        body: 'Move to safe zone!',
        type: 'danger',
        icon: 'blight',
        duration: 4000,
    });
}

/**
 * Show creep kill in feed
 */
export function showCreepKill(playerName, creepType) {
    addKillFeedEntry({
        killer: playerName,
        victim: creepType,
        weapon: 'sword',
        isPlayer: true,
    });
}

/**
 * Clear all notifications
 */
export function clearAllNotifications() {
    [...activeNotifications].forEach(n => dismissNotification(n.id));
    [...activeKillEntries].forEach(k => removeKillEntry(k.id));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create ripple effect at click position
 */
export function createRipple(event, container) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        width: ${size}px;
        height: ${size}px;
    `;
    
    container.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

/**
 * Add premium button behavior to an element
 */
export function makePremiumButton(element) {
    element.classList.add('btn-premium', 'ripple-container');
    element.addEventListener('click', (e) => createRipple(e, element));
}

/**
 * Initialize all premium buttons on page
 */
export function initPremiumButtons() {
    document.querySelectorAll('.glass-btn, .shop-buy-btn, #game-over-button').forEach(btn => {
        if (!btn.classList.contains('btn-premium')) {
            makePremiumButton(btn);
        }
    });
}
