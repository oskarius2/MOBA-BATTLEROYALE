# 🤖 BOT INTEGRATION GUIDE — BotBrain x Game-Loop

## Översikt

`BotBrain` är en **Finite State Machine (FSM)** som styr bot-entiteters AI i realtid. Den är:

- ✅ **100% deterministisk** — använder `bot.seed + tick`, INGEN `Math.random()` i AI-loopen
- ✅ **Supersnabb** — enkel vektor-matematik, ingen pathfinding-overhead
- ✅ **Modulär** — pluggas direkt in i game-loop via `bot.brain.update(gameState)`
- ✅ **Prioriterad FSM** — fyra tillstånd med strikt hierarki

---

## 🧠 FSM Tillstånd (prioritetsordning)

1. **CIRCLE_ESCAPE** (Högst prio)  
   Om botten är utanför den krympande BR-zonen → rör sig mot cirkelns mitt

2. **PLAYER_AGGRO**  
   Om en spelare/bot syns inom `VISION_RADIUS` → chasar och attackerar målet

3. **JUNGLE_FARM**  
   Om inga fiender syns, men jungle-camps finns tillgängliga → farmrar XP/guld

4. **WANDERING** (Lägst prio)  
   Patrullerar deterministiskt på kartan (seed-baserad, ingen slumpa)

---

## 📋 Hur man använder BotBrain

### 1. Skapa en Bot-entitet

```javascript
import { Bot } from './core/entities/bot.js';

// Skapa en bot med position, klass och seed
const bot = new Bot(
    1500,              // x-position
    1500,              // y-position
    'Warrior',         // hero-klass
    Math.floor(Math.random() * 10000) // seed för deterministisk AI
);
```

### 2. Uppdatera bots i game-loop

I `core/game-loop.js`, lägg till bot-uppdatering i `updateGameLogic()`:

```javascript
export function updateGameLogic(deltaTime) {
    if (!gameState.running) return;

    // ... befintlig kod ...

    // Bot-uppdateringar (ny kod)
    if (window._bots && Array.isArray(window._bots)) {
        for (const bot of window._bots) {
            bot.update({
                circleCenter: Blight.center,
                circleRadius: Blight.currentRadius,
                circleShrinking: true, // eller baserat på game state
                players: [_player], // lista på alla players
                bots: window._bots,  // lista på alla bots
                tick: gameState.tick ?? 0,
                deltaTime,
            });
        }
    }
}
```

### 3. Rita bots i render-loopen

I `core/game-loop.js`, lägg till i `renderGame()`:

```javascript
export function renderGame(deltaTime, time = 0) {
    // ... befintlig kod ...

    // Rita alla bots
    if (window._bots && Array.isArray(window._bots)) {
        for (const bot of window._bots) {
            if (!bot.isDead && isObjectVisible(bot, _viewportWidth, _viewportHeight)) {
                bot.draw(_ctx, camera);
            }
        }
    }

    // ... rest av rendering ...
}
```

---

## 🔧 Konfiguration

### BotBrain konfigurerbara värden

I `core/entities/bot-brain.js`, justera dessa för att finjustera AI-beteendet:

```javascript
// Patrollerings-radie för WANDERING state
this.patrolRadius = 400; // pixels (ändra för att påverka patroll-area)

// Patrollerings-hastighet (råd/tick)
this.patrolAngleSpeed = 0.02;

// Vision-range importeras från world-config
// VISION_RADIUS = 450 px
```

### Bot-stats

I `core/entities/bot.js`, ändra base-stats:

```javascript
this.maxHp = 130;           // justerad per klass
this.speed = 3.6;           // px/tick
this.projectileDamage = 26; // baserat på heroClass
```

---

## 🎯 GameState Input Format

`BotBrain.update(gameState)` förväntar:

```javascript
{
    circleCenter: { x: 3000, y: 3000 },  // BR-zonens mitt
    circleRadius: 2500,                  // BR-zonens radie i pixels
    circleShrinking: true,               // bool: expanderar eller krymper zonen
    players: [ Player { x, y, hp, ... } ], // lista på alla player-objekt
    bots: [ Bot { x, y, hp, ... } ],       // lista på alla bot-objekt
    tick: 120,                            // frame-nummer (för deterministik)
    deltaTime: 16,                        // millisekunder sedan senaste frame
}
```

---

## 🧮 Deterministisk Pathfinding Detaljer

### WANDERING-logiken (100% seed-baserad)

```javascript
_executeWandering(gameState, tick) {
    const seedModifier = this.bot.seed ?? 1;
    
    // Patrollerings-vinkeln uppdateras uniform baserat på seed
    this.patrolAngle += patrolSpeed;
    
    // Home-base beräknas från seed (reproducerbar)
    const homeX = (this.bot.seed) % CANVAS_WIDTH;
    const homeY = ((this.bot.seed) * 71) % CANVAS_HEIGHT;
    
    // Botten rör sig i en cirkel runt hemmet
    const circleX = homeX + Math.cos(this.patrolAngle) * this.patrolRadius;
    const circleY = homeY + Math.sin(this.patrolAngle) * this.patrolRadius;
    
    // Beräkna rörelsevektor
    // ... rörelsekod ...
}
```

**Varför seed-baserat?**
- Två bots med samma seed rör sig identiskt (för testing & replicering)
- Två bots med olika seeds rör sig olika (för variation)
- INGEN `Math.random()` — helt deterministisk, server-auditerbar

---

## 📊 State Transitions Exempel

```
Bot är vid (1500, 1500) på 6000×6000 kartan.
BR-zon mitt: (3000, 3000), radie 2500.

┌─────────────────────────────────────────┐
│ Frame 1: Bot är UTANFÖR zonen           │
│ → CIRCLE_ESCAPE (högst prio)            │
│ → Rör sig mot (3000, 3000)              │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ Frame 100: Bot är INNANFÖR, ingen fiende│
│ → Närmaste jungle-camp: (1600, 1600)    │
│ → JUNGLE_FARM                           │
│ → Rör sig mot campet                    │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ Frame 200: Spelare dyker upp!           │
│ → Spelare inom VISION_RADIUS (450 px)   │
│ → PLAYER_AGGRO                          │
│ → Chasar och attackerar                 │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ Frame 280: Spelaren försvinner (farväl) │
│ → Ingen fiende inom range               │
│ → Inga tilgängliga camps                │
│ → WANDERING                             │
│ → Patrullerar deterministiskt           │
└─────────────────────────────────────────┘
```

---

## 🚀 Next Steps: Vad som behöver byggas vidare

1. **Attacklogik** — Bot-till-spelare-skador, cooldowns, abilities
2. **Team-system** — Skilja mellan allierade och fiender
3. **Creep-interaktion** — Bots farmrar jungle-creeps för XP/guld
4. **Collision-handtering** — Bots undviker varandra vid väg
5. **Nätverks-replikering** — GameState från server → all client-bots uppdateras synkroniserat

---

## 🐛 Debugging

### Logga aktuellt FSM-tillstånd

```javascript
console.log(`Bot #${bot.id}: STATE = ${bot.brain.currentState}, Target = ${bot.brain.aggroTarget}`);
```

### Visualisera vision-range

I render-loopen, rita en cirkel omkring boten:

```javascript
ctx.beginPath();
ctx.arc(screenX, screenY, VISION_RADIUS, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
ctx.lineWidth = 1;
ctx.stroke();
```

### Verifiera seed-reproducerbarhet

Skapa två bots med samma seed, kör 100 frames → båda bör ha samma position + rörelse-historik.

---

## 📚 Filer att känna till

- `core/entities/bot-brain.js` — FSM-hjärnan (MODIFIERA INTE)
- `core/entities/bot.js` — Bot-klassen (kan utökas med abilities senare)
- `core/game-loop.js` — Integrationspunkt för bot-uppdateringar
- `data/world-config.js` — VISION_RADIUS, JUNGLE_CAMP_LOCATIONS, kartgränser
- `core/balance-config.js` — Bot-stats och förhållanden mellan klasser

---

## 💡 Design Philosophy

BotBrain är avsiktligt **enkel** för att:
1. Köra 100+ bots på 60 FPS utan stottning
2. Kunna replikeras exakt över nätverk (seed-baserad)
3. Inte påverka player-inputen eller combat-loop
4. Kunna debuggas och testades enkelt
5. Vara beredd för senare optimeringar (quadtree-baserad vision, osv)

**Ingen AI ska lyckas besegra en spelare genom puro intelligens.** BotBrain är bara **navigationlogik + target-prioritering**. Sköl skadas genom samma combat-system som spelare.

---

## ✅ Checklist: Integration Complete

- [ ] `core/entities/bot-brain.js` skapad ✓
- [ ] `core/entities/bot.js` skapad ✓
- [ ] Bot-uppdatering pluggad in i `game-loop.js`
- [ ] Bot-rendering pluggad in i `renderGame()`
- [ ] Test: 4 bots skapade och synliga på kartan
- [ ] Test: CIRCLE_ESCAPE fungerar när bot går utanför zone
- [ ] Test: PLAYER_AGGRO triggerar när spelare är nära
- [ ] Test: JUNGLE_FARM targetas när ingen fiende syns
- [ ] Test: WANDERING sker deterministiskt utan slumpa
