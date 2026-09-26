# Luật dự án

- **Giao diện client: màn không có một dòng CSS riêng.** Mọi kiểu là component / lớp / biến trong `apps/client/src/ui/`
  (danh mục và quy ước: `apps/client/src/ui/README.md`); màn chỉ ghép. `architecture.test.ts` chặn — cần kiểu mới thì thêm
  vào ui/ trước, không chép đồ vật giữa các màn, không viết mã màu trong màn.
