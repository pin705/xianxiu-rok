// Truy vấn của game. Logic game đọc state trong RAM (world actor); DB chỉ là nơi lưu bền.
import { and, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import { JOIN_DAYS, type State } from '@rok/rules'
import type { Seen } from '@rok/protocol'
import type { Database } from './index.ts'
import { accounts, chat, chatReports, codes, events, inbox, players, pushSubs, reports, sessions, worlds } from './schema.ts'

// ---------- Phiên ----------

export type Session = { account: number; locale: string; banned: boolean; deleted: boolean; pid: number | null; world: number | null }
export async function findSession(db: Database, hash: Buffer): Promise<Session | null> {
  const [r] = await db
    .select({
      account: accounts.id,
      locale: accounts.locale,
      banned: sql<boolean>`${accounts.bannedAt} is not null`,
      deleted: sql<boolean>`${accounts.deletedAt} is not null`,
      pid: players.id,
      world: players.worldId,
    })
    .from(sessions)
    .innerJoin(accounts, eq(accounts.id, sessions.accountId))
    .leftJoin(players, eq(players.accountId, accounts.id))
    .where(eq(sessions.hash, hash))
  return r ?? null
}

export const deleteSession = (db: Database, hash: Buffer) => db.delete(sessions).where(eq(sessions.hash, hash))

export class NameTaken extends Error {}

// Khách mới: tài khoản + tông môn + phiên trong một transaction. Giới: giới mở id nhỏ nhất còn chỗ; hết chỗ thì mở giới mới.
export async function createGuest(
  db: Database,
  g: { hash: Buffer; locale: string; name: string; nameKey: string; crest: number; state: State; cap: number; world?: number; ip?: string; ua?: string; seed: number },
) {
  try {
    return await db.transaction(async tx => {
      let world = g.world
        ? (await tx.select({ id: worlds.id }).from(worlds).where(and(eq(worlds.id, g.world), eq(worlds.status, 'open'))))[0]?.id
        : undefined
      if (!world) {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext('rok:world'))`) // hai khách cùng lúc không mở hai giới
        const [open] = await tx.execute<{ id: number }>(sql`
          select w.id from ${worlds} w
          where w.status = 'open' and w.opens_at > now() - make_interval(days => ${JOIN_DAYS})
            and (select count(*) from ${players} p where p.world_id = w.id and p.account_id is not null) < ${g.cap}
          order by w.id limit 1`)
        world = open?.id ?? (await tx.insert(worlds).values({ seed: g.seed }).returning({ id: worlds.id }))[0].id
      }
      const [a] = await tx.insert(accounts).values({ locale: g.locale }).returning({ id: accounts.id })
      const [p] = await tx
        .insert(players)
        .values({ accountId: a.id, worldId: world, name: g.name, nameKey: g.nameKey, crest: g.crest, state: g.state })
        .returning({ id: players.id })
      await tx.insert(sessions).values({ hash: g.hash, accountId: a.id, ip: g.ip ?? null, ua: g.ua?.slice(0, 200) ?? null })
      return { account: a.id, pid: p.id, world }
    })
  } catch (e) {
    const cause = (e as { cause?: { code?: string; constraint_name?: string } }).cause ?? (e as { code?: string; constraint_name?: string })
    if (cause.code === '23505' && cause.constraint_name === 'players_world_name') throw new NameTaken()
    throw e
  }
}

// ---------- Giới: nhận / nhả (lease + epoch) ----------

export type Claimed = { id: number; name: string; seed: number; season: number; state: unknown; epoch: number; warp: number; opensAt: Date }
// Nhận giới nếu chưa ai giữ, hoặc chính node này giữ (khởi động lại), hoặc lease đã hết quá 15 giây
// (grace: DB chập chờn không làm giới chuyển oan sang node khác)
export async function claimWorld(db: Database, id: number, node: string): Promise<Claimed | { owner: string | null }> {
  const [w] = await db
    .update(worlds)
    .set({ owner: node, epoch: sql`${worlds.epoch} + 1`, leaseUntil: sql`now() + interval '15 seconds'`, updatedAt: sql`now()` })
    .where(
      and(
        eq(worlds.id, id),
        sql`${worlds.status} <> 'ended'`,
        or(isNull(worlds.owner), eq(worlds.owner, node), lt(worlds.leaseUntil, sql`now() - interval '15 seconds'`)),
      ),
    )
    .returning({ id: worlds.id, name: worlds.name, seed: worlds.seed, season: worlds.season, state: worlds.state, epoch: worlds.epoch, warp: worlds.warp, opensAt: worlds.opensAt })
  if (w) return w
  const [o] = await db.select({ owner: worlds.owner }).from(worlds).where(eq(worlds.id, id))
  return { owner: o?.owner ?? null }
}

// Đường Socket.IO của node đang giữ giới (null: chưa ai giữ, hoặc lease đã hết)
export async function worldPath(db: Database, id: number) {
  const [w] = await db.select({ owner: worlds.owner }).from(worlds).where(and(eq(worlds.id, id), sql`${worlds.leaseUntil} > now()`))
  return w?.owner ?? null
}

export const releaseWorld = (db: Database, id: number, node: string, epoch: number) =>
  db.update(worlds).set({ owner: null, leaseUntil: null }).where(and(eq(worlds.id, id), eq(worlds.owner, node), eq(worlds.epoch, epoch)))

// Giới mồ côi (chưa ai giữ, hoặc lease hết quá grace) và giới đang có chủ — cho vòng cân tải
export async function worldOwners(db: Database) {
  const rows = await db
    .select({ id: worlds.id, owner: worlds.owner, live: sql<boolean>`${worlds.leaseUntil} > now()`, orphan: sql<boolean>`${worlds.owner} is null or ${worlds.leaseUntil} < now() - interval '15 seconds'` })
    .from(worlds)
    .where(sql`${worlds.status} <> 'ended'`)
  return rows
}

export type PlayerRow = { id: number; accountId: number | null; name: string; crest: number; state: State; seen: Seen | null; worldId: number }
const playerCols = { id: players.id, accountId: players.accountId, name: players.name, crest: players.crest, state: players.state, seen: players.seen, worldId: players.worldId }
export const worldPlayers = (db: Database, world: number): Promise<PlayerRow[]> => db.select(playerCols).from(players).where(eq(players.worldId, world))
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
  players: { id: number; state: State; name: string; power: number; hall: number; tower: number; rebirths: number; pvp: number; weekNo: number; weekPts: number; seen?: Seen }[]
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
        .set({ leaseUntil: sql`now() + interval '15 seconds'`, online: b.online, updatedAt: sql`now()`, ...(b.state && { state: b.state }), ...b.season })
        .where(and(eq(worlds.id, b.world), eq(worlds.owner, b.node), eq(worlds.epoch, b.epoch)))
        .returning({ id: worlds.id }),
    ]
    if (b.players.length)
      q.push(
        tx.execute(sql`
          update ${players} p set state = r.state, name = r.name, power = r.power, hall = r.hall, tower = r.tower, rebirths = r.rebirths,
            pvp = r.pvp, week_no = r."weekNo", week_pts = r."weekPts", seen = coalesce(r.seen, p.seen), updated_at = now()
          from jsonb_to_recordset(${JSON.stringify(b.players)}::jsonb)
            as r(id int, state jsonb, name text, power int, hall int, tower int, rebirths int, pvp int, "weekNo" int, "weekPts" int, seen jsonb)
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
    if (b.inboxDone.length) q.push(tx.update(inbox).set({ doneAt: sql`now()` }).where(and(eq(inbox.worldId, b.world), inArray(inbox.id, b.inboxDone))))
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
export const reportChat = (db: Database, r: { world: number; msgId: number; reporter: number; author: number; text: string }) =>
  db.insert(chatReports).values({ worldId: r.world, msgId: r.msgId, reporter: r.reporter, author: r.author, text: r.text })
export const setMute = (db: Database, pid: number, until: Date | null) => db.update(players).set({ mutedUntil: until }).where(eq(players.id, pid))
export const mutes = (db: Database, world: number) =>
  db.select({ pid: players.id, until: players.mutedUntil }).from(players).where(and(eq(players.worldId, world), sql`${players.mutedUntil} > now()`))

// ---------- Hộp lệnh (inbox): API ghi, chủ giới đọc 2 giây một lần, đánh dấu xong trong chính commit của nó ----------

export type InboxRow = { id: number; kind: string; body: unknown }
export const openInbox = (db: Database, world: number): Promise<InboxRow[]> =>
  db.select({ id: inbox.id, kind: inbox.kind, body: inbox.body }).from(inbox).where(and(eq(inbox.worldId, world), isNull(inbox.doneAt))).orderBy(inbox.id).limit(100)
export const addInbox = (db: Database, world: number, kind: string, body: object) => db.insert(inbox).values({ worldId: world, kind, body }).returning({ id: inbox.id })

// ---------- Xếp hạng ----------

export const BOARDS = ['power', 'hall', 'tower', 'pvp', 'week'] as const
export type Board = (typeof BOARDS)[number]
const boardValue = { power: players.power, hall: players.hall, tower: players.tower, pvp: players.pvp, week: players.weekPts }
const boardScope = (world: number, board: Board, week: number) => and(eq(players.worldId, world), board === 'week' ? eq(players.weekNo, week) : undefined)
const boardOrder = (board: Board) => (board === 'hall' ? [desc(players.hall), desc(players.power)] : [desc(boardValue[board])])
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
  const halls = await db.select({ hall: players.hall, n: sql<number>`count(*)::int` }).from(players).groupBy(players.hall).orderBy(players.hall)
  const tribs = await db.execute<{ hall: number; tries: number; wins: number }>(sql`
    select (props->>'hall')::int as hall, count(*)::int as tries, count(*) filter (where (props->>'win')::boolean)::int as wins
    from ${events} where name = 'trib' group by 1 order by 1`)
  return { cohorts: [...cohorts], halls, tribs: [...tribs] }
}

export async function playerReports(db: Database, pid: number, before?: number) {
  const rows = await db
    .select({ body: reports.body })
    .from(reports)
    .where(and(eq(reports.playerId, pid), before === undefined ? undefined : lt(reports.id, before)))
    .orderBy(desc(reports.id))
    .limit(30)
  return rows.map(r => r.body)
}

export const addWarp = (db: Database, world: number, ms: number) =>
  db.update(worlds).set({ warp: sql`${worlds.warp} + ${ms}` }).where(eq(worlds.id, world))

// Việc hằng đêm: chiến báo 30 ngày, analytics 180 ngày, phiên không dùng 180 ngày. Khoá: nhiều node không chạy chồng.
export async function prune(db: Database) {
  await db.transaction(async tx => {
    const [{ ok }] = await tx.execute<{ ok: boolean }>(sql`select pg_try_advisory_xact_lock(hashtext('rok:prune')) as ok`)
    if (!ok) return
    await tx.delete(reports).where(lt(reports.at, sql`now() - interval '30 days'`))
    await tx.delete(events).where(lt(events.at, sql`now() - interval '180 days'`))
    await tx.delete(chat).where(lt(chat.at, sql`now() - interval '14 days'`))
    await tx.delete(sessions).where(lt(sessions.seenAt, sql`now() - interval '180 days'`))
  })
}


// ---------- Tài khoản (M9) ----------

export type Login = { account: number; pass: string | null; email: string | null; banned: boolean; deleted: boolean }
const loginCols = {
  account: accounts.id, pass: accounts.pass, email: accounts.email,
  banned: sql<boolean>`${accounts.bannedAt} is not null`, deleted: sql<boolean>`${accounts.deletedAt} is not null`,
}
export const accountOf = async (db: Database, id: number): Promise<Login | null> =>
  (await db.select(loginCols).from(accounts).where(eq(accounts.id, id)))[0] ?? null
export const accountByEmail = async (db: Database, email: string): Promise<Login | null> =>
  (await db.select(loginCols).from(accounts).where(eq(accounts.email, email)))[0] ?? null

export class EmailTaken extends Error {}
// Khách gắn email + mật khẩu (một lần; đổi mật khẩu đi đường setPass)
export async function linkEmail(db: Database, account: number, email: string, pass: string) {
  try {
    const r = await db.update(accounts).set({ email, pass }).where(and(eq(accounts.id, account), isNull(accounts.email))).returning({ id: accounts.id })
    return r.length > 0
  } catch (e) {
    const cause = (e as { cause?: { code?: string } }).cause ?? (e as { code?: string })
    if (cause.code === '23505') throw new EmailTaken()
    throw e
  }
}
export const setPass = (db: Database, account: number, pass: string) => db.update(accounts).set({ pass }).where(eq(accounts.id, account))

export const newSession = (db: Database, account: number, hash: Buffer, ip?: string, ua?: string) =>
  db.insert(sessions).values({ hash, accountId: account, ip: ip ?? null, ua: ua?.slice(0, 200) ?? null })
// Xoá mọi phiên của tài khoản (trừ `keep` nếu có): đăng xuất mọi nơi, đổi mật khẩu
export const dropSessions = (db: Database, account: number, keep?: Buffer) =>
  db.delete(sessions).where(and(eq(sessions.accountId, account), keep ? sql`${sessions.hash} <> ${keep}` : undefined))

// Mã chuyển máy: mỗi tài khoản một mã còn hạn (tạo mới thì mã cũ bỏ); dùng là xoá luôn trong cùng câu (không dùng lại được)
export async function putCode(db: Database, account: number, hash: Buffer, expiresAt: Date) {
  await db.transaction(async tx => {
    await tx.delete(codes).where(eq(codes.accountId, account))
    await tx.insert(codes).values({ hash, accountId: account, expiresAt })
  })
}
export const takeCode = async (db: Database, hash: Buffer): Promise<number | null> =>
  (await db.delete(codes).where(and(eq(codes.hash, hash), sql`${codes.expiresAt} > now()`)).returning({ account: codes.accountId }))[0]?.account ?? null

// Xoá tài khoản: đánh dấu + bỏ mọi phiên ngay (không vào được nữa), rồi nhờ chủ giới gỡ tông môn khỏi giới (inbox 'delete');
// chủ giới xoá dòng tài khoản (dây chuyền: tông môn, chiến báo, mã, đăng ký push) trong commit của chính nó.
export async function markDeleted(db: Database, account: number, pid: number | null, world: number | null) {
  await db.transaction(async tx => {
    await tx.update(accounts).set({ deletedAt: sql`now()` }).where(eq(accounts.id, account))
    await tx.delete(sessions).where(eq(sessions.accountId, account))
    if (pid && world) await tx.insert(inbox).values({ worldId: world, kind: 'delete', body: { pid } })
    else await tx.delete(accounts).where(eq(accounts.id, account)) // chưa có tông môn: xoá luôn
  })
}

// ---------- Web Push ----------

export const addPushSub = (db: Database, account: number, sub: { endpoint: string; p256dh: string; auth: string }) =>
  db.insert(pushSubs).values({ accountId: account, ...sub }).onConflictDoUpdate({ target: pushSubs.endpoint, set: { accountId: account, p256dh: sub.p256dh, auth: sub.auth } })
export const dropPushSub = (db: Database, endpoint: string, account?: number) =>
  db.delete(pushSubs).where(and(eq(pushSubs.endpoint, endpoint), account ? eq(pushSubs.accountId, account) : undefined))
// Đăng ký push của người chơi pid, kèm ngôn ngữ tài khoản (server dựng chữ thông báo)
export const pushSubsOf = (db: Database, pid: number) =>
  db
    .select({ endpoint: pushSubs.endpoint, p256dh: pushSubs.p256dh, auth: pushSubs.auth, locale: accounts.locale })
    .from(pushSubs)
    .innerJoin(accounts, eq(accounts.id, pushSubs.accountId))
    .innerJoin(players, eq(players.accountId, accounts.id))
    .where(eq(players.id, pid))
