# MathSlayer

An anime-style browser math game built with Phaser.js. Defeat slime enemies by solving math problems before they reach your character!

## How to Play

1. **Select operations** to practice — Addition, Subtraction, Multiplication, Division (pick one or more)
2. **Choose difficulty** — Easy (1–10), Medium (1–25), or Hard (1–100)
3. Hit **▶ START GAME**
4. Slimes walk toward your character from the right
5. Solve the math question shown at the bottom of the screen:
   - **Type** your answer and press **Enter**, OR
   - **Click** one of the 4 answer buttons
6. Correct answer → your character fires a projectile that destroys the slime ✨
7. Wrong answer → the input box shakes red (no HP penalty — keep trying!)
8. If a slime reaches you → lose **1 HP** (you have 5 HP total)
9. Game ends when HP reaches 0

## Difficulty Scaling

The game gets harder automatically — no levels to select:

| Milestone | Effect |
|-----------|--------|
| Every 5 correct answers | +1 max simultaneous slimes (cap: 6) |
| Every 12 seconds | Slimes walk faster |
| Over time | Spawn interval shortens |

All thresholds are tunable in `src/config.js` via the `CONFIG` object.

## Sprite Replacement Guide

Placeholder colored sprites are generated procedurally. To use real artwork, add PNG files to the `sprites/` folder and update `SpriteManager.preload()` in `src/SpriteManager.js` to load them.

| Filename | Recommended size | Description |
|----------|-----------------|-------------|
| `sprites/player.png` | 48 × 64 px | Anime girl character (idle pose, facing right) |
| `sprites/slime.png` | 44 × 36 px | Slime enemy |
| `sprites/projectile.png` | 18 × 8 px | Attack projectile / energy bolt |
| `sprites/heart.png` | 20 × 18 px | HP heart icon — full |
| `sprites/heart_empty.png` | 20 × 18 px | HP heart icon — empty |

### Swapping sprites (no logic changes needed)

Update `SpriteManager.preload()` to load image files instead of generating textures:

```js
static preload(scene) {
  scene.load.image('player',      'sprites/player.png');
  scene.load.image('slime',       'sprites/slime.png');
  scene.load.image('projectile',  'sprites/projectile.png');
  scene.load.image('heart',       'sprites/heart.png');
  scene.load.image('heart_empty', 'sprites/heart_empty.png');
}
```

For animated spritesheets, use `scene.load.spritesheet()` and add animation configs — all other game code remains unchanged.

## Running Locally

Just open `index.html` in any modern browser — no build step, no server required.

```bash
# Optional: serve with a local HTTP server to avoid CORS on file://
npx serve .
# then open http://localhost:3000
```

## GitHub Pages Deployment

1. Push to the `main` branch
2. Go to **Settings → Pages → Source → main / (root)**
3. Your game will be live at `https://<username>.github.io/<repo>/`

## Live Demo

🎮 **Play here:** [https://your-username.github.io/mathslayer](https://your-username.github.io/mathslayer)

*(Update this link after enabling GitHub Pages)*

## Tech Stack

| | |
|--|--|
| Game engine | [Phaser 3.60](https://phaser.io/) |
| Fonts | Google Fonts — Orbitron, Exo 2 |
| Persistence | `localStorage` for high score |
| Build tools | None — vanilla JS |
