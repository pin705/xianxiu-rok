# Sơn Hà Tiên Tông

Game tu tiên chiến lược (SLG) chạy trên trình duyệt: dựng tông môn, thu nhận trưởng lão, xuất quân đánh yêu thú, độ kiếp, luân hồi. **Chơi online**: server làm trọng tài (chạy chính bộ luật của client), tiến độ lưu trên PostgreSQL. Cài được như app (PWA). Đa ngôn ngữ (hiện có Tiếng Việt, English).

```bash
npm install
npm run db         # Postgres cho dev/test (Docker, cổng 5439) — một lần mỗi lần bật máy
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
                             index.ts (state, advance, apply) · combat.ts (trận tất định) · data.ts (số liệu) · simulate.ts (bot chỉnh nhịp)
    art/       @rok/art      bút lông sinh hình vẽ tay (canvas → texture), icon, chân dung, bảng màu
    i18n/      @rok/i18n     chữ hiển thị mọi ngôn ngữ (locales/*.ts), chọn ngôn ngữ, tải theo nhu cầu
    protocol/  @rok/protocol giao kèo client ↔ server: kiểu sự kiện Socket.IO, view()/diff() (patch), mã giao thức (hash luật)
  architecture.test.ts       khoá chiều phụ thuộc giữa các package
  tsconfig.base.json         cấu hình TypeScript chung, mỗi package kế thừa
  (sau này) apps/mobile (P4, Capacitor) · apps/desktop (P4, Electron + Steam)
```

Chiều phụ thuộc (sai là `npm test` báo): `rules` ← `i18n` ← `client`; `art` ← `client`; `rules` ← `protocol` ← `client`, `server`; `i18n` ← `server` (chữ Web Push). Package mới phải được khai trong `architecture.test.ts`.

## Đa ngôn ngữ

- Chữ nằm trong `packages/i18n/locales/<mã>.ts`, cùng khuôn `Text` lấy từ bản gốc `vi.ts`. Thiếu khoá thì TypeScript báo; chuỗi rỗng, mảng hụt, dịch nhầm hàm thành chuỗi thì `npm test` báo. Không viết chữ cứng trong component.
- Số liệu trong câu (phần trăm, thời gian hồi) lấy thẳng từ `@rok/rules`: đổi cân bằng là chữ mọi ngôn ngữ tự đúng.
- Chọn ngôn ngữ: người chơi đã chọn → thứ tự ưu tiên của trình duyệt → tiếng Anh. Mỗi ngôn ngữ là một file JS riêng, chỉ tải ngôn ngữ đang dùng. Có sẵn hướng chữ (`dir`) cho tiếng Ả Rập/Do Thái sau này.
- Thêm ngôn ngữ: tạo `locales/xx.ts` (chép `en.ts` rồi dịch), thêm một dòng vào `LOCALES` trong `packages/i18n/index.ts`; hệ chữ mới thì thêm font (dưới đây). Ô chọn ngôn ngữ trong Cài đặt tự có thêm mục.

## Font

Alegreya (serif nét bút lông, giấy phép OFL), tự host trong `apps/client/public/fonts`: đủ Latin, Latin mở rộng (châu Âu, Thổ Nhĩ Kỳ, Indonesia…), tiếng Việt, Cyrillic (Nga, Ukraina…), Hy Lạp. Mỗi hệ chữ một file kèm `unicode-range`, trình duyệt chỉ tải phần đang dùng (người chơi Việt tải ~110 KB).

Hệ chữ Alegreya không có (Trung/Nhật/Hàn, Thái, Ả Rập, Hindi…) dùng họ **Noto Serif** tương ứng: cùng tinh thần serif, phủ gần như mọi hệ chữ, Google cắt CJK thành nhiều lát nhỏ nên cũng chỉ tải chữ cần. Bỏ dấu `//` trước họ font trong `apps/client/fonts.mjs` rồi chạy `npm run fonts`.
