# Sơn Hà Tiên Tông

Game tu tiên chiến lược (SLG) chạy trên trình duyệt: dựng tông môn, thu nhận trưởng lão, xuất quân đánh yêu thú, độ kiếp, luân hồi. **Chơi online**: server làm trọng tài (chạy chính bộ luật của client), tiến độ lưu trên PostgreSQL. Cài được như app (PWA). Đa ngôn ngữ (hiện có Tiếng Việt, English).

```bash
npm install
npm run db         # Postgres cho dev/test (Docker, cổng 5439) — một lần mỗi lần bật máy
# hoặc bỏ Docker: DATABASE_URL=postgres://user:pass@host:5432/rok trong .env (user cần quyền CREATEDB cho test/e2e/play)
npm run server     # server game: http://localhost:8787 (tự khởi động lại khi sửa code; tài liệu API ở /docs)
npm run dev        # chơi thử: http://localhost:5173 (proxy /api và /socket.io sang server)
npm test           # luật game, gói tin, i18n, ranh giới package, server với Postgres thật, vẽ mọi màn hình (SSR)
npm run check      # kiểm tra kiểu (tsc + svelte-check mọi package)
npm run sim        # bot chơi 30 ngày ảo, in nhịp tiến độ (CI báo lỗi nếu không tới tầng 15)
npm run build      # bản tĩnh ở apps/client/dist
npm run e2e        # sau build: Chrome headless chơi thật với server game + Postgres (database tạm)
npm run load -- --clients 2000   # load test: bot socket.io thật (server cần LIMITS=off)
npm run package    # build + nén release.zip (bản itch.io cần VITE_SERVER_URL trỏ về server)
npm run fonts      # tải lại font tự host (sau khi thêm hệ chữ mới)
npm run db:generate -w @rok/server   # sinh migration SQL sau khi sửa apps/server/src/db/schema.ts
```

Triển khai: `apps/server/deploy/` (Docker Compose: Postgres + 2 node game + Caddy HTTPS + sao lưu hằng ngày; cấu hình mẫu `.env.example`), sổ tay vận hành ở [docs/RUNBOOK.md](docs/RUNBOOK.md). Kiến trúc server: xem [docs/PLAN.md](docs/PLAN.md) mục 4.

Mọi lệnh chạy ở gốc repo. Lệnh của riêng một package: `npm run <lệnh> -w @rok/client`.

- [docs/PLAN.md](docs/PLAN.md) — tầm nhìn, hệ thống, kỹ thuật, lộ trình, cách phát hành (mục 13).
- [docs/UX.md](docs/UX.md) — luồng màn hình, hệ thiết kế.
- [docs/RUNBOOK.md](docs/RUNBOOK.md) — vận hành server: dựng máy, deploy cuốn chiếu, sao lưu / khôi phục, theo dõi, xử lý sự cố.

## Cấu trúc repo (npm workspaces, không cần Nx/Turbo)

```
rok/
  apps/                      sản phẩm chạy được — dùng packages, không package nào import ngược lại
    client/    @rok/client   Vite + Svelte 5 + PixiJS: HUD, bảng, cảnh WebGL, PWA; src/net.ts nói chuyện với server
    server/    @rok/server   Fastify (API) + Socket.IO (thời gian thực) + world actor trong RAM + PostgreSQL (Drizzle)
                             src/game (actor, lease/epoch) · src/realtime · src/http · src/db (schema, truy vấn) · drizzle/ (migration)
  packages/                  thư viện dùng chung
    rules/     @rok/rules    luật game thuần — không I/O, không Date, không phụ thuộc gì (client và server chạy chung)
                             core/ (kiểu, advance, trận, đọc JSON) · sect/ (thao tác một tông môn) · world/ (thao tác giữa người chơi)
                             combat.ts (trận tất định) · data.ts (số liệu) · bot.ts + simulate.ts (bot chỉnh nhịp)
    art/       @rok/art      bút lông sinh hình vẽ tay (canvas → texture), icon, chân dung, bảng màu
    i18n/      @rok/i18n     chữ hiển thị mọi ngôn ngữ (locales/*.ts), chọn ngôn ngữ, tải theo nhu cầu
    protocol/  @rok/protocol giao kèo client ↔ server: kiểu sự kiện Socket.IO, view()/diff() (patch), mã giao thức (hash luật)
  architecture.test.ts       khoá chiều phụ thuộc giữa các package
  tsconfig.base.json         cấu hình TypeScript chung, mỗi package kế thừa
  (sau này) apps/mobile (P4, Capacitor) · apps/desktop (P4, Electron + Steam)
```

Chiều phụ thuộc (sai là `npm test` báo): `rules` ← `i18n` ← `client`; `art` ← `client`; `rules` ← `protocol` ← `client`, `server`; `i18n` ← `server` (chữ Web Push). Package mới phải được khai trong `architecture.test.ts`.

## Thêm một tính năng

Mỗi bước có một chỗ cố định. Quên bước nào thì compiler hoặc `npm test` báo, không phải nhớ.

1. **Luật** — một file mới `packages/rules/sect/<tên>.ts` (thao tác trên một tông môn) hoặc `world/<tên>.ts` (giữa người chơi, cần state người khác). File export kiểu thao tác `XAction` và bảng `xActions: Actions<XAction>` (world: `WorldActions`), mỗi `type` có `pick` (đọc JSON không tin được, dùng `core/parse.ts`) và `run` (luật; state đã `advance` tới lúc thao tác).
   Đăng ký: thêm `XAction` vào union và `...xActions` vào bảng trong `sect/apply.ts` (hoặc `world/act.ts`). Thiếu `pick`/`run` cho một `type` là lỗi biên dịch. Danh sách thao tác của server (`ACTION_TYPES`, `WORLD_ACTIONS`) tự suy ra.
   Chỉ import xuống: `core/` ← `sect/` ← `world/`. File trong `sect/` không import nhau (`architecture.test.ts` báo).
2. **Số liệu** — hằng và bảng cân bằng vào `packages/rules/data.ts`. Đổi nhịp thì chạy `npm run sim`.
3. **Kiểu lỗi / thư / biên niên** — `Err` trong `core/types.ts`; thư hệ thống thì thêm khoá vào `MailArgs` (kèm tuple tham số), biên niên giới vào `ChronArgs`. Mọi locale thiếu chữ hay sai tham số là lỗi biên dịch (`satisfies MailTexts` / `ChronTexts`).
4. **Chữ** — `packages/i18n/locales/vi.ts` rồi `en.ts`. Không viết chữ cứng trong component.
5. **Giao diện** — component lấy `game`, `now`, `act`, `busy` bằng `useGame()` (`src/game.ts`), không nhận qua props. Thao tác tông môn: `g.act(a, 'tiếng')`. Tiếng mới thêm một dòng vào `SOUNDS` (`lib.ts`). Thao tác giới đi qua `net.send`. Màn mới thêm vào `render.test.ts` để được vẽ thử (SSR).
6. **Hình** — công trình vào `DRAW`/`MOTIF` (`art/buildings.ts`), vật phẩm/pháp bảo vào `ITEM_DRAW` (`art/icons.ts`), huy hiệu vào `DRAW` (`art/emblems.ts`). Bảng khoá theo id nên thiếu hình là lỗi biên dịch.
7. **Kiểm tra** — test luật trong `rules.test.ts` (tông môn) hoặc `world.test.ts` (giới). Trước khi đẩy lên:

```bash
npm run format && npm run lint && npm test && npm run check && npm run sim
```

`npm run lint` (oxlint, `.oxlintrc.json`) chặn:
- chuỗi dấu phẩy và `a && b()` dùng làm lệnh;
- ternary lồng quá 2 tầng (luật riêng trong `lint.mjs`);
- tên biến che tên ở tầng ngoài;
- lồng quá 4 tầng;
- file quá 400 dòng, hàm quá 100 dòng.

`createNet` và `bot.turn` là closure có trần riêng về độ dài hàm, chỉ được nhỏ đi.

## Đa ngôn ngữ

- Chữ nằm trong `packages/i18n/locales/<mã>.ts`, cùng khuôn `Text` lấy từ bản gốc `vi.ts`. Thiếu khoá thì TypeScript báo; chuỗi rỗng, mảng hụt, dịch nhầm hàm thành chuỗi thì `npm test` báo. Không viết chữ cứng trong component.
- Số liệu trong câu (phần trăm, thời gian hồi) lấy thẳng từ `@rok/rules`: đổi cân bằng là chữ mọi ngôn ngữ tự đúng.
- Chọn ngôn ngữ: người chơi đã chọn → thứ tự ưu tiên của trình duyệt → tiếng Anh. Mỗi ngôn ngữ là một file JS riêng, chỉ tải ngôn ngữ đang dùng. Có sẵn hướng chữ (`dir`) cho tiếng Ả Rập/Do Thái sau này.
- Thêm ngôn ngữ: tạo `locales/xx.ts` (chép `en.ts` rồi dịch), thêm một dòng vào `LOCALES` trong `packages/i18n/index.ts`; hệ chữ mới thì thêm font (dưới đây). Ô chọn ngôn ngữ trong Cài đặt tự có thêm mục.

## Font

Alegreya (serif nét bút lông, giấy phép OFL), tự host trong `apps/client/public/fonts`: đủ Latin, Latin mở rộng (châu Âu, Thổ Nhĩ Kỳ, Indonesia…), tiếng Việt, Cyrillic (Nga, Ukraina…), Hy Lạp. Mỗi hệ chữ một file kèm `unicode-range`, trình duyệt chỉ tải phần đang dùng (người chơi Việt tải ~110 KB).

Hệ chữ Alegreya không có (Trung/Nhật/Hàn, Thái, Ả Rập, Hindi…) dùng họ **Noto Serif** tương ứng: cùng tinh thần serif, phủ gần như mọi hệ chữ, Google cắt CJK thành nhiều lát nhỏ nên cũng chỉ tải chữ cần. Bỏ dấu `//` trước họ font trong `apps/client/fonts.mjs` rồi chạy `npm run fonts`.
