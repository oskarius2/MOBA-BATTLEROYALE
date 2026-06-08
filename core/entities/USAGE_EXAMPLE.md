# 🎮 USAGE EXAMPLE: BotBrain Integration

## Praktiskt exempel: Lägg till 4 stycken bots på kartan

### Steg 1: Skapa bots-arrayen (i game-init.js eller index.html)

```javascript
// I game-init.js eller en ny file: core/bot-manager.js

import { Bot } from './core/entities/bot.js';

export let Bots = [];

export function initializeBots() {
    Bots = [];
    
    // Skapa 4 bots på olika positioner
    const positions = [
        { x: 1000, y: 1000, heroClass: 'Warrior', seed: 101 },
        { x: 5000, y: 1000, heroClass: 'Mage', seed: 102 },
        { x: 1000, y: 5000, heroClass: 'Ranger', seed: 103 },
        { x: 5000, y: 5000, heroClass: 'Tank-Viking', seed: 104 },
    ];

    for (const pos of positions) {
        Bots.push(new Bot(pos.x, pos.y, pos.heroClass, pos.seed));
    }

    console.log(`Initialized ${Bots.length} bots`);
}

export function resetBots() {
    Bots = [];
}
```

### Steg 2: Uppdatera game-loop.js

**Lägg till denna import i toppen:**

```javascript
import { Bots, initializeBots, resetBots } from './bot-manager.js';
```

**I `updateGameLogic()`, lägg till bot-uppdateringar före creep-loopen:**

```javascript
export function updateGameLogic(deltaTime) {
    if (!gameState.running) return;

    // ... befintlig kod ...

    // 🆕 BOT UPDATES (ny sektion)
    if (Bots && Bots.length > 0) {
        for (let i = Bots.length - 1; i >= 0; i--) {
            const bot = Bots[i];
            
            // Skapa gameState för bot
            const botGameState = {
                circleCenter: Blight.center,
                circleRadius: Blight.currentRadius,
                circleShrinking: true,
                players: [_player],
                bots: Bots,
                tick: gameState.tick ?? 0,
                deltaTime,
            };
            
            // Uppdatera bot-hjärnan
            bot.update(botGameState);

            // Ta bort döda bots
            if (bot.isDead) {
                Bots.splice(i, 1);
                continue;
            }

            // Bot-till-spelare-kollision (skada)
            const distToPlayer = Math.hypot(_player.x - bot.x, _player.y - bot.y);
            if (distToPlayer < _player.radius + bot.radius) {
                _player.takeDamage(0.5 * deltaTime / 16);
            }
        }
        
        // Uppdatera game-tick för nästa frame
        gameState.tick = (gameState.tick ?? 0) + 1;
    }

    // ... resten av game-loop ...
}
```

**I `renderGame()`, lägg till bot-rendering före projectiler:**

```javascript
export function renderGame(deltaTime, time = 0) {
    tickWeaponArcAnimation(deltaTime / 1000);
    _ctx.clearRect(0, 0, _viewportWidth, _viewportHeight);
    _ctx.save();
    _ctx.translate(-camera.x, -camera.y);

    // ... befintlig rendering (background, biomes, etc) ...

    // 🆕 RENDER BOTS
    for (const bot of Bots) {
        if (!bot.isDead && isObjectVisible(bot, _viewportWidth, _viewportHeight)) {
            bot.draw(_ctx, camera);
        }
    }

    // ... creeps, items, projectiles, etc ...
}
```

### Steg 3: Initiera bots när spelet startar

I `game-init.js`, lägg till i `initializeGame()`:

```javascript
export function initializeGame({ heroKey = 'mage' } = {}) {
    // ... befintlig initialization ...

    resetBots();           // Töm bots-arrayen
    initializeBots();      // Skapa nya bots
    
    // ... rest av init ...
}
```

---

## 🧪 Minimal Test: Verifiera att det fungerar

Lägg denna kod i `index.html` console eller test-fil:

```javascript
// Test 1: Verifiera att BotBrain importeras
import { BotBrain } from './core/entities/bot-brain.js';
console.log('✓ BotBrain imported:', typeof BotBrain);

// Test 2: Verifiera att Bot importeras
import { Bot } from './core/entities/bot.js';
const testBot = new Bot(3000, 3000, 'Warrior', 42);
console.log('✓ Test bot created:', testBot);
console.log('  Position:', { x: testBot.x, y: testBot.y });
console.log('  Brain state:', testBot.brain.currentState);

// Test 3: Simulera en uppdatering
const mockGameState = {
    circleCenter: { x: 3000, y: 3000 },
    circleRadius: 2500,
    circleShrinking: false,
    players: [],
    bots: [testBot],
    tick: 1,
    deltaTime: 16,
};
testBot.update(mockGameState);
console.log('✓ After update - Position:', { x: testBot.x, y: testBot.y });
console.log('✓ After update - Velocity:', { vx: testBot.vx, vy: testBot.vy });
console.log('✓ After update - Brain state:', testBot.brain.currentState);
```

**Förväntat output:**
```
✓ BotBrain imported: function
✓ Test bot created: Bot {...}
  Position: {x: 3000, y: 3000}
  Brain state: WANDERING
✓ After update - Position: {x: ~3001.xx, y: ~3000.xx}
✓ After update - Velocity: {vx: ..., vy: ...}
✓ After update - Brain state: WANDERING
```

---

## 🎯 Integration Checklist

### Filer att modifiera:

- [ ] `core/game-loop.js`
  - [ ] Importera `Bots, initializeBots, resetBots`
  - [ ] Lägg till bot-update-loop i `updateGameLogic()`
  - [ ] Lägg till bot-render-loop i `renderGame()`

- [ ] `core/game-init.js`
  - [ ] Importera `initializeBots, resetBots`
  - [ ] Anropa `initializeBots()` i `initializeGame()`
  - [ ] Anropa `resetBots()` i `resetArrays()`

### Nya filer skapade:

- [x] `core/entities/bot-brain.js` — ✓ DONE
- [x] `core/entities/bot.js` — ✓ DONE
- [x] `core/bot-manager.js` — (eller lägg Bots-arrayen direkt i game-loop.js)

### Testing:

- [ ] 4 bots spawnar på kartan när spelet börjar
- [ ] Bots rör sig utan att stanna
- [ ] Bots slutar ropa Warrior/Ranger/etc klasserna korrekt
- [ ] Bots tar skada när speler attackerar dem
- [ ] Bots töms när nytt spel startar

---

## 🔄 Deterministic Test (Seed-reproducerbarhet)

```javascript
// Skapa två bots med samma seed
const bot1 = new Bot(3000, 3000, 'Warrior', 999);
const bot2 = new Bot(3000, 3000, 'Warrior', 999);

// Kör 100 frames med samma gameState
for (let i = 0; i < 100; i++) {
    const gs = { /* ... */ };
    bot1.update(gs);
    bot2.update(gs);
}

// Verifiera att båda är på samma position
console.assert(bot1.x === bot2.x && bot1.y === bot2.y,
    'Seed-baserad determinism FAILED');
console.log('✓ Both bots at:', { x: bot1.x, y: bot1.y });
```

**Förväntad resultat:** Båda bots är exakt på samma position efter 100 frames.

---

## 💬 FAQ

### Q: Kan jag skapa bots med olika level?
**A:** Ja, modifiera `new Bot()` eller sätt `bot.level = 5` efteråt. Stats uppdateras via `bot.levelUp()`.

### Q: Vad händer när en bot dör?
**A:** `bot.isDead = true` och den tas bort från `Bots`-arrayen nästa frame.

### Q: Kan två bots attackera varandra?
**A:** Nu är de potentiella targets för varandra i PLAYER_AGGRO. Full attack-logik implementeras senare.

### Q: Varför ingen `Math.random()` i WANDERING?
**A:** För att det måste vara reproducerbart over network. Alla bots får samma gameState, så de måste agera deterministiskt.

### Q: Hur långsamt blir det med 100 bots?
**A:** BotBrain är O(1) — bara vector-matematik. Kan säkert hantera 100+ bots på 60 FPS. Begränsningen är snarare rendering.

---

## 📞 Support

Om du kör på problem:

1. Verifiera att `node -c core/entities/bot-brain.js` passar syntax
2. Kolla att `gameState` har alla obligatoriska fält
3. Lägg `console.log(bot.brain.currentState)` för debugging
4. Rita `VISION_RADIUS`-cirklar för att visualisera target-finding

**Lycka till! 🚀**
