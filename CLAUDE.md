# Claude Code Configuration - RuFlo V3

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/src` for source code files
- Use `/tests` for test files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
- Use `/scripts` for utility scripts
- Use `/examples` for example code

## Project Architecture

- Follow Domain-Driven Design with bounded contexts
- Keep files under 500 lines
- Use typed interfaces for all public APIs
- Prefer TDD London School (mock-first) for new code
- Use event sourcing for state changes
- Ensure input validation at system boundaries

### Project Config

- **Topology**: hierarchical-mesh
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

## Build & Test

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

- ALWAYS run tests after making code changes
- ALWAYS verify build succeeds before committing

## Security Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit .env files or any file containing secrets
- Always validate user input at system boundaries
- Always sanitize file paths to prevent directory traversal
- Run `npx @claude-flow/cli@latest security scan` after security-related changes

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- Use Claude Code's Task tool for spawning agents, not just MCP
- ALWAYS batch ALL todos in ONE TodoWrite call (5-10+ minimum)
- ALWAYS spawn ALL agents in ONE message with full instructions via Task tool
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL Bash commands in ONE message

## Swarm Orchestration

- MUST initialize the swarm using CLI tools when starting complex tasks
- MUST spawn concurrent agents using Claude Code's Task tool
- Never use CLI tools alone for execution — Task tool agents do the actual work
- MUST call CLI tools AND Task tool in ONE message for complex work

### 3-Tier Model Routing (ADR-026)

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| **1** | Agent Booster (WASM) | <1ms | $0 | Simple transforms (var→const, add types) — Skip LLM |
| **2** | Haiku | ~500ms | $0.0002 | Simple tasks, low complexity (<30%) |
| **3** | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning, architecture, security (>30%) |

- Always check for `[AGENT_BOOSTER_AVAILABLE]` or `[TASK_MODEL_RECOMMENDATION]` before spawning agents
- Use Edit tool directly when `[AGENT_BOOSTER_AVAILABLE]`

## Swarm Configuration & Anti-Drift

- ALWAYS use hierarchical topology for coding swarms
- Keep maxAgents at 6-8 for tight coordination
- Use specialized strategy for clear role boundaries
- Use `raft` consensus for hive-mind (leader maintains authoritative state)
- Run frequent checkpoints via `post-task` hooks
- Keep shared memory namespace for all agents

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## Swarm Execution Rules

- ALWAYS use `run_in_background: true` for all agent Task calls
- ALWAYS put ALL agent Task calls in ONE message for parallel execution
- After spawning, STOP — do NOT add more tool calls or check status
- Never poll TaskOutput or check swarm status — trust agents to return
- When agent results arrive, review ALL results before proceeding

## V3 CLI Commands

### Core Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `init` | 4 | Project initialization |
| `agent` | 8 | Agent lifecycle management |
| `swarm` | 6 | Multi-agent swarm coordination |
| `memory` | 11 | AgentDB memory with HNSW search |
| `task` | 6 | Task creation and lifecycle |
| `session` | 7 | Session state management |
| `hooks` | 17 | Self-learning hooks + 12 workers |
| `hive-mind` | 6 | Byzantine fault-tolerant consensus |

### Quick CLI Examples

```bash
npx @claude-flow/cli@latest init --wizard
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder
npx @claude-flow/cli@latest swarm init --v3-mode
npx @claude-flow/cli@latest memory search --query "authentication patterns"
npx @claude-flow/cli@latest doctor --fix
```

## Available Agents (60+ Types)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Specialized
`security-architect`, `security-auditor`, `memory-specialist`, `performance-engineer`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

### GitHub & Repository
`pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`

## Memory Commands Reference

```bash
# Store (REQUIRED: --key, --value; OPTIONAL: --namespace, --ttl, --tags)
npx @claude-flow/cli@latest memory store --key "pattern-auth" --value "JWT with refresh" --namespace patterns

# Search (REQUIRED: --query; OPTIONAL: --namespace, --limit, --threshold)
npx @claude-flow/cli@latest memory search --query "authentication patterns"

# List (OPTIONAL: --namespace, --limit)
npx @claude-flow/cli@latest memory list --namespace patterns --limit 10

# Retrieve (REQUIRED: --key; OPTIONAL: --namespace)
npx @claude-flow/cli@latest memory retrieve --key "pattern-auth" --namespace patterns
```

## Quick Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

## Claude Code vs CLI Tools

- Claude Code's Task tool handles ALL execution: agents, file ops, code generation, git
- CLI tools handle coordination via Bash: swarm init, memory, hooks, routing
- NEVER use CLI tools as a substitute for Task tool agents

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues

---

# MathSlayer — Project Context

> This section is for continuing development. Read this before touching any game file.

## How to Run Locally

```bash
# From the mathslayer project root:
npx serve .
# Then open http://localhost:3000 in a browser.
# Do NOT open index.html directly as file:// — browsers block asset loading under that protocol.
```

For GitHub Pages: push to `main` branch. The deploy workflow at `.github/workflows/deploy.yml` publishes automatically.

---

## File Structure

```
mathslayer/
├── index.html                   # Entry point — loads Phaser CDN + all scripts in order
├── sprites/                     # All sprite assets (see Sprite Details table below)
│   ├── background.png
│   ├── player_idle.png          # 10-frame samurai idle
│   ├── player_attack.png        # 7-frame samurai attack
│   ├── player_run.png           # 16-frame samurai run
│   ├── player_hurt.png          # 4-frame samurai hurt
│   ├── SmallSlime_Green.png     # 5-col grid, Addition (+)
│   ├── SmallSlime_Pink.png      # 5-col grid, Subtraction (−) / Division (÷)
│   ├── SmallSlime_Violet.png    # 5-col grid, Multiplication (×)
│   ├── MediumSlime_Blue.png     # 5-col grid, wave 3+
│   ├── MediumSlime_Orange.png   # 5-col grid, wave 3+
│   ├── MediumSlime_Yellow.png   # 5-col grid, wave 3+
│   ├── LargeSlime_Purple.png    # 5-col grid, boss
│   ├── LargeSlime_Red.png       # 5-col grid, boss
│   └── LargeSlime_Grey.png      # 5-col grid, boss
└── src/
    ├── config.js                # Global CONFIG constants (incl. boss settings)
    ├── SpriteManager.js         # Asset loading, animations, sprite factories
    ├── MathEngine.js            # Question generation, boss question helper
    ├── EnemyManager.js          # Slime spawning, movement, boss lifecycle
    └── scenes/
        ├── MenuScene.js         # Main menu — op/difficulty selection, high score
        ├── GameScene.js         # Core gameplay loop, boss battle logic
        └── GameOverScene.js     # End screen — score, high score, play again
```

---

## What Each File Does

### `src/config.js`
Central constants. Key values:
- `GAME_WIDTH: 800`, `GAME_HEIGHT: 500`
- `PLAYER_X: 110`, `GROUND_Y: 305` — gameplay area top half
- `PANEL_Y: 350`, `PANEL_HEIGHT: 150` — math panel bottom half
- `PLAYER_HP: 5`
- `DIFFICULTIES: { easy:{min:1,max:10}, medium:{min:1,max:25}, hard:{min:1,max:100} }`
- Slime speed/scaling: `SLIME_BASE_SPEED:60`, `SLIME_SPEED_MAX:180`, increment every 12s
- Spawn interval: starts at 3200ms, scales down to 900ms minimum
- `MAX_SLIMES_START:1`, `MAX_SLIMES_CAP:6`, scales up every 5 correct answers
- `BOSS_TRIGGER:10` — every 10 correct answers triggers boss
- `BOSS_HP:5`, `BOSS_SPEED:12`, `BOSS_SCALE:0.96`, `BOSS_SCORE_BONUS:500`

### `src/SpriteManager.js`
- `static preload(scene)` — loads all PNG assets, registers load diagnostics, calls `_createPlaceholders()`
- `static createAnimations(scene)` — creates all player and slime animations with `anims.exists()` guards
- `static createPlayer(scene, x, y)` — scale 0.9, plays `player_idle_anim` by default
- `static createSlime(scene, x, y, operation, wave)` — wave-aware: regular slimes wave 1–2, mid-wave slimes wave 3+; calls `addBounceToSlime()`
- `static createBossSlime(scene, x, y, variant)` — boss at `CONFIG.BOSS_SCALE`, calls `addBounceToSlime()`
- `static addBounceToSlime(slime, scene, baseY)` — gentle sine bounce tween (700ms, 10px amplitude, infinite yoyo)
- `static checkAndShowErrors(scene)` — renders on-screen red panel for failed assets
- `static _detectSlimeFrameSize(sheetW, sheetH)` — auto-detects frame size for 1240×1860 sheets via common column counts (5→4→3→2)
- `static _createPlaceholders(scene)` — generates `projectile`, `heart`, `heart_empty` textures via Graphics

### `src/MathEngine.js`
- Constructor: `new MathEngine(operations[], difficulty)`
- `generateQuestion()` — returns `{ question, answer, choices, operation }`, avoids repeating same string as last question
- `generateBatch(n)` — returns array of n question objects, no consecutive repeats
- `generateBossQuestion()` — generates a question using hard difficulty regardless of selected difficulty; restores original after
- `validate(userAnswer)` — compares against `currentQuestion.answer`

### `src/EnemyManager.js`
- Constructor: `new EnemyManager(scene, getQuestion)`
- `spawnBoss(variant, getBossQuestion)` — dramatic entrance tween from off-screen right, `isBoss` data flag, `hp: CONFIG.BOSS_HP`
- `damageBoss()` — decrements boss HP by 1, returns `true` when HP reaches 0
- `killBoss(onComplete)` — scale+alpha death tween, particle burst, clears `bossSlime`
- `update(time, delta)` — moves slimes and boss independently; boss at `BOSS_SPEED`
- `getActiveSlimes()` — returns alive, active slimes only
- `getBossSlime()` — returns active boss or null
- `_spawnSlime()` — skips spawning if boss is alive
- `reset()` — clears `bossSpawned` flag and `bossSlime`
- `onCorrectAnswers(totalCorrect)` — checks `BOSS_TRIGGER` threshold, emits `bossTriggered` event

### `src/scenes/MenuScene.js`
- Shows background.png + dark overlay (depth 0/1), all UI at depth 2–4
- Operation toggle buttons (+, -, ×, ÷) — minimum 1 always selected
- Difficulty buttons (Easy/Medium/Hard)
- High score from `localStorage.getItem('mathslayer_highscore')`
- Start button → `this.scene.start('GameScene', { operations, difficulty })`
- Calls `SpriteManager.checkAndShowErrors(this)` at end of `create()`

### `src/scenes/GameScene.js`
- **Background**: `background.png` cropped to `PANEL_Y` height (gameplay area only)
- **Question pool**: pre-generated 12 questions at game start; refills to 12 when pool drops below 5
- **Slime-question binding**: each slime pops `questionPool.shift()` at spawn → `slime.setData('question', q)`
- **Display queue**: `_getDisplayQueue()` — boss question takes first priority when boss is active; then active slime questions sorted by x; then pool preview. Always 3 items.
- **Math panel** (y=350–500): CURRENT question (large, center), NEXT (left preview), SOON (right preview), answer input (DOM element), 4 multiple-choice buttons
- **Answer handling**: `_handleAnswer(value)` — validates against `_getDisplayQueue()[0].answer`; if correct, fires projectile; boss takes 1 damage per correct answer
- **Boss battle**: `_onBossTriggered()` → `_showBossAppeared()` (darken + text) → `EnemyManager.spawnBoss()`; boss HP bar at y=52; `_showBossDefeated()` on kill with particle explosion + celebration text + +500 score
- **Score**: +100 per kill; +500 boss bonus; high score saved to localStorage
- Player animations: `player_attack_anim` plays on projectile fire; `player_hurt_anim` plays on damage

### `src/scenes/GameOverScene.js`
- Shows final score, high score, correct answers, wave/slimes stats
- "Play Again" reads last settings from localStorage
- Uses procedural background (NOT background.png — not yet updated to use the sprite)

---

---

## Sprite Details

All sprite sheets are auto-detected where applicable. Frame size detection for 1240×1860 slime sheets tries column counts 5→4→3→2, confirming rows divide evenly.

### Player Sprites (Samurai pixel art — horizontal strips, 96px per frame)

| File | Dimensions | Frames | Animation | Notes |
|------|-----------|--------|-----------|-------|
| `player_idle.png` | 960×96 | 10 | `player_idle_anim` (fps 8, loop) | Default/idle state |
| `player_attack.png` | 672×96 | 7 | `player_attack_anim` (fps 10, once) | Plays on slime kill |
| `player_run.png` | 1536×96 | 16 | `player_run_anim` (fps 12, loop) | Available for future use |
| `player_hurt.png` | 384×96 | 4 | `player_hurt_anim` (fps 6, once) | Plays on player damage |

Player display: scale 0.9 → ~86×86px on screen.

### Slime Sprites (all sheets 1240×1860px, 5-column grid → 248×372px frames, use frames 0–3)

| File | Sprite Key | Animation | Used for |
|------|-----------|-----------|---------|
| `SmallSlime_Green.png` | `small_green` | `small_green_anim` | Regular slime, Addition (+) |
| `SmallSlime_Pink.png` | `small_pink` | `small_pink_anim` | Regular slime, Subtraction (−) and Division (÷) |
| `SmallSlime_Violet.png` | `small_violet` | `small_violet_anim` | Regular slime, Multiplication (×) |
| `MediumSlime_Blue.png` | `medium_blue` | `medium_blue_anim` | Mid-wave slime (wave 3+), cycles with operation |
| `MediumSlime_Orange.png` | `medium_orange` | `medium_orange_anim` | Mid-wave slime (wave 3+) |
| `MediumSlime_Yellow.png` | `medium_yellow` | `medium_yellow_anim` | Mid-wave slime (wave 3+) |
| `LargeSlime_Purple.png` | `large_purple` | `large_purple_anim` | Boss slime variant |
| `LargeSlime_Red.png` | `large_red` | `large_red_anim` | Boss slime variant |
| `LargeSlime_Grey.png` | `large_grey` | `large_grey_anim` | Boss slime variant |

Regular slime display: scale 0.32 → ~79px wide.
Boss slime display: scale `CONFIG.BOSS_SCALE` (0.96) → ~238px wide (3× regular).

---

## Current State

### Working
- Full game loop: menu → gameplay → game over → play again
- Operation and difficulty selection carried through to game
- Slime spawning — wave-aware: regular slimes (wave 1–2), mid-wave slimes (wave 3+)
- Question pool system: always 3 items visible (CURRENT / NEXT / SOON)
- 1:1 slime-question binding — slime color matches the question shown
- Multiple choice buttons + text input both work for answering
- Projectile fires at owning slime on correct answer
- Wrong answer punishment — 2-attempt system: first wrong shakes + shows warning; second wrong loses 1 HP + hurt animation + red flash; attempt counter (●●/●○) shown in question panel
- HP hearts (5 lives), damage on slime reaching player (1 HP per slime, 2 HP per boss)
- **ESC pause menu** — overlay with Resume and Main Menu buttons; pauses all movement and timers; ESC toggles
- Score scaling, high score in localStorage
- Slime speed + spawn rate difficulty ramp over time
- Asset load diagnostics: console errors + on-screen panel for missing files
- GitHub Pages deploy workflow
- **Boss battle system** — fully implemented (see below)

### Boss Battle System (IMPLEMENTED)
- Every `CONFIG.BOSS_TRIGGER` (10) correct answers triggers a boss
- On trigger: new slime spawning halts immediately (`bossSpawned` flag); "BOSS INCOMING..." pulses on screen while existing slimes are cleared
- Boss only spawns after all regular slimes are defeated — no question conflicts possible
- Boss is a LargeSlime (purple/red/grey random variant), 3× regular slime size (`BOSS_SCALE: 0.96`)
- Boss moves at `BOSS_SPEED` (12px/s) — 5× slower than base slime speed; walks in from the right edge naturally
- Boss has 5 HP shown as a magenta bar below the HUD (y=52); bar is fully destroyed on defeat
- All sprites face left (`setFlipX(true)`); boss question panel force-refreshed on spawn
- Boss questions use **hard difficulty** numbers (`CONFIG.DIFFICULTIES.hard: min=1, max=100`) regardless of selected difficulty
- Each correct answer deals 1 damage to boss; a **new unique boss question** is generated for each hit (no repeats)
- **Boss entrance**: fades in from off-screen right, "BOSS APPEARED!" flashes, screen darkens
- **Boss defeated**: particle explosion (20 particles, pink/yellow/white), "BOSS DEFEATED!" celebration text, +500 score bonus, regular slimes resume
- If boss reaches player: deals 2 HP damage, big red flash + camera shake + player hurt animation
- `bossSpawned` resets to `false` inside `killBoss` so the next boss can trigger after 10 more correct answers

### Not Working / Known Issues
1. **Sprites may still fail under `file://`** — must use `npx serve .` or a local HTTP server
2. **GameOverScene** still uses a procedural Graphics background — not yet updated to use `background.png`
3. **`player_run_anim` loaded but never triggered** — reserved for future use (e.g. player movement)
4. **Answer input focus lost** — after clicking a multiple-choice button, DOM input may lose focus
5. **No sound** — no audio of any kind

---

## Planned Features

### Other Planned
- Switch player to walk/run animation when firing
- Sound effects (correct answer, wrong answer, slime death, player hit, boss battle)
- Combo multiplier for consecutive correct answers
- Mobile touch support for answer buttons
- Wave counter that persists through boss fights (currently resets per `SLIMES_SCALE_THRESHOLD`)
