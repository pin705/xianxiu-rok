# Chính sách an ninh

## Báo cáo lỗ hổng

**Đừng mở issue công khai cho lỗi an ninh.** Dùng **Security Advisories của GitHub**: tab *Security → Report a vulnerability* trên repo, hoặc liên hệ trực tiếp chủ repo qua email trong hồ sơ GitHub.

Báo cáo nên kèm:

- Mô tả lỗi và ảnh hưởng (điều gì bị lộ / làm được gì).
- Các bước tái hiện hoặc PoC (script, curl, payload).
- Phiên bản/commit bị ảnh hưởng.
- (Nếu biết) gợi ý vá.

Tôi sẽ phản hồi trong vòng **3–5 ngày**, xác nhận lỗi, ước tính thời gian vá và ghi nhận người báo cáo trong release (nếu muốn).

## Phạm vi

- `apps/server` — HTTP API, Socket.IO, world actor, cơ sở dữ liệu, admin API.
- `apps/client` — client chạy trong trình duyệt, service worker, PWA.
- `packages/protocol`, `packages/rules` — giao thức client ↔ server, luật game (điểm tin cậy server).
- Triển khai mẫu `apps/server/deploy/` (Docker Compose, Caddy).

Ngoài phạm vi: tấn công từ chối dịch vụ quy mô lớn, lỗi ở các dịch vụ bên thứ ba (itch.io, Google Fonts…), tự host cấu hình sai (xem tài liệu bên dưới).

## Ghi chú thiết kế (có thể hữu ích khi kiểm tra)

- Server là **trọng tài**: luật game thuần, tất định chạy ở `packages/rules`, client chỉ đoán trước — không tin bất cứ thao tác nào từ client.
- Thao tác chỉ được ack **sau khi** commit vào Postgres; hành động parse bằng `pick` (JSON không tin được).
- `/api/admin/*` bật khi có `ADMIN_TOKEN` (≥ 24 ký tự); `ALLOW_WARP` (tua giờ, đặt state) là công cụ dev/e2e và **phải tắt** ở production.
- Cấu hình an toàn khi tự host: xem [apps/server/deploy/.env.example](apps/server/deploy/.env.example) và sổ tay [docs/RUNBOOK.md](docs/RUNBOOK.md).
