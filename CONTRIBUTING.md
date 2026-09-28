# Đóng góp

Cảm ơn bạn muốn góp sức vào **Sơn Hà Tiên Tông**! Mọi đóng góp đều quý: sửa chữ, báo lỗi, thêm tính năng, vẽ tranh, dịch ngôn ngữ, viết tài liệu.

Viết tiếng Việt hoặc tiếng Anh đều được — repo dùng tiếng Việt làm ngôn ngữ chính, tiếng Anh trên UI qua `@rok/i18n`.

## Môi trường phát triển

Cần: **Node.js 24+**, Docker (hoặc một Postgres sẵn có), Google Chrome (cho e2e / chơi thử).

```bash
npm install
npm run db         # Postgres cho dev (Docker, cổng 5439) — một lần mỗi lần bật máy
npm start          # chạy cả database + server + client: mở http://localhost:5173
```

| Lệnh | Việc gì |
|---|---|
| `npm test` | luật game, gói tin, i18n, ranh giới package, server với Postgres thật, vẽ mọi màn hình (SSR) |
| `npm run check` | kiểm tra kiểu (tsc + svelte-check mọi package) |
| `npm run lint` | oxlint theo `.oxlintrc.json` |
| `npm run format` | Prettier |
| `npm run sim` | bot chơi 30 ngày, in nhịp tiến độ |
| `npm run e2e` | Chrome headless chơi thật với server + Postgres (chạy sau `npm run build`) |
| `npm run server` / `npm run dev` | chỉ chạy server / client khi đã có database |

## Quy ước của repo

Đọc trước khi sửa code: [README.md](README.md) (tổng quan + cách thêm một tính năng từng bước) và [CLAUDE.md](CLAUDE.md).

- **Ranh giới package** do `architecture.test.ts` khoá: `rules` là lõi thuần không I/O; client và server chạy chung luật. Package mới phải khai trong đó.
- **Client không có CSS riêng trong màn** — mọi kiểu là component/lớp/biến trong `apps/client/src/ui/`.
- **Không viết chữ cứng trong component** — thêm khoá vào `packages/i18n/locales/vi.ts` rồi `en.ts`; thiếu khoá là lỗi biên dịch. Số liệu trong câu lấy thẳng từ `@rok/rules`.
- **Luật game thuần, tất định** — không I/O, không `Date` trong `packages/rules`.
- Lint chặn: file > 400 dòng, hàm > 100 dòng, lồng > 4 tầng, ternary lồng > 2 tầng, tên biến che tên tầng ngoài. Chi tiết: `.oxlintrc.json` + `lint.mjs`.

## Gửi pull request

1. Fork / tạo nhánh từ `master`.
2. Làm việc, thêm/sửa test cho phần mình đổi.
3. Trước khi đẩy:

   ```bash
   npm run format && npm run lint && npm test && npm run check && npm run sim
   ```

   CI chạy đúng các lệnh này (kèm e2e) — xanh hết thì PR nhanh gọn.
4. Commit ngắn gọn, theo kiểu hiện có: `feat: …`, `fix: …`, `docs: …`.
5. PR mô tả: đổi gì, tại sao, đã kiểm thế nào (dán log/cảnh nếu liên quan). PR nhỏ, làm một việc là dễ merge nhất.

Báo lỗi và đề xuất tính năng dùng [issue templates](.github/ISSUE_TEMPLATE) — lỗi an ninh thì **không** mở issue công khai, xem [SECURITY.md](SECURITY.md).

## Việc hay cho người mới

- **Thêm ngôn ngữ**: tạo `packages/i18n/locales/xx.ts` (chép `en.ts` rồi dịch) + một dòng trong `LOCALES` — README mục "Đa ngôn ngữ".
- **Sửa cân bằng**: bảng số liệu ở `packages/rules/data.ts`, kiểm nhịp bằng `npm run sim`.
- **Tài liệu**: docs/PLAN.md (kế hoạch), docs/UX.md (thiết kế), docs/RUNBOOK.md (vận hành) — bổ sung chỗ chưa rõ.
- **Tranh**: quy trình vẽ/ghép ở [tools/art/README.md](tools/art/README.md).

Lịch sử thiết kế và lộ trình nằm ở [docs/PLAN.md](docs/PLAN.md) — chọn việc khớp ưu tiên hiện tại sẽ dễ được merge hơn.
