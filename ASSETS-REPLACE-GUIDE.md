# Byta sprites & skills-referens

Guide för att byta ut grafik utan att röra spellogik. Teknisk spec (mått, grid): se [`ASSETS-SPEC.md`](ASSETS-SPEC.md).

---

## Så funkar det

```
assets/manifest.json  →  SpriteSheetManager  →  getFrame()  →  drawImage()
                              ↓
                    dimension-validering
                              ↓
              OK + useSprites:true  →  riktiga sprites
              FAIL eller useSprites:false  →  procedural fallback (inga cirklar i spelet, bara kod-render)
```

Spelet **kraschar inte** om en sheet är fel. För liten PNG loggas varning i konsolen och den hjälten/creepen ritas proceduralt tills filen är korrekt.

---

## Snabbväg: byt PNG direkt

Om du redan har färdiga PNG-spritesheets i rätt format:

1. Ersätt filen på **exakt sökväg** (se tabell nedan).
2. Kontrollera mått (minsta krav):

   | Kategori | Fil | Minsta storlek | Cell | Grid |
   |----------|-----|----------------|------|------|
   | Hero | `assets/heroes/warrior.png` | 768 × 512 | 128 × 128 | 6 × 4 |
   | Hero | `assets/heroes/mage.png` | 768 × 512 | 128 × 128 | 6 × 4 |
   | Hero | `assets/heroes/ranger.png` | 768 × 512 | 128 × 128 | 6 × 4 |
   | Hero | `assets/heroes/viking.png` | 768 × 512 | 128 × 128 | 6 × 4 |
   | Hero | `assets/heroes/hybrid.png` | **768 × 1024** | 128 × 128 | 6 × 8 |
   | Creep | `assets/creeps/scout.png` | 384 × 384 | 96 × 96 | 4 × 4 |
   | Creep | `assets/creeps/warrior.png` | 384 × 384 | 96 × 96 | 4 × 4 |
   | Creep | `assets/creeps/ancient.png` | 384 × 384 | 96 × 96 | 4 × 4 |

3. Sätt `"useSprites": true` i [`assets/manifest.json`](assets/manifest.json) (om det inte redan är det).
4. **Hård reload** i webbläsaren (Ctrl+F5). Server måste köras via HTTP (`npx serve .`), inte `file://`.

**Radordning** (alla heroes utom Hybrid rad 4–7):

| Rad | Animation |
|-----|-----------|
| 0 | idle |
| 1 | walk |
| 2 | attack |
| 3 | transition |

**Hybrid** (8 rader): rad 0–3 = MELEE, rad 4–7 = RANGED (samma radordning per stance).

**Creeps** (4 rader): idle → walk → attack → transition.

---

## Alternativ: JPG-källor → bake-script

Om källan är JPG (t.ex. från AI-export) utan alpha:

1. Lägg JPG i `assets/heroes/` eller `assets/creeps/`.
2. Uppdatera källmappningen i [`scripts/bake-art-sheets.py`](scripts/bake-art-sheets.py):

   ```python
   HERO_TARGETS = {
       'warrior.png': ('heroes/din-nya-warrior.jpg', 768, 512),
       # ...
   }
   CREEP_TARGETS = {
       'scout.png': ('creeps/din-nya-scout.jpg', 384, 384),
       # ...
   }
   ```

3. Kör från projektroten:

   ```bash
   pip install pillow
   python scripts/bake-art-sheets.py
   ```

   Scriptet:
   - tar bort grå rut-transparent bakgrund (heuristik för checkerboard-JPG),
   - skalar till spec-mått,
   - skriver **bara** över de 8 PNG-filerna som manifest pekar på,
   - lämnar JPG-källorna kvar.

4. Ladda om spelet.

### Nuvarande källmappning (i bake-scriptet idag)

| PNG-mål | JPG-källa |
|---------|-----------|
| `heroes/warrior.png` | `heroes/watermarked_img_13228795930869720989.jpg` |
| `heroes/ranger.png` | `heroes/959fbeca-37fe-481f-b89f-3d8a5662749a.jpg` |
| `heroes/viking.png` | `heroes/5744e91c-bf99-4d99-bf00-1374156920c8.jpg` |
| `heroes/mage.png` | `heroes/watermarked_img_13178481383848877501.jpg` |
| `heroes/hybrid.png` | `heroes/3da63731-b5e5-4da6-a026-8d52dcc116ca.jpg` |
| `creeps/scout.png` | `creeps/1aec59f2-f290-41b6-8fbd-b1f9932e3d6d.jpg` |
| `creeps/warrior.png` | `creeps/924a6566-ef9b-4b45-a540-82270136c90b.jpg` |
| `creeps/ancient.png` | `creeps/9baddc46-c58e-400e-8658-fc6d383c5fb3.jpg` |

Byt JPG-fil eller uppdatera raden i `HERO_TARGETS` / `CREEP_TARGETS` när du har ny art.

---

## Stäng av sprites (tillbaka till procedural)

I `assets/manifest.json`:

```json
"useSprites": false
```

Ladda om. Ingen annan fil behöver ändras.

---

## Felsökning

| Symptom | Trolig orsak | Åtgärd |
|---------|--------------|--------|
| Konsol: `rejected — got 768x128, need >= 768x512` | En rad placeholders / för kort sheet | Leverera full 4-raders sheet eller kör bake-script |
| Fortfarande procedural trots PNG | `useSprites: false` eller validering fail | Sätt `true`, fixa mått, reload |
| Svart/låda runt figur | JPG utan riktig alpha | Exportera PNG med transparent bakgrund, eller förbättra `key_checkerboard()` i bake-scriptet |
| Hybrid ranged ser fel ut | Fel radordning i sheet | RANGED måste ligga på rad 4–7 (idle/walk/attack/transition) |
| Vattenstämpel syns | Vattenmärkt käll-JPG | Byt källa i bake-scriptet och kör om |
| Inget laddas | `file://` eller fel server | `npx serve .` och öppna `http://localhost:3000` |

Verifiera efter byte:

```bash
node scripts/verify-design.mjs
node scripts/full-audit.mjs
```

---

## Alla spelarskills

Kontroller i match:

| Tangent | HUD-slot | Kod |
|---------|----------|-----|
| **LMB** | Attack | Grundattack |
| **1** | Skill 1 | `q` |
| **2** | Skill 2 | `w` |
| **3** | Ultimate | `e` |

Riktning för de flesta skills: **muspekare / sikte** i världen. Källor: [`data/hero-roster.js`](data/hero-roster.js), [`core/ability-engine.js`](core/ability-engine.js), [`core/balance-config.js`](core/balance-config.js).

---

### Warrior — Bladed Duelist

| Slot | Namn | CD | Vad den gör |
|------|------|-----|-------------|
| LMB | **Attack** | 0,6 s | Närstrid, 90° båge, räckvidd 90 px, skada ×1,2 |
| 1 | **Dash Strike** | 7 s | Dash mot pekare (max 420 px), träffskada i liten cirkel vid landning |
| 2 | **Blade Whirl** | 14 s | Spin runt spelaren, radie 130 px, omedelbar AOE-skada |
| 3 | **Bladestorm** | 55 s | Ult: 1,5 s roterande storm, upprepade AOE-ticks runt spelaren |

---

### Ranger — Swift Archer

| Slot | Namn | CD | Vad den gör |
|------|------|-----|-------------|
| LMB | **Attack** | 0,35 s | Pil-projektil mot pekare, skada ×1,1 |
| 1 | **Volley** | 10 s | 5 pilar i spridning mot sikte |
| 2 | **Tumble** | 6 s | Rull-dash 350 px i siktriktning (undvikning) |
| 3 | **Arrow Rain** | 60 s | Ult: 4 s pilregn i cirkel vid pekaren på kartan |

---

### Tank-Viking — Nord Vanguard

| Slot | Namn | CD | Vad den gör |
|------|------|-----|-------------|
| LMB | **Attack** | 0,8 s | Enkel närstrid mot närmaste mål i 75 px, skada ×0,8 |
| 1 | **Ground Slam** | 9 s | Kegel-slam (60°) 220 px framåt, skada ×1,5 |
| 2 | **Iron Shield** | 18 s | Sköldbuff i 2,5 s (`isShielded`) |
| 3 | **Valhalla's Call** | 65 s | Ult: +28 % fart i 5 s (expanderande aura) |

---

### Hybrid — Shapeshifter

| Slot | Namn | CD | Vad den gör |
|------|------|-----|-------------|
| LMB | **Attack** | 0,5 s (när) / 0,45 s (dist) | **MELEE:** båge 65 px, ×0,9. **RANGED:** pil ×0,9. Beror på stance |
| 1 | **Stance Swap** | 1,5 s | Växlar MELEE ↔ RANGED (byter spritesheet-rad 0–3 / 4–7) |
| 2 | **Shadow Dash** | 18 s | Teleport till pekaren; lämnar decoy-cirkel på gamla positionen |
| 3 | **Equilibrium** | 50 s | Ult: AOE-burst radie 60 px; extra +15 skada i MELEE-stance |

---

### Mage — Pyromancer

| Slot | Namn | CD | Vad den gör |
|------|------|-----|-------------|
| LMB | **Attack** | 0,4 s | Eldboll-projektil mot pekare |
| 1 | **Fireball** | 8 s | Kraftig eldboll, skada ×2,5 |
| 2 | **Flame Dash** | 12 s | Dash 500 px + brinnande cirklar längs sträckan (DoT-zoner) |
| 3 | **Meteor Strike** | 70 s | Ult: fördröjd meteor vid pekare, explosion radie 300 px, skada ×2,5 |

---

## Sammanfattning — alla 15 namngivna skills

| # | Hjälte | Q (1) | W (2) | E (3) |
|---|--------|-------|-------|-------|
| 1 | Warrior | Dash Strike | Blade Whirl | Bladestorm |
| 2 | Ranger | Volley | Tumble | Arrow Rain |
| 3 | Tank-Viking | Ground Slam | Iron Shield | Valhalla's Call |
| 4 | Hybrid | Stance Swap | Shadow Dash | Equilibrium |
| 5 | Mage | Fireball | Flame Dash | Meteor Strike |

Plus **grundattack (LMB)** per klass — se tabellerna ovan.

---

## Filer du *inte* behöver röra vid art-byte

- `index.html`, `core/ability-engine.js`, `core/entities/player.js` — gameplay oförändrat
- `ui/hud.js` — skill-namn och ikoner hämtas från `HERO_ROSTER` automatiskt
- Ändra cooldown/skada i [`core/balance-config.js`](core/balance-config.js) (`ABILITY_CONFIG`), inte i manifest

---

## Relaterade filer

| Fil | Roll |
|-----|------|
| [`assets/manifest.json`](assets/manifest.json) | Sökvägar, `useSprites`, frameSize |
| [`scripts/bake-art-sheets.py`](scripts/bake-art-sheets.py) | JPG → PNG bake |
| [`core/rendering/sprite-sheet-manager.js`](core/rendering/sprite-sheet-manager.js) | Laddning + validering |
| [`ASSETS-SPEC.md`](ASSETS-SPEC.md) | Full artist-spec |
