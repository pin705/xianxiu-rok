// Truy vấn của người chơi ngoài game: phiên, khách mới, tài khoản (email, mật khẩu, mã chuyển máy, xoá), đăng ký Web Push.
// Phần của giới (lease, commit, chat, hộp lệnh, xếp hạng) ở store.ts.
import { and, eq, isNull, sql } from 'drizzle-orm'
import { JOIN_DAYS, type State } from '@rok/rules'
import type { Database } from './index.ts'
import { accounts, codes, inbox, players, pushSubs, sessions, worlds } from './schema.ts'

// ---------- Phiên ----------

export type Session = {
  account: number
  locale: string
  banned: boolean
  deleted: boolean
  pid: number | null
  world: number | null
}
// Mọi lối vào (HTTP, socket) đều qua đây: phiên còn dùng thì dời seen_at (tối đa một lần mỗi ngày) để prune không xoá oan
export async function findSession(db: Database, hash: Buffer): Promise<Session | null> {
  const [r] = await db
    .select({
      account: accounts.id,
      locale: accounts.locale,
      banned: sql<boolean>`${accounts.bannedAt} is not null`,
      deleted: sql<boolean>`${accounts.deletedAt} is not null`,
      pid: players.id,
      world: players.worldId,
      stale: sql<boolean>`${sessions.seenAt} < now() - interval '1 day'`,
    })
    .from(sessions)
    .innerJoin(accounts, eq(accounts.id, sessions.accountId))
    .leftJoin(players, eq(players.accountId, accounts.id))
    .where(eq(sessions.hash, hash))
  if (!r) return null
  const { stale, ...s } = r
  if (stale)
    await db
      .update(sessions)
      .set({ seenAt: sql`now()` })
      .where(eq(sessions.hash, hash))
  return s
}

const sessionRow = (account: number, hash: Buffer, ip?: string, ua?: string) => ({
  hash,
  accountId: account,
  ip: ip ?? null,
  ua: ua?.slice(0, 200) ?? null,
})
export const deleteSession = (db: Database, hash: Buffer) => db.delete(sessions).where(eq(sessions.hash, hash))

export class NameTaken extends Error {}
// Lỗi của Postgres (driver bọc trong cause): mã SQLSTATE + tên ràng buộc
type PgError = { code?: string; constraint_name?: string }
const pgError = (e: unknown): PgError => (e as { cause?: PgError }).cause ?? (e as PgError)
const UNIQUE = '23505'

// Khách mới: tài khoản + tông môn + phiên trong một transaction. Giới: giới mở id nhỏ nhất còn chỗ; hết chỗ thì mở giới mới.
export async function createGuest(
  db: Database,
  g: {
    hash: Buffer
    locale: string
    name: string
    nameKey: string
    crest: number
    state: State
    cap: number
    world?: number
    ip?: string
    ua?: string
    seed: number
  },
) {
  try {
    return await db.transaction(async tx => {
      let world = g.world
        ? (
            await tx
              .select({ id: worlds.id })
              .from(worlds)
              .where(and(eq(worlds.id, g.world), eq(worlds.status, 'open')))
          )[0]?.id
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
      await tx.insert(sessions).values(sessionRow(a.id, g.hash, g.ip, g.ua))
      return { account: a.id, pid: p.id, world }
    })
  } catch (e) {
    const cause = pgError(e)
    if (cause.code === UNIQUE && cause.constraint_name === 'players_world_name') throw new NameTaken()
    throw e
  }
}

// ---------- Tài khoản (M9) ----------

export type Login = { account: number; pass: string | null; email: string | null; banned: boolean; deleted: boolean }
const loginCols = {
  account: accounts.id,
  pass: accounts.pass,
  email: accounts.email,
  banned: sql<boolean>`${accounts.bannedAt} is not null`,
  deleted: sql<boolean>`${accounts.deletedAt} is not null`,
}
export const accountOf = async (db: Database, id: number): Promise<Login | null> =>
  (await db.select(loginCols).from(accounts).where(eq(accounts.id, id)))[0] ?? null
export const accountByEmail = async (db: Database, email: string): Promise<Login | null> =>
  (await db.select(loginCols).from(accounts).where(eq(accounts.email, email)))[0] ?? null

export class EmailTaken extends Error {}
// Khách gắn email + mật khẩu (một lần; đổi mật khẩu đi đường setPass)
export async function linkEmail(db: Database, account: number, email: string, pass: string) {
  try {
    const r = await db
      .update(accounts)
      .set({ email, pass })
      .where(and(eq(accounts.id, account), isNull(accounts.email)))
      .returning({ id: accounts.id })
    return r.length > 0
  } catch (e) {
    if (pgError(e).code === UNIQUE) throw new EmailTaken()
    throw e
  }
}
// Đổi tên tông môn (Cải Danh Lệnh): false nếu tên mới trùng tông môn khác trong giới (khoá players_world_name)
export async function renamePlayer(db: Database, pid: number, name: string, nameKey: string) {
  try {
    await db.update(players).set({ name, nameKey }).where(eq(players.id, pid))
    return true
  } catch (e) {
    if (pgError(e).code === UNIQUE) return false
    throw e
  }
}
export const setPass = (db: Database, account: number, pass: string) =>
  db.update(accounts).set({ pass }).where(eq(accounts.id, account))

export const newSession = (db: Database, account: number, hash: Buffer, ip?: string, ua?: string) =>
  db.insert(sessions).values(sessionRow(account, hash, ip, ua))
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
  (
    await db
      .delete(codes)
      .where(and(eq(codes.hash, hash), sql`${codes.expiresAt} > now()`))
      .returning({ account: codes.accountId })
  )[0]?.account ?? null

// Xoá tài khoản: đánh dấu + bỏ mọi phiên ngay (không vào được nữa), rồi nhờ chủ giới gỡ tông môn khỏi giới (inbox 'delete');
// chủ giới xoá dòng tài khoản (dây chuyền: tông môn, chiến báo, mã, đăng ký push) trong commit của chính nó.
export async function markDeleted(db: Database, account: number, pid: number | null, world: number | null) {
  await db.transaction(async tx => {
    await tx
      .update(accounts)
      .set({ deletedAt: sql`now()` })
      .where(eq(accounts.id, account))
    await tx.delete(sessions).where(eq(sessions.accountId, account))
    if (pid && world) await tx.insert(inbox).values({ worldId: world, kind: 'delete', body: { pid } })
    else await tx.delete(accounts).where(eq(accounts.id, account)) // chưa có tông môn: xoá luôn
  })
}

// ---------- Web Push ----------

export const addPushSub = (db: Database, account: number, sub: { endpoint: string; p256dh: string; auth: string }) =>
  db
    .insert(pushSubs)
    .values({ accountId: account, ...sub })
    .onConflictDoUpdate({ target: pushSubs.endpoint, set: { accountId: account, p256dh: sub.p256dh, auth: sub.auth } })
export const dropPushSub = (db: Database, endpoint: string, account?: number) =>
  db.delete(pushSubs).where(and(eq(pushSubs.endpoint, endpoint), account ? eq(pushSubs.accountId, account) : undefined))
// Loại thông báo đẩy tài khoản đã tắt
export const pushOffOf = async (db: Database, account: number) =>
  (await db.select({ off: accounts.pushOff }).from(accounts).where(eq(accounts.id, account)))[0]?.off ?? []
export const setPushOff = (db: Database, account: number, off: string[]) =>
  db.update(accounts).set({ pushOff: off }).where(eq(accounts.id, account))
// Đăng ký push của người chơi pid, kèm ngôn ngữ tài khoản (server dựng chữ thông báo) và loại đã tắt
export const pushSubsOf = (db: Database, pid: number) =>
  db
    .select({
      endpoint: pushSubs.endpoint,
      p256dh: pushSubs.p256dh,
      auth: pushSubs.auth,
      locale: accounts.locale,
      off: accounts.pushOff,
    })
    .from(pushSubs)
    .innerJoin(accounts, eq(accounts.id, pushSubs.accountId))
    .innerJoin(players, eq(players.accountId, accounts.id))
    .where(eq(players.id, pid))
