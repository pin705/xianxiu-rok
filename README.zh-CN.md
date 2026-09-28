# 山河仙宗（Sơn Hà Tiên Tông）

<div align="center">

[Tiếng Việt](README.md) · [English](README.en.md) · **简体中文**

[![CI](https://github.com/pin705/xianxiu-rok/actions/workflows/ci.yml/badge.svg)](https://github.com/pin705/xianxiu-rok/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-green.svg)](CONTRIBUTING.md)

<img src="docs/screenshots/sect.png" width="240" alt="宗门山门" /> <img src="docs/screenshots/battle.png" width="240" alt="战斗" /> <img src="docs/screenshots/world.png" width="240" alt="世界地图" /> <img src="docs/screenshots/elders.png" width="240" alt="门下" />

</div>

一款运行在浏览器中的修仙策略游戏（SLG）：建立宗门，招募长老，出兵讨伐妖兽，渡劫飞升，轮回转世。**在线游玩**——服务器担任裁判（与客户端运行同一套规则代码），进度保存在 PostgreSQL。可像应用一样安装（PWA）。多语言（目前有越南语、英语）。

需要 Node.js 24+。最快上手方式：

```bash
npm install
npm start          # 数据库 (Docker) + 服务器 + 客户端：打开 http://localhost:5173
```

```bash
npm install
npm run db         # 开发/测试用 Postgres（Docker，端口 5439）— 每次开机后执行一次
# 或不用 Docker：在 .env 里设置 DATABASE_URL=postgres://user:pass@host:5432/rok（用户需有 CREATEDB 权限才能跑 test/e2e/play）
npm run server     # 游戏服务器：http://localhost:8787（改代码自动重启；API 文档在 /docs）
npm run dev        # 试玩：http://localhost:5173（/api 和 /socket.io 代理到服务器）
npm test           # 游戏规则、数据包、i18n、包边界、服务器连真实 Postgres、SSR 渲染所有界面
npm run check      # 类型检查（所有包的 tsc + svelte-check）
npm run sim        # 机器人玩 30 个虚拟日，输出节奏（CI 中不到 15 层就报错）
npm run build      # 静态构建输出到 apps/client/dist
npm run e2e        # 构建后执行：headless Chrome 与服务器 + Postgres 真实对局（临时数据库）
npm run load -- --clients 2000   # 负载测试：真实 socket.io 机器人（服务器需 LIMITS=off）
npm run package    # 构建 + 打包 release.zip（itch.io 版需要 VITE_SERVER_URL 指向服务器）
npm run fonts      # 重新下载自托管字体（添加新文字系统后）
npm run db:generate -w @rok/server   # 修改 apps/server/src/db/schema.ts 后生成迁移 SQL
```

部署：`apps/server/deploy/`（Docker Compose：Postgres + 2 个游戏节点 + Caddy HTTPS + 每日备份；示例配置见 `.env.example`），运维手册见 [docs/RUNBOOK.md](docs/RUNBOOK.md)。服务器架构见 [docs/PLAN.md](docs/PLAN.md) 第 4 节（越南语）。

所有命令在仓库根目录执行。单包命令：`npm run <命令> -w @rok/client`。

- [docs/PLAN.md](docs/PLAN.md) — 愿景、系统、技术、路线图、发布计划（第 13 节）*(越南语)*。
- [docs/UX.md](docs/UX.md) — 界面流程、设计系统 *(越南语)*。
- [docs/RUNBOOK.md](docs/RUNBOOK.md) — 服务器运维：开通机器、滚动部署、备份/恢复、监控、故障处理 *(越南语)*。

## 仓库结构（npm workspaces，不需要 Nx/Turbo）

```
rok/
  apps/                      可运行的产品 — 只使用 packages，绝不反向依赖
    client/    @rok/client   Vite + Svelte 5 + PixiJS：HUD、面板、WebGL 场景、PWA；src/net.ts 与服务器通信
    server/    @rok/server   Fastify（API）+ Socket.IO（实时）+ 内存中的 world actor + PostgreSQL（Drizzle）
                             src/game（actor、lease/epoch）· src/realtime · src/http · src/db（schema、查询）· drizzle/（迁移）
  packages/                  共享库
    rules/     @rok/rules    纯游戏规则 — 无 I/O、无 Date、无依赖（客户端与服务器共用同一套代码）
                             core/（类型、advance、战斗、JSON 解析）· sect/（单宗门操作）· world/（跨玩家操作）
                             combat.ts（确定性战斗）· data.ts（数值）· bot.ts + simulate.ts（节奏机器人）
    art/       @rok/art      程序化水墨画风（canvas → 纹理）、图标、头像、调色板
    i18n/      @rok/i18n     各语言的界面文本（locales/*.ts）、语言选择、按需加载
    protocol/  @rok/protocol 客户端 ↔ 服务器契约：Socket.IO 事件类型、view()/diff()（补丁）、协议代码（规则哈希）
  architecture.test.ts       锁定包之间的依赖方向
  tsconfig.base.json         共享 TypeScript 配置，各包继承
  （以后）apps/mobile（P4，Capacitor）· apps/desktop（P4，Electron + Steam）
```

依赖方向（违反会让 `npm test` 报错）：`rules` ← `i18n` ← `client`；`art` ← `client`；`rules` ← `protocol` ← `client`、`server`；`i18n` ← `server`（Web Push 文本）。新包必须在 `architecture.test.ts` 中声明。

## 添加一个功能

每个步骤都有固定的位置。漏了哪一步，编译器或 `npm test` 会告诉你——不用背。

1. **规则** — 新文件 `packages/rules/sect/<名称>.ts`（单宗门操作）或 `world/<名称>.ts`（跨玩家，需要其他玩家的状态）。导出操作类型 `XAction` 和表 `xActions: Actions<XAction>`（world 用 `WorldActions`）；每个 `type` 有 `pick`（用 `core/parse.ts` 解析不可信 JSON）和 `run`（规则本身；state 已 `advance` 到操作时刻）。
   注册：在 `sect/apply.ts`（或 `world/act.ts`）中把 `XAction` 加入 union、把 `...xActions` 加入表。某个 `type` 缺 `pick`/`run` 是编译错误。服务器的操作列表（`ACTION_TYPES`、`WORLD_ACTIONS`）自动推导。
   只能向下导入：`core/` ← `sect/` ← `world/`。`sect/` 内的文件不互相导入（`architecture.test.ts` 会报）。
2. **数值** — 常量和平衡表放在 `packages/rules/data.ts`。改节奏要跑 `npm run sim`。
3. **错误 / 邮件 / 编年史类型** — `core/types.ts` 中的 `Err`；系统邮件的键加入 `MailArgs`（带参数元组），世界编年史加入 `ChronArgs`。任何语言缺文本或误用参数都是编译错误（`satisfies MailTexts` / `ChronTexts`）。
4. **文本** — `packages/i18n/locales/vi.ts` 然后 `en.ts`。绝不在组件里硬编码文本。
5. **界面** — 组件通过 `useGame()`（`src/game.ts`）获取 `game`、`now`、`act`、`busy`，不通过 props。宗门操作：`g.act(a, '音效')`。新音效在 `SOUNDS`（`lib.ts`）加一行。世界操作走 `net.send`。新界面加入 `render.test.ts` 以便在测试中 SSR 渲染。
6. **美术** — 建筑进 `DRAW`/`MOTIF`（`art/buildings.ts`），物品/法宝进 `ITEM_DRAW`（`art/icons.ts`），徽章进 `DRAW`（`art/emblems.ts`）。表按 id 索引，缺图是编译错误。
7. **测试** — 规则测试放 `rules.test.ts`（宗门）或 `world.test.ts`（世界）。推送前：

```bash
npm run format && npm run lint && npm test && npm run check && npm run sim
```

`npm run lint`（oxlint，`.oxlintrc.json`）拦截：
- 逗号序列和用作语句的 `a && b()`；
- 三元表达式嵌套超过 2 层（自定义规则在 `lint.mjs`）；
- 变量名遮蔽外层作用域；
- 嵌套超过 4 层；
- 文件超过 400 行、函数超过 100 行。

`createNet` 和 `bot.turn` 是闭包，有各自的函数长度上限——只许变小。

## 多语言

- 文本位于 `packages/i18n/locales/<代码>.ts`，全部符合由 `vi.ts` 推导出的 `Text` 形状。缺键是 TypeScript 错误；空字符串、数组缺项、把函数误译成字符串会让 `npm test` 报错。绝不在组件中硬编码文本。
- 句子中的数值（百分比、冷却时间）直接来自 `@rok/rules`：调整一次平衡，所有语言的文本自动正确。
- 语言选择：玩家的选择 → 浏览器偏好 → 英语。每种语言是独立的 JS 文件，只加载正在用的。文字方向（`dir`）已为将来的阿拉伯语/希伯来语做好准备。
- 添加语言：创建 `locales/xx.ts`（复制 `en.ts` 再翻译），在 `packages/i18n/index.ts` 的 `LOCALES` 里加一行；新文字系统需要字体（见下）。设置里的语言选择器会自动多出该语言。

## 字体

Alegreya（毛笔风格的衬线体，OFL 许可），自托管在 `apps/client/public/fonts`：完整拉丁、拉丁扩展（东欧、土耳其语、印尼语…）、越南语、西里尔（俄语、乌克兰语…）、希腊语。每种文字系统一个文件，带 `unicode-range`，浏览器只下载用到的部分（越南玩家约 110 KB）。

Alegreya 没有的文字系统（中日韩、泰语、阿拉伯语、天城文…）用对应的 **Noto Serif** 家族：同样的衬线气质，几乎全覆盖，Google 把 CJK 切成许多小子集，玩家只下载需要的字形。在 `apps/client/fonts.mjs` 里取消注释相应家族，然后运行 `npm run fonts`。

## 参与贡献

欢迎一切贡献——修 bug、加功能、翻译、美术、文档。请从 [CONTRIBUTING.md](CONTRIBUTING.md) 开始（开发环境、仓库约定、PR 流程——越南语）。用 [issue 模板](.github/ISSUE_TEMPLATE)报告 bug；安全问题通过 [SECURITY.md](SECURITY.md) 私下报告。请遵守[行为准则](CODE_OF_CONDUCT.md)。

## 许可证

以 **[GNU AGPL-3.0-or-later](LICENSE)** 发布：本仓库中的所有代码、数值、美术和文档。若公开托管修改版服务器，必须公开修改后的源代码（AGPL 第 13 条）。

- Alegreya 字体保留其自身的 [SIL OFL 许可](apps/client/public/fonts/OFL-Alegreya.txt)（位于字体文件旁）。
- 游戏名称与玩法属于项目作者的商标与版权；游戏受 SLG 题材启发，但与 Lilith Games（Rise of Kingdoms）无关联，不使用其素材。
