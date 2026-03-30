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
├── sprites/                     # All sprite assets (see details below)
│   ├── background.png
│   ├── player_idle.png
│   ├── player_walk.png
│   ├── Slime_Medium_Green.png
│   ├── Slime_Medium_Blue.png
│   ├── Slime_Medium_Red.png
│   ├── Slime_Medium_White.png
│   ├── Slime_Small_Green.png    # Not yet used in game
│   ├── Slime_Small_Blue.png     # Not yet used in game
│   ├── Slime_Small_Red.png      # Not yet used in game
│   └── Slime_Small_White.png    # Not yet used in game
└── src/
    ├── config.js                # Global CONFIG constants
    ├── SpriteManager.js         # Asset loading, animation setup, sprite factories
    ├── MathEngine.js            # Question generation and answer validation
    ├── EnemyManager.js          # Slime spawning, movement, kill logic
    └── scenes/
        ├── MenuScene.js         # Main menu — op/difficulty selection, high score
        ├── GameScene.js         # Core gameplay loop
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

### `src/SpriteManager.js`
- `static preload(scene)` — loads all PNG assets, registers `loaderror`/`filecomplete`/`complete` listeners for diagnostics, calls `_createPlaceholders()` for projectile/heart textures
- `static createAnimations(scene)` — creates named Phaser animations (guards with `anims.exists()` check to avoid duplication across scene restarts)
- `static createPlayer(scene, x, y)` — returns sprite at scale 1.4 playing `player_idle_anim`
- `static createSlime(scene, x, y, operation)` — returns sprite at scale 2.0 playing the correct color animation
- `static checkAndShowErrors(scene)` — renders on-screen red panel listing any failed asset paths; call from `create()` in both MenuScene and GameScene
- `static _createPlaceholders(scene)` — generates `projectile`, `heart`, `heart_empty` textures via Graphics (no PNG needed)

### `src/MathEngine.js`
- Constructor: `new MathEngine(operations[], difficulty)`
- `generateQuestion()` — returns `{ question, answer, choices, operation }`, avoids repeating same string as last question
- `generateBatch(n)` — returns array of n question objects, no consecutive repeats; used to pre-fill the question pool
- `validate(userAnswer)` — compares against `currentQuestion.answer` (NOTE: GameScene uses direct comparison against `currentQ.answer` from the display queue, not this method)

### `src/EnemyManager.js`
- Constructor: `new EnemyManager(scene, getQuestion)` — `getQuestion` is a callback that returns a full question object (called at slime spawn time)
- Each slime stores its question via `slime.setData('question', q)` and operation via `slime.setData('operation', op)`
- `update(time, delta)` — moves slimes left; fires `slimeReachedPlayer` event when a slime reaches `PLAYER_X + 35`
- `killSlime(slime, onComplete)` — scale+fade tween then particle burst, removes from active list
- `getActiveSlimes()` — returns only alive+active slimes
- `onCorrectAnswers(totalCorrect)` — scales `maxSimultaneousSlimes` and `spawnInterval` based on score

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
- **Display queue**: `_getDisplayQueue()` — combines active slime questions (sorted by x, closest first) with pool preview; always returns 3 items
- **Math panel** (y=350–500): CURRENT question (large, center), NEXT (left preview), SOON (right preview), answer input (DOM element), 4 multiple-choice buttons
- **Answer handling**: `_handleAnswer(value)` — validates against `_getDisplayQueue()[0].answer`; if correct, fires projectile at the slime owning that question (or removes from pool if no slime owns it yet); calls `_advanceQuestionDisplay()` for slide animation
- **Score**: +100 per kill; high score saved to localStorage
- Calls `SpriteManager.checkAndShowErrors(this)` at end of `create()`

### `src/scenes/GameOverScene.js`
- Shows final score, high score, correct answers, wave/slimes stats
- "Play Again" reads last settings from localStorage
- Uses procedural background (NOT background.png — not yet updated to use the sprite)

---

## Sprite Details

| File | Dimensions | Frame size | Frames | Used for |
|------|-----------|-----------|--------|---------|
| `background.png` | any | — | — | Full-canvas BG in Menu + Game |
| `player_idle.png` | 456×55 | 57×55 | 8 | `player_idle_anim` (fps 8, loop) |
| `player_walk.png` | 180×348 | 60×58 | 18 | `player_walk_anim` (fps 10, loop) — loaded, not yet triggered |
| `Slime_Medium_Green.png` | 128×128 | 32×32 | 16 (use 0–3) | `slime_green_anim` — Addition (+) |
| `Slime_Medium_Blue.png` | 128×128 | 32×32 | 16 (use 0–3) | `slime_blue_anim` — Subtraction (−) |
| `Slime_Medium_Red.png` | 128×128 | 32×32 | 16 (use 0–3) | `slime_red_anim` — Multiplication (×) |
| `Slime_Medium_White.png` | 128×128 | 32×32 | 16 (use 0–3) | `slime_white_anim` — Division (÷) |
| `Slime_Small_*.png` | 128×128 | 32×32 | 16 | Not yet used (reserved for future) |

Slime display size: 32px × scale 2.0 = **64px** on screen.
Player display size: scale 1.4 → ~80×77px on screen.

---

## Current State

### Working
- Full game loop: menu → gameplay → game over → play again
- Operation and difficulty selection carried through to game
- Slime spawning with correct color per operation
- Question pool system: always 3 items visible (CURRENT / NEXT / SOON)
- 1:1 slime-question binding — slime color matches the question shown
- Multiple choice buttons + text input both work for answering
- Projectile fires at owning slime on correct answer
- Wrong answer flash feedback (red panel)
- HP hearts (5 lives), damage on slime reaching player
- Score scaling, high score in localStorage
- Slime speed + spawn rate difficulty ramp over time
- Asset load diagnostics: console errors + on-screen panel for missing files
- GitHub Pages deploy workflow

### Not Working / Known Issues
1. **Sprites may still fail under `file://`** — must use `npx serve .` or a local HTTP server. The new diagnostics will at least show a clear error panel.
2. **GameOverScene** still uses a procedural Graphics background — it does not use `background.png`. Needs updating to match Menu/Game scenes.
3. **`player_walk_anim` never plays** — animation is loaded but GameScene never switches from idle to walk. Could be triggered during projectile firing or when slimes are near.
4. **Small slime sprites unused** — `Slime_Small_*.png` files are present in `sprites/` but never loaded or used.
5. **Answer input focus lost** — after clicking a multiple-choice button, the DOM input may lose focus and require a click to re-engage keyboard input.
6. **No sound** — no audio of any kind.

---

## Planned Features

### Boss Battle System (next priority)
- Every N correct answers (e.g. every 10), spawn a boss slime instead of a regular slime
- Boss uses a harder question (larger numbers or multi-step)
- Boss requires multiple correct answers to kill (HP > 1), shown as a health bar above it
- Boss uses a distinct sprite (could reuse a Slime_Large variant or scaled-up existing sprite)
- On boss kill: score bonus + brief fanfare animation
- Boss wave count tracked and displayed in HUD

### Other Planned
- Switch player to walk animation when firing
- Sound effects (correct answer, wrong answer, slime death, player hit)
- Combo multiplier for consecutive correct answers
- Pause menu (Esc key)
- Mobile touch support for answer buttons
