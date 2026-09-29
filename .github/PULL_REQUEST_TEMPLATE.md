## Tóm tắt

<!-- Đổi gì, tại sao. Ghi rõ issue nào (nếu có): "Closes #123". -->

## Kiểm tra

<!-- Đã chạy cách nào để tin là đúng: test mới/thêm, lệnh dưới, e2e, sim… -->

```bash
npm run format && npm run lint && npm test && npm run check && npm run sim
```

- [ ] Các lệnh trên chạy xanh (`npm run sim` nếu đổi cân bằng/nhịp)
- [ ] Chữ mới có đủ cả `vi` và `en` (`packages/i18n/locales/`), không viết chữ cứng trong component
- [ ] Không thêm CSS riêng trong màn hình (kiểu nằm trong `apps/client/src/ui/`)
- [ ] Ranh giới package vẫn đúng (`architecture.test.ts` tự báo khi chạy `npm test`)
- [ ] Tài liệu (README / docs) cập nhật nếu đổi hành vi
