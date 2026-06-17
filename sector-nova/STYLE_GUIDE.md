# SECTOR NOVA — Style Guide

This guide exists so that future contributors (including other AIs such as Codex) can
extend the game **without breaking the established look and feel**. Read this before
adding new enemies, weapons, bosses, or effects.

The single most important rule: **new content must blend in with what already exists.**
Match the existing size, color, and particle vocabulary rather than introducing a new one.

---

## 1. Core Visual Identity

- **SFC / Super Famicom-era aesthetic.** Low resolution, chunky shapes, punchy colors.
- **Internal resolution is fixed at 320 × 480** (`CANVAS_WIDTH` × `CANVAS_HEIGHT`). The
  canvas is scaled up with `image-rendering: pixelated` for a crisp pixel look. Design
  for this small space — keep sprites small and readable.
- **Canvas drawing only.** Everything is drawn procedurally with the Canvas 2D API
  (`fillRect`, `arc`, `moveTo/lineTo` polygons, radial gradients).
- **No image assets.** Do not add PNG/JPG/SVG/spritesheets or external fonts. The only
  font used is the built-in monospace (`'... px monospace'`).
- **No external libraries.** Plain ES5/ES6 classes loaded via `<script>` tags in
  dependency order (see `index.html`).

## 2. Color Palette

All colors live in the `COLORS` object in `src/utils.js`. **Reuse existing entries**
where possible; if a new color is truly needed, add it there (don't inline hex codes
scattered across files).

- **Background:** black to dark navy space. `BG_DARK (#0a0a1a)`, `BG_NEBULA (#0d0d2b)`,
  with subtle parallax stars (`STAR_DIM`, `STAR_BRIGHT`, `STAR_WHITE`) and faint nebula clouds.
- **Accents (use these as the highlight language):**
  - **Bright blue** — the player & player bullets (`PLAYER_BODY #3399ff`, `PLAYER_BULLET #66eeff`).
  - **Yellow** — UI highlights, cores, score (`UI_YELLOW #ffdd44`).
  - **Red** — danger, enemy bullets, enrage, lives (`UI_RED`, `ENEMY_BULLET`).
  - **Green** — success / defensive shield / "stage clear" (`UI_GREEN`, `ITEM_SHIELD`).
- **Per-role tints already defined:** enemies A/B/C, the new enemy types
  (`ENEMY_SHIELD/SPLIT/FORM/RUSH/TURRET`), weapons (`LASER_*`, `FLAME_*`, `SHIELD_*`),
  items (`ITEM_TRIPLE` purple, `ITEM_PIERCE` blue, `ITEM_FLAME` red, `ITEM_SHIELD` green,
  `ITEM_LIFE` yellow, `ITEM_MAX_LIFE` pink), and bosses.

Item Colors:
- Purple: TRIPLE BEAM
- Blue: PIERCE LASER
- Red: FLAME VORTEX
- Green: SHIELD BARRIER
- Yellow: LIFE RECOVER
- Pink: MAX LIFE UP

Green items are defensive items, not weapon-changing items.
Shield effects must not prevent the player from firing.
Yellow items are recovery items, not weapon-changing items.
Pink items increase max life for the current stage only.
Recovery and max-life items must not change the current weapon or shield state.

Keep saturation high and values bright against the dark background. Avoid pastel,
grayscale, or photo-realistic gradients.

Stage / Boss Theme Accents:
- Stage3 IRON SWARM: iron gray bodies with yellow highlights.
- Stage4 STORM ZONE: blue / cyan storm tones with restrained red warning accents.
- Stage5 NEBULA HEART: purple core tones with white and gold highlights.

Keep these as accents only; do not replace the established dark space backdrop or
the existing SFC-style Canvas shape language.

## 3. UI

- **All UI is drawn inside the canvas** — no HTML/DOM overlays, no CSS-styled HUD.
- Monospace font, small sizes (`7px`–`12px` for HUD, up to `~30px` for titles).
- HUD conventions already in place: top bar (score / life / time / stage label),
  bottom-left weapon panel with a countdown bar, centered boss HP bar, and full-screen
  centered overlays for TITLE / PAUSED / GAME OVER / STAGE CLEAR / CAMPAIGN COMPLETE.
- Use `ctx.save()/restore()` around any state changes (alpha, font, alignment).
- Blinking prompts use `Math.floor(frame / 30) % 2`.

## 4. Sprites — Size & Shape Language

Drawn with simple polygons + circles, centered via `ctx.translate(x, y)`.

- **Player ship:** ~24 px wide, blue body + wings, orange/yellow engine flame, cyan cockpit.
  Small hit radius (`PLAYER_HIT_RADIUS = 6`) relative to the visual.
- **Enemies:** radius roughly **7–14 px**. Each type has a distinct silhouette
  (diamond, winged oval, ringed circle, arrowhead, spiky hexagon, turret) and a
  light "eye/core" detail. New enemies should stay in this size band and follow the
  same body + dark-inner + bright-core layering.
- **Bullets:** small glowing circles (player ~3 px cyan, enemy ~3 px red, boss ~4 px
  orange) with a translucent glow halo and a 1–2 px white center. Special weapons keep
  the glow-halo + bright-core idea (laser = thin bright beam, flame = small red/orange glow).
- **Bosses:** ~40 px radius, layered armor plates + rotating elements + a pulsing core,
  with an enrage state. New bosses may reuse this structure with a distinct palette.

## 5. Effects & Animation

- **Particles** (`src/effects.js`): explosions, hit sparks, pickups, big boss death.
  Reuse `EffectsManager` (`explode`, `bigExplode`, `hitSpark`, `powerupPickup`) instead
  of writing bespoke particle code. Particle colors come from the explosion palette
  (`EXPLOSION_INNER/MID/OUTER`) — white-hot center fading to orange/red.
- **Motion** is frame-based (60 fps assumed); animate with `this.frame++` and
  `Math.sin(frame * speed)` for pulsing/twinkling/flicker. Keep pulses subtle (±10–20%).
- **Glow** is faked with a larger, low-`globalAlpha` shape behind the solid shape.
- Always reset `globalAlpha` back to `1` after use.

## 6. Checklist When Adding Content

- [ ] Drawn purely with Canvas 2D — no images, no DOM.
- [ ] Colors taken from / added to `COLORS` in `utils.js`, matching the accent language.
- [ ] Sprite size fits the existing band (enemies ~7–14 px, bullets ~3–4 px, boss ~40 px).
- [ ] Uses `EffectsManager` for explosions/sparks rather than new particle systems.
- [ ] Tunable constants added to `utils.js` (don't hardcode magic numbers in logic).
- [ ] Looks at home next to the current player, enemies, bullets, and explosions.
