# PIXI Arcade — პროექტის სრული გზამკვლევი

> ერთიანი წყარო ყველა AI სესიისთვის, რომელიც ამ რეპოზიტორიას შემოსძრომს. ცვლილებების შეტანამდე ბოლომდე უნდა წაიკითხო.

---

## 1. პროექტის ხედვა

ეს არის **მრავალთამაშიანი ვებ-პლატფორმა**, სადაც თითოეული თამაში დამოუკიდებელი PixiJS WebGL გამოცდილებაა, რომელიც Angular-ის შელის შიგნით ცხოვრობს.

**პლატფორმის დონის ცნებები** (routing, lifecycle, dashboard, asset pipeline, scoring) საერთოა ყველა თამაშისთვის. თითოეული თამაში plug-and-play რეჟიმშია ერთი აბსტრაქციის (`BasePixiGame`) უკან — 51-ე თამაშის დამატებას იგივე დრო დასჭირდება, რაც მე-2-ს.

**პროექტის სამიზნე არ არის:** SSR, mobile-native აპლიკაცია, multiplayer / ქსელური სინქრონიზაცია.

ამჟამად პროექტში **6 სრული თამაშია:** Memory · Snake · Puzzle · Blocks (Tetris-style) · Breakout · The Lab (ფიზიკური თავსატეხი).

---

## 2. ტექნოლოგიური სტეკი — რა რისთვის გამოიყენება

| ფენა | ტექნოლოგია | რისთვის |
|---|---|---|
| Framework | **Angular 21.2** | UI-ფენის სკელეტი. **Standalone components** მხოლოდ — NgModules არ გამოიყენება. **Signals** არის რეაქტიული პრიმიტივი. |
| Rendering | **PixiJS v8.18** | WebGL რენდერინგი. თითო თამაშისთვის თითო `Application`. ინიციალიზაცია ასინქრონულია (`await app.init()`). |
| Pixi ეფექტები | **pixi-filters 6.1** | `GlowFilter` ბრწყინვის ეფექტისთვის (Snake-ის თავი/საკვები, ბურთები, Bombo-ს ცეცხლი). სხვა ფილტრებიც ხელმისაწვდომია. |
| რეაქტიულობა | **Angular signals** + RxJS 7.8 | Signals — მთავარი state primitive. RxJS — stream-სტილის flow-ებისთვის (router events, async pipelines), მაგრამ **არ არის** ნაგულისხმევი state-ის შენახვის გზა. |
| Routing | `@angular/router` | Lazy loading `loadComponent`-ით. Routes ავტომატურად გენერირდება registry-დან (იხ. §4). |
| Build | `@angular/build` (esbuild) | `npx ng build` / `npx ng serve`. სწრაფი esbuild-ბექენდი. |
| Test | `vitest` 4.0 | მზადაა, მაგრამ ჯერ ტესტები არ დაწერილა. |
| Tooling | Prettier 3.8, TypeScript 5.9 | `.prettierrc` რეპოს ფესვშია. `strict: true`. |
| გარემო | Windows · PowerShell · WebStorm | Bash-ი ხელმისაწვდომია; პრეფერენცია — forward slash-ი ბილიკებში. |

### ბიბლიოთეკების ფუნქცია უფრო დეტალურად

**PixiJS v8** — ეს არის ჩვენი მთავარი ხელსაწყო თამაშების ვიზუალური მხარისთვის:
- `Application` — root WebGL canvas. ყოველ თამაშს თავისი აქვს.
- `Container` — სცენის გრაფის კვანძი. ნებისმიერი ჯგუფი — Container-ი.
- `Graphics` — ვექტორული ფიგურები (`circle`, `roundRect`, `moveTo/lineTo`).
- `Text` — ტექსტი (HUD-ის დანახვადი ნაწილი არ — DOM-ი ჯობია).
- `Ticker` — frame loop, deltaMS-ით. გამოვიყენებთ თითო თამაშში ერთხელ.
- `Sprite` — სამომავლოდ asset pipeline-ისთვის (ჯერ არ გამოვიყენებთ).

**pixi-filters** — დამატებითი ფილტრები PixiJS-ზე. ძირითადად `GlowFilter` ვიყენებთ ბრწყინვის ეფექტისთვის. **მნიშვნელოვანია:** ფილტრები **Container.destroy()**-ზე ავტომატურად არ ნადგურდება, ცალკე უნდა გამოიძახო `filter.destroy()` (იხ. §6).

**Angular signals** — რეაქტიული მდგომარეობა. ყოველი თამაშის `GameStateService`-ი მთლიანად სიგნალებზეა აშენებული:
- `signal<T>(initial)` — წერვადი
- `computed(() => ...)` — წარმოებული მნიშვნელობები (auto-update)
- `effect(() => ..., { injector })` — გვერდითი ეფექტები (renderer-ის სინქრონიზაცია)

**RxJS** — გვაქვს, მაგრამ ცოტა ვიყენებთ. ძირითადად router-ის ნაკადებისთვის და async ოპერაციებისთვის.

---

## 3. არქიტექტურა — ფენების საზღვრები

ეს წესები **საფუძველმდებარეა**. დარღვევას ჯაჭვური ეფექტი აქვს.

```
┌─────────────────────────────────────────────┐
│  Angular Shell (DOM/HUD)  ─── Smart/Dummy   │  ← ფენა 1
├─────────────────────────────────────────────┤
│  BasePixiGame  ─── lifecycle contract       │  ← ფენა 2
├─────────────────────────────────────────────┤
│  Pixi renderers (Container, Graphics, ...)  │  ← ფენა 3
├─────────────────────────────────────────────┤
│  Domain (rules + state)  ─── pure TS        │  ← ფენა 4
└─────────────────────────────────────────────┘
```

### 3.1 ფენების მთავარი წესები

- **`domain/` არასოდეს არ უნდა ჩაიცვას `pixi.js`-დან.** ეს არის ტესტირებადი ბირთვი — სუფთა TypeScript. თუ აქ Container-ის გამოყენება გინდა — შეჩერდი.
- **Pixi renderer-ი არასოდეს არ უნდა ცვლიდეს state-ს.** ის მხოლოდ ხედავს state-ს (signal-ის `effect()`-ით) და გადააქცევს მას ვიზუალურ ფორმაში. ღილაკები იხსნება იმ callback-ებით, რომლებიც renderer-მა კონსტრუქტორში მიიღო — არასოდეს უშუალოდ `state.set(...)` არ გამოიძახოს.
- **Angular კომპონენტი არასოდეს არ უნდა ეხებოდეს PixiJS-ს უშუალოდ.** ის მხოლოდ სერვისებს მართავს და canvas-ს მასპინძლობს. `BasePixiGame`-ის შვილი კლასია ერთადერთი, რომელიც PIXI ობიექტებს ფლობს.

### 3.2 Smart / Dummy კომპონენტები

ჩვენ ვიცავთ **Smart / Dummy** დაყოფას:

- **Smart კომპონენტი** (მაგ. `MemoryShell`, `SnakeShell`, `HubComponent`) — `inject()`-ით სერვისებს იღებს, `viewChild`-ით canvas-ს სდევს, lifecycle-ს მართავს, resize-ს რეაგირებს. **ბიზნეს-ლოგიკა აქ არ ცხოვრობს** — მხოლოდ ორქესტრაცია.

- **Dummy კომპონენტი** (მაგ. `HudComponent`, `WinModalComponent`, `GameCardComponent`) — მხოლოდ `input.required<T>()` და `output<T>()`. `ChangeDetectionStrategy.OnPush`. სერვისს არ inject-ობს. **წმინდა ფუნქცია input-დან DOM-მდე.**

### 3.3 BasePixiGame-ის კონტრაქტი

ფაილი: `src/app/core/game/base-pixi-game.ts`

```ts
abstract class BasePixiGame {
  abstract readonly id: string;
  protected ctx!: GameContext;   // app, stage, width, height, injector
  protected root!: Container;    // ამ თამაშის ძირი ctx.stage-ის შიგნით

  async mount(ctx: GameContext): Promise<void>;  // template method
  protected abstract init(): Promise<void> | void;
  abstract resize(width: number, height: number): void;
  protected abstract onDestroy(): void;
  destroy(): void;               // onDestroy() + root.destroy({ children: true })
}
```

ყოველი თამაში ახდენს `init / resize / onDestroy`-ის implement-ს. ბაზური კლასი იძლევა გარანტიას, რომ `root` Container უკვე stage-ზე იქნება დამატებული `init()`-ის გამოძახებამდე და გასუფთავდება `onDestroy()`-ის შემდეგ.

### 3.4 Bridge pattern — state-ი ↔ ვიზუალი

```
GameStateService  ─── signals
       │
       │  effect(() => board.syncCards(state.cards()))
       ▼
BoardRenderer  ─── Pixi Container tree
```

State-ის ცვლილება მუდამ ერთი მიმართულებით მიდის:

```
Pixi/keyboard event → callback → rules service → signal update → effect → renderer diff
```

Renderer-ი არასოდეს არ ფლობს state-ს. ის მხოლოდ ეცემა state-ის ცვლილებას და ვიზუალურად გამოიყვანს მას.

### 3.5 Domain-ი — წმინდა TypeScript

`domain/` ფოლდერი — სუფთა ბიზნეს-ლოგიკა, ყოველგვარი UI / Pixi-ს გარეშე:
- `models/` — `interface`, `type`, ცხრილები (მაგ. `DELTA`, `OPPOSITE`, `SHAPES`).
- `state/` — `GameStateService` სიგნალებით.
- `services/` — `GameEngineService` (წესები) + helper-ები (`shuffler`, `food-spawner`, `physics`, `tetromino-bag`).

ეს ფენა **ცარიელ Node.js გარემოში მუშაობს** — Pixi/Angular DOM-ის გარეშე. სრულად ტესტირებადი.

### 3.6 Per-frame რენდერინგის შაბლონი (draw-once, transform-only)

ეს არის ერთ-ერთი **ყველაზე მნიშვნელოვანი წარმადობის წესი** (Snake-ის რეფაქტორიდან მიღებული გაკვეთილი):

- **გეომეტრია ერთხელ დახატე.** `g.clear()` + `g.roundRect(...).fill(...)` უნდა გაიშვას მხოლოდ მაშინ, როცა state რეალურად შეიცვალა (size / color / orientation), **არა ყოველ ფრეიმზე**.
- **ფრეიმში ცვლი მხოლოდ transform-ებს:** `position`, `scale`, `rotation`, `alpha`, `visible`. ეს არის იაფი GPU upload-ი.
- **თუ გეომეტრია რამდენიმე input-ზეა დამოკიდებული** — შეინახე "drawn state" ცალკე და მხოლოდ ცვლილებაზე გადახატე. იხილე `snake.renderer.ts:13-19` (`SegmentState`) კანონიკური მაგალითი.

**წესის დარღვევა:** 30 segment-ი × 60fps = 1800 GraphicsContext rebuild-ი წამში. მობილური მოწყობილობა მაშინვე ხედავს.

### 3.7 Registry-driven scalability

`src/app/games-config.ts` — **ერთადერთი ფაილი**, რომელიც თამაშებს ჩამოთვლის. Hub კატალოგი მისგან კითხულობს, route-ები ავტომატურად გენერირდება. ორ ადგილას ჩაწერა (კატალოგი + routes) აკრძალულია — **ერთი ადგილია**.

`GameManifest.disabled?: boolean` ანიშნებს placeholder-ს — ჩანს Hub-ში (გაჩუმებული), მაგრამ route-ად არ ხელმისაწვდომია.

### 3.8 Responsive / breakpoint pattern

`src/app/core/responsive/breakpoint.ts` განსაზღვრავს ერთიან `LayoutMode = 'mobile' | 'desktop'` 768px ზღვარით. ყოველი თამაში აწვდის **ორ კონფიგურაციას** (`DESKTOP_CONFIG`, `MOBILE_CONFIG`) და `pickXxxConfig(viewportWidth)` დამხმარე ფუნქციას. Shell-ი ამას იძახებს boot-ზე და ResizeObserver-ის event-ებზე.

**ყველა breakpoint ლოგიკა მიდის `getLayoutMode()`-ზე.** არსად სხვაგან 768 hard-coded არ უნდა იყოს.

---

## 4. პროექტის სტრუქტურა

```
src/
├── styles.scss                          # design tokens (neon palette, motion, typography)
├── main.ts
├── index.html
└── app/
    ├── app.ts / app.html / app.scss     # ძირი (router-outlet)
    ├── app.routes.ts                    # auto-generated from games-config
    ├── app.config.ts
    ├── games-config.ts                  # 📋 single source of truth
    │
    ├── core/                            # პლატფორმის დონის აბსტრაქციები
    │   ├── game/
    │   │   ├── game.types.ts            # GameManifest, GameContext, GameRegistration
    │   │   ├── base-pixi-game.ts        # აბსტრაქტული კლასი ყველა თამაშისთვის
    │   │   └── game-engine.service.ts   # PIXI.Application lifecycle (per route)
    │   └── responsive/
    │       └── breakpoint.ts            # LayoutMode, getLayoutMode
    │
    ├── features/
    │   ├── hub/                         # მთავარი dashboard
    │   │   ├── hub.ts
    │   │   └── ui/game-card.ts
    │   │
    │   └── games/                       # თითო თამაში — თითო ფოლდერი
    │       ├── memory/                  # 4×4 ბარათების ასორტი
    │       ├── snake/                   # კლასიკური გველი
    │       ├── puzzle/                  # 15-სლაიდი თავსატეხი
    │       ├── blocks/                  # Tetris-სტილის ფიგურები
    │       ├── breakout/                # ბურთი + paddle + ბრიკები + power-ups
    │       └── lab/                     # 12 ფიზიკური ექსპერიმენტი
    │
    └── shared/                          # (მომავალი) reusable UI primitives
```

### თითო თამაშის სტანდარტული ლეიაუტი

```
features/games/<id>/
├── <id>.shell.ts                # Smart Angular კომპონენტი (route entry)
├── <id>-game.ts                 # BasePixiGame შვილი
├── domain/
│   ├── models/                  # 🚫 NO PIXI IMPORTS
│   │   ├── *.model.ts           # ტიპები / interface-ები
│   │   └── <id>-config.model.ts # DESKTOP/MOBILE configs + pickXxxConfig
│   ├── state/
│   │   └── game-state.service.ts   # signals store
│   └── services/
│       ├── game-engine.service.ts  # წესები (rules)
│       └── *.ts                    # helpers (shuffler, physics, bag, etc.)
├── pixi/
│   ├── renderers/
│   │   └── *.renderer.ts        # ვიზუალური მხარე
│   └── input/
│       └── *-input.ts           # keyboard / pointer / swipe adapters
└── ui/
    ├── hud.ts                   # Dummy: HUD ჯგუფი (DOM)
    ├── *-modal.ts/.html/.scss   # modal components
    └── ...
```

### როგორ ვამატებ ახალ თამაშს — რეცეპტი

1. შექმენი `features/games/<id>/` — Memory/Snake-ის შაბლონით.
2. იმპლემენტი `<Id>Game extends BasePixiGame`-ი `<id>-game.ts`-ში.
3. იმპლემენტი `<Id>Shell` (Smart Angular კომპონენტი) — providers, ResizeObserver.
4. დაწერე `DESKTOP_CONFIG` + `MOBILE_CONFIG` + `pick<Id>Config(viewportWidth)` `domain/models/<id>-config.model.ts`-ში. იმპორტი `getLayoutMode` `core/responsive/breakpoint`-დან.
5. დაამატე ერთი ჩანაწერი `src/app/games-config.ts`-ში:
   ```ts
   {
     manifest: { id: 'newgame', title: 'New', description: '...', thumbnail: '🎯', tags: [...], accent: '#22d3ee' },
     loadShell: () => import('./features/games/newgame/newgame.shell').then(m => m.NewGameShell)
   }
   ```
6. **დასრულდა.** Hub ავტომატურად აიღებს, route გენერირდება, lazy chunk ცალკე იქნება split-ი.

---

## 5. Design Patterns და კოდის პრინციპები

### 5.1 Bridge — domain და renderer-ის კავშირი

ჩვენი მთავარი შაბლონი. State-ი ცხოვრობს signals-ში, renderer წვდება მას `effect()`-ით:

```ts
// memory-game.ts (მაგალითი)
this.effectRef = effect(() => {
  const cards = this.state.cards();
  if (cards.length) board.syncCards(cards);
}, { injector: this.injector });
```

State-ის ცვლილებაზე `effect`-ი ფიქსდება და renderer-ი თავის ვიზუალს აკორექტირებს. **ცალმხრივი ნაკადი.**

### 5.2 Strategy — Input adapter-ები

თითოეული input modality (კლავიატურა, swipe, pointer) თავისი კლასია:

```
KeyboardInput → callbacks → rules service
SwipeInput    → callbacks → rules service
PointerInput  → callbacks → rules service
```

Game-class-ი მხოლოდ ერთხელ ქმნის ყველა adapter-ს და callback-ებს უფარდებს `rules.method()`-ს. რეცეპტი ერთიანია.

### 5.3 Pool / Object reuse

ყოველ თამაშში, რომელიც ნაწილაკებს ხატავს, ვიყენებთ `ParticleRenderer` pool-ს:
- `prewarm(count)` — boot-ზე უნდა გამოვიძახოთ, რომ პირველი ნაწილაკი არ გამოიწვიოს ფრეიმის ჩავარდნა.
- `acquire()` / `release()` — გამოყენებული Graphics-ი ცარიელდება და უკან pool-ში ბრუნდება.

### 5.4 Template Method — BasePixiGame.mount

ბაზური კლასი განსაზღვრავს `mount()` ალგორითმს და შვილებზე ტოვებს `init / resize / onDestroy` "ნახვრეტებს":

```ts
async mount(ctx: GameContext): Promise<void> {
  this.ctx = ctx;
  this.root = new Container();
  ctx.stage.addChild(this.root);
  await this.init();
  this.resize(ctx.width, ctx.height);
}
```

ყოველი თამაშის შვილი იცვლის ნახვრეტებს, ბაზური კლასი — ჩარჩოს.

### 5.5 Registry — Configuration as Data

`games-config.ts` არის **მონაცემი, არა კოდი**. ის აღწერს ყველა თამაშს უხეშად: `id`, `title`, `accent`, `loadShell`. ეს შესაძლებელს ხდის `app.routes.ts`-ის ავტო-გენერაციას + Hub-ის ავტო-შევსებას.

---

## 6. მეხსიერების მართვა — მკაცრი წესები

PixiJS-ს არ აქვს automatic GC GPU რესურსებზე. მახსოვრობის ნაკადები **გრძელდება საათებს**, თუ წესებს არ დაიცავ.

### 6.1 ყოველი `new` უნდა შეესაბამოს `destroy()`-ს

ყოველი `new Container()`, `new Graphics()`, `new Text()`, `new Ticker()`, `new Sprite()` — **უნდა ჰქონდეს შესაბამისი `.destroy()` გამოძახება**, რომელიც მიწვდომადი იქნება თამაშის `onDestroy()`-დან.

### 6.2 ფილტრები ცალკე უნდა განადგურდეს

```ts
// ❌ ცუდი — GlowFilter ნადგურდება, მაგრამ filter არა
this.view.filters = [new GlowFilter(...)];
this.view.destroy({ children: true });
```

```ts
// ✅ კარგი
private readonly glow: GlowFilter;
constructor() {
  this.glow = new GlowFilter(...);
  this.view.filters = [this.glow];
}
destroy(): void {
  this.view.filters = null;
  this.glow.destroy();
  this.view.destroy({ children: true });
}
```

`Container.destroy({ children: true })` **არ ანადგურებს ფილტრებს**. ეს უკვე გასწორდა Snake / Lab თამაშებში; შემდეგი თამაშების წერისას ეს გახსოვდეს.

### 6.3 EffectRef-ებიც ცალკე უნდა მოგვყავდეს

```ts
private effects: EffectRef[] = [];

protected init(): void {
  this.effects.push(effect(() => { ... }, { injector: this.injector }));
}

protected onDestroy(): void {
  this.effects.forEach(e => e.destroy());
  this.effects = [];
}
```

### 6.4 GameEngineService-ის destroy

`core/game/game-engine.service.ts`-ში:
```ts
app.destroy(true, { children: true, texture: false });
```

`texture: false` — შერჩევითად ვიქცევით, რადგან მომავალი asset pipeline ფლობს texture cache-ს route-ების შორის. ფიქრი ნაგულისხმევზე — ფასი/სარგებელი.

### 6.5 Per-route engine

`GameEngineService` provided-ია **shell კომპონენტის დონეზე**, არა root-ზე. Route-დან გასვლისას DI scope იშლება და `destroy()` ავტომატურად გაიშვება.

---

## 7. წარმადობის პრინციპები

### 7.1 Draw-once, transform-only

(იხ. §3.6.) Snake-ის ანალიზიდან: 1800 rebuild/s → ~0 rebuild/s. **ფრეიმის work** მინიმალურამდე.

### 7.2 Sub-stepping (anti-tunneling)

ფიზიკის თამაშებში (Breakout, Lab) ბურთი სწრაფად მოძრაობს. თუ ერთი ფრეიმის გადაადგილება > ბრიკის სიგრძე, ბურთი გადაივლის ბრიკზე. გამოსავალი: **substep**-ები.

```ts
const subs = Math.min(8, Math.ceil((speed * deltaMs) / substepMaxPx));
const subDt = deltaMs / subs;
for (let s = 0; s < subs; s++) {
  // physics step + collision check
}
```

`substepMaxPx ≈ ballRadius * 0.8` — ემპირიული საუკეთესო კომპრომისი.

### 7.3 Closest-hit, არა first-hit

რთულ ფიზიკაში ბურთი შეიძლება ეჯახებოდეს რამდენიმე ობიექტს ერთდროულად (კუთხეში). **არ შეიძლება** პირველი ნაპოვნი — სწორი შერჩევა არის **უახლოესი** (`prev`-დან minimum dist).

### 7.4 Dirty-flag patterns

თუ ცვლილება იშვიათია (მაგ. shake state, hold lock), **dirty flag** უმჯობესია per-frame შემოწმებაზე:

```ts
// ❌ per-frame property check
if (this.playRoot.position.x !== this.baseX || this.playRoot.position.y !== this.baseY) { ... }

// ✅ dirty flag
if (this.shakeActive) { reset; this.shakeActive = false; }
```

### 7.5 Pool prewarm

ნებისმიერი pool-ი — particle, bullet, etc. — **prewarm-ი** boot-ზე. პირველი burst-ი/dispatch-ი არ უნდა გამოიწვიოს მახსოვრობის allocate-ი play-ის დროს.

---

## 8. კოდირების კონვენციები

### 8.1 ფაილების სახელები

- ლათინური ასოები, dash-ით გამოყოფილი: `memory-game.ts`, `score-popup.renderer.ts`.
- Suffix იმეორებს როლს:
  - `*.service.ts` — `@Injectable`
  - `*.model.ts` — ტიპები / interface-ები (მცირე const ცხრილები ნებადართულია — `DELTA`, `OPPOSITE`, `SHAPES`)
  - `*.renderer.ts` — Pixi-ის მხრის კლასი
  - `*.shell.ts` — Smart Angular კომპონენტი (route entry)
  - `<id>-game.ts` — `BasePixiGame` შვილი
  - `*-input.ts` — input adapter
  - `*.ts` (suffix-ის გარეშე) — Angular კომპონენტი

### 8.2 კლასების სახელები

- **PascalCase.** Component კლასებს არ ემატება `Component` suffix-ი, თუ selector-ი და ფაილის სახელი უკვე ხსნიან როლს (Angular 21 standalone idiom). მემკვიდრეობით ზოგჯერ რჩება (`HudComponent`, `WinModalComponent`) — ფოლდერის შიგნით თანმიმდევრულობა მნიშვნელოვანია.
- Pixi კლასები — `Renderer` suffix-ით (`BoardRenderer`, `CardRenderer`).
- Domain სერვისები — განზრახვით (`GameStateService`, `GameEngineService` სადაც "engine" = წესები).
- Input adapter-ები — `Input` suffix-ით (`KeyboardInput`, `SwipeInput`).

### 8.3 TypeScript

- `strict: true` (Angular-ის default).
- **`readonly`** — ყველა interface ველზე და კლასის წევრზე, რომელიც არ იცვლება.
- **`any`-ს არ ვიყენებთ.** `unknown` და narrow.
- სერვისების public API იყენებს `*.asReadonly()` signals — შიდა `_*` signals პირადია.
- Input-ები — `input.required<T>()`. Output-ები — `output<T>()`.
- კოლექციების ტიპები — `readonly Cell[]` / `readonly Card[]` — immutability ტიპის დონეზე.

### 8.4 კომპონენტების შაბლონები

- `changeDetection: ChangeDetectionStrategy.OnPush` **ყოველთვის**.
- Inject ფილდის ინიციალიზატორში: `private readonly engine = inject(GameEngineService);`. Constructor-ის პარამეტრები არა.
- `viewChild.required<ElementRef<HTMLDivElement>>('stage')` canvas მასპინძლებზე.
- გასუფთავება — `destroyRef.onDestroy(() => ...)` ან თამაშის `onDestroy()`-ში.
- Modal-ები (`win-modal`, `game-over-modal`) — ცალკე კომპონენტებად, თავისი `.html` + `.scss`. Sparkle / decoration arrays computed-ი ფილდის ინიციალიზატორში.

### 8.5 Renderer-ების შაბლონები

- კონსტრუქტორი იღებს `Config`-ს და callback-ებს. **DI არა**.
- Public ფილდი — `view: Container | Graphics`. გარესამყაროს მხოლოდ ეს ეხება.
- `setConfig(config)` — live config swap-ის დროს (resize across breakpoint). pool-ი ნადგურდება და ახლიდან.
- `tick(deltaMs)` — დროზე დამოკიდებული ანიმაცია (pulse, particle decay). სუფთა transform-ები.
- `update(state)` ან `render(prev, curr, t, ...)` — state-ით მართული ცვლილება. **Draw-once** (§3.6).
- `destroy()` — ფილტრებიც + children-იც.

### 8.6 Input-ის შაბლონები

- ერთი adapter — ერთი modality.
- კონსტრუქტორი — element + callback-ები.
- `destroy()` — ყველა listener წაშალე და DOM mutation-ი დააბრუნე (მაგ. `el.style.touchAction = ''`).

### 8.7 კომენტარები

- **ნაგულისხმევი — არცერთი.** კოდი თავად უნდა იკითხებოდეს.
- ერთხაზოვანი კომენტარი მხოლოდ მაშინ, როცა *რატომ* არ არის თვალით ცხადი (მაგ. `texture: false` არჩევანი `app.destroy`-ზე, snake-ის wrap-around interpolation).
- მრავალხაზოვანი ბლოკები არა. JSDoc-ი არა, თუ სიმბოლო არ გადადის feature-ის საზღვარს.

### 8.8 Workflow

- **build-ის შემოწმება ყოველი სამუშაოს ბოლოს:** `npx ng build --configuration=development` რეპოს root-დან.
- **Branching:** master-ზე ვმუშაობთ. main — repo metadata, მაგრამ commits master-ზე.
- **Commit messages:** imperative present tense, ლაკონური. ემოჯი არა. ამჟამინდელი შაბლონი: `feat: <short description>`.
- **Dependency churn-ი არა:** ახალი პაკეტის დამატებამდე დაასაბუთე, რომ უკვე არსებული (Pixi, pixi-filters, Angular signals) ვერ აკეთებს იგივეს.

---

## 9. Pixi-ის გამოყენების პრინციპები

### 9.1 Application lifecycle

```ts
const app = new PIXI.Application();
await app.init({
  background: 0x000000,
  width, height,
  antialias: true,
  resolution: window.devicePixelRatio,
  autoDensity: true
});
hostElement.appendChild(app.canvas);
```

`init` **ასინქრონულია PIXI v8-ში** (v7-ში სინქრონული იყო). `await`-ი აუცილებელია.

### 9.2 Container hierarchy

```
app.stage (root)
  └─ playRoot (game's own root)
      ├─ arena.view
      ├─ playfield.view
      ├─ active-piece.view
      ├─ particles.view
      └─ flash.view
```

**ცალკე layer-ები** — z-ordering ჯაჭვური. Particle-ი/flash-ი ზევით — ყოველთვის ჩანდება.

### 9.3 Coordinate system

Pixi v8 default — Y გადის **ქვევით** (web-ის მსგავსი). გრავიტაცია — `+y`. `rotation` დადებითი — საათისებრივი.

### 9.4 Graphics API (v8)

```ts
g.clear()
  .roundRect(x, y, w, h, r).fill({ color, alpha })
  .stroke({ width, color, alpha });
```

Chain-ი მუშაობს. **`fill` / `stroke` ცალკე გამოძახდება** — ერთიანი `drawRect`-ი v7-ის სტილში აღარაა. `fill` და `stroke` მუშაობენ **ბოლო shape-ზე** რომელიც მის წინ აღიწერა.

### 9.5 Text rendering

```ts
new Text({
  text: '...',
  style: { fontFamily: [...], fontSize, fill, dropShadow: {...} }
});
```

**`new` PIXI v8-ში options object-ით.** Text-ი ძვირია (canvas-ი ხატავს თითო ცვლილებაზე) — გამოიყენე მხოლოდ Pixi-ში მნიშვნელოვანი label-ებისთვის. სხვა შემთხვევებში — DOM ჯობია.

### 9.6 Filter usage

```ts
this.glow = new GlowFilter({ distance, outerStrength, innerStrength, color, quality });
this.view.filters = [this.glow];
```

**Quality < 1** — შეგნებული პრეფერენცია. Filter-ი ძვირია — quality 0.3-0.5 საკმარისია ნებისმიერი UI-ისთვის, ნახევარს ზოგავს GPU-ს.

**`GlowFilter` per-element-ზე** — ცუდი იდეა. გადაიტანე parent container-ზე — ფილტრი ერთხელ უნდა გაიშვას, ბევრ ბავშვზე.

### 9.7 Ticker და frame loop

```ts
this.ticker = new Ticker();
this.ticker.add(t => this.frame(t.deltaMS));
this.ticker.start();
```

PixiJS-ის ticker-ი იყენებს `requestAnimationFrame`-ს. `t.deltaMS` — წინა ფრეიმიდან გასული ms-ი (typical 16-17 60fps-ზე). **ფრეიმის work** ამ რიცხვით ამატებულ-ნორმალიზებული.

---

## 10. გაფრთხილებები — გაკვეთილები გამოცდილებიდან

ეს ის შეცდომებია, რომელიც ჩვენ უკვე გვქონდა. მათ თავიდან აცილება:

### 10.1 GlowFilter leak (Snake)

ბაგი: `view.destroy({ children: true })` ფილტრს არ ანადგურებს. ყოველი route-ის ცვლილება იტოვებდა GPU shader-ს. **გასწორებული Lab-ში; შემდეგ თამაშებში ხსოვდე §6.2.**

### 10.2 Side-hit reflect with zero velocity (Breakout)

ბაგი: `reflect({ x: 0, y: 0 }, side)` ნულოვანი ვექტორი → ბურთი ჩერდებოდა paddle-ში. გამოსწორება: paddle ერთ-მხრივი — მხოლოდ ზედა hit reflect-ი, გვერდი/ქვემო → ბურთი გაივლის და ცხოვრება დაიკარგება.

### 10.3 Wall angle confusion (Lab)

PixiJS rotation: **დადებითი = საათისებრივი** (y ქვემოთ). მე ვცდებოდი — funnel walls-ის ნიშნები მქონდა გადაბრუნებული, V-ის ნაცვლად ^-ფორმა იქმნებოდა. **გახსოვდეს:** დადებითი angle → მარჯვენა ბოლო ქვემოთ.

### 10.4 Closed barriers without gap (Lab L7 Portal)

ერთი ბაგი იყო ერთი ფაიფლი ქმნიდა "ფაიერვოლს" — ბურთი ვერ აღწევდა portal-მდე. ლექცია: **ლეიაუტის ხელით ვიზუალიზაცია** — სცადე, არ უნდა გათვალო ცარიელი დაგჯე mock-ი ფურცელზე.

### 10.5 First-hit instead of closest-hit (Breakout)

კუთხეში 2 ბრიკი ერთდროულად — `for` loop-ი იღებდა პირველს, არა ყველაზე ახლოს. ფიზიკურად არასწორი reflection. ფიქსი: ციკლი მთლიანად, dist² შედარება, უმცირესი — გამარჯვებული.

### 10.6 Multi-ball with attached source (Breakout)

ბურთი გაშვებამდე vel = (0, 0). multi-ball-ი ცდილობდა fan-out-ს ნულოვანი ვექტორიდან → atan2(0,0) = 0 → ბურთები horizontal-ზე გადიოდნენ. ფიქსი: არა-მოძრაობის შემთხვევაში default-ი (-π/2 ზევით).

### 10.7 Per-frame state.status() reads (Snake)

თავდაპირველი წარმოდგენა: signal წაკითხვა იაფია, მაგრამ ბევრი reads ფრეიმში — ცუდი ფსიქოლოგია. ერთხელ წაიკითხე ცვლადში, ისე გამოიყენე branch-ში.

---

## 11. სტატუსი — რა გაკეთდა / რა აკლდება

### დასრულებული (✅)

| Item | Status |
|---|---|
| `BasePixiGame` აბსტრაქცია | ✅ |
| Core `GameEngineService` (Application lifecycle) | ✅ |
| `games-config.ts` registry + `disabled` ფლაგი | ✅ |
| Lazy-loaded route generation | ✅ — 6 ცალკე chunk |
| Hub dashboard (dark UI, hover, --accent per game) | ✅ |
| Design tokens `styles.scss`-ში | ✅ |
| Responsive: `breakpoint.ts` + per-game configs | ✅ |
| ResizeObserver routed through GameEngineService | ✅ |
| **Memory** — domain + Pixi + HUD + win modal | ✅ |
| **Snake** — full game, perf-optimized, best score | ✅ |
| **Puzzle** — sliding tiles, goal preview, best persist | ✅ |
| **Blocks** — SRS rotation, hold, next-3, mobile controls | ✅ |
| **Breakout** — ball physics, 6 levels, 5 power-ups, lasers | ✅ |
| **The Lab** — 12 physics levels (pegs/walls/bumpers/portals/wells/spinners) | ✅ |
| `pixi-filters` GlowFilter integration | ✅ |
| LocalStorage persistence (best scores, level stars) | ✅ |

### აკლდება (⛔)

| Item | Status |
|---|---|
| Asset pipeline (`AssetLoaderService` + manifest preload) | ⛔ — ყველა თამაში emoji/Text placeholder |
| GSAP integration | ⛔ — manual sin/cos tweens |
| Sound layer | ⛔ |
| Global `ScoreService` (cross-game) | ⛔ — ყოველი თამაშის localStorage ცალკე |
| Tests | ⛔ |
| Shared UI primitives (`shared/`) | ⛔ |
| Profile / progress (IndexedDB) | ⛔ |
| Hub: filter / search by tag | ⛔ |

### Roadmap (Roadmap)

**უახლოესი:**
1. Snake-ის bestScore + Puzzle-ის bestMoves/bestTime + Blocks/Breakout-ის bestScore + Lab-ის bestStars → ერთიანი `ScoreService`.
2. Asset pipeline — emoji-ბის ნაცვლად რეალური სპრაიტები.
3. GSAP — manual tweens-ის ჩანაცვლება (squash, flip, slide, paddle width).

**საშუალოვადიანი:**
4. Sound — `AudioService` + per-game sound packs.
5. Shared UI primitives (button, modal, panel).
6. Per-game theming `--accent` token-ით.
7. Light/dark theme toggle.

**გრძელვადიანი:**
8. i18n — ქართული + ინგლისური.
9. Tests — vitest domain-ისთვის, Playwright e2e.
10. Profile / progress IndexedDB.
11. Plugin manifest format — remote feed-დან რეგისტრაცია.

---

## 12. სწრაფი ცნობარი

```bash
# ინსტალაცია
npm install

# dev server
npx ng serve                          # http://localhost:4200

# production build
npx ng build

# fast feedback (development bundle)
npx ng build --configuration=development
```

### პირველი წასაკითხი ფაილები

- `src/app/core/game/base-pixi-game.ts` — კონტრაქტი
- `src/app/core/game/game-engine.service.ts` — Pixi Application lifecycle
- `src/app/core/responsive/breakpoint.ts` — layout mode
- `src/app/games-config.ts` — registry
- `src/app/features/games/memory/memory-game.ts` + `pixi/renderers/card.renderer.ts` — draw-once kanonical pattern
- `src/app/features/games/snake/snake-game.ts` + `pixi/renderers/snake.renderer.ts` — `SegmentState` pattern, ticker-driven simulation
- `src/app/features/games/breakout/domain/services/physics.ts` — circle-rect collision
- `src/app/features/games/lab/domain/services/physics.ts` + `integrator.ts` — სრული ფიზიკური engine
- `src/styles.scss` — design tokens (`--neon-*`, `--ease-*`, `--font-display`)

### Plans directory

დამტკიცებული გეგმები: `~/.claude/plans/`. ყველა მიმდინარე გეგმა აქ ცხოვრობს.

---

## 13. ოქროს წესები — TL;DR

თუ ახლახან დაიწყე ამ რეპოზე მუშაობა, ეს სია გახსოვდე:

1. **`domain/`-ში PIXI არასოდეს.** წმინდა TypeScript.
2. **Renderer state-ს არ ცვლის.** მხოლოდ ხედავს და ხატავს.
3. **Angular კომპონენტი PIXI-ს არ ეხება.** მხოლოდ შელი + სერვისი.
4. **Draw-once, transform-only.** გეომეტრია — state-ცვლილებაზე; transform — ფრეიმში.
5. **ყოველი `new` — `destroy()`.** ფილტრებიც ცალკე.
6. **EffectRef-ი onDestroy-ში გადააგდე.**
7. **Smart/Dummy.** Smart მართავს, Dummy ხატავს.
8. **`OnPush` ყოველთვის.**
9. **Sub-stepping ფიზიკაში.** Anti-tunneling.
10. **Closest-hit, არა first-hit.**
11. **`games-config.ts` ერთადერთია.** Routes აქედან.
12. **`getLayoutMode()` ერთადერთი breakpoint წყაროა.**
13. **Build პროცესის ბოლოს.** `npx ng build --configuration=development`.
14. **კომენტარი მხოლოდ "რატომ"-ისთვის.** "რა"-ს კოდი იმეორებს.
15. **შეცდომა → root cause.** Bypass / `--no-verify` — არასოდეს.
