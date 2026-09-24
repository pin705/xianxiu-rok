// Schema PostgreSQL (Drizzle). Sinh migration: npm run db:generate -w @rok/server (drizzle-kit so schema này với migration cũ).
// Migration chỉ được THÊM: node bản cũ phải chạy được trên schema mới lúc deploy cuốn chiếu.
import { sql } from 'drizzle-orm'
import { boolean, customType, doublePrecision, index, inet, integer, jsonb, pgTable, primaryKey, smallint, text, timestamp, unique } from 'drizzle-orm/pg-core'
import type { State } from '@rok/rules'
import type { Seen } from '@rok/protocol'

const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' })
const ts = (name: string) => timestamp(name, { withTimezone: true })

export const accounts = pgTable('accounts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text().unique(), // lower(trim()); null = khách
  pass: text(), // argon2id
  locale: text().notNull().default('en'),
  cosmetics: jsonb().notNull().default({}), // danh hiệu, khung (giữ qua mùa)
  createdAt: ts('created_at').notNull().defaultNow(),
  bannedAt: ts('banned_at'),
  banReason: text(),
  deletedAt: ts('deleted_at'),
})

export const sessions = pgTable(
  'sessions',
  {
    hash: bytea().primaryKey(), // sha256(token); token chỉ nằm ở client
    accountId: integer().notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull().defaultNow(),
    seenAt: ts('seen_at').notNull().defaultNow(),
    ip: inet(),
    ua: text(),
  },
  t => [index().on(t.accountId)],
)

export const worlds = pgTable('worlds', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull().default(''),
  seed: integer().notNull(), // bản đồ giới sinh từ seed
  season: integer().notNull().default(1),
  status: text({ enum: ['open', 'closed', 'ended'] }).notNull().default('open'), // closed: vẫn chạy, không nhận người mới
  opensAt: ts('opens_at').notNull().defaultNow(),
  endsAt: ts('ends_at'),
  config: jsonb().notNull().default({}),
  state: jsonb().notNull().default({}), // phần chung của giới (chủ giới ghi)
  owner: text(), // đường Socket.IO của node đang giữ giới
  leaseUntil: ts('lease_until'),
  epoch: integer().notNull().default(0), // fencing token: +1 mỗi lần nhận giới
  online: integer().notNull().default(0),
  warp: doublePrecision().notNull().default(0), // ms tua giờ (chỉ khi ALLOW_WARP)
  updatedAt: ts('updated_at'),
})

export const players = pgTable(
  'players',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountId: integer().unique().references(() => accounts.id, { onDelete: 'cascade' }), // null: tông môn NPC
    worldId: integer().notNull().references(() => worlds.id),
    name: text().notNull(),
    nameKey: text().notNull(), // tên chuẩn hoá để chặn trùng
    crest: integer().notNull().default(0),
    state: jsonb().$type<State>().notNull(), // chỉ giữ chiến báo mà hành quân đang đi còn tham chiếu
    seen: jsonb().$type<Seen>(), // lát state lúc rời game: màn Xuất quan
    power: integer().notNull().default(0), // chép từ state lúc commit, cho xếp hạng / admin
    hall: smallint().notNull().default(1),
    tower: integer().notNull().default(0),
    rebirths: smallint().notNull().default(0),
    pvp: integer().notNull().default(1000), // điểm tranh đoạt
    weekNo: integer('week_no').notNull().default(0), // sự kiện tuần: tuần của week_pts
    weekPts: integer('week_pts').notNull().default(0),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  t => [unique('players_world_name').on(t.worldId, t.nameKey)], // không index cột hay đổi: update luôn HOT
)

export const reports = pgTable(
  'reports',
  {
    playerId: integer().notNull().references(() => players.id, { onDelete: 'cascade' }),
    id: integer().notNull(), // Report.id (nextId của state)
    at: ts('at').notNull(),
    kind: text().notNull(),
    win: boolean().notNull(),
    body: jsonb().notNull(), // bản phát lại đầy đủ
  },
  t => [primaryKey({ columns: [t.playerId, t.id] }), index().on(t.at)],
)

export const inbox = pgTable(
  'inbox',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(), // lệnh bền cho chủ giới: thư admin, mute, ban, xoá tài khoản…
    worldId: integer().notNull().references(() => worlds.id),
    kind: text().notNull(),
    body: jsonb().notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    doneAt: ts('done_at'),
  },
  t => [index('inbox_open').on(t.worldId).where(sql`done_at is null`)],
)

export const events = pgTable(
  'events',
  {
    at: ts('at').notNull().defaultNow(), // analytics do server tự ghi (D1/D7, cảnh giới, độ kiếp…)
    day: integer().notNull(), // rules dayOf() — giờ VN
    playerId: integer(), // không FK: xoá chủ động khi xoá tài khoản
    name: text().notNull(),
    props: jsonb().notNull().default({}),
  },
  t => [index().on(t.playerId, t.day), index().on(t.name, t.at)],
)
