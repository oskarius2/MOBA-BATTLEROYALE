# 🗺️ MOBA BATTLE ROYALE — BIOME MAP REFERENCE

## Strategic Map Overview (6000×6000 pixels)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 0                                                              6000  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 0    NEUTRAL GRASSLAND — JUNGLE ARENA                             0 │
│      └─── Jungle Camps (XP/Gold farming)                           │
│      └─── Creep spawns every 30 seconds                          1500
│      └─── Open combat zone                                         │
│                                                                     │
│     🏕 Camp 1: (1600, 1600)                                        │
│     🏕 Camp 2: (4400, 3600)                                        │
│     🏕 Camp 3: (3000, 800)                                         │
│     🏕 Camp 4: (1200, 4400)                                        │
│                                                                     │
│                          ╔════════════════════════════════╗         │
│                          ║                                ║         │
│                    2000  ║   BLIGHTED WOODS               ║ 2000    │
│                          ║   (Corrupted Quadrant)         ║         │
│                          ║   X > 4500, Y < 1500           ║         │
│                          ║                                ║         │
│                          ║   Effects:                     ║         │
│                          ║   • +5 dmg/sec (debuff)        ║         │
│                          ║   • Purple corruption motes    ║         │
│                          ║   • Uncontested farming zone   ║         │
│                          ║                                ║         │
│                          ╚════════════════════════════════╝         │
│                                                                     │
│      JUNGLE ARENA (Main combat zone)                               │
│      ─────────────────────────────────────                   3000  │
│                                                                     │
│                                                                     │
│      ╔════════════════════════════════════════════════════════╗    │
│      ║                                                        ║    │
│  4000║    🌊 WINDING RIVERBED 🌊                              ║    │
│      ║    Y ∈ [4000, 4400], X ∈ [200, 5800]                  ║    │
│      ║                                                        ║    │
│      ║    Effects:                                           ║    │
│      ║    • -30% movement speed (slowing water)              ║    │
│      ║    • Blue tint + wave animation                       ║    │
│      ║    • Bottleneck for gank rotations                    ║    │
│      ║    • Hidden gank routes via BRUSH                     ║    │
│      ║                                                        ║    │
│      ║  [BRUSH] Dense Foliage                                ║    │
│      ║  (1200, 4100) radius 60px ← Camp vision block         ║    │
│      ║                                                        ║    │
│      ║  [BRUSH] Dense Foliage                                ║    │
│      ║  (2800, 3950) radius 50px ← Jungle passage            ║    │
│      ║                                                        ║    │
│      ║ Terrain Effects:                                      ║    │
│      ║ • Line-of-sight blocking (-50% vision range)          ║    │
│      ║ • Hide from vision wards                              ║    │
│      ║ • Ambush points for rotating teams                    ║    │
│      ║                                                        ║    │
│      ╚════════════════════════════════════════════════════════╝    │
│                                                                     │
│  5000  NEUTRAL GRASSLAND — Lower Jungle                            │
│        └─── Alternative rotation routes                            │
│        └─── Creep farming                                        5000
│        └─── Low-priority camps                                     │
│                                                                     │
│  6000  MAP BOUNDARY (position clamp at 32–5968)                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Biome Reference Table

| Biome | Zone | Effects | Tactical Use | Creeps | Items |
|-------|------|---------|--------------|--------|-------|
| **GRASS** | Everywhere except WATER/BLIGHTED/BRUSH | None | Main arena | ✓ Spawns | ✓ Drops |
| **WATER** | Y ∈ [4000, 4400], X ∈ [200, 5800] | -30% movespd | Choke point, gank bottleneck | ✓ Respawn | ✓ Drops |
| **BLIGHTED** | X > 4500, Y < 1500 | +5 dmg/s (no immunity) | High-risk farming, late-game | ✓ Rare | ✓ Epic+ |
| **BRUSH** | (1200, 4100) r60 + (2800, 3950) r50 | -50% vision range | Hide from wards, ambush | ✗ None | ✗ None |

---

## 🗺️ Camp Locations

### Camp 1: Northwest
- **Position:** (1600, 1600)
- **Nearby Biome:** GRASS
- **Accessibility:** Open, easy to rotate
- **Creep Type:** Scout (Scout ×2) + Warrior (Warrior ×2)
- **Gold/XP:** 10–15 gold, 25 XP per scout; 35 gold, 60 XP per warrior

### Camp 2: Southeast
- **Position:** (4400, 3600)
- **Nearby Biome:** Borderline BLIGHTED (just outside)
- **Accessibility:** Mid-map, moderate rotation
- **Creep Type:** Scout ×2 + Warrior ×2
- **Tactical:** Risk/reward farming near Blight damage zone

### Camp 3: North-Central
- **Position:** (3000, 800)
- **Nearby Biome:** Edge of BLIGHTED zone
- **Accessibility:** Requires river crossing or northern route
- **Creep Type:** Scout ×2 + Warrior ×2
- **Tactical:** Safe early-game farming, contested in late game

### Camp 4: Riverbank (West)
- **Position:** (1200, 4400)
- **Nearby Biome:** BRUSH (1200, 4100) within 300px
- **Accessibility:** Riverbed approach + brush concealment
- **Creep Type:** Scout ×2 + Warrior ×2
- **Tactical:** Hidden farming via BRUSH, gank risk from river

---

## 🎮 Gameplay Implications

### Early Game (0–5min)
- **Farm rotation:** Camps 1, 3, 4 are safe
- **Gank routes:** River crossing (Camp 2 or 4)
- **Vision:** Keep BRUSH zones clear of enemy wards

### Mid Game (5–15min)
- **Blighted farming:** High risk, high reward
- **Bottleneck control:** River warding + brush ambushes
- **Team rotation:** Use BRUSH to hide movements

### Late Game (15+ min)
- **BR Zone shrinking:** Forces teams toward center
- **Blighted damage:** Becomes relevant if circle contracts there
- **Final fight:** River choke → last stand at remaining safe zone

---

## 🧭 Pathfinding Around Biomes

### Water Crossing (Riverbed)
```
Option A: Direct crossing at any X ∈ [200, 5800]
  Risk: -30% movespd penalty, vulnerable
  Time: 5 seconds vs 3.5 (at normal speed)
  
Option B: Northern route around river
  Risk: None (GRASS terrain)
  Time: 2 seconds extra (longer path)
  Reward: Hide from ward vision

Option C: Southern route + BRUSH
  Risk: Vulnerable in BRUSH (reduced vision)
  Time: 1.5 seconds extra
  Reward: Ambush point for enemies
```

### Blighted Zone Navigation
```
Direct entry (X > 4500, Y < 1500):
  Damage: +5 dmg/sec
  Duration: 10 seconds to farm one camp
  Total damage: 50 HP
  Strategy: High-level heroes only (100+ HP)

Circumnavigate (Y > 1500):
  Time cost: +20 seconds
  Damage: 0
  Strategy: Early-game safer route
```

---

## 📊 Terrain Type Detection Code

```javascript
export function getTerrainType(x, y) {
    // 1. The Winding Riverbed (Y: 4000 to 4400 cuts horizontally across map)
    if (y > 4000 && y < 4400 && x > 200 && x < 5800) return 'WATER';
    
    // 2. The Blighted Woods (Top-Right Zone quadrant: X > 4500 and Y < 1500)
    if (x > 4500 && y < 1500) return 'BLIGHTED';
    
    // 3. Dense Brush clusters (Simulated specific localized foliage points)
    // Checking tactical proxy zones around riverbanks
    if (Math.hypot(x - 1200, y - 4100) < 60 || Math.hypot(x - 2800, y - 3950) < 50) {
        return 'BRUSH';
    }

    return 'GRASS';
}
```

---

## 🌍 Terrain Modifier Application

### Movement Speed Penalty (WATER)
```javascript
// In game-loop.js or ability-engine.js
const terrainType = getTerrainType(player.x, player.y);
player.speedModifier = terrainType === 'WATER' ? 0.7 : 1.0;
// Result: player.speed = player.baseSpeed * 0.7 in water
```

### Damage Over Time (BLIGHTED)
```javascript
// Apply debuff each frame
if (getTerrainType(player.x, player.y) === 'BLIGHTED') {
    if (!player.blightImmune) {
        player.takeDamage(5 * deltaTime / 1000);  // 5 dmg/sec
    }
}
```

### Vision Penalty (BRUSH)
```javascript
// Reduce vision range while in BRUSH
if (getTerrainType(player.x, player.y) === 'BRUSH') {
    visionRange *= 0.5;  // 450 → 225 pixels
}
```

---

## 🎨 Visual Reference (Biome Colors)

| Biome | Color Code | Hex | RGB |
|-------|-----------|-----|-----|
| GRASS | Green | #2d5a2d | (45, 90, 45) |
| WATER | Blue | #1e3a8a | (30, 58, 138) |
| BLIGHTED | Purple/Red | #6b1a1a | (107, 26, 26) |
| BRUSH | Dark Green | #1f4620 | (31, 70, 32) |

---

## 📐 Coordinate System

```
Top-Left: (0, 0)
Top-Right: (6000, 0)
Bottom-Left: (0, 6000)
Bottom-Right: (6000, 6000)

Center: (3000, 3000)
Clamping: [32, 5968] to allow radius collision
```

---

## 🔄 Seasonal Variations (Future)

**Blight Expansion Over Time:**
```
Game Start (0 min):    BLIGHTED zone is X > 4500, Y < 1500
Expansion (10 min):    BLIGHTED zone grows → X > 4200, Y < 1800
Expansion (20 min):    BLIGHTED zone grows → X > 3800, Y < 2200
Final Circle:          BLIGHTED may dominate endgame arena
```

---

**Map Design Philosophy:** Strategic depth through terrain tactically routing teams, forcing decisions between safety and efficiency. Water slows rotation, Blight damages greedy farmers, Brush hides movement rotations.

