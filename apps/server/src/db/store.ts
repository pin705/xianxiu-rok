// Truy vấn của giới: lease, người chơi, commit gộp, chat, hộp lệnh, xếp hạng, việc hằng đêm. Logic game đọc state trong RAM
// (world actor); DB chỉ là nơi lưu bền. Phiên và tài khoản ở accounts.ts.
import { and, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import { type State } from '@rok/rules'
import type { Seen } from '@rok/protocol'
import type { Database } from './index.ts'
import { accounts, chat, chatReports, events, inbox, players, reports, sessions, worlds } from './schema.ts'

// ---------- Giới: nhận / nhả (lease + epoch) ----------

// Lease của giới (ms): mỗi commit / heartbeat gia hạn thêm ttl. Node khác chỉ nhận giới khi lease đã hết quá grace (DB chập chờn
// không làm giới chuyển oan). Node đang giữ tự chuyển chỉ đọc khi quá readOnly không gia hạn được — trước lúc lease hết — nên
// không bao giờ có hai node cùng ghi. Heartbeat mỗi beat; quá renew chưa commit thì heartbeat tự gia hạn.
export const LEASE = { ttl: 15_000, grace: 15_000, readOnly: 12_000, renew: 5_000, beat: 2_000 }
const leaseEnd = sql`now() + make_interval(secs => ${LEASE.ttl / 1000})`
const graceEnd = sql`now() - make_interval(secs => ${LEASE.grace / 1000})`

export type Claimed = {
  id: number
  name: string
  seed: number
  season: number
  state: unknown
  epoch: number
  warp: number
  opensAt: Date
}
// Nhận giới nếu chưa ai giữ, hoặc chính node này giữ (khởi động lại), hoặc lease đã hết quá LEASE.grace
// (grace: DB chập chờn không làm giới chuyển oan sang node khác)
export async function claimWorld(db: Database, id: number, node: string): Promise<Claimed | { owner: string | null }> {
  const [w] = await db
    .update(worlds)
    .set({
      owner: node,
      epoch: sql`${worlds.epoch} + 1`,
      leaseUntil: leaseEnd,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(worlds.id, id),
        sql`${worlds.status} <> 'ended'`,
        or(isNull(worlds.owner), eq(worlds.owner, node), lt(worlds.leaseUntil, graceEnd)),
      ),
    )
    .returning({
      id: worlds.id,
      name: worlds.name,
      seed: worlds.seed,
      season: worlds.season,
      state: worlds.state,
      epoch: worlds.epoch,
      warp: worlds.warp,
      opensAt: worlds.opensAt,
    })
  if (w) return w
  const [o] = await db.select({ owner: worlds.owner }).from(worlds).where(eq(worlds.id, id))
  return { owner: o?.owner ?? null }
}

// Đường Socket.IO của node đang giữ giới (null: chưa ai giữ, hoặc lease đã hết)
export async function worldPath(db: Database, id: number) {
  const [w] = await db
    .select({ owner: worlds.owner })
    .from(worlds)
    .where(and(eq(worlds.id, id), sql`${worlds.leaseUntil} > now()`))
  return w?.owner ?? null
}

export const releaseWorld = (db: Database, id: number, node: string, epoch: number) =>
  db
    .update(worlds)
    .set({ owner: null, leaseUntil: null })
    .where(and(eq(worlds.id, id), eq(worlds.owner, node), eq(worlds.epoch, epoch)))

// Giới mồ côi (chưa ai giữ, hoặc lease hết quá grace) và giới đang có chủ — cho vòng cân tải
export async function worldOwners(db: Database) {
  const rows = await db
    .select({
      id: worlds.id,
      owner: worlds.owner,
      live: sql<boolean>`${worlds.leaseUntil} > now()`,
      orphan: sql<boolean>`${worlds.owner} is null or ${worlds.leaseUntil} < ${graceEnd}`,
    })
    .from(worlds)
    .where(sql`${worlds.status} <> 'ended'`)
  return rows
}

export type PlayerRow = {
  id: number
  accountId: number | null
  name: string
  crest: number
  state: State
  seen: Seen | null
  worldId: number
}
const playerCols = {
  id: players.id,
  accountId: players.accountId,
  name: players.name,
  crest: players.crest,
  state: players.state,
  seen: players.seen,
  worldId: players.worldId,
}
export const worldPlayers = (db: Database, world: number): Promise<PlayerRow[]> =>
  db.select(playerCols).from(players).where(eq(players.worldId, world))
export const worldExists = async (db: Database, id: number) =>
  (await db.select({ id: worlds.id }).from(worlds).where(eq(worlds.id, id))).length > 0
export const findPlayer = async (db: Database, pid: number): Promise<PlayerRow | null> =>
  (await db.select(playerCols).from(players).where(eq(players.id, pid)))[0] ?? null

// ---------- Commit gộp của một giới ----------

export type Batch = {
  world: number
  epoch: number
  node: string
  online: number
  sync: boolean
  state?: object // phần chung của giới, khi đổi
  season?: { seed: number; season: number; opensAt: Date } // hết mùa: bản đồ mới, mùa mới, mở lại từ lúc này
  gone?: number[] // tông môn vừa xoá tài khoản: xoá dòng tài khoản (dây chuyền tông môn, chiến báo, mã, push)
  players: {
    id: number
    state: State
    name: string
    power: number
    hall: number
    tower: number
    rebirths: number
    pvp: number
    weekNo: number
    weekPts: number
    kills: number
    seen?: Seen
  }[]
  reports: { pid: number; id: number; at: number; kind: string; win: boolean; body: object }[]
  events: { pid: number; name: string; day: number; at: number; props: object }[]
  inboxDone: number[]
  chat?: ChatRow[]
}
export type ChatRow = { id: number; ch: string; pid: number; name: string; text: string; at: number }
export class Fenced extends Error {}

// Một transaction: kiểm fencing (owner + epoch; UPDATE khoá dòng worlds) rồi ghi mọi thứ. Các câu chạy nối liền trên cùng
// kết nối; fencing trượt thì throw → rollback: node đã mất quyền giữ giới không bao giờ ghi được gì.
export async function flushWorld(db: Database, b: Batch) {
  await db.transaction(async tx => {
    if (!b.sync) await tx.execute(sql`set local synchronous_commit = off`)
    await tx.execute(sql`set local statement_timeout = '5s'`)
    const q: Promise<unknown>[] = [
      tx
        .update(worlds)
        .set({
          leaseUntil: leaseEnd,
          online: b.online,
          updatedAt: sql`now()`,
          ...(b.state && { state: b.state }),
          ...b.season,
        })
        .where(and(eq(worlds.id, b.world), eq(worlds.owner, b.node), eq(worlds.epoch, b.epoch)))
        .returning({ id: worlds.id }),
    ]
    if (b.players.length)
      q.push(
        tx.execute(sql`
          update ${players} p set state = r.state, name = r.name, power = r.power, hall = r.hall, tower = r.tower, rebirths = r.rebirths,
            pvp = r.pvp, week_no = r."weekNo", week_pts = r."weekPts", kills = r.kills, seen = coalesce(r.seen, p.seen),
            updated_at = now()
          from jsonb_to_recordset(${JSON.stringify(b.players)}::jsonb)
            as r(id int, state jsonb, name text, power int, hall int, tower int, rebirths int, pvp int, "weekNo" int, "weekPts" int,
              kills int, seen jsonb)
          where p.id = r.id and p.world_id = ${b.world}`),
      )
    if (b.reports.length)
      q.push(
        tx.execute(sql`
          insert into ${reports} (player_id, id, at, kind, win, body)
          select r.pid, r.id, to_timestamp(r.at / 1000.0), r.kind, r.win, r.body
          from jsonb_to_recordset(${JSON.stringify(b.reports)}::jsonb) as r(pid int, id int, at float8, kind text, win boolean, body jsonb)
          on conflict (player_id, id) do update set body = excluded.body, win = excluded.win`),
      )
    if (b.events.length)
      q.push(
        tx.execute(sql`
          insert into ${events} (at, day, player_id, name, props)
          select to_timestamp(e.at / 1000.0), e.day, e.pid, e.name, e.props
          from jsonb_to_recordset(${JSON.stringify(b.events)}::jsonb) as e(at float8, day int, pid int, name text, props jsonb)`),
      )
    if (b.chat?.length)
      q.push(
        tx.execute(sql`
          insert into ${chat} (world_id, id, ch, player_id, name, text, at)
          select ${b.world}, c.id, c.ch, c.pid, c.name, c.text, to_timestamp(c.at / 1000.0)
          from jsonb_to_recordset(${JSON.stringify(b.chat)}::jsonb) as c(id int, ch text, pid int, name text, text text, at float8)
          on conflict do nothing`),
      )
    if (b.gone?.length)
      q.push(
        tx.delete(accounts).where(
          inArray(
            accounts.id,
            tx
              .select({ id: sql<number>`${players.accountId}` })
              .from(players)
              .where(and(eq(players.worldId, b.world), inArray(players.id, b.gone))),
          ),
        ),
      )
    if (b.inboxDone.length)
      q.push(
        tx
          .update(inbox)
          .set({ doneAt: sql`now()` })
          .where(and(eq(inbox.worldId, b.world), inArray(inbox.id, b.inboxDone))),
      )
    const [fence] = (await Promise.all(q)) as [unknown[]]
    if (!fence.length) throw new Fenced()
  })
}

// Tông môn NPC (không tài khoản): tạo một lần cho mỗi giới. Trùng tên (đã tạo ở lần nhận giới trước) thì bỏ qua.
export async function createNpcs(db: Database, world: number, rows: { name: string; nameKey: string; state: State }[]) {
  if (!rows.length) return []
  return db
    .insert(players)
    .values(rows.map(r => ({ worldId: world, name: r.name, nameKey: r.nameKey, state: r.state })))
    .onConflictDoNothing()
    .returning(playerCols)
}

// ---------- Chat ----------

// Tin gần đây của giới (mọi kênh) để nạp lại lúc nhận giới
export async function recentChat(db: Database, world: number, limit = 400): Promise<ChatRow[]> {
  const rows = await db
    .select({ id: chat.id, ch: chat.ch, pid: chat.playerId, name: chat.name, text: chat.text, at: chat.at })
    .from(chat)
    .where(eq(chat.worldId, world))
    .orderBy(desc(chat.id))
    .limit(limit)
  return rows.reverse().map(r => ({ ...r, at: r.at.getTime() }))
}
export const reportChat = (
  db: Database,
  r: { world: number; msgId: number; reporter: number; author: number; text: string },
) =>
  db
    .insert(chatReports)
    .values({ worldId: r.world, msgId: r.msgId, reporter: r.reporter, author: r.author, text: r.text })
export const setMute = (db: Database, pid: number, until: Date | null) =>
  db.update(players).set({ mutedUntil: until }).where(eq(players.id, pid))
export const mutes = (db: Database, world: number) =>
  db
    .select({ pid: players.id, until: players.mutedUntil })
    .from(players)
    .where(and(eq(players.worldId, world), sql`${players.mutedUntil} > now()`))

// ---------- Hộp lệnh (inbox): API ghi, chủ giới đọc 2 giây một lần, đánh dấu xong trong chính commit của nó ----------

export type InboxRow = { id: number; kind: string; body: unknown }
export const openInbox = (db: Database, world: number): Promise<InboxRow[]> =>
  db
    .select({ id: inbox.id, kind: inbox.kind, body: inbox.body })
    .from(inbox)
    .where(and(eq(inbox.worldId, world), isNull(inbox.doneAt)))
    .orderBy(inbox.id)
    .limit(100)
export const addInbox = (db: Database, world: number, kind: string, body: object) =>
  db.insert(inbox).values({ worldId: world, kind, body }).returning({ id: inbox.id })

// ---------- Xếp hạng ----------

export const BOARDS = ['power', 'hall', 'tower', 'pvp', 'week', 'kills'] as const
export type Board = (typeof BOARDS)[number]
const boardValue = {
  power: players.power,
  hall: players.hall,
  tower: players.tower,
  pvp: players.pvp,
  week: players.weekPts,
  kills: players.kills,
}
const boardScope = (world: number, board: Board, week: number) =>
  and(eq(players.worldId, world), board === 'week' ? eq(players.weekNo, week) : undefined)
const boardOrder = (board: Board) =>
  board === 'hall' ? [desc(players.hall), desc(players.power)] : [desc(boardValue[board])]
// Top 50 của giới. ponytail: quét cả giới (≤ vài trăm dòng, API cache 30 giây); index khi giới to.
export async function topOf(db: Database, world: number, board: Board, week: number) {
  const rows = await db
    .select({ pid: players.id, name: players.name, v: boardValue[board], hall: players.hall })
    .from(players)
    .where(boardScope(world, board, week))
    .orderBy(...boardOrder(board), players.id)
    .limit(50)
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}
export async function rankOf(db: Database, world: number, board: Board, pid: number, week: number) {
  const [me] = await db.execute<{ rank: number; v: number }>(sql`
    select rank, v from (
      select id, ${boardValue[board]} as v, rank() over (order by ${sql.join(boardOrder(board), sql`, `)}, id) as rank
      from ${players} where ${boardScope(world, board, week)}
    ) x where id = ${pid}`)
  return me ? { rank: Number(me.rank), v: Number(me.v) } : null
}

// ---------- Admin: D1/D7 theo ngày vào game đầu tiên (giờ VN), phân bố cảnh giới ----------

export async function stats(db: Database) {
  const cohorts = await db.execute<{ day: number; n: number; d1: number | null; d7: number | null }>(sql`
    with d as (select distinct player_id, day from ${events} where name = 'login' and player_id is not null),
         f as (select player_id, min(day) as d0 from d group by player_id)
    select f.d0 as day, count(*)::int as n,
      avg((exists (select 1 from d where d.player_id = f.player_id and d.day = f.d0 + 1))::int)::float8 as d1,
      avg((exists (select 1 from d where d.player_id = f.player_id and d.day = f.d0 + 7))::int)::float8 as d7
    from f group by f.d0 order by f.d0 desc limit 60`)
  const halls = await db
    .select({ hall: players.hall, n: sql<number>`count(*)::int` })
    .from(players)
    .groupBy(players.hall)
    .orderBy(players.hall)
  const tribs = await db.execute<{ hall: number; tries: number; wins: number }>(sql`
    select (props->>'hall')::int as hall, count(*)::int as tries, count(*) filter (where (props->>'win')::boolean)::int as wins
    from ${events} where name = 'trib' group by 1 order by 1`)
  return { cohorts: [...cohorts], halls, tribs: [...tribs] }
}

export const REPORTS_PAGE = 30 // chiến báo mỗi lần hỏi (cuộn xuống thì hỏi tiếp trước id cũ nhất)
export async function playerReports(db: Database, pid: number, before?: number) {
  const rows = await db
    .select({ body: reports.body })
    .from(reports)
    .where(and(eq(reports.playerId, pid), before === undefined ? undefined : lt(reports.id, before)))
    .orderBy(desc(reports.id))
    .limit(REPORTS_PAGE)
  return rows.map(r => r.body)
}
// Một chiến báo (chia sẻ vào chat)
export async function playerReport(db: Database, pid: number, id: number) {
  const rows = await db
    .select({ body: reports.body })
    .from(reports)
    .where(and(eq(reports.playerId, pid), eq(reports.id, id)))
  return rows[0]?.body ?? null
}

export const addWarp = (db: Database, world: number, ms: number) =>
  db
    .update(worlds)
    .set({ warp: sql`${worlds.warp} + ${ms}` })
    .where(eq(worlds.id, world))

// Việc hằng đêm: chiến báo 30 ngày, analytics 180 ngày, phiên không dùng 180 ngày. Khoá: nhiều node không chạy chồng.
export async function prune(db: Database) {
  await db.transaction(async tx => {
    const [{ ok }] = await tx.execute<{ ok: boolean }>(
      sql`select pg_try_advisory_xact_lock(hashtext('rok:prune')) as ok`,
    )
    if (!ok) return
    await tx.delete(reports).where(lt(reports.at, sql`now() - interval '30 days'`))
    await tx.delete(events).where(lt(events.at, sql`now() - interval '180 days'`))
    await tx.delete(chat).where(lt(chat.at, sql`now() - interval '14 days'`))
    await tx.delete(sessions).where(lt(sessions.seenAt, sql`now() - interval '180 days'`))
  })
}
