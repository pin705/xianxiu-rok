# Vận hành server Sơn Hà Tiên Tông

Sổ tay cho người trực server: dựng máy, deploy, sao lưu, theo dõi, xử lý sự cố. Kiến trúc chi tiết ở [PLAN.md](PLAN.md) › 4 › Kiến trúc online.

**Tóm tắt kiến trúc.** Một máy chạy `apps/server/deploy/docker-compose.yml`:

- `db`: Postgres 17, nén WAL/TOAST bằng lz4.
- `n1`, `n2`: hai node game giống hệt nhau.
- `caddy`: HTTPS, file tĩnh của client, định tuyến `/nX/*` về đúng node.
- `backup`: `pg_dump` mỗi ngày.

Mỗi giới là một actor chạy trên đúng một node. Node giữ giới bằng lease 15 giây kèm `epoch`; node khác chỉ nhận giới khi lease đã hết hạn. Thao tác chỉ được ack **sau khi** đã commit vào Postgres, nên đã ack là không mất.

## 1. Dựng lần đầu

```sh
cp apps/server/deploy/.env.example apps/server/deploy/.env   # điền DOMAIN, DB_PASSWORD, … (chú thích trong file)
npm ci && npm run build                                       # client → apps/client/dist (Caddy phục vụ thư mục này)
docker compose -f apps/server/deploy/docker-compose.yml up -d --build
curl -fsS https://$DOMAIN/api/me                              # {"account":null,…} là chạy
```

Migration tự chạy lúc node khởi động, có khoá nên hai node không chạy chồng.

Tường lửa chỉ mở 80/443. Postgres, `/metrics` và `/readyz` chỉ nằm trong mạng nội bộ: Caddy trả 404 cho chúng.

## 2. Cấu hình (`.env`)

| Biến | Ý nghĩa |
|---|---|
| `DOMAIN` | Tên miền; Caddy tự xin chứng chỉ |
| `DB_PASSWORD` | Mật khẩu Postgres (bắt buộc; thiếu thì compose dừng) |
| `ORIGINS` | Origin khác được gọi API/socket (vd. itch.io), cách nhau dấu phẩy |
| `ADMIN_TOKEN`, `ADMIN_IPS` | Bật `/api/admin/*` (token ≥ 24 ký tự, header `x-admin-token`) và giới hạn IP được gọi |
| `MARKET` | `off` tắt chợ giữa người chơi (lệnh đang treo vẫn hết hạn và trả hàng như thường) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push. Tạo khoá bằng `npx web-push generate-vapid-keys`. **Đừng đổi khoá** khi đã chạy: mọi đăng ký cũ sẽ hỏng |
| `BACKUP_KEEP_DAYS` | Số ngày giữ bản `pg_dump` (mặc định 14) |

Các núm khác nằm trong `apps/server/src/config.ts` và có giá trị mặc định hợp lý:
- `COMMIT_MS`: cửa sổ commit gộp
- `SYNC_COMMIT`
- `WORLD_CAP`: số người mỗi giới
- `LOG_LEVEL`

## 3. Deploy (cuốn chiếu, không ngắt người chơi)

Nguyên tắc: migration chỉ được **thêm** (bản cũ phải chạy được trên schema mới), server lên trước client.

```sh
git pull && npm ci
docker compose -f apps/server/deploy/docker-compose.yml build n1 n2
for n in n1 n2; do
  docker compose -f apps/server/deploy/docker-compose.yml up -d --no-deps $n
  until docker compose -f apps/server/deploy/docker-compose.yml exec -T $n node -e "fetch('http://127.0.0.1:8787/readyz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"; do sleep 1; done
done
npm run build   # client mới sau cùng: Caddy đọc thẳng apps/client/dist
```

**Node đang tắt thì làm gì:**
1. `/readyz` trả 503, nên Caddy ngừng gửi API tới nó.
2. Nó commit lần cuối, nhả lease và gửi `bye restart`.
3. Client tự nối lại, node kia nhận giới trong vài giây.

**Đổi luật chơi** (`packages/rules`): mã `PROTOCOL` đổi theo. Client cũ bị mời tải bản mới đúng một lần, nên phải deploy client ngay sau server.

**Quay lại bản cũ:** checkout commit cũ rồi build/up như trên. Migration chỉ thêm nên bản cũ chạy được trên schema mới.

## 4. Sao lưu và khôi phục

**Có sẵn:**
- Dịch vụ `backup` chạy `pg_dump -Fc` lúc khởi động, rồi cứ 24 giờ một lần.
- File nằm trong volume `backups`, giữ `BACKUP_KEEP_DAYS` ngày.
- Đây chỉ là **lưới cuối**: sự cố thì mất tối đa một ngày.

**Chép ra ngoài máy** (cron của máy chủ, mỗi ngày), vd. vào object storage:

```sh
docker run --rm -v rok-prod_backups:/b alpine sh -c 'ls -t /b/rok-*.dump | head -1' # bản mới nhất
docker run --rm -v rok-prod_backups:/b -v "$PWD":/out alpine sh -c 'cp "$(ls -t /b/rok-*.dump | head -1)" /out/'
# rồi rclone/aws s3 cp tới nơi lưu khác
```

**Diễn tập khôi phục** (làm mỗi tháng; chưa khôi phục thử thì coi như chưa có sao lưu):

```sh
f=$(docker compose -f apps/server/deploy/docker-compose.yml exec -T backup sh -c 'ls -t /backups/rok-*.dump | head -1')
docker compose -f apps/server/deploy/docker-compose.yml exec -T backup sh -c "createdb rok_restore && pg_restore -d rok_restore --no-owner $f"
docker compose -f apps/server/deploy/docker-compose.yml exec -T db psql -U rok -d rok_restore -c 'select count(*) from players'
```

**Khôi phục thật:**
1. Dừng `n1`, `n2`.
2. `dropdb rok && createdb rok && pg_restore -d rok …`
3. Bật lại các node. Mọi thứ sau thời điểm của bản dump sẽ mất; nên gửi thư bồi thường (mục 6).

**Nên nâng cấp khi có người chơi thật: PITR** (khôi phục tới từng giây). Chọn một trong hai:
- Postgres managed có PITR (nhà cung cấp lo WAL + snapshot).
- Tự chạy WAL-G / pgBackRest đẩy WAL liên tục lên object storage, kèm một base backup mỗi ngày.

Lưu lượng WAL ở 10k CCU vào khoảng 3–6 MB/giây. Núm `COMMIT_MS` quyết định con số này, và cả giá lưu trữ.

## 5. Theo dõi

**Nguồn số đo:**
- Prometheus kéo `http://nX:8787/metrics` qua mạng nội bộ.
- Số đo của process có tiền tố `rok_`.

| Số đo | Cảnh báo khi |
|---|---|
| `rok_commit_seconds` (histogram) | p99 > 200 ms trong 5 phút: DB chậm, xem WAL/IO, `COMMIT_MS` |
| `rok_commit_errors_total` | tăng liên tục: DB lỗi. Quá 12 giây không gia hạn được thì giới **chỉ đọc**; client thấy dải "máy chủ đang bận" |
| `rok_worlds_fenced_total` | > 0: một node mất lease (mạng/DB chập chờn), node khác đã nhận giới. Một lần thì bình thường, lặp lại thì phải xem mạng |
| `rok_nodejs_eventloop_lag_p99_seconds` | > 0,02: node quá tải CPU (xem số giới / node, `rok_worlds`) |
| `rok_socket_connections`, `rok_players_online` | tụt đột ngột: node sập hoặc Caddy lỗi |
| `rok_intents_total{result!="ok"}` | tỉ lệ `rate`/`bad` tăng vọt: có người spam hoặc client lỗi |
| `rok_nodejs_heap_size_used_bytes` | tăng đều không giảm: rò bộ nhớ (trần `--max-old-space-size=768`) |

**Log:**
- JSON của Pino: `docker compose logs -f n1`.
- Các dòng cần để ý:
  - `state không qua migrate: cách ly người chơi`
  - `commit failed`
  - `world fenced`
  - `apply threw`
  - `world step threw`

## 6. Sự cố thường gặp

| Tình huống | Chuyện gì xảy ra | Làm gì |
|---|---|---|
| Một node sập / bị kill | Chỉ mất phần chưa ack. Docker khởi động lại. Nếu không lên, node kia nhận giới sau khi lease hết (≤ ~35 giây) | Xem log vì sao sập; không cần can thiệp dữ liệu |
| Máy chết hẳn | Mọi thứ dừng | Dựng máy mới từ mục 1, khôi phục bản sao lưu mới nhất (mục 4) |
| Postgres mất < 12 giây | Ack chờ, commit sau gửi hết, không mất gì | Không |
| Postgres mất > 12 giây | Giới chỉ đọc; thao tác bị từ chối `unavailable`; có DB lại thì tự chạy tiếp | Sửa DB. Nếu đã có node khác nhận giới thì node cũ tự đẩy client sang (`bye moved`) |
| Một người chơi bị cách ly (state hỏng) | Chỉ người đó không vào được, cả giới vẫn chạy | Sửa `players.state` bằng tay (so với `migrate()` trong `packages/rules/index.ts`), rồi nhả/nhận lại giới (khởi động lại node) |
| Chat bị lạm dụng | — | `POST /api/admin/mute {world, pid, minutes}`; báo cáo của người chơi nằm ở bảng `chat_reports` |
| Chợ / Vận Linh Trận bị lạm dụng (chuyển của cho acc phụ) | — | `MARKET=off` (tắt cả hai) rồi deploy lại; soi bảng `events` |
| Cần bồi thường sau sự cố | — | `POST /api/admin/mail {world, pid?, title, body, gift?}` (không có `pid`: cả giới): thư có quà, mỗi người nhận đúng một lần |
| Người chơi xin xoá dữ liệu | — | Họ tự xoá trong Cài đặt › Tài khoản. Chủ giới gỡ khỏi giới, tiên minh, rồi xoá dây chuyền |

Ví dụ gọi admin, từ IP nằm trong `ADMIN_IPS`:

```sh
curl -H "x-admin-token: $ADMIN_TOKEN" https://$DOMAIN/api/admin/stats   # D1/D7, phân bố cảnh giới, tỉ lệ độ kiếp
```

## 7. Mùa giải

Mỗi giới chạy 49 ngày, tính từ `worlds.opens_at`. Tới ngày 49, actor tự làm hết mùa trong một commit:
- mọi người luân hồi / phi thăng, có thư kết quả
- bản đồ mới (seed mới), xếp chỗ lại
- phân đà NPC làm lại, tiên minh giữ nguyên
- bảng phong thần lưu trong `worlds.state.fame`

Client được mời nối lại để nhận bản đồ mới.

Người mới chỉ vào giới trong 21 ngày đầu của mùa, sau đó server mở giới mới.

Muốn dời ngày hết mùa của một giới: sửa `worlds.opens_at` khi giới đang không ai giữ (dừng node), rồi bật lại.

## 8. Sức tải

**Đo:**
- Chạy `npm run load -- --url … --clients N --procs K` từ một **máy khác**; server đặt `LIMITS=off` trong lúc đo.
- Đạt khi p99 ack < 100 ms và lỗi < 0,1 %.

**Đã đo trên máy dev, một node:** 2000 kết nối, ~500 thao tác/giây, p99 52 ms (xem PLAN.md).

**Chưa đo:** mức 10k CCU cần máy phát tải riêng. Vẫn còn phải làm trước khi mở công khai. Kế hoạch đo và ngưỡng đạt ở PLAN.md › Kiểm chứng › Load.

**Test sự cố tự động** (`npm test`, cần Postgres):
- mất Postgres ngắn và dài
- node khởi động lại giữa chừng
- bị rào khi node khác nhận giới
- SIGKILL sau khi đã ack (e2e)
