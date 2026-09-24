// Truy vấn của game. Logic game đọc state trong RAM (world actor); DB chỉ là nơi lưu bền.
import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm'
import type { State } from '@rok/rules'
import type { Seen } from '@rok/protocol'
import type { Database } from './index.ts'
import { accounts, events, inbox, players, reports, sessions, worlds } from './schema.ts'

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
          where w.status = 'open' and (select count(*) from ${players} p where p.world_id = w.id and p.account_id is not null) < ${g.cap}
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

export type Claimed = { id: number; name: string; seed: number; season: number; state: unknown; epoch: number; warp: number }
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
    .returning({ id: worlds.id, name: worlds.name, seed: worlds.seed, season: worlds.season, state: worlds.state, epoch: worlds.epoch, warp: worlds.warp })
  if (w) return w
  const [o] = await db.select({ owner: worlds.owner }).from(worlds).where(eq(worlds.id, id))
  return { owner: o?.owner ?? null }
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
  players: { id: number; state: State; name: string; power: number; hall: number; tower: number; rebirths: number; seen?: Seen }[]
  reports: { pid: number; id: number; at: number; kind: string; win: boolean; body: object }[]
  events: { pid: number; name: string; day: number; at: number; props: object }[]
  inboxDone: number[]
}
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
        .set({ leaseUntil: sql`now() + interval '15 seconds'`, online: b.online, updatedAt: sql`now()`, ...(b.state && { state: b.state }) })
        .where(and(eq(worlds.id, b.world), eq(worlds.owner, b.node), eq(worlds.epoch, b.epoch)))
        .returning({ id: worlds.id }),
    ]
    if (b.players.length)
      q.push(
        tx.execute(sql`
          update ${players} p set state = r.state, name = r.name, power = r.power, hall = r.hall, tower = r.tower, rebirths = r.rebirths,
            seen = coalesce(r.seen, p.seen), updated_at = now()
          from jsonb_to_recordset(${JSON.stringify(b.players)}::jsonb)
            as r(id int, state jsonb, name text, power int, hall int, tower int, rebirths int, seen jsonb)
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
    if (b.inboxDone.length) q.push(tx.update(inbox).set({ doneAt: sql`now()` }).where(and(eq(inbox.worldId, b.world), sql`${inbox.id} = any(${b.inboxDone})`)))
    const [fence] = (await Promise.all(q)) as [unknown[]]
    if (!fence.length) throw new Fenced()
  })
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
    await tx.delete(sessions).where(lt(sessions.seenAt, sql`now() - interval '180 days'`))
  })
}

