// Các giới node này đang giữ: nhận giới (lease + epoch), gia hạn, cân tải giữa các node, xả khi deploy.
// Mọi node giống hệt nhau; mỗi giới chỉ do đúng một node giữ tại một thời điểm (fencing trong store.flushWorld).
import * as store from '../db/store.ts'
import { hosts } from '../lib/metrics.ts'
import { World, type Env } from './world.ts'

export class Host {
  readonly env: Env
  readonly worlds = new Map<number, World>()
  draining = false
  private readonly claiming = new Map<number, Promise<World | { owner: string | null }>>()
  private readonly timers: NodeJS.Timeout[] = []

  constructor(env: Env) {
    this.env = env
    hosts.add(this)
  }

  worldCount() {
    return this.worlds.size
  }
  online() {
    return [...this.worlds.values()].reduce((n, w) => n + w.online, 0)
  }

  // Giới này ở node nào? Chưa ai giữ (hoặc lease đã hết quá grace) thì nhận về đây — phục vụ trước, cân tải sau.
  ensure(id: number): Promise<World | { owner: string | null }> {
    const w = this.worlds.get(id)
    if (w && !w.lost) return Promise.resolve(w)
    if (this.draining) return Promise.resolve({ owner: null })
    let p = this.claiming.get(id)
    if (!p) {
      p = this.claim(id).finally(() => this.claiming.delete(id))
      this.claiming.set(id, p)
    }
    return p
  }

  private async claim(id: number) {
    const c = await store.claimWorld(this.env.db, id, this.env.node)
    if (!('epoch' in c)) return c
    const rows = await store.worldPlayers(this.env.db, id)
    const w = new World(c, rows, this.env)
    this.worlds.set(id, w)
    this.env.log.info({ world: id, epoch: c.epoch, players: rows.length }, 'world claimed')
    await w.ensureNpcs().catch(err => this.env.log.warn({ err, world: id }, 'npc seeding failed')) // lần đầu: phân đà NPC
    await w.loadChat().catch(err => this.env.log.warn({ err, world: id }, 'chat load failed'))
    w.tick(w.now()) // đuổi kịp sự kiện đã tới hạn lúc giới không có chủ
    return w
  }

  start({ rebalance }: { rebalance: boolean }) {
    this.timers.push(
      setInterval(() => {
        for (const [id, w] of this.worlds) {
          if (w.lost) this.worlds.delete(id)
          else w.heartbeat()
        }
      }, 2_000),
    )
    if (rebalance)
      this.timers.push(
        setInterval(() => void this.rebalance().catch(err => this.env.log.warn({ err }, 'rebalance failed')), 5_000),
      )
    for (const t of this.timers) t.unref()
  }

  // Nhận giới mồ côi khi số giới của node còn dưới phần chia đều (node chết → giới của nó sang node khác)
  private async rebalance() {
    if (this.draining) return
    const rows = await store.worldOwners(this.env.db)
    const live = new Set([...rows.filter(r => r.live && r.owner).map(r => r.owner), this.env.node]).size
    const target = Math.ceil(rows.length / live)
    for (const r of rows) {
      if (this.worlds.size >= target) break
      if (r.orphan && !this.worlds.has(r.id)) await this.ensure(r.id)
    }
  }

  // Deploy / tắt: không nhận thêm, mỗi giới commit lần cuối rồi nhả lease
  async drain() {
    this.draining = true
    for (const t of this.timers) clearInterval(t)
    await Promise.all([...this.worlds.values()].map(w => w.close()))
    this.worlds.clear()
    hosts.delete(this)
  }
}
