// ============================================================
// data/shop-catalog.js
// SHOP CATALOG — 15 items i 3 arketyper.
//
// Extraherat och expanderat ur index.html:
//   FÖRUT: 3 placeholder-items (armor, bow, scroll)
//   NU:    15 balanserade artifacts, hämtade från balance-config.js
//
// Importeras av index.html:
//   import { SHOP_CATALOG } from './data/shop-catalog.js';
//
// Kompatibilitet:
//   shop-interface.js läser item.category → sätts till archetype-värdet
//   (offensive / defensive / utility). economy-engine.calculateItemCost()
//   förstår dessa värden direkt (inga legacy-mappningar behövs).
//
//   buyItem() i index.html läser:
//     catalogItem.id, catalogItem.baseCost, catalogItem.category, catalogItem.name
//   Alla finns. Inga ändringar i shop-interface.js eller buyItem krävs.
//
// Prissättning:
//   calculateItemCost(baseCost, category, heroClass) applicerar CLASS_AFFINITIES.
//   Ex: Warrior + defensive = baseCost × 0.85 (rabatt)
//       Mage    + defensive = baseCost × 1.40 (premium)
// ============================================================

import { SHOP_CATALOG as _RAW } from '../core/balance-config.js';

// Omvandlar `archetype` → `category` för shop-interface.js bakåtkompatibilitet.
// Alla övriga fält (id, name, baseCost, stats, description) är oförändrade.
export const SHOP_CATALOG = _RAW.map(item => Object.freeze({
    ...item,
    category: item.archetype,   // shop-interface.js, buyItem() läser detta fält
}));

// ─── BEKVÄMLIGHETS-LOOKUPS ────────────────────────────────────────────────────

/** Hämtar ett item via id. Returnerar undefined om id saknas. */
export function getCatalogItem(id) {
    return SHOP_CATALOG.find(item => item.id === id);
}

/** Filtrerar items per arketyp. */
export function itemsByArchetype(archetype) {
    return SHOP_CATALOG.filter(item => item.archetype === archetype);
}

// ─── QUICK-REFERENCE (för debugging / validator) ──────────────────────────────
//
// Skrivs ut i konsolen vid import om VITE_DEBUG=true (eller liknande).
// Kommentera bort i produktion.

/*
console.table(SHOP_CATALOG.map(({ id, name, archetype, baseCost }) =>
    ({ id, name, archetype, baseCost })
));
*/
