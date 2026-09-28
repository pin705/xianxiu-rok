# Sơn Hà Tiên Tông (Mountain-River Immortal Sect)

<div align="center">

[Tiếng Việt](README.md) · **English**

[![CI](https://github.com/pin705/rok/actions/workflows/ci.yml/badge.svg)](https://github.com/pin705/rok/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-green.svg)](CONTRIBUTING.md)

<img src="docs/screenshots/sect.png" width="240" alt="Sect mountain view" /> <img src="docs/screenshots/battle.png" width="240" alt="Battle" /> <img src="docs/screenshots/world.png" width="240" alt="World map" /> <img src="docs/screenshots/elders.png" width="240" alt="Elders" />

</div>

A browser-based cultivation strategy game (SLG): found a sect, recruit elders, march troops against demon beasts, survive tribulations, reincarnate. **Play online** — the server acts as referee (running the exact same rules code as the client), progress persists in PostgreSQL. Installable as a PWA. Multi-language (currently Vietnamese and English).

Requires Node.js 24+. Quickest way to run:

```bash
npm install
npm start          # database (Docker) + server + client: open http://localhost:5173
```

```bash
npm install
npm run db         # dev/test Postgres (Docker, port 5439) — once per reboot
# or skip Docker: DATABASE_URL=postgres://user:pass@host:5432/rok in .env (user needs CREATEDB for test/e2e/play)
npm run server     # game server: http://localhost:8787 (auto-restarts on code changes; API docs at /docs)
npm run dev        # play: http://localhost:5173 (proxies /api and /socket.io to the server)
npm test           # game rules, packets, i18n, package boundaries, server against real Postgres, SSR-renders every screen
npm run check      # type checks (tsc + svelte-check in every package)
npm run sim        # bot plays 30 virtual days, prints pacing (CI fails if it doesn't reach floor 15)
npm run build      # static build in apps/client/dist
npm run e2e        # after build: headless Chrome plays the real online build against server + Postgres (throwaway DB)
npm run load -- --clients 2000   # load test: real socket.io bots (server needs LIMITS=off)
npm run package    # build + zip release.zip (the itch.io build needs VITE_SERVER_URL pointing at a server)
npm run fonts      # re-download self-hosted fonts (after adding a writing system)
npm run db:generate -w @rok/server   # generate migration SQL after editing apps/server/src/db/schema.ts
```

Deployment: `apps/server/deploy/` (Docker Compose: Postgres + 2 game nodes + Caddy HTTPS + daily backups; sample config in `.env.example`), operations manual in [docs/RUNBOOK.md](docs/RUNBOOK.md). Server architecture: [docs/PLAN.md](docs/PLAN.md) section 4 (in Vietnamese).

All commands run from the repo root. Per-package commands: `npm run <cmd> -w @rok/client`.

- [docs/PLAN.md](docs/PLAN.md) — vision, systems, tech, roadmap, release plan (section 13) *(Vietnamese)*.
- [docs/UX.md](docs/UX.md) — screen flows, design system *(Vietnamese)*.
- [docs/RUNBOOK.md](docs/RUNBOOK.md) — server ops: provisioning, rolling deploys, backup/restore, monitoring, incident handling *(Vietnamese)*.

## Repo layout (npm workspaces, no Nx/Turbo)

```
rok/
  apps/                      runnable products — consume packages, never the reverse
    client/    @rok/client   Vite + Svelte 5 + PixiJS: HUD, panels, WebGL scenes, PWA; src/net.ts talks to the server
    server/    @rok/server   Fastify (API) + Socket.IO (realtime) + in-RAM world actor + PostgreSQL (Drizzle)
                             src/game (actor, lease/epoch) · src/realtime · src/http · src/db (schema, queries) · drizzle/ (migrations)
  packages/                  shared libraries
    rules/     @rok/rules    pure game rules — no I/O, no Date, no dependencies (client and server run the same code)
                             core/ (types, advance, battle, JSON parsing) · sect/ (single-sect ops) · world/ (cross-player ops)
                             combat.ts (deterministic battles) · data.ts (numbers) · bot.ts + simulate.ts (pacing bot)
    art/       @rok/art      procedural ink-brush art (canvas → texture), icons, portraits, palette
    i18n/      @rok/i18n     UI text for every language (locales/*.ts), language picking, on-demand loading
    protocol/  @rok/protocol client ↔ server contract: Socket.IO event types, view()/diff() (patches), protocol code (rules hash)
  architecture.test.ts       locks dependency direction between packages
  tsconfig.base.json         shared TypeScript config, inherited by each package
  (later) apps/mobile (P4, Capacitor) · apps/desktop (P4, Electron + Steam)
```

Dependency direction (violations fail `npm test`): `rules` ← `i18n` ← `client`; `art` ← `client`; `rules` ← `protocol` ← `client`, `server`; `i18n` ← `server` (Web Push text). New packages must be declared in `architecture.test.ts`.

## Adding a feature

Every step has a fixed home. Miss a step and the compiler or `npm test` tells you — no memorization.

1. **Rules** — a new file `packages/rules/sect/<name>.ts` (single-sect op) or `world/<name>.ts` (cross-player, needs other players' state). Export an op type `XAction` and a table `xActions: Actions<XAction>` (world: `WorldActions`); each `type` has `pick` (parse untrusted JSON via `core/parse.ts`) and `run` (the rule; state already `advance`d to op time).
   Register: add `XAction` to the union and `...xActions` to the table in `sect/apply.ts` (or `world/act.ts`). A `type` missing `pick`/`run` is a compile error. The server's op list (`ACTION_TYPES`, `WORLD_ACTIONS`) is derived automatically.
   Import downward only: `core/` ← `sect/` ← `world/`. Files in `sect/` never import each other (`architecture.test.ts` enforces).
2. **Numbers** — constants and balance tables in `packages/rules/data.ts`. Changing pacing → run `npm run sim`.
3. **Error / mail / chronicle types** — `Err` in `core/types.ts`; system mail keys go into `MailArgs` (with parameter tuples), world chronicle into `ChronArgs`. Any locale missing text or misusing parameters is a compile error (`satisfies MailTexts` / `ChronTexts`).
4. **Text** — `packages/i18n/locales/vi.ts` then `en.ts`. Never hardcode text in components.
5. **UI** — components get `game`, `now`, `act`, `busy` via `useGame()` (`src/game.ts`), never via props. Sect ops: `g.act(a, 'sound')`. New sound: one line in `SOUNDS` (`lib.ts`). World ops go through `net.send`. New screens go into `render.test.ts` so they get SSR-rendered in tests.
6. **Art** — buildings into `DRAW`/`MOTIF` (`art/buildings.ts`), items/relics into `ITEM_DRAW` (`art/icons.ts`), badges into `DRAW` (`art/emblems.ts`). Tables are keyed by id, so a missing drawing is a compile error.
7. **Tests** — rule tests in `rules.test.ts` (sect) or `world.test.ts` (world). Before pushing:

```bash
npm run format && npm run lint && npm test && npm run check && npm run sim
```

`npm run lint` (oxlint, `.oxlintrc.json`) blocks:
- comma sequences and `a && b()` used as statements;
- ternaries nested more than 2 deep (custom rule in `lint.mjs`);
- variable names shadowing outer scopes;
- nesting deeper than 4 levels;
- files over 400 lines, functions over 100 lines.

`createNet` and `bot.turn` are closures with their own function-length ceilings — they may only shrink.

## Multi-language

- Text lives in `packages/i18n/locales/<code>.ts`, all matching the `Text` shape derived from `vi.ts`. Missing keys are TypeScript errors; empty strings, short arrays, or a function translated as a string fail `npm test`. Never hardcode text in components.
- Numbers inside sentences (percentages, cooldowns) come straight from `@rok/rules`: rebalance once and every language updates itself.
- Language picking: player choice → browser preferences → English. Each language is its own JS file; only the active one loads. Text direction (`dir`) is ready for Arabic/Hebrew later.
- Adding a language: create `locales/xx.ts` (copy `en.ts`, translate), add one line to `LOCALES` in `packages/i18n/index.ts`; new writing systems need a font (below). The language picker in Settings picks it up automatically.

## Fonts

Alegreya (brush-stroke serif, OFL licensed), self-hosted in `apps/client/public/fonts`: full Latin, Latin Extended (Eastern Europe, Turkish, Indonesian…), Vietnamese, Cyrillic (Russian, Ukrainian…), Greek. Each writing system is its own file with `unicode-range`, so browsers fetch only what's used (Vietnamese players download ~110 KB).

Writing systems Alegreya lacks (CJK, Thai, Arabic, Devanagari…) use the matching **Noto Serif** family: same serif spirit, near-total coverage, and Google slices CJK into many small subsets so players only download the glyphs needed. Uncomment a family in `apps/client/fonts.mjs` and run `npm run fonts`.

## Contributing

All contributions are welcome — bug fixes, features, translations, art, docs. Start with [CONTRIBUTING.md](CONTRIBUTING.md) (dev environment, repo conventions, PR process — Vietnamese). Report bugs via [issue templates](.github/ISSUE_TEMPLATE); report security issues privately via [SECURITY.md](SECURITY.md). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Released under **[GNU AGPL-3.0-or-later](LICENSE)**: all code, data, art, and docs in this repo. If you host a modified server publicly, you must share your modified source (AGPL section 13).

- The Alegreya font keeps its own [SIL OFL license](apps/client/public/fonts/OFL-Alegreya.txt) (shipped next to the fonts).
- The game's name and gameplay are the project author's trademark and copyright; the game is inspired by the SLG genre but is not affiliated with and does not use assets from Lilith Games (Rise of Kingdoms).
