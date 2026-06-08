# 🌲 PROJECT MOBA-BATTLEROYALE – ARCHITECTURE & AGENT MANIFESTO

> **⚠️ ATTENTION ALL AI AGENTS / CURSOR DEVELOPERS:** > Read this document completely before modifying, refactoring, or generating any code in this workspace.

ROADMAP FOR CHANGES IF YOU ARE LOST


moba-battleroyale/
├── index.html                  ← 492 rader (var 1453) — bara bootstrap
│
├── core/
│   ├── balance-config.js       ← siffror: allt bor här
│   ├── balance-validator.js    ← kör i konsolen för att validera
│   ├── ability-engine.js       ← abilities, projektiler, partiklar
│   ├── canvas-renderer.js      ← all rendering (orörd)
│   ├── economy-engine.js       ← gold, loot, pity
│   ├── camera.js               ← kamera + koordinater
│   ├── inventory.js            ← pickup + shop-köp
│   ├── input.js                ← tangentbord + mus
│   ├── game-loop.js            ← update + render
│   ├── game-init.js            ← bootstrap + setupCreeps
│   ├── entities/
│   │   ├── player.js           ← Player-klassen
│   │   ├── creep.js            ← Creep-klassen
│   │   ├── projectile.js       ← Projectile-klassen
│   │   └── item.js             ← DroppedItem-klassen
│   └── world/
│       └── blight.js           ← Blight/storm-logik
│
├── data/
│   ├── balance-config.js       ← (re-exporteras från core/)
│   ├── hero-roster.js          ← 5 hjältar, kalibrerade stats
│   ├── shop-catalog.js         ← 15 items, 3 arketyper
│   └── world-config.js         ← CREEP_TYPES, JUNGLE_CAMPS, Blight
│
└── ui/
    ├── hud.js                  ← HUD-uppdatering
    ├── shop-interface.js       ← shop-UI (orörd)
    └── menu-interface.js       ← meny-system (orörd)



---

## 🖼️ SPRITE ASSETS (FIRST-TIME SETUP)

Placeholder hero/creep spritesheets live under `assets/` and are tracked in git. If sheets are missing on a fresh clone, regenerate them before launching the standalone client:

```powershell
powershell -File scripts/generate-placeholder-sheets.ps1
```

Without valid sheets, `USE_SPRITE_RENDERING` falls back to procedural `drawHero*` / `drawCreepModel` routines.

---

## 🎯 THE CORE VISION: MULTIPLAYER BATTLE-ROYALE (CRITICAL)
We are building a top-down, dark fantasy MOBA designed from the ground up as a **Massive Multiplayer Battle-Royale** running on a 6000x6000px logical world map. 

Even if current testing happens in a local standalone client, **the entire codebase must treat states as if they are running on a server/client network architecture.** Every player action will eventually be replicated over network packages.

### 🛑 CRITICAL MULTIPLAYER LAWS FOR AGENTS:
* **Pure Object Mutation via Dependency Injection:** Do NOT read or write to global variables inside core modules. Everything (e.g., `player`, `creeps`, `deltaTime`, `projectiles`) must be explicitly passed into functions as arguments.
* **No Client-Side Authority on Combat:** Attacks, damage loops, and position changes must be purely deterministic and mathematical so they can be validated by a server pipeline later.
* **Separation of Concerns:** Core logic (`core/`) must never talk directly to the DOM or handle styling. UI (`ui/`) and Rendering (`canvas-renderer.js`) should act as passive observers that simply draw or reflect the current data matrix.

---

## 🏗️ PROJECT DIRECTORY STRUCTURE

* `index.html` — The main presentation layer, viewport canvas, input manager, and central `requestAnimationFrame` game loop runner.
* `core/` — Pure logical state engines (No DOM dependencies, no rendering hooks).
    * `ability-engine.js` — The master router for hero capabilities, cooldown states, and vector physics (e.g., Bladestorm pull).
    * `canvas-renderer.js` — The high-performance visual processing pipeline. Processes map tiling, particles, and character sprite routines.
    * `economy-engine.js` — Handles bounties, drop tables, item pricing, and shopping logic.
* `ui/` — Frontend HUD wrappers and event handlers.
    * `shop-interface.js` — Handles layout injection and rendering for the shop overlays.

---

## 🧪 SURGICAL PATCH PROCEDURES (HOW TO INTEGRATE CODE SAFELY)

We are actively expanding the engine using parallel AI agents (Gemma processing massive graphics updates externally). To prevent catastrophic code overwrites, breaking brackets, or regression errors, you must follow these rules for **Surgical Integration**:

### 1. Zero Monolithic Overwrites
* Never replace an entire file unless explicitly instructed.
* If a script or module (like `canvas-renderer.js`) receives a massive update from Gemma, examine the delta carefully.
* Isolate the specific helper functions or rendering passes (e.g., river biome tiling, weapon arc rendering) and inject them hooks-by-hooks.

### 2. Safeguard Combat and State Mathematics
* Our current systems have verified distance formulas, cone/circle damage sweeps against the live `Creeps` array, and strict map clamping (`MAP_MIN=32 / MAP_MAX=5968`).
* Any incoming visual update must wrap *around* these existing equations, never delete them.

### 3. High Performance Pass Rules (60 FPS Target)
* **STRICTLY NO `shadowBlur`:** All visual glow or spell effect depth must be achieved using alpha layering (`ctx.globalAlpha`), sharp multi-line paths, or radial gradients.
* **Viewport Culling Required:** All terrain arrays, brushes, and particle pooling streams (`GlobalParticles.draw`) must actively filter against `CameraInstance` to skip off-screen graphics execution.
* **Dirty-Cached UI:** DOM operations must only execute if `window.hudCache.isDirty` is set to `true`.

---

## 🚀 CURRENT OBJECTIVE
We are currently wiring up complex biomes (Riverbed water slows, Blight zones, Dense Brush line-of-sight), unique weapon basic attack swing paths, and intense multi-particle explosions (Mage Meteor bursts). Integrate incoming snippets with maximum precision. Maintain unbroken syntax trees.