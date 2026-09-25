// Tài khoản (M9): gắn email + mật khẩu cho tài khoản khách, đăng nhập, đổi mật khẩu (các phiên khác bị đăng xuất), đăng xuất
// mọi nơi, mã chuyển máy dùng một lần, xoá tài khoản ngay trong game; đăng ký Web Push. Chưa có dịch vụ gửi mail nên chưa có
// xác minh email / quên mật khẩu — mã chuyển máy thay cho việc đó.
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { z } from 'zod'
import type { Database } from '../db/index.ts'
import * as accounts from '../db/accounts.ts'
import { addInbox, findPlayer } from '../db/store.ts'
import { cleanGiftCode, redeemGiftCode } from '../db/codes.ts'
import { LINK_GIFT } from '@rok/rules'
import {
  CODE_TTL,
  COOKIE,
  checkPass,
  cleanCode,
  cleanEmail,
  cleanName,
  cookieOptions,
  hashPass,
  hashToken,
  newCode,
  newToken,
} from '../lib/auth.ts'
import { ErrorReply, authed, clearSession, socketPath } from './session.ts'

export type AccountOptions = {
  db: Database
  secure: boolean
  path: string
  limits: boolean
  pushKey: string | null
  localPush: boolean
}

// Dịch vụ push của các trình duyệt (Chrome/Edge qua FCM, Firefox, Safari, Windows)
const PUSH_HOSTS = ['fcm.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com']
// Loại thông báo đẩy (tag của Note) người chơi tắt được
const PUSH_TAGS = ['done', 'raid', 'dm', 'trib', 'ark', 'plan'] as const

const Email = z.string().max(254).transform(cleanEmail).pipe(z.email())
const Pass = z.string().min(8).max(128)
const Ok = z.object({ ok: z.boolean() })
const Signed = z.object({
  token: z.string(),
  pid: z.number().nullable(),
  world: z.number().nullable(),
  path: z.string(),
})
const errors = { 400: ErrorReply, 401: ErrorReply, 403: ErrorReply, 409: ErrorReply, 429: ErrorReply }

type App = Parameters<FastifyPluginAsyncZod<AccountOptions>>[0]
type Auth = ReturnType<typeof authed>
const strict = { rateLimit: { max: 10, timeWindow: '1 minute' } }

export const accountRoutes: FastifyPluginAsyncZod<AccountOptions> = async (app, o) => {
  const auth = authed(o.db)
  loginRoutes(app, o)
  profileRoutes(app, o, auth)
  pushRoutes(app, o, auth)
  renameRoutes(app, o, auth)
  codeRoutes(app, o, auth)
}

// Đăng nhập bằng email + mật khẩu, hoặc bằng mã chuyển máy
function loginRoutes(app: App, o: AccountOptions) {
  // 5 lần sai mỗi email / 15 phút (thêm vào giới hạn theo IP của route): dò mật khẩu một tài khoản từ nhiều IP cũng bị chặn
  const perEmail = new RateLimiterMemory({ points: 5, duration: 15 * 60 })

  // Mở phiên mới cho tài khoản (đăng nhập bằng mật khẩu hoặc mã chuyển máy)
  async function signIn(req: FastifyRequest, reply: FastifyReply, account: number) {
    const token = newToken()
    await accounts.newSession(o.db, account, hashToken(token), req.ip, req.headers['user-agent'])
    const s = await accounts.findSession(o.db, hashToken(token))
    reply.setCookie(COOKIE, token, cookieOptions(o.secure))
    return {
      token,
      pid: s?.pid ?? null,
      world: s?.world ?? null,
      path: await socketPath(o.db, s?.world ?? null, o.path),
    }
  }
  const refuse = (reply: FastifyReply, a: accounts.Login | null) =>
    a?.banned ? reply.code(403).send({ error: 'banned' }) : reply.code(401).send({ error: 'wrong' })

  app.post(
    '/login',
    { config: strict, schema: { body: z.object({ email: Email, pass: Pass }), response: { 200: Signed, ...errors } } },
    async (req, reply) => {
      const { email, pass } = req.body
      const tries = o.limits ? await perEmail.get(email) : null
      if (tries && tries.consumedPoints >= 5) return reply.code(429).send({ error: 'rate' })
      const a = await accounts.accountByEmail(o.db, email)
      const good = await checkPass(pass, a?.pass ?? null) // email lạ vẫn băm: thời gian như nhau
      if (!a || !good || a.deleted || a.banned) {
        if (o.limits) await perEmail.consume(email).catch(() => {})
        return refuse(reply, a && good ? a : null)
      }
      return signIn(req, reply, a.account)
    },
  )

  app.post(
    '/login/code',
    { config: strict, schema: { body: z.object({ code: z.string().max(32) }), response: { 200: Signed, ...errors } } },
    async (req, reply) => {
      const id = await accounts.takeCode(o.db, hashToken(cleanCode(req.body.code)))
      const a = id ? await accounts.accountOf(o.db, id) : null
      if (!a || a.deleted || a.banned) return refuse(reply, a)
      return signIn(req, reply, a.account)
    },
  )
}

// Tài khoản của người đang chơi: xem, gắn email, đổi mật khẩu, đăng xuất mọi nơi, mã chuyển máy, xoá
function profileRoutes(app: App, o: AccountOptions, auth: Auth) {
  app.get(
    '/account',
    {
      preHandler: auth,
      schema: {
        response: {
          200: z.object({ email: z.string().nullable(), push: z.string().nullable(), off: z.array(z.string()) }),
          ...errors,
        },
      },
    },
    async req => {
      const s = req.session
      const [a, off] = await Promise.all([accounts.accountOf(o.db, s.account), accounts.pushOffOf(o.db, s.account)])
      return { email: a?.email ?? null, push: o.pushKey, off }
    },
  )

  app.post(
    '/account/link',
    {
      preHandler: auth,
      config: strict,
      schema: { body: z.object({ email: Email, pass: Pass }), response: { 200: Ok, ...errors } },
    },
    async (req, reply) => {
      const s = req.session
      try {
        if (!(await accounts.linkEmail(o.db, s.account, req.body.email, await hashPass(req.body.pass))))
          return reply.code(409).send({ error: 'linked' })
      } catch (e) {
        if (e instanceof accounts.EmailTaken) return reply.code(409).send({ error: 'email_taken' })
        throw e
      }
      // quà gắn email: lần gắn đầu (gắn lại bị chặn ở trên), chủ giới áp qua hộp lệnh như thư admin
      if (s.pid && s.world)
        await addInbox(o.db, s.world, 'mail', { pid: s.pid, mail: { k: 'linked', a: [], gift: LINK_GIFT } })
      return { ok: true }
    },
  )

  // Đổi mật khẩu: phải đúng mật khẩu cũ; mọi phiên khác bị đăng xuất (máy lạ đang giữ phiên mất quyền ngay)
  app.post(
    '/account/password',
    {
      preHandler: auth,
      config: strict,
      schema: { body: z.object({ old: z.string().max(128), pass: Pass }), response: { 200: Ok, ...errors } },
    },
    async (req, reply) => {
      const s = req.session
      const a = await accounts.accountOf(o.db, s.account)
      if (!a?.pass || !(await checkPass(req.body.old, a.pass))) return reply.code(401).send({ error: 'wrong' })
      await accounts.setPass(o.db, s.account, await hashPass(req.body.pass))
      await accounts.dropSessions(o.db, s.account, hashToken(s.token))
      return { ok: true }
    },
  )

  app.post(
    '/account/logout-all',
    { preHandler: auth, schema: { response: { 200: Ok, ...errors } } },
    async (req, reply) => {
      const s = req.session
      await accounts.dropSessions(o.db, s.account)
      clearSession(reply)
      return { ok: true }
    },
  )

  // Mã chuyển máy: mở game ở máy khác (hoặc sau khi trình duyệt xoá dữ liệu) mà không cần email
  app.post(
    '/account/code',
    {
      preHandler: auth,
      config: strict,
      schema: { response: { 200: z.object({ code: z.string(), until: z.number() }), ...errors } },
    },
    async req => {
      const s = req.session
      const code = newCode(),
        until = Date.now() + CODE_TTL
      await accounts.putCode(o.db, s.account, hashToken(code), new Date(until))
      return { code, until }
    },
  )

  // Xoá tài khoản: có mật khẩu thì phải nhập lại; tông môn được chủ giới gỡ khỏi giới và tiên minh rồi xoá hẳn (inbox)
  app.post(
    '/account/delete',
    {
      preHandler: auth,
      config: strict,
      schema: { body: z.object({ pass: z.string().max(128).optional() }), response: { 200: Ok, ...errors } },
    },
    async (req, reply) => {
      const s = req.session
      const a = await accounts.accountOf(o.db, s.account)
      if (a?.pass && !(await checkPass(req.body.pass ?? '', a.pass))) return reply.code(401).send({ error: 'wrong' })
      await accounts.markDeleted(o.db, s.account, s.pid, s.world)
      req.log.info({ account: s.account, pid: s.pid }, 'account deleted')
      clearSession(reply)
      return { ok: true }
    },
  )
}

// Web Push (chỉ khi server có khoá VAPID): trình duyệt đăng ký / huỷ; GET /account trả khoá công khai.
function pushRoutes(app: App, o: AccountOptions, auth: Auth) {
  // Endpoint chỉ nhận dịch vụ push thật (https): server sẽ gửi request tới đó — URL tuỳ ý là lỗ SSRF vào mạng nội bộ
  const pushHost = (u: string) => {
    const url = new URL(u)
    if (o.localPush && url.hostname === '127.0.0.1') return true // test, dev
    return url.protocol === 'https:' && PUSH_HOSTS.some(h => url.hostname === h || url.hostname.endsWith(`.${h}`))
  }
  const Sub = z.object({
    endpoint: z.url().max(1024).refine(pushHost),
    keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
  })
  app.post(
    '/push/sub',
    { preHandler: auth, schema: { body: Sub, response: { 200: Ok, ...errors } } },
    async (req, reply) => {
      const s = req.session
      if (!o.pushKey) return reply.code(400).send({ error: 'push_off' })
      await accounts.addPushSub(o.db, s.account, { endpoint: req.body.endpoint, ...req.body.keys })
      return { ok: true }
    },
  )
  // loại thông báo đẩy muốn tắt (việc xong, bị cướp, truyền âm, kiếp vân, sự kiện tiên minh)
  app.post(
    '/push/off',
    {
      preHandler: auth,
      schema: {
        body: z.object({ off: z.array(z.enum(PUSH_TAGS)).max(PUSH_TAGS.length) }),
        response: { 200: Ok, ...errors },
      },
    },
    async req => {
      await accounts.setPushOff(o.db, req.session.account, [...new Set(req.body.off)])
      return { ok: true }
    },
  )
  app.post(
    '/push/unsub',
    {
      preHandler: auth,
      schema: { body: z.object({ endpoint: z.string().max(1024) }), response: { 200: Ok, ...errors } },
    },
    async req => {
      const s = req.session
      await accounts.dropPushSub(o.db, req.body.endpoint, s.account)
      return { ok: true }
    },
  )
}

// Đổi tên tông môn bằng Cải Danh Lệnh (Rename của RoK): tên như lúc lập (cleanName: độ dài, ký tự, từ tục), không trùng trong
// giới (khoá DB). Khoá tên đổi ngay ở đây; chủ giới áp tên mới vào state và trừ lệnh qua hộp lệnh (state sống trong RAM của nó).
function renameRoutes(app: App, o: AccountOptions, auth: Auth) {
  app.post(
    '/account/rename',
    {
      preHandler: auth,
      config: strict,
      schema: { body: z.object({ name: z.string().max(64) }), response: { 200: Ok, ...errors } },
    },
    async (req, reply) => {
      const s = req.session
      const n = cleanName(req.body.name)
      if (!n) return reply.code(400).send({ error: 'name' })
      if (!s.pid || !s.world) return reply.code(403).send({ error: 'nosect' })
      const p = await findPlayer(o.db, s.pid)
      if (!p || !(p.state.items.caiDanh ?? 0)) return reply.code(403).send({ error: 'no_item' })
      if (!(await accounts.renamePlayer(o.db, s.pid, n.name, n.key)))
        return reply.code(409).send({ error: 'name_taken' })
      await addInbox(o.db, s.world, 'rename', { pid: s.pid, name: n.name })
      return { ok: true }
    },
  )
}

// Mã quà tặng (Redeem Code của RoK): mỗi tài khoản một lần mỗi mã; quà về tông môn đang chơi qua hộp lệnh như thư admin
function codeRoutes(app: App, o: AccountOptions, auth: Auth) {
  app.post(
    '/account/redeem',
    {
      preHandler: auth,
      config: strict,
      schema: { body: z.object({ code: z.string().min(1).max(64) }), response: { 200: Ok, ...errors } },
    },
    async (req, reply) => {
      const s = req.session
      if (!s.pid || !s.world) return reply.code(403).send({ error: 'nosect' })
      const code = cleanGiftCode(req.body.code)
      const r = await redeemGiftCode(o.db, code, s.account)
      if ('error' in r) return reply.code(r.error === 'code' ? 400 : 409).send({ error: r.error })
      await addInbox(o.db, s.world, 'mail', { pid: s.pid, mail: { k: 'code', a: [code], gift: r.gift } })
      return { ok: true }
    },
  )
}
