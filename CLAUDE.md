# PIXI Arcade — Project Brain

> Single source of truth for any AI session entering this repository. Read top-to-bottom before making changes.

---

## 1. Project Vision

A scalable **multi-game web platform** where each game is a self-contained PixiJS WebGL experience hosted inside an Angular shell.

The platform-level concerns (routing, lifecycle, dashboard, asset pipeline, scoring) are shared. Each individual game is plug-and-play behind a single abstraction (`BasePixiGame`) so that adding the 51st game costs the same as adding the 2nd.

**Non-goals:** SSR, mobile-native packaging, multiplayer/network sync (not in current scope).

---

## 2. Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | **Angular 21.2** | Standalone components only — no NgModules. Signals are the primary reactive primitive. |
| Rendering | **PixiJS v8.18** | WebGL renderer, `Application` per route. Init is async (`await app.init()`). |
| Pixi effects | **pixi-filters 6.1** | `GlowFilter` used by Snake (head + food orb). Other filters available; see §3.4 for destroy rules. |
| Reactive | **Angular signals** + RxJS 7.8 | Signals own state. RxJS available for stream-style flows but is **not** the default state primitive. |
| Routing | `@angular/router` | Lazy via `loadComponent`. Routes generated from the registry — see §4. |
| Build | `@angular/build` (esbuild) | `npx ng build` / `npx ng serve`. |
| Test | `vitest` 4.0 | Wired but no suites yet. |
| Tooling | Prettier 3.8, TypeScript 5.9 | `.prettierrc` at root. |
| Env | Windows · PowerShell · WebStorm | Bash also available; prefer forward slashes in paths. |

---

## 3. Architecture Rules

These are **load-bearing**. Violating them cascades.

### 3.1 Layer boundaries

```
┌─────────────────────────────────────────────┐
│  Angular Shell (DOM/HUD)  ─── Smart/Dummy   │
├─────────────────────────────────────────────┤
│  BasePixiGame  ─── lifecycle contract       │
├─────────────────────────────────────────────┤
│  Pixi renderers (Container, Graphics, ...)  │
├─────────────────────────────────────────────┤
│  Domain (rules + state)  ─── pure TS        │
└─────────────────────────────────────────────┘
```

- **`domain/` MUST NOT import from `pixi.js` or any renderer.** It is the testable core. If you find yourself reaching for a `Container` here, stop.
- **Pixi renderers MUST NOT mutate state.** They observe it (via signal `effect()`) and translate it to visuals. Clicks/keys fire callbacks the renderer or input class received in its constructor — they do not call `state.set(...)` directly.
- **Angular components MUST NOT call PixiJS directly.** They wire services and host the canvas. The `BasePixiGame` subclass is the only thing that owns Pixi objects.

### 3.2 Smart / Dummy components

- **Smart** (e.g. `MemoryShell`, `SnakeShell`, `HubComponent`) — inject services, hold a `viewChild` on the canvas host, orchestrate lifecycle, react to resize.
- **Dummy** (e.g. `HudComponent`, `WinModalComponent`, `GameCardComponent`) — `input.required<T>()` / `output<T>()` only, `ChangeDetectionStrategy.OnPush`, no service injection.

### 3.3 BasePixiGame contract

`src/app/core/game/base-pixi-game.ts`

```ts
abstract class BasePixiGame {
  abstract readonly id: string;
  protected ctx!: GameContext;   // app, stage, width, height, injector
  protected root!: Container;    // game's own root inside ctx.stage

  async mount(ctx: GameContext): Promise<void>;  // template method
  protected abstract init(): Promise<void> | void;
  abstract resize(width: number, height: number): void;
  protected abstract onDestroy(): void;
  destroy(): void;               // wraps onDestroy() + root.destroy({ children: true })
}
```

Every game implements `init` / `resize` / `onDestroy`. The base class guarantees the `root` container is added to the stage before `init()` runs and destroyed after `onDestroy()` returns.

### 3.4 Memory management (strict)

- Every `new` of a `Container`, `Graphics`, `Text`, `Ticker`, `Sprite` — **must** have a matching `.destroy()` reachable from the game's `onDestroy()`. No orphans.
- **Filters are NOT destroyed by `Container.destroy({ children: true })`.** When a renderer creates `new GlowFilter(...)`, it **must** call `filter.destroy()` in its own `destroy()`. This is currently a known bug in Snake (`snake.renderer.ts`, `food.renderer.ts`) — see §5 TODO list.
- `EffectRef` returned by `effect({ injector })` must be destroyed in `onDestroy()`. Otherwise the effect leaks into the next route.
- `GameEngineService.destroy()` calls `app.destroy(true, { children: true, texture: false })` — note `texture: false` because the asset pipeline (future) will own the texture cache across navigations.
- Per-route engine: `GameEngineService` is provided **at the shell component level**, not root. Leaving the route → DI scope torn down → `destroy()` runs.

### 3.5 Bridge pattern (state ↔ visuals)

```
GameStateService  ─── signals
       │
       │  effect(() => board.syncCards(state.cards()))
       ▼
BoardRenderer  ─── Pixi Container tree
```

State changes flow one way: Pixi/keyboard → callback → rules service → signal `update` → effect → renderer diff. Renderers never own state.

### 3.6 Per-frame rendering pattern (draw-once, transform-only)

For renderers that update every frame (`tick()` / `render()` driven by `Ticker`):

- **Draw geometry once.** `g.clear()` + `g.roundRect(...).fill(...)` should run only when the underlying state changes (size/color/orientation/visibility), NOT every frame.
- **Per frame, mutate transforms only:** `position`, `scale`, `rotation`, `alpha`, `visible`. These are cheap GPU uploads.
- **Track "drawn state" per object** if the geometry depends on multiple inputs that may change independently. See `snake.renderer.ts:13-19` (`SegmentState`) for the canonical pattern: store last-drawn `size` / `isHead` / `dir` / `squash`, redraw only on change.
- **Reference implementation:** Memory's `card.renderer.ts` — `tick()` (lines 83-95) only mutates transforms; `draw()` is called on `setState()` / `setSize()`.

Violating this: 30 segments × 60fps = 1800 GraphicsContext rebuilds/sec for nothing. Mobile devices feel it immediately.

### 3.7 Registry-driven scalability

`src/app/games-config.ts` is the **only** file that lists games. The Hub catalog reads it; routes are generated from it. Adding a game in two places (catalog + routes) is forbidden — there is one place.

`GameManifest.disabled?: boolean` marks placeholder entries — they appear in the Hub (greyed) but are not routable.

### 3.8 Responsive / breakpoint pattern

`src/app/core/responsive/breakpoint.ts` defines a single `LayoutMode = 'mobile' | 'desktop'` with `MOBILE_BREAKPOINT = 768`. Every game ships **two configs** (`DESKTOP_CONFIG`, `MOBILE_CONFIG`) and a `pickXxxConfig(viewportWidth)` helper. The shell calls this on boot and on `ResizeObserver` events. **All breakpoint logic flows through `getLayoutMode()` — do not hard-code 768 elsewhere.**

---

## 4. Project Structure

```
src/
├── styles.scss                          # design tokens (neon palette, motion, typography)
├── main.ts
├── index.html
└── app/
    ├── app.ts / app.html / app.scss     # root shell (router-outlet)
    ├── app.routes.ts                    # generated from games-config
    ├── app.config.ts
    ├── app.spec.ts
    ├── games-config.ts                  # 📋 single source of truth
    │
    ├── core/                            # platform-level abstractions
    │   ├── game/
    │   │   ├── game.types.ts            # GameManifest, GameContext, GameRegistration
    │   │   ├── base-pixi-game.ts        # abstract class for all games
    │   │   └── game-engine.service.ts   # PIXI.Application lifecycle (per route)
    │   └── responsive/
    │       └── breakpoint.ts            # LayoutMode, MOBILE_BREAKPOINT, getLayoutMode
    │
    ├── features/
    │   ├── hub/                         # dashboard
    │   │   ├── hub.ts                   # smart: lists games from registry
    │   │   ├── hub.scss
    │   │   └── ui/
    │   │       ├── game-card.ts         # dummy: hover-lift card with --accent
    │   │       └── game-card.scss
    │   │
    │   └── games/
    │       ├── memory/                  # 4×4 card-match
    │       │   ├── memory.shell.ts
    │       │   ├── memory-game.ts       # MemoryGame extends BasePixiGame
    │       │   ├── domain/              # NO PIXI IMPORTS
    │       │   │   ├── models/
    │       │   │   │   ├── card.model.ts
    │       │   │   │   └── game-config.model.ts  # DESKTOP_/MOBILE_CONFIG, pickMemoryConfig
    │       │   │   ├── state/game-state.service.ts
    │       │   │   └── services/
    │       │   │       ├── game-engine.service.ts  # rules (flip/match/win)
    │       │   │       └── shuffler.ts
    │       │   ├── pixi/renderers/
    │       │   │   ├── board.renderer.ts
    │       │   │   └── card.renderer.ts          # ⭐ canonical draw-once pattern
    │       │   └── ui/
    │       │       ├── hud.ts
    │       │       ├── win-modal.ts / .html / .scss
    │       │
    │       └── snake/                   # arcade reflex game
    │           ├── snake.shell.ts
    │           ├── snake-game.ts        # SnakeGame extends BasePixiGame
    │           ├── domain/              # NO PIXI IMPORTS
    │           │   ├── models/
    │           │   │   ├── snake.model.ts          # Cell, Direction, GameStatus, DELTA, OPPOSITE
    │           │   │   └── snake-config.model.ts   # DESKTOP_/MOBILE_CONFIG, pickSnakeConfig, boardPixelSize
    │           │   ├── state/game-state.service.ts # signals + localStorage best score
    │           │   └── services/
    │           │       ├── game-engine.service.ts  # rules (tick, eat, collide, pause)
    │           │       └── food-spawner.ts
    │           ├── pixi/
    │           │   ├── renderers/
    │           │   │   ├── arena.renderer.ts       # static board background + grid
    │           │   │   ├── snake.renderer.ts       # ⭐ SegmentState draw-once pattern
    │           │   │   ├── food.renderer.ts       # GlowFilter orb + emoji label
    │           │   │   ├── particle.renderer.ts   # pooled burst particles (prewarmed)
    │           │   │   ├── score-popup.renderer.ts # rising "+10" text
    │           │   │   └── flash.renderer.ts       # red flash on death
    │           │   └── input/
    │           │       ├── keyboard-input.ts       # arrows + WASD + space/P/Esc
    │           │       └── swipe-input.ts          # touch swipe (pointerdown/up)
    │           └── ui/
    │               ├── hud.ts                      # score, length/target, best, speed bars, pause/restart
    │               ├── win-modal.ts / .html / .scss
    │               └── game-over-modal.ts / .html / .scss
    │
    └── shared/                          # (future) reusable UI primitives
```

### Adding a new game (recipe)

1. Create `features/games/<id>/` mirroring the snake/memory layout.
2. Implement `<Id>Game extends BasePixiGame` in `<id>-game.ts`.
3. Implement `<Id>Shell` Angular component (smart) that providers the game's services, instantiates the Pixi class, and wires `ResizeObserver`.
4. Provide `DESKTOP_CONFIG` + `MOBILE_CONFIG` + `pick<Id>Config(viewportWidth)` in `domain/models/<id>-config.model.ts`. Import `getLayoutMode` from `core/responsive/breakpoint`.
5. Append one entry to `src/app/games-config.ts`:
   ```ts
   {
     manifest: { id: 'tetris', title: 'Blocks', description: '...', thumbnail: '🟦', tags: [...], accent: '#ec4899' },
     loadShell: () => import('./features/games/tetris/tetris.shell').then(m => m.TetrisShell)
   }
   ```
6. Done. Hub picks it up, route is generated, lazy chunk is auto-split.

---

## 5. Current Progress

**Status: foundation laid. Hub + Memory + Snake wired end-to-end.**

### Done

| Item | Status |
|---|---|
| `BasePixiGame` abstraction | ✅ |
| Core `GameEngineService` (Application lifecycle) | ✅ |
| `games-config.ts` registry + `disabled` placeholder support | ✅ |
| Lazy-loaded route generation | ✅ (chunks: `hub`, `memory-shell`, `snake-shell`) |
| Hub dashboard (dark UI, hover, --accent per game) | ✅ |
| Design system tokens in `styles.scss` (neon palette, motion easings, typography) | ✅ |
| Responsive: `breakpoint.ts` + per-game mobile/desktop configs | ✅ |
| `ResizeObserver` wired in shells, routed through `GameEngineService.resize()` | ✅ |
| **Memory** — domain (state, rules, shuffler) | ✅ |
| **Memory** — Pixi renderers (board, card with manual flip tween) | ✅ |
| **Memory** — HUD (moves, pairs, restart) + win modal with star rating | ✅ |
| **Memory** — refactored to extend `BasePixiGame` | ✅ |
| **Snake** — domain (state, rules, food-spawner, models) | ✅ |
| **Snake** — Pixi renderers (arena, snake with SegmentState, food, particle, popup, flash) | ✅ |
| **Snake** — keyboard + swipe input | ✅ |
| **Snake** — HUD (score, length, best, speed bars, pause) + win + game-over modals | ✅ |
| **Snake** — `GlowFilter` glow effects on head + food | ✅ |
| **Snake** — wrap-around board + interpolated movement + squash + death cascade | ✅ |
| **Snake** — persistent best score (localStorage) | ✅ |
| **Snake** — perf pass (draw-once segments, particle prewarm, shake dirty flag) | ✅ |
| `pixi-filters` integrated | ✅ |

### Not yet

| Item | Status |
|---|---|
| Asset pipeline (`AssetLoaderService` + manifest preload) | ⛔ — both games use `Text` emoji placeholders |
| GSAP integration | ⛔ — manual `sin/cos`-based tweens in both games |
| Sound layer | ⛔ |
| **Global** highscore service (cross-game, manifest-driven metrics) | ⛔ — Snake has its own localStorage key; no shared service |
| Tests | ⛔ |
| Shared UI primitives (`shared/` button, modal, panel) | ⛔ |
| Asset preload before `app.init()` | ⛔ |
| Hub: filter/search by tag | ⛔ |
| Profile / progress persistence (IndexedDB) | ⛔ |

### Known issues / tech debt

1. **GlowFilter leak** — `snake.renderer.ts:23` and `food.renderer.ts:17` create `new GlowFilter(...)` but never call `filter.destroy()`. Each Hub→Snake→Hub navigation leaks a filter. **Fix priority: high.**
2. **`hslToHex` duplicated** in `snake-game.ts` and `food.renderer.ts`. Should extract to `core/util/color.ts`.
3. **Snake `resize()` resets score mid-game** (`snake-game.ts:138-152`). When viewport crosses the breakpoint during play, `rules.start(next)` is called, wiping score and length. Should re-layout only, not restart.
4. **Two `GameEngineService` classes** — one in `core/game/` (PIXI lifecycle), one inside each game's `domain/services/` (rules). Forces aliasing at every import site (`as RulesService` / `as MemoryRulesService`). Cleaner: rename per-game services to `<Id>RulesService`.
5. **`KeyboardInput` listens on `window` and always `preventDefault`s** — will hijack arrows from any future input field on the page. Should bail when `e.target` is editable.
6. **Snake HUD `Pause` button stays clickable on `lost`/`won`** — should disable; the rules service correctly ignores it but the affordance is wrong.
7. **Snake `ScorePopupRenderer` is single-slot** — fast successive eats overwrite the previous popup. Should queue.

---

## 6. Naming Conventions & Workflow

### File names

- Lowercase, dash-separated: `memory-game.ts`, `game-engine.service.ts`, `score-popup.renderer.ts`.
- Suffix conveys role:
  - `*.service.ts` — `@Injectable`
  - `*.model.ts` — types & interfaces only, no runtime values (small const tables OK, e.g. `DELTA`, `OPPOSITE`)
  - `*.renderer.ts` — Pixi-side class. Public surface: `view: Container | Graphics`, plus the methods the game calls.
  - `*.shell.ts` — smart Angular component (route entry)
  - `<id>-game.ts` — `BasePixiGame` subclass
  - `*-input.ts` — input adapter (keyboard, swipe, etc.)
  - `*.ts` (no suffix) — Angular component for the file's namesake (e.g. `hud.ts`, `win-modal.ts`)

### Class names

- `PascalCase`. Component classes do NOT carry `Component` suffix when the selector and filename already convey it (Angular 21 standalone idiom). Some legacy classes still use the suffix (`HudComponent`, `WinModalComponent`, `GameCardComponent`, `HubComponent`) — be consistent within a folder.
- Pixi classes end in `Renderer` (`BoardRenderer`, `CardRenderer`, `ArenaRenderer`, `FlashRenderer`).
- Domain services use intent: `GameStateService`, `GameEngineService` (where "engine" inside `domain/services/` = rules, not PIXI). Note: aliasing is required at import sites; see issue #4 in §5.
- Input adapters end in `Input` (`KeyboardInput`, `SwipeInput`).

### TypeScript

- `strict: true` (Angular default).
- Prefer `readonly` on all interface fields and class members not reassigned.
- Avoid `any`. Use `unknown` and narrow.
- Public API of services exposes `*.asReadonly()` signals — internal `_*` signals stay private.
- Inputs use `input.required<T>()`; outputs use `output<T>()`.
- Domain models for state collections use `readonly Cell[]` / `readonly Card[]` — immutability at the type level.

### Component patterns

- `changeDetection: ChangeDetectionStrategy.OnPush` always.
- Inject in field initializers: `private readonly engine = inject(GameEngineService);` — no constructor params.
- `viewChild.required<ElementRef<HTMLDivElement>>('stage')` for canvas hosts.
- Cleanup in `destroyRef.onDestroy(() => ...)` or in a game's `onDestroy()`.
- Modals (`win-modal`, `game-over-modal`) ship as separate components with their own `.html` + `.scss`. Sparkle/decoration arrays computed once in field initializers — `Math.random()` runs per instance.

### Renderer patterns

- Constructor takes the `Config` object and any callbacks. **No DI** in renderers.
- Public `view: Container | Graphics` is the only field outsiders touch.
- `setConfig(config)` to handle live config swap (resize across breakpoint). Destroys + rebuilds geometry pool.
- `tick(deltaMs)` for time-based updates that don't depend on state diffs (pulse, particle, popup decay, flash fade).
- `update(state)` or `render(prev, curr, t, ...)` for state-driven updates. **Draw-once + transform-only** (§3.6).
- `destroy()` must release filters AND children.

### Input patterns

- One adapter class per input modality. Constructor takes element (or `window`-scoped) + callbacks.
- `destroy()` removes all listeners and resets any DOM mutations (e.g. `el.style.touchAction`).

### Comments

- Default: none. Code should read itself.
- Add a one-liner only when the *why* is non-obvious (e.g. the `texture: false` choice on `app.destroy`, the wrap-around interpolation in `snake.renderer.ts`).
- No multi-line block comments. No JSDoc unless the symbol is part of a public API consumed across feature boundaries.

### Workflow

- **Build check before declaring done:** `npx ng build --configuration=development` from the repo root.
- **Branching:** working on `master`. Main branch is `main` per repo metadata; commits live on `master`.
- **Commit messages:** imperative present tense, terse. No emojis. Current pattern: `feat: <short description>`.
- **No dependency churn:** before adding a package, justify why an existing one (Pixi, pixi-filters, Angular signals) can't do it.

---

## 7. Roadmap

### Near-term (next 1–2 sessions)

1. **Pay down Snake tech debt** (priority order):
   - Fix `GlowFilter.destroy()` leak in Snake (1 hour).
   - Extract `hslToHex` + any other shared color/math helpers to `core/util/color.ts`.
   - Fix Snake `resize()` so it preserves score mid-game.
2. **Asset pipeline** — `AssetLoaderService` wrapping `Assets.load()`, manifest-driven preload, retina-aware texture resolution. Replace both games' `Text` emoji placeholders with real card-face / food sprites.
3. **GSAP integration** — install `gsap`, replace manual tweens in `CardRenderer.tick()` (Memory flip) and `SnakeRenderer` (squash) with `gsap.to(...)`. Cleaner easing, kill-on-destroy semantics.

### Mid-term

4. **Sound layer** — `AudioService` (root-provided, lazy-init AudioContext); per-game sound packs registered via manifest. Mute persisted in localStorage.
5. **Global highscore service** — `ScoreService` (`@Injectable({ providedIn: 'root' })`) backed by `localStorage` initially; manifest declares which metrics each game contributes (`moves`, `time`, `score`). Migrate Snake's per-key bestScore into this service.
6. **Two more games** — Puzzle (sliding tiles) and Breakout. The four `disabled: true` placeholders in `games-config.ts` (Puzzle, Tetris/Blocks, Breakout, Lab) need real shells.
7. **Shared UI primitives** — `shared/` folder: button, modal, panel, sparkle background. Used by HUDs and modals across games.
8. **Per-game theming via `--accent` token** — already partially wired in Hub; extend to in-game HUD via `[style.--accent]` binding on the shell.

### Long-term

9. **Theme system** — light/dark toggle (current is dark-only); per-game theme overrides via the manifest's `accent` plus optional palette.
10. **i18n** — Georgian + English. `@angular/localize` or signal-based translator.
11. **Tests** — `vitest` for `domain/` (state + rules — pure TS, no Pixi). Playwright for end-to-end navigation flow + Pixi smoke tests.
12. **Profile / progress persistence** — IndexedDB-backed user state, sync-ready shape.
13. **Plugin manifest format** — JSON schema for `GameManifest` so games can be registered from a remote feed without code changes (long shot — would require a sandboxed loader).

---

## 8. Quick reference

```bash
# install
npm install

# dev server
npx ng serve                              # http://localhost:4200

# production build
npx ng build

# fast feedback build (no minification)
npx ng build --configuration=development
```

### Key entry points (read first)

- `src/app/core/game/base-pixi-game.ts` — the contract every game implements
- `src/app/core/game/game-engine.service.ts` — Pixi `Application` lifecycle
- `src/app/core/responsive/breakpoint.ts` — single source for layout mode
- `src/app/games-config.ts` — what's registered, what's disabled
- `src/app/features/games/memory/memory-game.ts` + `pixi/renderers/card.renderer.ts` — canonical draw-once renderer pattern
- `src/app/features/games/snake/snake-game.ts` + `pixi/renderers/snake.renderer.ts` — `SegmentState` pattern, ticker-driven simulation, dual input
- `src/styles.scss` — design tokens (`--neon-*`, `--ease-*`, `--font-display`)

### Plans directory

Approved implementation plans live at `~/.claude/plans/`. Most recent: `adaptive-questing-pebble.md` (Snake perf optimization, 2026-04-29).
