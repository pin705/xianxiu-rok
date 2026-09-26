// Chiến thuật bot: một lượt chơi trên state (thử mọi thao tác trên bản sao, luật tất định). Dùng bởi simulate.ts;
// sau này bởi sim PvP (nhiều bot một giới) và load test.
import {
  ACH_IDS,
  BAG,
  BAG_IDS,
  BEASTS,
  DEPUTY_HALL,
  ELDER_IDS,
  ELDER_MAX,
  FEST_IDS,
  festRewards,
  jobOf,
  IDS,
  MAX_LEVEL,
  PILL_IDS,
  REALMS,
  REBIRTH_HALL,
  SECTS,
  TALENT_NODES,
  TECH_IDS,
  TIERS,
  TRIBS,
  TYPES,
  UNITS,
  apply,
  batch,
  capArmy,
  cost,
  count,
  deputyOf,
  elderLevel,
  enemyOf,
  fight,
  gearOf,
  sideOf,
  storage,
  PROTECT,
  talentError,
  talentPoints,
  talentUsed,
  tierOpen,
  unitOf,
  winChance,
  type Action,
  type Army,
  type ElderId,
  type GearId,
  type PillId,
  type State,
  type Target,
  type UnitId,
  compact,
  isMarching,
  expAt,
  levelsAt,
  newGame,
  NPC_ELDER,
  NPC_HALL,
  NPC_RES,
  NPC_TROOPS,
  REVENGE_TIME,
  SURE_WIN,
} from './index.ts'
import {
  guardSide,
  raidChance,
  regionOf,
  scout,
  type Atlas,
  type Players,
  type World,
  type WorldAction,
} from './world.ts'

export type BotOpts = {
  casual?: boolean // người chơi thường: chỉ đánh khi giao diện báo ≥ 80% thắng
  rebirth?: boolean // tới tầng 15 và đã hạ hết bản đồ thì luân hồi
  note?: (at: number, msg: string) => void
}

// Sẵn sàng luân hồi: ngừng xuất quân, đợi các đội về (luật đòi mọi đội về hết)
export const ready = (s: State, o: BotOpts) =>
  !!o.rebirth && s.levels.chuDien >= REBIRTH_HALL && s.beast === BEASTS.length && s.sects.every(Boolean)
// Pháp bảo theo thứ tự luyện, đeo cho trưởng lão mạnh nhất trước. Đan bot luyện (Tẩy Tủy, Ngưng Thần: bot không cần)
const GEAR_PLAN: GearId[] = [
  'thienLoi',
  'hoTam',
  'huyenVu',
  'tiLoi',
  'thanhSuong',
  'kimCang',
  'xichViem',
  'ngocGian',
  'tuBao',
]
const BREWS: PillId[] = PILL_IDS.filter(p => p !== 'taiTuy' && p !== 'ngungThan').reverse()

// Mọi đệ tử đang ở nhà; trưởng lão rảnh (mạnh nhất trước)
export const homeArmy = (st: State): Army => compact(st.troops)
export const idleElders = (st: State) =>
  ELDER_IDS.filter(e => st.elders[e] !== undefined && !isMarching(st, e)).sort(
    (a, b) => elderLevel(st.elders[b]) - elderLevel(st.elders[a]),
  )

// Quà và túi đồ, như người chơi thật: nhận mọi quà sự kiện đang chờ, mở nang tài nguyên, dùng Tụ Linh Phù khi hết buff,
// kinh thư cho trưởng lão mạnh nhất, phù/đan tăng tốc cho việc còn lâu (mệnh giá lớn nhất không phí quá phần còn lại)
export function perks(start: State): State {
  let s = start
  const tryDo = (a: Action) => {
    const r = apply(s, a, s.time)
    if (r.ok) s = r.state
    return r.ok
  }
  tryDo({ type: 'login' })
  tryDo({ type: 'vipChest' })
  tryDo({ type: 'towerChest' })
  if (!s.dao) tryDo({ type: 'dao', id: 'tranTong' }) // đạo thống: Trận Tông (xây nhanh, thủ chắc)
  // Chiêu Hiền Đài: mở hết thiếp (miễn phí + trong túi), thu nhận khi đủ tín vật, nâng sao người mạnh nhất
  for (const kind of ['silver', 'gold'] as const) while (tryDo({ type: 'draw', kind, n: 1 }));
  for (const e of ELDER_IDS) tryDo({ type: 'recruit', elder: e })
  for (const e of idleElders(s)) while (tryDo({ type: 'star', elder: e }));
  for (const job of ['build', 'study', 'train', 'heal', 'forge'] as const) tryDo({ type: 'finish', job })
  for (const id of FEST_IDS) festRewards(id).forEach((_, i) => tryDo({ type: 'fest', id, i }))
  for (const id of ACH_IDS) while (tryDo({ type: 'ach', id }));
  // nang tài nguyên: để trong túi (không bị cướp), chỉ mở khi kho còn dưới phần được bảo hộ — như người chơi khéo
  for (const id of BAG_IDS) {
    const d = BAG[id]
    if (d.use !== 'res') continue
    while (s.items[id] && s.res[d.res] + d.n <= PROTECT * storage(s) && tryDo({ type: 'use', item: id, n: 1 }));
  }
  if (!s.buffs.some(b => b.src === 'phu.prod'))
    (['tuLinh24', 'tuLinh8'] as const).some(id => s.items[id] && tryDo({ type: 'use', item: id, n: 1 }))
  // Tạp Dịch Lệnh: thuê ngay khi chưa có tạp dịch thứ hai
  if (s.items.tapDich48 && (s.builder2 ?? 0) <= s.time) tryDo({ type: 'use', item: 'tapDich48', n: 1 })
  const top = idleElders(s).find(e => elderLevel(s.elders[e]) < ELDER_MAX)
  for (const id of ['kinhThu8k', 'kinhThu2k', 'kinhThu500'] as const)
    if (top && s.items[id]) tryDo({ type: 'use', item: id, n: s.items[id]!, elder: top })
  for (const job of ['build', 'study', 'train'] as const) {
    const left = () => {
      const j = jobOf(s, job)
      return j ? j.finishAt - s.time : 0
    }
    for (let guard = 0; guard < 40 && left() > 20 * 60_000; guard++) {
      const id = BAG_IDS.filter(x => {
        const d = BAG[x]
        return d.use === 'speed' && (!d.job || d.job === job) && s.items[x] && d.min * 60_000 <= left()
      }).sort((a, b) => speedOf(b) - speedOf(a))[0]
      if (!id || !tryDo({ type: 'use', item: id, n: 1, job })) break
    }
  }
  const left = () => (s.queue[0] ? s.queue[0].finishAt - s.time : 0)
  if (s.items.daiTuKhi && left() > 3 * 3_600_000) tryDo({ type: 'speed', job: 'build', n: 1, pill: 'daiTuKhi' })
  if (s.items.tuKhi && left() > 20 * 60_000) tryDo({ type: 'speed', job: 'build', n: 1 })
  return s
}
const speedOf = (id: (typeof BAG_IDS)[number]) => {
  const d = BAG[id]
  return d.use === 'speed' ? d.min : 0
}

export function turn(start: State, o: BotOpts = {}): State {
  let s = start
  const casual = !!o.casual
  const note = (msg: string) => o.note?.(s.time, msg)
  const tryDo = (a: Action) => {
    const r = apply(s, a, s.time)
    if (r.ok) s = r.state
    return r.ok
  }
  // Bot giỏi biết trước kết quả thật; người chơi thường chỉ thấy tỉ lệ thắng ước lượng trên giao diện
  const wins = (st: State, e: ElderId, army: Army, t: Target | 'trib', pill = false) =>
    casual
      ? winChance(st, e, army, t, pill) >= SURE_WIN
      : t === 'trib'
        ? true
        : fight(sideOf(st, e, army, deputyOf(st, e)), enemyOf(st, t), st.seed).win
  const sumType = (t: string) =>
    UNITS.filter(u => unitOf(u).type === t).reduce((sum, u) => sum + s.troops[u] * unitOf(u).tier, 0)
  tryDo({ type: 'collect' }) // vào núi: chạm thu sản lượng trước

  function build() {
    const hall = s.levels.chuDien
    // Như chuỗi nhiệm vụ dạy: có đủ 3 công trình tài nguyên (tầng 2) rồi mới dồn Chủ điện
    for (const id of ['tuLinhTran', 'linhDien', 'khoangMach'] as const)
      if (s.levels[id] < Math.min(hall - 1, 2) && tryDo({ type: 'upgrade', building: id })) return true
    if (tryDo({ type: 'upgrade', building: 'chuDien' })) return true
    // Kho sắp không đủ chứa chi phí Chủ điện tầng sau → nâng Tàng Bảo Các trước
    // Luyện Khí Phòng không mở gì thêm cho Chủ điện: xây sau cùng, chậm hơn các công trình khác vài tầng
    const lv = (id: (typeof IDS)[number]) => s.levels[id] + (id === 'luyenKhiPhong' ? 6 : 0)
    const want = IDS.filter(id => id !== 'chuDien').sort(
      (a, b) => lv(a) - lv(b) || cost(a, s.levels[a] + 1).linhThach - cost(b, s.levels[b] + 1).linhThach,
    )
    const need = cost('chuDien', Math.min(MAX_LEVEL, hall + 1))
    if (
      Math.max(need.linhThach, need.linhThao, need.linhKhoang) > 0.9 * storage(s) &&
      tryDo({ type: 'upgrade', building: 'tangBaoCac' })
    )
      return true
    for (const id of want) if (tryDo({ type: 'upgrade', building: id })) return true
    return false
  }

  function train() {
    if (s.train || !s.levels.dienVoTruong) return false
    const tier = [...TIERS].reverse().find(t => tierOpen(s, t))!
    // giữ ba hệ cân nhau
    const type = [...TYPES].sort((a, b) => sumType(a) - sumType(b))[0]
    const u = `${type}${tier}` as UnitId
    for (let n = batch(s); n >= 5; n = Math.floor(n / 2)) if (tryDo({ type: 'train', unit: u, n })) return true
    return false
  }

  // Pháp bảo: luyện theo thứ tự, món nào cũng lên đều; đeo cho trưởng lão cấp cao nhất đang ở nhà
  function gear() {
    let acted = false
    if (!s.forge)
      for (const g of [...GEAR_PLAN].sort((a, b) => (s.gear[a]?.lv ?? 0) - (s.gear[b]?.lv ?? 0)))
        if (tryDo({ type: 'forge', gear: g })) {
          acted = true
          break
        }
    const owned = GEAR_PLAN.filter(g => s.gear[g]?.lv)
    idleElders(s).forEach((e, i) => {
      const g = owned[i]
      if (g && gearOf(s, e) !== g && tryDo({ type: 'equip', gear: g, elder: e })) acted = true
    })
    // phó trưởng lão (từ DEPUTY_HALL): người mạnh nhì làm phó cho người mạnh nhất (xếp trên mọi trưởng lão, kể cả đang đi)
    const [main, second] = ELDER_IDS.filter(e => s.elders[e] !== undefined).sort(
      (a, b) => (s.elders[b] ?? 0) - (s.elders[a] ?? 0),
    )
    if (
      second &&
      s.levels.chuDien >= DEPUTY_HALL &&
      s.pairs?.[main] !== second &&
      tryDo({ type: 'pair', elder: main, deputy: second })
    )
      acted = true
    // thiên phú: công trước, rồi thể, rồi đạo
    for (const e of idleElders(s))
      // thiên phú: lấp Công mạch rồi Thủ mạch rồi Đạo mạch, nút tầng thấp trước (tầng trên mở dần theo điểm đã cộng)
      while (talentUsed(s, e) < talentPoints(s, e)) {
        const b = TALENT_NODES.findIndex((_, i) => !talentError(s, e, i))
        if (b < 0 || !tryDo({ type: 'talent', elder: e, node: b })) break
        acted = true
      }
    return acted
  }

  function fightAll() {
    let acted = false
    // Độ kiếp khi đủ sức (thử trên bản sao, luật tất định)
    const tr = TRIBS[s.trib]
    if (tr && s.levels.chuDien === tr.hall && count(s.troops)) {
      const e = idleElders(s)[0]
      if (e) {
        const pill = !!s.items.doKiep
        const r = apply(s, { type: 'trib', elder: e, army: homeArmy(s), pill }, s.time)
        if (casual && r.ok && wins(s, e, homeArmy(s), 'trib', pill)) {
          s = r.state // người chơi thường đánh theo ước lượng: có thể thua, phải chờ
          note(
            `${r.state.reports.at(-1)!.win ? 'ĐỘ KIẾP thành công' : 'độ kiếp THẤT BẠI'} → Chủ điện ${s.levels.chuDien} (${count(r.state.troops)} đệ tử)`,
          )
          acted = true
        } else if (!casual && r.ok && r.state.reports.at(-1)!.win) {
          s = r.state
          note(
            `ĐỘ KIẾP thành công → Chủ điện ${s.levels.chuDien} (${count(s.troops)} đệ tử, trưởng lão ${elderLevel(s.elders[e])})`,
          )
          acted = true
        }
      }
    }
    // Bí cảnh
    for (let i = 0; i < REALMS.length; i++) {
      const e = idleElders(s)[0]
      if (!e || !count(s.troops)) break
      const t: Target = { kind: 'realm', i }
      const r = apply(s, { type: 'realm', i, elder: e, army: homeArmy(s) }, s.time)
      if (r.ok && wins(s, e, homeArmy(s), t) && (casual || r.state.reports.at(-1)!.win)) {
        s = r.state
        if (r.state.reports.at(-1)!.win) note(`bí cảnh ${i + 1} tầng ${s.realms[i]}`)
        acted = true
        if (r.state.reports.at(-1)!.win) i--
      }
    }
    // Thông Thiên Tháp: leo khi chắc thắng (mỗi lượt tối đa vài tầng), như người chơi xem tỉ lệ thắng
    for (let k = 0; k < 3; k++) {
      const e = idleElders(s)[0]
      if (!e || !count(s.troops)) break
      const t: Target = { kind: 'tower', i: 0 }
      const r = apply(s, { type: 'tower', elder: e, army: homeArmy(s) }, s.time)
      if (!r.ok || !wins(s, e, homeArmy(s), t) || !(casual || r.state.reports.at(-1)!.win)) break
      s = r.state
      if (r.state.reports.at(-1)!.win) note(`tháp tầng ${s.tower}`)
      acted = true
    }
    // Xuất quân: tông môn chưa hạ trước, rồi yêu thú cấp cao nhất đánh thắng được
    for (const e of ready(s, o) ? [] : idleElders(s)) {
      if (!count(s.troops)) break
      const army = homeArmy(s)
      const targets: Target[] = [
        ...SECTS.map((_, i) => ({ kind: 'sect', i }) as Target).filter(t => !s.sects[t.i]),
        ...BEASTS.map((_, i) => ({ kind: 'beast', i }) as Target).reverse(),
      ]
      for (const t of targets) {
        if (!wins(s, e, army, t)) continue
        if (tryDo({ type: 'march', target: t, elder: e, army })) {
          acted = true
          break
        }
      }
    }
    return acted
  }

  for (let guard = 0; guard < 60; guard++) {
    let acted = false
    if (tryDo({ type: 'claim' })) acted = true
    for (let i = 0; i < 5; i++) if (tryDo({ type: 'weekly', i })) acted = true
    if (tryDo({ type: 'weeklyBonus' })) acted = true
    if (count(s.wounded) && tryDo({ type: 'heal' })) acted = true
    if (build()) acted = true
    if (!s.study)
      for (const t of [...TECH_IDS].sort((a, b) => (s.tech[a] ?? 0) - (s.tech[b] ?? 0)))
        if (tryDo({ type: 'study', tech: t })) {
          acted = true
          break
        }
    if (!s.brew)
      for (const p of BREWS)
        if (tryDo({ type: 'brew', pill: p, n: 1 })) {
          acted = true
          break
        }
    const p = perks(s)
    if (p !== s) {
      s = p
      acted = true
    }
    if (s.items.hoiXuan && count(s.wounded) >= 300 && tryDo({ type: 'cure' })) acted = true
    if (gear()) acted = true
    for (const e of ELDER_IDS)
      if (s.items.boiNguyen && s.elders[e] !== undefined && tryDo({ type: 'feed', elder: e, n: 1 })) acted = true
    if (train()) acted = true
    if (fightAll()) acted = true
    if (!acted) break
  }
  return s
}

// ---------- Phân đà NPC của giới (server gọi: mỗi NPC_EVERY một lượt) ----------

// Lúc lập: đội thủ vừa phải, không khiên tân thủ (là mục tiêu cho người chơi ngay từ đầu)
// Trưởng lão cầm đầu mỗi phân đà: một trong sáu vị đầu, theo tên (phân đà khác nhau thì đội hình khác nhau, cả ở Luận Kiếm Đài)
const npcLead = (name: string) => ELDER_IDS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 6]
export function npcState(now: number, name: string, seat: { x: number; y: number }): State {
  const s = newGame(now, name)
  const lead = npcLead(name)
  return {
    ...s,
    name,
    seat,
    levels: levelsAt(NPC_HALL),
    trib: TRIBS.filter(t => t.hall < NPC_HALL).length,
    shield: 0,
    guard: lead,
    elders: { [lead]: expAt(NPC_ELDER) },
    troops: { ...s.troops, kiem2: NPC_TROOPS, phap2: NPC_TROOPS, the2: NPC_TROOPS },
    res: { linhThach: NPC_RES, linhThao: NPC_RES, linhKhoang: NPC_RES },
  }
}
// Trưởng lão rảnh đầu tiên (theo thứ tự thu nhận)
export const firstIdle = (s: State) => (Object.keys(s.elders) as ElderId[]).find(x => !isMarching(s, x))

// Giữ linh mạch trong vùng mình: chưa đóng quân ở đâu mà vùng còn mạch trống thì đem nửa quân tới đóng — mạch còn hộ trận
// linh thú thì chỉ đánh khi chắc thắng (không lao vào chịu chết mỗi lượt)
export function npcHold(s: State, a: Atlas, w: World): WorldAction | null {
  const e = firstIdle(s)
  if (!s.seat || !e || s.marches.some(m => m.target.kind === 'spot')) return null
  const region = regionOf(a, s.seat)
  const half = Object.fromEntries(UNITS.filter(u => s.troops[u] >= 2).map(u => [u, Math.floor(s.troops[u] / 2)]))
  const army = capArmy(s, e, half) // vừa trận dung
  const ok = (i: number) => {
    const g = w.spots[i]?.tamed ? null : guardSide(a, i)
    return !g || raidChance(s, e, army, g) >= 0.7
  }
  const vein = a.points.find(
    p => p.kind === 'vein' && p.region === region && w.spots[p.i]?.own === undefined && ok(p.i),
  )
  return vein && Object.keys(army).length ? { type: 'go', i: vein.i, task: 'take', elder: e, army } : null
}

// Phản kích kẻ vừa cướp mình nếu chắc thắng. NPC không bao giờ tự khởi đầu PvP.
export function npcRevenge(s: State, ps: Players, now: number): WorldAction | null {
  const foe = [...s.foes].reverse().find(f => f.at + REVENGE_TIME > now)
  const target = foe && ps.get(foe.pid)
  const e = firstIdle(s)
  const army = e ? capArmy(s, e, homeArmy(s)) : {}
  if (!foe || !target || !e || !count(army) || raidChance(s, e, army, scout(target).side) < SURE_WIN) return null
  return { type: 'raid', pid: foe.pid, elder: e, army }
}
