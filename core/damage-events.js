// ============================================================
// core/damage-events.js — Visual Damage Event Queue
// Hanterar enbart spridning av UI-event (siffror) vid träff.
// Matte & Armor-kalkylering sker via balance-config.js.
// ============================================================

import { isDamageNumbersEnabled } from '../ui/game-settings.js';
import { spawnDamageNumber, tickDamageNumbers as tickFloatingNumbers } from '../ui/damage-numbers.js';

// Enum för att standardisera skadetyper i systemet
export const DamageType = {
    PHYSICAL: 'physical', // Standard attacker
    MAGIC: 'magic',       // Spells och abilitites
    TRUE: 'true',         // Ignorerar all armor (t.ex. Blight/Storm)
    CRIT: 'crit',         // Extra stor/färgad skrift
    SHIELD: 'shield',     // Absorberad skada (Grå/Blå färg)
    HEAL: 'heal'          // Grön färg
};

const _queue = [];
const MAX_AGE = 1.5; // Hur länge skade-eventet hålls kvar i minnet

/**
 * Registrerar ett hit-event och skapar en visuell Floating Combat Text.
 * @param {number} x - Världskoordinat X
 * @param {number} y - Världskoordinat Y
 * @param {number} amount - Skadan som togs (efter armor-kalkyl)
 * @param {string} type - Vilken typ av skada (Använd DamageType)
 */
export function pushDamageEvent(x, y, amount, type = DamageType.PHYSICAL) {
    if (amount === 0 || !isDamageNumbersEnabled()) return;
    
    // Vi rundar av här för att undvika "15.423" på skärmen
    const displayAmount = Math.ceil(amount);
    
    // Spara i kö (Kan användas för framtida audio-triggers eller hit-markers)
    _queue.push({ x, y, amount: displayAmount, type, age: 0 });
    
    // Generera grafiken
    spawnDamageNumber(x, y, displayAmount, type);
}

// Alias för bakåtkompatibilitet
export const emitDamageNumber = pushDamageEvent;

/**
 * Körs varje frame av main game-loop.
 * Uppdaterar alla grafiska siffror och rensar gammal data.
 */
export function updateDamageNumbers(deltaSeconds) {
    tickFloatingNumbers(deltaSeconds);
    
    // Reverse-loop för säker borttagning från array
    for (let i = _queue.length - 1; i >= 0; i--) {
        _queue[i].age += deltaSeconds;
        if (_queue[i].age > MAX_AGE) {
            _queue.splice(i, 1);
        }
    }
}

export function getDamageEvents() { 
    return _queue; 
}

export function clearDamageEvents() { 
    _queue.length = 0; 
}
