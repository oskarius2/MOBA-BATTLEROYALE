// ============================================================
// core/inventory.js
// Item-inventering, köp och pickup.
// Extraherat ur index.html.
// ============================================================

import { SHOP_CATALOG }    from '../data/shop-catalog.js';
import { calculateItemCost } from './economy-engine.js';
import { checkMapPresenceUI } from '../ui/shop-interface.js';

export const inventoryItems = { slot1: null, slot2: null, slot3: null };

export function inventorySlotsArray() {
    return [inventoryItems.slot1, inventoryItems.slot2, inventoryItems.slot3];
}

export function isFull() {
    return !!(inventoryItems.slot1 && inventoryItems.slot2 && inventoryItems.slot3);
}

function nextFreeSlot() {
    if (!inventoryItems.slot1) return 'slot1';
    if (!inventoryItems.slot2) return 'slot2';
    if (!inventoryItems.slot3) return 'slot3';
    return null;
}

function slotElementId(slot) {
    return slot.replace('slot', 'slot-');
}

function applySlotStyle(el, item) {
    if (!el) return;
    el.classList.remove('filled', 'offensive', 'defensive', 'utility');
    if (!item) {
        el.textContent = '—';
        el.style.boxShadow = '';
        return;
    }
    el.classList.add('filled');
    const arch = item.archetype ?? 'utility';
    if (arch === 'offensive' || arch === 'defensive' || arch === 'utility') {
        el.classList.add(arch);
    }
    el.style.boxShadow = '0 0 12px rgba(201, 162, 39, 0.35)';
}

export function resetInventory(onChanged) {
    inventoryItems.slot1 = null;
    inventoryItems.slot2 = null;
    inventoryItems.slot3 = null;
    ['slot-1', 'slot-2', 'slot-3'].forEach(id => {
        const el = document.getElementById(id);
        applySlotStyle(el, null);
    });
    if (onChanged) onChanged();
}

/**
 * Plockar upp ett droppat item.
 * @param {object} item   DroppedItem-instans
 * @param {Function} onChanged  — markHudDirty o.d.
 */
export function collectItem(item, onChanged) {
    if (isFull()) return;
    const slot = nextFreeSlot();
    if (!slot) return;

    const el = document.getElementById(slotElementId(slot));
    const lootItem = {
        name: item.name,
        type: item.type,
        archetype: 'utility',
    };
    if (el) {
        el.textContent = item.name;
        applySlotStyle(el, lootItem);
    }

    inventoryItems[slot] = item;
    checkMapPresenceUI(inventorySlotsArray());
    if (onChanged) onChanged();
}

/**
 * Köper ett item från shoppen.
 * @param {string}   itemId
 * @param {string}   playerClass
 * @param {object}   gameState      — { gold }
 * @param {object}   player         — PlayerInstance (för HP-bonus)
 * @param {Function} onChanged
 */
export function buyItem(itemId, playerClass, gameState, player, onChanged) {
    const catalogItem = SHOP_CATALOG.find(i => i.id === itemId);
    if (!catalogItem || !gameState.running) return;

    const cost = calculateItemCost(catalogItem.baseCost, catalogItem.category, playerClass);
    if (gameState.gold < cost) return;
    if (isFull()) return;

    const slot = nextFreeSlot();
    if (!slot) return;

    gameState.gold -= cost;

    const purchasedItem = {
        id:          catalogItem.id,
        name:        catalogItem.name,
        archetype:   catalogItem.archetype,
        category:    catalogItem.category,
        stats:       catalogItem.stats ?? {},
        description: catalogItem.description ?? '',
        mapPresence: catalogItem.mapPresence ?? false,
        type:        'SHOP',
        power:       1,
    };

    if (purchasedItem.stats.hp && player) {
        player.maxHp += purchasedItem.stats.hp;
        player.hp     = Math.min(player.hp + purchasedItem.stats.hp, player.maxHp);
    }

    const el = document.getElementById(slotElementId(slot));
    if (el) {
        el.textContent = purchasedItem.name;
        applySlotStyle(el, purchasedItem);
    }

    inventoryItems[slot] = purchasedItem;
    checkMapPresenceUI(inventorySlotsArray());
    if (onChanged) onChanged();
}
