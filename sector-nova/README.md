# SECTOR NOVA

*Subtitle: **SECTOR NOVA: ORB CORE***

An SFC-style (Super Famicom / SNES) vertical scrolling shooter built entirely with HTML5 Canvas and JavaScript. No external libraries or assets required.

## Current Version: v0.3 Campaign Complete

- Stage 1 through Stage 5 implemented
- Weapon items rebalanced: NORMAL / TRIPLE BEAM / PIERCE LASER / FLAME VORTEX
- Defensive item added: SHIELD BARRIER
- Recovery items added: LIFE RECOVER / MAX LIFE UP
- Stage unlock save added with title-screen NEW GAME / CONTINUE
- Local high score save added for BEST SCORE / BEST CLEAR SCORE
- Mobile browser touch support implemented
- METEOR GUARDIAN attack volume reduced for readability
- Android app packaging **not yet implemented**

v0.3 completes the first five-stage campaign while preserving the v0.2 visual style, controls, and weapon baseline.
See [STYLE_GUIDE.md](STYLE_GUIDE.md) before adding new enemies, weapons, or effects.

## Overview

SECTOR NOVA is a retro-style vertical scrolling shooting game created as an AI game development experiment. The game features pixel-art style graphics rendered entirely via the Canvas API, multiple enemy types, weapon and defensive item pickups, a multi-stage structure, and boss encounters.

## How to Play

### Launch

Open `index.html` in any modern web browser. No build tools required. A simple static server such as `python -m http.server` also works.

### Controls

| Key | Action |
|---|---|
| Arrow Keys / WASD | Move |
| Space | Shoot |
| Enter | New Game / Return to Title / Advance |
| C | Continue from latest unlocked stage on the title screen |
| 1-5 | Start an unlocked stage from the title screen |
| P | Pause / Resume |
| 1-5 | **(DEBUG, in-game only)** Switch weapon / grant shield; see below |

## Mobile Browser Support

SECTOR NOVA can be played in a mobile browser before the Android app conversion step.

- Smartphone controls use touch drag to move the player ship.
- Touch movement keeps the player slightly above the finger for visibility.
- Smartphone play uses auto-shot; existing weapon fire intervals are unchanged.
- On the title screen, NEW GAME / CONTINUE / STAGE SELECT can be tapped.
- Locked stages are shown dimmed and cannot be started by touch.
- PC keyboard controls remain available.
- The canvas prevents page scrolling, selection, and overscroll during touch play.
- A small on-screen PAUSE button appears for touch/mobile play.
- When the page becomes hidden, gameplay automatically enters PAUSED and does not auto-resume.
- Android app packaging is the next step; Capacitor / APK / PWA support is not implemented yet.

### Objective

- Shoot enemies to earn points.
- Survive until the stage boss appears, then defeat it to clear the stage.
- **Stage 1** boss: **ORB CORE**
- **Stage 2** boss: **METEOR GUARDIAN**
- **Stage 3** boss: **SHIELD CARRIER**
- **Stage 4** boss: **STORM CORE**
- **Stage 5** boss: **NEBULA HEART**
- Clear Stage 5 to reach **CAMPAIGN COMPLETE**.

## Stages

| Stage | Name | Status |
|---|---|---|
| 1 | NEBULA GATE | Implemented - basic stage, clearable with the normal shot |
| 2 | METEOR BELT | Implemented - denser enemies, items, special weapons, and new enemy types |
| 3 | IRON SWARM | Implemented - durable enemies, splitters, formations |
| 4 | STORM ZONE | Implemented - aimed fire, rushers, turrets |
| 5 | NEBULA HEART | Implemented - full campaign mix and final boss |

After clearing each stage you advance to the next implemented stage. Score carries over during normal progression, while lives, weapon, shield, player position, and invincibility are reset for a clean stage start. After clearing **Stage 5** the game shows a **CAMPAIGN COMPLETE** screen with the total score and a *PRESS ENTER TO TITLE* prompt.

Stage themes:

- **IRON SWARM** emphasizes enemy processing with Shield / Split / Formation enemies.
- **STORM ZONE** emphasizes movement pressure with shooters, rushers, and turrets.
- **NEBULA HEART** combines Stage 1-4 enemy roles with higher item support and a long final boss.

## Stage Save / Continue

SECTOR NOVA saves stage progress with browser `localStorage`; it does **not** create an external save file.

- Save key: `sectorNova_unlockedStage`
- Saved value: the highest unlocked stage number
- Initial unlocked stage: `1`
- Clearing Stage 1 unlocks Stage 2 and saves `2`
- Clearing Stage 2 unlocks Stage 3
- Clearing Stage 3 unlocks Stage 4
- Clearing Stage 4 unlocks Stage 5
- Continue starts from the latest unlocked implemented stage
- This is stage-unlock progress only, not a full mid-stage resume

Title screen options:

- `PRESS ENTER - NEW GAME`: start Stage 1 with score 0
- `PRESS C - CONTINUE`: start from the latest unlocked stage with score 0
- `UNLOCKED STAGE: X`: shows the current saved unlock
- `BEST SCORE: 00000000`: shows the highest Game Over or Campaign Complete score
- `BEST CLEAR: 00000000`: shows the highest Campaign Complete score
- `1`-`5`: start an unlocked, implemented stage

## High Score Save

SECTOR NOVA saves local high scores with browser `localStorage`; it does **not** create an external score file.

- BEST SCORE key: `sectorNova_bestScore`
- BEST SCORE is saved when Game Over or Campaign Complete beats the previous best score
- BEST CLEAR SCORE key: `sectorNova_bestClearScore`
- BEST CLEAR SCORE is saved only when Campaign Complete beats the previous best clear score
- Title screen shows BEST SCORE and BEST CLEAR
- Game Over screen shows SCORE, BEST, and NEW BEST when updated
- Campaign Complete screen shows TOTAL SCORE, BEST CLEAR, and NEW CLEAR BEST when updated
- Online rankings are not implemented

## Stage Start Rules

Each stage starts from a clean player state:

- Lives reset to maximum
- Stage-only max-life upgrades reset to the normal maximum
- Weapon resets to NORMAL
- Shield is OFF
- Player position returns to the lower center of the screen
- A short invincibility window is granted
- Score carries over only during normal Stage 1 to Stage 2 progression; NEW GAME / CONTINUE / stage select start with score 0

## Weapons & Items

You always have the **NORMAL** shot. Defeated enemies have a chance to drop a colored item. Purple, blue, and red items change the attack weapon; green items grant a separate defensive barrier; yellow and pink items affect life only.

### Implemented Weapons

| Item color | Weapon | Behaviour |
|---|---|---|
| Purple | **TRIPLE BEAM** | Purple item pickup. Fires a forward 3-way shot: center bullet plus left/right angled bullets. Useful for clearing weaker enemies across a wider area. |
| Blue | **PIERCE LASER** | Thick twin beams that pierce through enemies (each hit once). Strong against vertical columns, weaker against spread-out enemies. Slightly slows the ship while equipped. |
| Red | **FLAME VORTEX** | Short-to-mid range flame bullets that waver forward with a red/orange glow. Hits create small flame-like burst effects. |

Special-weapon rules:

- A special weapon lasts **20 seconds**, shown in the bottom-left HUD.
- **Getting hit reverts the attack weapon to NORMAL** immediately.
- Picking up another weapon item **overwrites** the current special weapon and resets the timer to 20 s.
- TRIPLE BEAM: purple item pickup grants a forward 3-way shot.

### Defensive Item

| Item color | Effect | Behaviour |
|---|---|---|
| Green | **SHIELD BARRIER** | Green item pickup. Separate from the attack weapon. The player keeps firing the current weapon while the barrier blocks one enemy hit. |

Shield rules:

- SHIELD BARRIER does **not** change `weaponType`.
- The player can keep firing while shielded.
- Blocking a hit does not reduce lives and does not remove the current weapon.
- The barrier is consumed after one blocked hit, or expires after its timer.

### Recovery Items

| Item color | Effect | Behaviour |
|---|---|---|
| Yellow | **LIFE RECOVER** | Restores 1 life up to the current max. If already full, grants a 1000 point score bonus. |
| Pink | **MAX LIFE UP** | Increases max life by 1 for the current stage only, up to 5, and fully restores current life. If max life is already capped and life is already full, grants a 1500 point score bonus. |

Recovery rules:

- LIFE RECOVER and MAX LIFE UP do **not** change the current weapon.
- LIFE RECOVER and MAX LIFE UP do **not** change SHIELD BARRIER state.
- MAX LIFE UP resets on Stage Clear / Stage Start.
- Continue and Stage Select always begin with the normal max life.

### Item Balance

Item type selection is weighted per stage. SHIELD BARRIER is slightly more common than attack weapons, LIFE RECOVER appears at a moderate rate, and MAX LIFE UP is rarer.

### Removed / Replaced

- BURST ORB is retired and no longer appears as an item or debug weapon.
- CYCLONE FIELD is retired as an attack weapon.
- Green items now grant SHIELD BARRIER instead of changing the attack weapon.

### Debug weapon keys

For tuning and testing, number keys are available only when `DEBUG_MODE = true` in `src/utils.js`:

- `1` = NORMAL
- `2` = TRIPLE BEAM
- `3` = PIERCE LASER
- `4` = FLAME VORTEX
- `5` = SHIELD BARRIER

Keys `1`-`4` switch the attack weapon. Key `5` grants the shield without changing the current attack weapon.
Set `const DEBUG_MODE = false;` for a release build; the hotkeys and title-screen debug hint are then disabled. See `handleDebugKeys()` in `src/game.js`.

## Enemies

Base types (Stage 1): straight mover (A), weaving mover (B), and a slow shooter (C).

Stage 2 introduces new enemy types:

- **Shield Enemy** - heavy front plate reduces head-on bullet/laser damage.
- **Split Enemy** - splits into small fast minions when destroyed.
- **Formation Enemy** - spawns in lines/columns; PIERCE LASER shreds a column.
- **Rush Enemy** - hovers, then dashes toward the player.
- **Turret Enemy** - settles near the top and fires aimed shots at a steady interval.

Stages 3-5 remix these enemy types instead of adding new ones. Later stages raise difficulty through enemy combinations, spawn timing, and boss endurance rather than filling the screen with unavoidable bullets.

## Boss Balance

- ORB CORE has been toned down as the first-stage tutorial boss.
- ORB CORE no longer uses extra side bullets while enraged.
- ORB CORE bullet speed and firing pressure are reduced so Stage 1 is easier to clear.
- METEOR GUARDIAN's firing cadence has been reduced from the earlier high-pressure version.
- METEOR GUARDIAN no longer fires extra side bullets while enraged; it keeps the basic 3-way pattern.
- Stage 2 boss pressure is tuned so attacks are readable and avoidable without requiring item luck.
- ORB CORE keeps the same visual structure while using a gentler tutorial-boss attack profile.
- SHIELD CARRIER is durable but keeps a readable 3-way pattern.
- STORM CORE adds extra side bullets with slower bullet speed so dodge space remains.
- NEBULA HEART is a longer final fight with restrained firing intervals and capped bullet speed.

## File Structure

```text
sector-nova/
|- index.html          # Entry point (script load order matters)
|- style.css           # Styling & pixel scaling
|- README.md           # This file
`- src/
   |- main.js          # Initialization & game loop
   |- game.js          # Game state machine, collisions, stage flow, HUD
   |- player.js        # Player ship, weapon state, shield state
   |- weapon.js        # Weapon registry, special projectiles, shield drawing
   |- powerup.js       # Colored item drops
   |- stage.js         # Stage definitions (1-5 implemented) & StageManager
   |- enemy.js         # Enemy types & stage-aware spawner
   |- bullet.js        # Bullet classes (player, enemy, boss)
   |- boss.js          # Bosses (ORB CORE / METEOR GUARDIAN / SHIELD CARRIER / STORM CORE / NEBULA HEART)
   |- effects.js       # Explosions, particles, screen flash
   |- input.js         # Keyboard input handler
   `- utils.js         # Constants & utility functions
```

## Implemented Features

- [x] Canvas rendering at 320x480 with pixel-perfect scaling
- [x] Title / Playing / Paused / Game Over / Stage Clear / Campaign Complete screens
- [x] Player movement, shooting, life system with invincibility frames
- [x] Weapon system: NORMAL + 3 special weapons via item pickup (20 s, reset on hit)
- [x] TRIPLE BEAM, PIERCE LASER, FLAME VORTEX
- [x] SHIELD BARRIER as a defensive item separate from attack weapons
- [x] LIFE RECOVER and MAX LIFE UP recovery items
- [x] Item drops with per-stage drop rate and weighted item selection
- [x] 8 enemy types incl. Shield / Split / Formation / Rush / Turret
- [x] Stage management (Stage 1-5) with carry-over progression
- [x] Stage unlock save via localStorage and title-screen continue
- [x] BEST SCORE / BEST CLEAR SCORE save via localStorage
- [x] Mobile browser touch movement, auto-shot, and touch pause button
- [x] METEOR GUARDIAN attack-volume rebalance
- [x] Five bosses with distinct name, HP, fire cadence, and palette
- [x] Scrolling parallax star background, explosion & hit effects
- [x] Debug hotkeys (1-5) gated by `DEBUG_MODE`
- [x] No external dependencies

## Future Improvements

- [ ] **Android app packaging** (Capacitor / APK)
- [ ] Sound effects (Web Audio API) and BGM
- [ ] Per-stage backgrounds matching `backgroundType`
- [ ] More Stage 3-5 balance polish and screen-shake polish

## Quick Test Checklist

Manual smoke test for the current build (v0.3 Campaign Complete):

- [ ] **Launch** - game opens in the browser with the SECTOR NOVA title screen, no console errors.
- [ ] **Mobile fit** - in smartphone Chrome, the Canvas fits inside the screen.
- [ ] **Mobile title New Game** - tapping NEW GAME on the smartphone title screen starts Stage 1.
- [ ] **Mobile title Continue** - tapping CONTINUE on the smartphone title screen starts the latest unlocked stage.
- [ ] **Mobile title Stage Select** - Stage Select can be operated by tapping stage buttons.
- [ ] **Mobile locked stage guard** - tapping a locked stage does not start it.
- [ ] **Touch drag move** - dragging on the Canvas moves the player ship.
- [ ] **Mobile auto-shot** - smartphone play fires automatically without Space.
- [ ] **Touch no scroll** - the page does not scroll while touching or dragging on the Canvas.
- [ ] **Auto pause hidden page** - hiding the page automatically switches gameplay to PAUSED.
- [ ] **PC keyboard preserved** - Arrow / WASD movement, Space shooting, Enter, C, stage keys, and P pause still work.
- [ ] **Title/play touch separation** - title menu taps and in-game drag movement do not interfere with each other.
- [ ] **README touch status** - README accurately says mobile browser touch support is implemented and Android app packaging is not.
- [ ] **Zip src folder** - extracting the distribution zip creates a real `src/` folder.
- [ ] **Script paths** - `index.html` loads all JS files from the actual `src/` folder.
- [ ] **Clear Stage 1** - survive until ORB CORE appears and defeat it.
- [ ] **Advance to Stage 2** - STAGE CLEAR to Stage 2 (METEOR BELT) begins, score carries over.
- [ ] **Initial unlock** - first launch shows UNLOCKED STAGE: 1.
- [ ] **New Game** - Enter starts from Stage 1 with score 0.
- [ ] **Stage unlock save** - clearing Stage 1 saves Stage 2 as unlocked.
- [ ] **Reload persistence** - after reloading the browser, Stage 2 remains unlocked.
- [ ] **Continue** - pressing C on the title screen starts the latest unlocked stage.
- [ ] **Stage select** - pressing 2 starts Stage 2 only after Stage 2 is unlocked.
- [ ] **Stage 3 start** - Stage 3 can be started after it is unlocked.
- [ ] **Stage 3 boss** - SHIELD CARRIER appears in Stage 3.
- [ ] **Stage 3 clear unlock** - clearing Stage 3 unlocks Stage 4.
- [ ] **Stage 4 start** - Stage 4 can be started after it is unlocked.
- [ ] **Stage 4 boss** - STORM CORE appears in Stage 4.
- [ ] **Stage 4 clear unlock** - clearing Stage 4 unlocks Stage 5.
- [ ] **Stage 5 start** - Stage 5 can be started after it is unlocked.
- [ ] **Stage 5 boss** - NEBULA HEART appears in Stage 5.
- [ ] **Stage 5 campaign complete** - clearing Stage 5 shows CAMPAIGN COMPLETE.
- [ ] **Locked stage guard** - locked stages cannot be started.
- [ ] **Storage reset** - deleting `sectorNova_unlockedStage` returns the title screen to UNLOCKED STAGE: 1.
- [ ] **Title high scores** - title screen shows BEST SCORE and BEST CLEAR.
- [ ] **Stage start reset** - stage starts with max lives, NORMAL weapon, shield OFF, lower-center position, and short invincibility.
- [ ] **Stage 3-5 start reset** - Stage 3-5 also start with max lives, NORMAL weapon, and shield OFF.
- [ ] **Six item colors drop** - purple / blue / red / green / yellow / pink items appear from defeated enemies.
- [ ] **Purple item** - pickup changes the weapon to TRIPLE BEAM.
- [ ] **TRIPLE BEAM** - fires a 3-way shot.
- [ ] **Blue item** - pickup changes the weapon to PIERCE LASER.
- [ ] **Red item** - pickup changes the weapon to FLAME VORTEX.
- [ ] **Red item replacement** - the retired red orb weapon does not appear.
- [ ] **Green item** - pickup grants SHIELD BARRIER.
- [ ] **Green item does not change weapon** - after pickup, the current attack weapon can still fire.
- [ ] **Yellow item appears** - LIFE RECOVER can drop.
- [ ] **Yellow item heals** - pickup restores 1 life when below the current max.
- [ ] **Yellow full-life bonus** - pickup at full life grants a 1000 point score bonus.
- [ ] **Pink item appears** - MAX LIFE UP can drop.
- [ ] **Pink item raises max** - pickup increases max life by 1 for the current stage.
- [ ] **Pink item full heal** - pickup fully restores current life.
- [ ] **Max life cap** - max life does not exceed 5.
- [ ] **Pink cap heal** - pickup at max-life cap still fully restores current life if damaged.
- [ ] **Pink cap bonus** - pickup grants a 1500 point score bonus only when max life is capped and current life is already full.
- [ ] **Max life stage reset** - after Stage Clear, the next stage starts at the normal max life.
- [ ] **Max life continue reset** - Continue / Stage Select starts at the normal max life.
- [ ] **Recovery keeps weapon** - yellow / pink pickups do not change the current weapon.
- [ ] **Recovery keeps shield** - yellow / pink pickups do not change SHIELD BARRIER state.
- [ ] **Stage 3-5 recovery** - yellow recovery and pink max-life items work in Stage 3-5.
- [ ] **Invincible pickup** - items can be collected during post-hit invincibility blinking.
- [ ] **Invincible yellow pickup** - yellow items still restore life during invincibility blinking.
- [ ] **Invincible pink pickup** - pink items still increase max life and fully restore life during invincibility blinking.
- [ ] **Invincible damage block** - enemies, enemy bullets, and boss bullets still cannot deal extra damage during invincibility blinking.
- [ ] **Shield block** - while shielded, one enemy hit does not reduce lives.
- [ ] **Shield block keeps weapon** - blocking a hit does not remove the current attack weapon.
- [ ] **Campaign Complete** - clearing Stage 5 (NEBULA HEART) shows CAMPAIGN COMPLETE with TOTAL SCORE and PRESS ENTER TO TITLE.
- [ ] **Stage 2 boss cadence** - METEOR GUARDIAN fires clearly less often than before.
- [ ] **Stage 2 enraged pattern** - METEOR GUARDIAN does not fire extra side bullets while enraged.
- [ ] **Stage 2 avoidability** - METEOR GUARDIAN's attacks are avoidable without relying on items.
- [ ] **Stage 1 boss easier** - ORB CORE is easier than before.
- [ ] **Stage 1 no side bullets** - ORB CORE does not fire extra side bullets while enraged.
- [ ] **Stage 1 slower bullets** - ORB CORE bullet speed is reduced.
- [ ] **Stage 3-5 boss readability** - Stage 3-5 boss attacks are challenging but not unfair.
- [ ] **Game Over return** - pressing Enter after Game Over returns to the title screen.
- [ ] **Game Over best score** - Game Over updates BEST SCORE when the score is higher than the saved value.
- [ ] **Game Over best display** - Game Over screen shows SCORE, BEST, and NEW BEST when updated.
- [ ] **No auto restart** - Game Over does not immediately restart from Stage 1.
- [ ] **Continue after Game Over** - after returning to title, C starts from the latest unlocked stage.
- [ ] **Save preserved on Game Over** - `sectorNova_unlockedStage` is not reset by Game Over.
- [ ] **Campaign best score** - Campaign Complete updates BEST SCORE when the total score is higher than the saved value.
- [ ] **Campaign best clear score** - Campaign Complete updates BEST CLEAR SCORE when the total score is higher than the saved clear value.
- [ ] **Campaign best display** - Campaign Complete screen shows BEST CLEAR and NEW CLEAR BEST when updated.
- [ ] **Best score reload** - after reloading the browser, BEST SCORE remains saved.
- [ ] **Best clear reload** - after reloading the browser, BEST CLEAR SCORE remains saved.
- [ ] **High score save isolation** - high score saving does not reset `sectorNova_unlockedStage`.
- [ ] **Name consistency** - the title screen, browser tab title, and in-game text all read **SECTOR NOVA**; no legacy title name remains.
- [ ] **Debug toggle off** - with `DEBUG_MODE = false` in `src/utils.js`, keys `1`-`5` do **not** change the weapon or grant shield, and the title-screen debug hint is hidden.
- [ ] **Game Over screen** - losing all lives shows the GAME OVER screen correctly (drawn once, with score and PRESS ENTER TO TITLE).
- [ ] **Style guide present** - `STYLE_GUIDE.md` exists in the project root and reflects the new item roles.

## AI Development Notes

### What worked well
- (To be filled after development)

### Challenges encountered
- (To be filled after development)

### Simplifications made
- Bosses reuse the same compact core structure with distinct names, HP, firing cadence, and palettes.
- Stages 3-5 use existing enemy families rather than introducing new enemy classes.

### Areas needing human judgment
- Weapon and stage balance (intentionally left for tuning).

### Lessons learned
- (To be filled after development)
