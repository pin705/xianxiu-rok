# Project-local game skills

This repository has a project-local OpenCode skill suite for the Svelte 5 + PixiJS 8 game.

## Installation

- Skills: `.opencode/skills/`
- Shared references: `.opencode/references/`
- Shared scripts: `.opencode/scripts/`
- Shared tools: `.opencode/tools/`
- OpenCode config: `opencode.jsonc`

The suite was installed on 2026-09-25 from the Codex Game Maker and local agent skill directories. It contains 53 skills covering:

- Game direction, architecture, implementation, review, audio, accessibility, localization, performance, platforms, and release workflows (`game-studio-*`)
- PixiJS v8 application, scene graph, Graphics, Sprite, Text, filters, assets, input, accessibility, rendering, and performance (`pixijs*`)
- Game UI design (`game-ui-design`)
- Browser-game architecture (`game-architecture`)
- Procedural/pixel asset guidance (`game-assets`, `pixel-art-sprites`)

## Recommended routing for this project

1. **UI/UX system and hub** — `game-studio-ui-ux` + `game-ui-design`
2. **PixiJS implementation** — `pixijs-scene-container` + `pixijs-scene-graphics` + `pixijs-scene-sprite` + `pixijs-scene-text`
3. **Art direction and style lock** — `game-studio-art-assets`
4. **Characters, props, icons, and animation** — `game-studio-sprite-assets`
5. **World/map layers** — `game-studio-map-assets`
6. **Runtime visual QA** — `game-studio-asset-qa` + `game-studio-review`
7. **Wiring changes into the app** — `game-studio-implementation` + `game-architecture`

The Game Studio instructions include some Godot-specific examples. This project is web-first, so use the art, UI, asset, QA, and architecture guidance while mapping engine-specific steps to Svelte, PixiJS, and the existing `apps/client` structure.

## Updating

Do not hand-edit the copied skills as a substitute for an upstream update. Refresh the selected skill directories from their source locations, then re-run the project checks and review the diff. Keep project-specific decisions in `design/`, `production/`, and `docs/`, not in the copied skill instructions.
