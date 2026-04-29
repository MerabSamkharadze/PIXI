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
| Framework | **Angular 21** | Standalone components only — no NgModules. Signals are the primary reactive primitive. |
| Rendering | **PixiJS v8** | WebGL renderer, `Application` per route. Init is async (`await app.init()`). |
| Reactive | **Angular signals** + RxJS | Signals own state. RxJS is available for stream-style flows (router events, async pipelines) but is **not** the default state primitive. |
| Routing | `@angular/router` | Lazy via `loadComponent`. Routes are generated from the registry — see §4. |
| Build | `@angular/build` (esbuild) | `npx ng build` / `npx ng serve`. |
| Test | `vitest` | Wired but no suites yet. |
| Tooling | Prettier, TypeScript 5.9 | `.prettierrc` at root. |
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
- **Pixi renderers MUST NOT mutate state.** They observe it (via signal `effect()`) and translate it to visuals. Clicks fire callbacks the renderer received in its constructor — they do not call `state.set(...)` directly.
- **Angular components MUST NOT call PixiJS directly.** They wire services and host the canvas. The `BasePixiGame` subclass is the only thing that owns Pixi objects.

### 3.2 Smart / Dummy components

- **Smart** (e.g. `MemoryShell`, `HubComponent`) — inject services, hold a `viewChild` on the canvas host, orchestrate lifecycle.
- **Dummy** (e.g. `HudComponent`, `GameCardComponent`) — `input()` / `output()` only, `ChangeDetectionStrategy.OnPush`, no service injection.

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

State changes flow one way: Pixi → callback → rules service → signal `update` → effect → renderer diff. Renderers never own state.

### 3.6 Registry-driven scalability

`src/app/games-config.ts` is the **only** file that lists games. The Hub catalog reads it; routes are generated from it. Adding a game in two places (catalog + routes) is forbidden — there is one place.

---

## 4. Project Structure

```
src/app/
├── core/                                # platform-level abstractions
│   └── game/
│       ├── game.types.ts                # GameManifest, GameContext, GameRegistration
│       ├── base-pixi-game.ts            # abstract class for all games
│       └── game-engine.service.ts       # PIXI.Application lifecycle (per route)
│
├── features/
│   ├── hub/                             # dashboard
│   │   ├── hub.ts                       # smart: lists games from registry
│   │   └── ui/
│   │       └── game-card.ts             # dummy: hover-lift card with --accent
│   │
│   └── games/                           # one folder per game
│       └── memory/
│           ├── memory.shell.ts          # smart Angular component
│           ├── memory-game.ts           # MemoryGame extends BasePixiGame
│           ├── domain/                  # NO PIXI IMPORTS
│           │   ├── models/
│           │   │   ├── card.model.ts
│           │   │   └── game-config.model.ts
│           │   ├── state/
│           │   │   └── game-state.service.ts   # signals store
│           │   └── services/
│           │       ├── game-engine.service.ts  # rules (flip/match/win)
│           │       └── shuffler.ts
│           ├── pixi/
│           │   └── renderers/
│           │       ├── board.renderer.ts
│           │       └── card.renderer.ts
│           └── ui/
│               └── hud.ts                # dummy
│
├── shared/                              # (future) reusable UI primitives
│
├── games-config.ts                      # 📋 single source of truth
├── app.routes.ts                        # generated from games-config
├── app.config.ts
└── app.ts / app.html
```

### Adding a new game (recipe)

1. Create `features/games/<id>/` with the same internal layout as `memory/`.
2. Implement `<Id>Game extends BasePixiGame` in `<id>-game.ts`.
3. Implement `<Id>Shell` Angular component (smart) that providers the game's services and instantiates the Pixi class.
4. Append one entry to `src/app/games-config.ts`:
   ```ts
   {
     manifest: { id: 'snake', title: 'Snake', description: '...', thumbnail: '🐍', tags: [...], accent: '#49e0a0' },
     loadShell: () => import('./features/games/snake/snake.shell').then(m => m.SnakeShell)
   }
   ```
5. Done. Hub picks it up, route is generated, lazy chunk is auto-split.

---

## 5. Current Progress

**Status: foundation laid. Hub + Memory wired end-to-end.**

| Item | Status |
|---|---|
| `BasePixiGame` abstraction | ✅ |
| Core `GameEngineService` (Application lifecycle) | ✅ |
| `games-config.ts` registry | ✅ |
| Lazy-loaded route generation | ✅ (verified — separate chunks for `hub` and `memory-shell`) |
| Hub dashboard (dark UI, hover, --accent per game) | ✅ |
| Memory: domain (state, rules, shuffler) | ✅ |
| Memory: Pixi renderers (board, card, manual flip tween) | ✅ |
| Memory: HUD (moves, pairs, restart) + win overlay | ✅ |
| Memory: refactored to extend `BasePixiGame` | ✅ |
| Asset pipeline | ⛔ — uses `Text` placeholders |
| GSAP integration | ⛔ — manual `cos(progress·π)` tween |
| Particle / match-burst effects | ⛔ |
| Global highscore | ⛔ |
| Sound | ⛔ |
| Tests | ⛔ |

Build passes: `npx ng build` produces `hub` + `memory-shell` lazy chunks.

---

## 6. Naming Conventions & Workflow

### File names

- Lowercase, dash-separated: `memory-game.ts`, `game-engine.service.ts`.
- Suffix conveys role:
  - `*.service.ts` — `@Injectable`
  - `*.model.ts` — types & interfaces only, no runtime
  - `*.renderer.ts` — Pixi-side class
  - `*.shell.ts` — smart Angular component (route entry)
  - `<id>-game.ts` — `BasePixiGame` subclass
  - `*.ts` (no suffix) — Angular component for the file's namesake

### Class names

- `PascalCase`. Component classes do **not** carry the `Component` suffix when their selector and filename already convey it (Angular 21 standalone idiom). Exceptions kept where existing code uses the suffix (`HudComponent`, `GameCardComponent`, `HubComponent`, `MemoryGameComponent`-style is acceptable too — be consistent within a folder).
- Pixi classes end in `Renderer` (`BoardRenderer`, `CardRenderer`).
- Domain services use intent: `GameStateService`, `GameEngineService` (where "engine" = rules service inside a game's `domain/`).

### TypeScript

- `strict: true` (Angular default).
- Prefer `readonly` on all interface fields and class members that aren't reassigned.
- Avoid `any`. Use `unknown` and narrow.
- Public API of services exposes `*.asReadonly()` signals — internal `_*` signals stay private.
- Inputs use `input.required<T>()`; outputs use `output<T>()`.

### Component patterns

- `changeDetection: ChangeDetectionStrategy.OnPush` always.
- Inject in field initializers: `private readonly engine = inject(GameEngineService);` — no constructor params.
- `viewChild.required<ElementRef<HTMLDivElement>>('stage')` for canvas hosts.
- Cleanup in `destroyRef.onDestroy(() => ...)` or in a game's `onDestroy()`.

### Comments

- Default: none. Code should read itself.
- Add a one-liner only when the *why* is non-obvious (e.g., the `texture: false` choice on `app.destroy`).
- No multi-line block comments. No JSDoc unless the symbol is part of a public API consumed across feature boundaries.

### Workflow

- **Build check before declaring done:** `npx ng build` from the repo root.
- **Branching:** working on `master`. Main branch is `main` (per repo metadata) but commits live on `master` for now.
- **Commit messages:** imperative present tense, terse. No emojis.
- **No dependency churn:** before adding a package, justify why an existing one can't do it.

---

## 7. Roadmap

### Near-term (next 1–2 sessions)

1. **Asset pipeline** — `AssetLoaderService` wrapping `Assets.load()`, manifest-driven preload, retina-aware texture resolution. Replace Memory's `Text` placeholders with real card-face sprites.
2. **GSAP flip + match-burst** — install `gsap` + `pixi-filters`; replace manual tween in `CardRenderer.tick()` with `gsap.to(view.scale, ...)`; add particle emitter on match.
3. **Resize handling** — wire `ResizeObserver` on the canvas host, route through `GameEngineService.resize()`.

### Mid-term

4. **Sound layer** — `AudioService` with howler.js; per-game sound packs registered via manifest.
5. **Global highscore system** — `ScoreService` (`@Injectable({ providedIn: 'root' })`) backed by `localStorage` initially; manifest declares which metrics a game contributes (`moves`, `time`, `score`).
6. **Two more games** — Puzzle (sliding tiles) and Snake. Validates that the abstraction holds beyond Memory.
7. **Shared UI primitives** — `shared/` folder: button, modal, panel. Used by HUDs across games.

### Long-term

8. **Theme system** — CSS custom properties driven by user preference; per-game theme overrides.
9. **i18n** — Georgian + English. `@angular/localize` or signal-based translator.
10. **Tests** — `vitest` for `domain/` (state + rules), Playwright for end-to-end navigation flow.
11. **Profile / progress persistence** — IndexedDB-backed user state, sync-ready shape.
12. **Plugin manifest format** — JSON schema for `GameManifest` so games can be registered from a remote feed without code changes.

---

## 8. Quick reference

```bash
# install (already done — pixi.js included)
npm install

# dev server
npx ng serve

# production build
npx ng build

# build (development bundle, fast feedback)
npx ng build --configuration=development
```

Key entry points to read first:
- `src/app/core/game/base-pixi-game.ts` — the contract
- `src/app/core/game/game-engine.service.ts` — Pixi lifecycle
- `src/app/games-config.ts` — what's registered
- `src/app/features/games/memory/memory-game.ts` — reference implementation
