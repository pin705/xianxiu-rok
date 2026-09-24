<script lang="ts">
  import { mailText } from '@rok/i18n'
  import { flushSync, onMount } from 'svelte'
  import {
    BUILDINGS,
    IDS,
    MAP_HALL,
    REALMS,
    TOWER,
    TRIBS,
    SECTS,
    TECH_IDS,
    MAX_LEVEL,
    cost,
    jobOf,
    newGame,
    questDone,
    questOf,
    storeNeed,
    type Action,
    type Army,
    type Bag as Res,
    type BuildingId,
    type ElderId,
    type Report,
    type State,
    type Target,
  } from '@rok/rules'
  import type { MapSnap, Seen, WorldInfo } from '@rok/protocol'
  import { Button, Card, Medal, Toasts, fly, type ToastItem } from './ui'
  import Conn from './Conn.svelte'
  import Daily from './Daily.svelte'
  import Disciples from './Disciples.svelte'
  import Hud from './Hud.svelte'
  import MapTab from './world/MapTab.svelte'
  import Alliance from './Alliance.svelte'
  import Chat from './Chat.svelte'
  import Panel from './Panel.svelte'
  import Ranks from './Ranks.svelte'
  import Rivals from './Rivals.svelte'
  import Replay from './Replay.svelte'
  import Reports from './Reports.svelte'
  import Result, { type Outcome } from './Result.svelte'
  import Home from './world/Home.svelte'
  import Settings from './Settings.svelte'
  import TargetSheet from './Target.svelte'
  import Title from './Title.svelte'
  import Vault from './Vault.svelte'
  import AwaySummary from './AwaySummary.svelte'
  import { summarize, type Away } from './away'
  import { createNet, type Net, type Status } from './net'
  import { provideGame } from './game'
  import { setMood } from './music'
  import type { AllyInfo, AllyRow, WorldAction } from '@rok/rules/world'
  import {
    DESK,
    L,
    LANG,
    TABS,
    forgetP1,
    isMuted,
    defended,
    keyBlocked,
    read,
    reportName,
    setMuted,
    sfx,
    write,
    type Sfx,
    type Tab,
    type PanelTab,
  } from './lib'

  const preview = newGame(Date.now()) // cảnh nền cho màn tiêu đề

  let net = $state.raw<Net>()
  let status: Status = $state('boot')
  let game: State | null = $state.raw(null)
  let now = $state(Date.now())
  let screen: 'title' | 'game' = $state('title')
  let entered = $state(false) // màn tiêu đề đã xong (đợi thêm welcome của server nếu mạng chậm)
  let tab: Tab = $state('tongMon')
  let selected: BuildingId | null = $state(null)
  let view: PanelTab | null = $state(null) // thẻ mở sẵn trong bảng công trình
  let target: Target | null = $state(null)
  let replay: Report | null = $state(null)
  let outcome: Outcome | null = $state(null) // kết quả độ kiếp / luân hồi
  let storm = $state<{ hall: number; strikes: number } | null>(null) // đang độ kiếp: tầng Chủ điện trước khi đột phá (giấu kết quả tới khi sét đánh xong), số đợt sét
  let busy = $state(false) // đang chờ server giải trận (bí cảnh, tháp, độ kiếp)
  let quiet = false // độ kiếp tự diễn phần mừng sau khi sét đánh xong: tạm không báo
  let reportsOpen = $state(false)
  let settingsOpen = $state(false)
  let dailyOpen = $state(false)
  let rivalsOpen = $state(false)
  let rivalsFocus = $state<number | null>(null)
  let info = $state<WorldInfo | null>(null) // giới đang ở: seed bản đồ, lúc mở (pha mùa)
  let ally = $state.raw<AllyInfo | null>(null) // tiên minh của mình
  let allyRows = $state.raw<AllyRow[] | null>(null) // các minh trong giới (khi chưa vào minh)
  let ranksOpen = $state(false)
  let me = $state<number | null>(null) // mã tông môn của mình (tô đậm trên bảng xếp hạng)
  // nhạc theo cảnh: xem trận / độ kiếp là trống trận, bản đồ là sáo trúc lên đường
  $effect(() => setMood(replay || storm ? 'battle' : tab === 'banDo' ? 'map' : 'home'))
  let bursts: { id: BuildingId; level: number; t: number }[] = $state([])
  let gain: { bag: Partial<Res>; t: number } | null = $state(null)
  let toasts: ToastItem[] = $state([])
  let away: Away | null = $state.raw(null)
  let seen: Seen | undefined
  let awayOpen = $state(false)
  let muted = $state(isMuted())
  let world = $state<HTMLDivElement>()
  // Mọi màn trong game đọc state / giờ / thao tác từ đây (game.ts) — chỉ dùng khi đã vào game (game khác null)
  provideGame({
    get game() {
      return game!
    },
    get now() {
      return now
    },
    get busy() {
      return busy
    },
    act,
  })

  // Mũi tên chỉ đường: công trình của nhiệm vụ, khi tạp dịch rảnh và chưa mở bảng
  const guide = $derived.by(() => {
    const q = game && questOf(game)
    if (!game || selected || game.queue.length || q?.k !== 'build' || questDone(game)) return null
    return questBuilding(game, q.id as BuildingId)
  })
  // Công trình nhiệm vụ cần xây — trừ khi kho không đủ chỗ cho chi phí: khi đó phải nâng Tàng Bảo Các trước
  const questBuilding = (s: State, id: BuildingId) =>
    storeNeed(s, cost(id, Math.min(s.levels[id] + 1, MAX_LEVEL))) ? 'tangBaoCac' : id

  // Chủ điện lên tầng n: báo những gì vừa mở (UX.md mục 4 — mở dần theo tầng)
  function unlocks(n: number) {
    const opened = [
      ...IDS.filter(id => id !== 'chuDien' && BUILDINGS[id].unlock === n).map(id => L.b[id].name),
      ...TABS.filter(t => t.unlock === n).map(t => L.tabs[t.id]),
      ...(n === MAP_HALL ? [L.map.title] : []),
      ...SECTS.flatMap((d, i) => (d.hall === n ? [L.sects[i].name] : [])),
      ...REALMS.flatMap((d, i) => (d.hall === n ? [L.realms[i].name] : [])),
      ...(n === TOWER.hall ? [L.tower.name] : []),
    ]
    if (opened.length) toast(L.unlocked([...new Set(opened)].join(', ')))
  }

  let tid = 0
  function toast(text: string, opt: { bad?: boolean; report?: Report; act?: [string, () => void] } = {}) {
    const id = ++tid
    const r = opt.report
    const btn = opt.act ?? (r && [L.report.replay, () => (replay = r)])
    toasts = [...toasts.slice(-2), { id, text, bad: opt.bad, ...(btn && { action: btn[0], onaction: btn[1] }) }]
    setTimeout(() => (toasts = toasts.filter(t => t.id !== id)), btn ? 6000 : 2600)
  }

  // Hỏi bật thông báo đúng lúc: vừa giao một việc dài (≥ 30 phút) mà trình duyệt chưa được hỏi — mỗi máy một lần.
  // Quyền chỉ xin được khi người chơi bấm, nên hỏi bằng toast có nút "Bật" chứ không bật hộp thoại của trình duyệt ngay.
  let pushKey: string | null = null
  function askPush(prev: State, next: State) {
    if (!pushKey || typeof Notification === 'undefined' || Notification.permission !== 'default' || read('rok.push'))
      return
    const long = (k: 'build' | 'train' | 'study' | 'forge') => {
      const j = jobOf(next, k)
      return !!j && j !== jobOf(prev, k) && j.finishAt - next.time >= 30 * 60_000
    }
    if (!(['build', 'train', 'study', 'forge'] as const).some(long)) return
    write('rok.push', '1')
    const key = pushKey
    toast(L.push.ask, {
      act: [
        L.push.on,
        () => void net?.account.push(key).then(r => r === 'denied' && toast(L.push.denied, { bad: true })),
      ],
    })
  }

  // So state trước/sau để mừng việc vừa xong — dù xong theo giờ, nhờ Tụ Khí Đan hay do server đẩy xuống.
  // reports: báo chiến báo mới (trận ở bí cảnh/độ kiếp người chơi đang xem tận mắt thì không cần)
  function notice(prev: State, next: State, reports: boolean) {
    // kiếp vân (độ kiếp công khai) vừa giáng: đang ở núi thì diễn sét như độ kiếp tại chỗ, không thì chỉ báo
    const tr =
      reports && tab === 'tongMon' && !document.hidden && !storm
        ? next.reports.find(r => r.kind === 'trib' && r.id >= prev.nextId)
        : undefined
    if (tr) {
      strike(tr, prev.levels.chuDien)
      if (prev.reports.every(r => r.id <= prev.seen)) setTimeout(() => act({ type: 'seen' }))
      prev = { ...prev, levels: { ...prev.levels, chuDien: next.levels.chuDien } }
    }
    for (const id of IDS) {
      if (next.levels[id] > prev.levels[id]) {
        bursts = [...bursts, { id, level: next.levels[id], t: now }]
        if (!document.hidden) sfx('done') // tab ẩn (tab khác cùng người chơi đang bấm) thì im
        if (id === 'chuDien') unlocks(next.levels[id])
      }
    }
    if (reports)
      for (const r of next.reports.filter(r => r.id >= prev.nextId && r !== tr))
        toast(r.def ? defended(r) : L.report.fresh(reportName(r), r.win), { report: r, bad: !r.win })
    const newest = next.mail.at(-1)
    if (newest && newest.id >= prev.nextId) toast(`${L.mail.title}: ${mailText(L, newest)[0]}`)
    if (next.stats.trained > prev.stats.trained) toast(L.away.trained(next.stats.trained - prev.stats.trained))
    if (next.stats.healed > prev.stats.healed) toast(L.away.healed(next.stats.healed - prev.stats.healed))
    if (next.stats.brewed > prev.stats.brewed) toast(L.away.brewed(next.stats.brewed - prev.stats.brewed))
    for (const t of TECH_IDS)
      if ((next.tech[t] ?? 0) > (prev.tech[t] ?? 0)) toast(L.away.tech(L.techs[t], next.tech[t]!))
  }

  onMount(() => {
    const n = createNet(
      {
        state(prev, next, why) {
          if (why === 'first' && seen) away = summarize(seen, next)
          if (prev && screen === 'game' && why !== 'first' && !quiet) notice(prev, next, why !== 'mine')
          if (prev && why === 'mine') askPush(prev, next)
          game = next
        },
        status: s => (status = s),
        welcome: w => {
          seen = w.seen
          me = w.me.pid
          info = w.world
          void loadAlly()
          void n.account.info().then(r => {
            if (r.ok) pushKey = r.data.push
          })
        },
        error(code) {
          sfx('err')
          toast((L.err as Record<string, string>)[code] ?? L.err.unavailable, { bad: true })
        },
      },
      LANG,
    )
    net = n
    const offAlly = n.onAlly(() => void loadAlly())
    void n.start()
    if (forgetP1()) toast(L.net.p1Gone)
    const tick = setInterval(() => {
      now = n.now()
      n.tick()
      if (bursts.length && now - bursts[0].t > 2000) bursts = bursts.filter(b => now - b.t < 2000)
    }, 250)
    // Phím 1–5: chuyển tab (không khi đang gõ chữ hay có hộp thoại modal che)
    const keys = (e: KeyboardEvent) => {
      const t = TABS[Number(e.key) - 1]
      if (!t || !game || screen !== 'game' || keyBlocked(e)) return
      if (game.levels.chuDien >= t.unlock && t.id !== tab)
        switchTab(t.id, new MouseEvent('click', { clientX: innerWidth / 2, clientY: innerHeight / 2 }))
    }
    addEventListener('keydown', keys)
    // Bản dev (server bật ALLOW_WARP): rok.warp(60) tua giới 60 phút, rok.get() / rok.set(state)
    if (import.meta.env.DEV)
      Object.assign(globalThis, {
        rok: {
          get: () => game,
          warp: (min: number) => n.dev('warp', { min }),
          set: (s: State) => n.dev('state', { state: s }),
        },
      })
    return () => {
      clearInterval(tick)
      offAlly()
      removeEventListener('keydown', keys)
      n.close()
    }
  })

  // Màn tiêu đề xong và server đã gửi state: vào game
  $effect(() => {
    if (entered && game && screen === 'title') screen = 'game'
  })

  // Bố cục desktop (cột trái, thanh trên) chỉ khi đang chơi; báo resize để cảnh WebGL đo lại khung
  $effect(() => {
    document.documentElement.classList.toggle('game', screen === 'game')
    dispatchEvent(new Event('resize'))
  })

  // Vào game: mở Xuất quan nếu vắng lâu
  $effect(() => {
    if (screen !== 'game' || !world) return
    if (away) awayOpen = true
  })

  // Mọi thao tác tất định đi qua đây: đoán trước ngay, server xác nhận sau (lỗi thì net báo và rút lại)
  function act(a: Action, sound?: Sfx): State | null {
    const s = net?.act(a) ?? null
    if (s && sound) sfx(sound)
    return s
  }

  // null: đã lập xong (đang nối tới server); chuỗi: mã lỗi để màn đặt tên báo
  async function found(name: string) {
    return net ? net.found(name) : 'offline'
  }

  function select(id: BuildingId, v: PanelTab | null = null) {
    sfx('tap')
    view = v
    selected = id
  }

  // Từ HUD, nhiệm vụ, trang khác: về núi, cuộn tới công trình rồi mở bảng
  function focus(id: BuildingId, v: PanelTab | null = null) {
    tab = 'tongMon'
    target = null
    requestAnimationFrame(() =>
      world?.querySelector(`[data-b="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    )
    select(id, v)
  }

  // Chuyển tab: vết mực loang ra từ chỗ chạm (trình duyệt không hỗ trợ View Transitions thì chuyển ngay)
  function switchTab(t: Tab, e: MouseEvent) {
    sfx('tap')
    const go = () => {
      tab = t
      selected = null
    }
    // trang đang ẩn thì trình duyệt bỏ qua hiệu ứng (ready bị từ chối): chuyển thẳng
    if (!document.startViewTransition || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return go()
    const root = document.documentElement.style
    root.setProperty('--vt-x', `${e.clientX}px`)
    root.setProperty('--vt-y', `${e.clientY}px`)
    document.startViewTransition(() => flushSync(go)).ready.catch(() => {})
  }

  function openTarget(t: Target) {
    selected = null
    tab = 'banDo'
    target = t
  }

  function upgrade(id: BuildingId) {
    if (!act({ type: 'upgrade', building: id })) return
    sfx('build')
    selected = null
  }

  function claim(e: MouseEvent) {
    const q = game && questOf(game)
    if (!q || !act({ type: 'claim' })) return
    gain = { bag: q.reward, t: now }
    fly(e.currentTarget as Element, { ...q.reward, ...q.items })
    sfx('reward')
  }

  function goQuest() {
    const q = game && questOf(game)
    if (!game || !q) return
    if (q.k === 'build') focus(questBuilding(game, q.id as BuildingId), 'upgrade')
    if (q.k === 'train') focus('dienVoTruong', 'train')
    if (q.k === 'tech') focus('tangKinhCac', 'library')
    if (q.k === 'brew') focus('danPhong', 'alchemy')
    if (q.k === 'hunt') openTarget({ kind: 'beast', i: Math.min(game.beast, q.n - 1) })
    if (q.k === 'sect') openTarget({ kind: 'sect', i: Number(q.id) })
    if (q.k === 'realm') openTarget({ kind: 'realm', i: Number(q.id) })
  }

  function builder() {
    if (!game) return
    const job = game.queue[0]
    focus(job?.building ?? guide ?? 'chuDien', 'upgrade')
  }

  // Chờ server (trận đánh ngay, thao tác giới): một việc mỗi lúc; busy tắt lại cả khi mạng lỗi
  async function waiting<T>(run: (n: Net) => Promise<T>): Promise<T | null> {
    if (!net || busy) return null
    busy = true
    try {
      return await run(net)
    } finally {
      busy = false
    }
  }

  // Trận đánh ngay (bí cảnh, tháp, độ kiếp): server giải bằng mầm bí mật, client chờ kết quả rồi diễn.
  // Người chơi xem tận mắt nên không tính là chiến báo chưa đọc.
  async function fightNow(a: Action) {
    if (!net || busy) return null
    const fresh = !!game && game.reports.every(r => r.id <= game!.seen)
    quiet = a.type === 'trib'
    let r
    try {
      r = await waiting(n => n.send(a))
    } finally {
      quiet = false
    }
    const rep = r?.ok ? (r.rep?.at(-1) ?? null) : null
    if (rep && fresh) act({ type: 'seen' })
    return rep
  }

  async function march(t: Target, elder: ElderId, army: Army) {
    // bí cảnh, tháp: đánh ngay tại chỗ, xem trận luôn
    if (t.kind === 'realm' || t.kind === 'tower') {
      const rep = await fightNow(
        t.kind === 'tower' ? { type: 'tower', elder, army } : { type: 'realm', i: t.i, elder, army },
      )
      if (!rep) return
      target = null
      replay = rep
      return
    }
    if (!act({ type: 'march', target: t, elder, army })) return
    sfx('march')
    target = null
  }

  // Độ kiếp: về núi, trời tối, ba đợt sét đánh xuống Chủ điện, rồi hiện kết quả.
  // Có chỗ trên bản đồ giới: kiếp vân tụ trước cho cả giới thấy, server giải lúc giáng — sét diễn khi kết quả về (notice)
  async function trib(elder: ElderId, army: Army, pill: boolean) {
    if (game?.seat) {
      const r = await waiting(n => n.send({ type: 'trib', elder, army, pill }))
      if (!r?.ok) return
      selected = null
      tab = 'tongMon'
      sfx('thunder')
      toast(L.trib.started)
      return
    }
    const from = game?.levels.chuDien ?? null
    storm = from === null ? null : { hall: from, strikes: 0 } // giấu tầng mới ngay khi server trả kết quả
    const r = await fightNow({ type: 'trib', elder, army, pill })
    if (!r || from === null) {
      storm = null
      return
    }
    strike(r, from)
  }
  function strike(r: Report, from: number) {
    const hall = TRIBS[r.i].hall + 1
    selected = null
    tab = 'tongMon'
    requestAnimationFrame(() =>
      world?.querySelector('[data-b="chuDien"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    )
    storm = { hall: from, strikes: r.fights.length }
    r.fights.forEach((_, i) => setTimeout(() => sfx('thunder'), 700 + i * 1200))
    setTimeout(
      () => {
        storm = null
        outcome = { kind: 'trib', report: r }
        sfx(r.win ? 'win' : 'lose')
        if (r.win) {
          bursts = [...bursts, { id: 'chuDien', level: hall, t: now }]
          unlocks(hall)
        }
      },
      800 + r.fights.length * 1200,
    )
  }

  // Đi cướp: luật giới (server kiểm cả hai bên) nên không đoán trước — chờ server
  async function raid(pid: number, elder: ElderId, army: Army) {
    const r = await waiting(n => n.send({ type: 'raid', pid, elder, army }))
    if (!r?.ok) return
    sfx('march')
    rivalsOpen = false
  }

  // Tiên minh: của mình (server báo khi đổi), hoặc danh sách để vào
  async function loadAlly() {
    if (!net) return
    ally = await net.ask({ k: 'ally' })
    allyRows = ally ? null : ((await net.ask({ k: 'allies' })) ?? [])
  }
  // Thao tác tiên minh: chờ server (luật giới), rồi tải lại minh
  async function sendWorld(a: WorldAction) {
    if (!net) return { ok: false as const, err: 'unavailable' as const }
    const r = await net.send(a)
    if (r.ok) void loadAlly()
    return r
  }

  // Tranh đoạt: danh sách đối thủ, hoặc thẳng một tông môn (chạm trên bản đồ giới)
  function openRivals(pid: number | null = null) {
    rivalsFocus = pid
    rivalsOpen = true
  }
  // Bản đồ giới: đăng ký nhận ảnh chụp (server đẩy khi đổi) — trả hàm huỷ
  const watchMap = (on: (m: MapSnap) => void) => net?.watchMap(on) ?? (() => {})

  async function rebirth() {
    const r = await waiting(n => n.send({ type: 'rebirth' }))
    if (!r?.ok || !game) return
    selected = null
    tab = 'tongMon'
    outcome = { kind: 'rebirth', n: game.rebirths }
    sfx('done')
  }

  function openReports() {
    reportsOpen = true
    if (game && game.seen < game.nextId - 1) act({ type: 'seen' })
  }
</script>

{#snippet crashed(error: unknown)}
  <div class="crash" role="alert">
    <Card>
      <div class="stack center" style:--gap="var(--sp-3)">
        <Medal emblem="crest" tone="red" size={72} />
        <h2 class="t-title">{L.crash.title}</h2>
        <p class="t-lore">{L.crash.body}</p>
        <Button variant="gold" wide onclick={() => location.reload()}>{L.crash.reload}</Button>
        <small class="t-tiny t-faint t-ellipsis">{String(error)}</small>
      </div>
    </Card>
  </div>
{/snippet}

<svelte:boundary failed={crashed} onerror={e => console.error(e)}>
  {#if screen === 'game' && game}
    {@const shown = storm ? { ...game, levels: { ...game.levels, chuDien: storm.hall } } : game}
    <Home
      bind:scroller={world}
      game={shown}
      {now}
      {selected}
      {guide}
      {bursts}
      storm={storm?.strikes ?? 0}
      hidden={tab !== 'tongMon'}
      onselect={id => select(id)}
    />
    {#if tab === 'monHa'}
      <Disciples onfocus={focus} />
    {:else if tab === 'banDo'}
      <MapTab
        {info}
        {me}
        allies={ally ? ally.people.map(p => p.pid) : []}
        {ally}
        watch={watchMap}
        onpick={t => (target = t)}
        onreports={openReports}
        onrivals={() => openRivals()}
        onraid={pid => openRivals(pid)}
        send={sendWorld}
      />
    {:else if tab === 'baoKho'}
      <Vault onfocus={focus} />
    {:else if tab === 'tienMinh'}
      <Alliance {me} {ally} rows={allyRows} send={sendWorld}>
        {#snippet chat()}<Chat {me} ally api={net ?? null} toast={t => toast(t)} inline />{/snippet}
      </Alliance>
    {/if}
    {#if tab === 'banDo'}<Chat {me} ally={!!ally} api={net ?? null} toast={t => toast(t)} />{/if}
    <Hud
      game={shown}
      {now}
      {tab}
      storm={!!storm}
      {gain}
      onclaim={claim}
      onquest={goQuest}
      onbuilder={builder}
      ontab={switchTab}
      onsettings={() => (settingsOpen = true)}
      ondaily={() => (dailyOpen = true)}
      onranks={() => (ranksOpen = true)}
      onmail={openReports}
      onfocus={focus}
    />
    <Daily open={dailyOpen} onclose={() => (dailyOpen = false)} />
    <Panel
      id={selected}
      {view}
      onupgrade={upgrade}
      onclose={() => (selected = null)}
      onselect={focus}
      ontrib={trib}
      onrebirth={rebirth}
    />
    <TargetSheet
      {target}
      onclose={() => (target = null)}
      onmarch={march}
      onrecruit={() => focus('dienVoTruong', 'train')}
    />
    <Reports open={reportsOpen} onclose={() => (reportsOpen = false)} onopen={r => (replay = r)} />
    <Replay
      report={replay}
      onclose={() => (replay = null)}
      onrevenge={() => {
        replay = null
        reportsOpen = false
        rivalsOpen = true
      }}
      {now}
    />
    <Rivals
      open={rivalsOpen}
      focus={rivalsFocus}
      load={pid => net?.ask({ k: 'rivals', pid }) ?? Promise.resolve(null)}
      onclose={() => {
        rivalsOpen = false
        rivalsFocus = null
      }}
      onraid={raid}
      onrecruit={() => {
        rivalsOpen = false
        focus('dienVoTruong', 'train')
      }}
    />
    <Ranks
      open={ranksOpen}
      {me}
      load={b => net?.ranks(b).then(r => (r.ok ? r.data : null)) ?? Promise.resolve(null)}
      season={info ? () => net?.ask({ k: 'season' }) ?? Promise.resolve(null) : undefined}
      onclose={() => (ranksOpen = false)}
    />
    <Result {outcome} onclose={() => (outcome = null)} onreplay={r => (replay = r)} />
    <Settings
      open={settingsOpen}
      {muted}
      account={net?.account}
      onout={() => location.reload()}
      onclose={() => (settingsOpen = false)}
      onmute={() => {
        muted = !muted
        setMuted(muted)
      }}
      toast={t => toast(t)}
    />

    <Toasts
      list={toasts}
      top={DESK?.matches ? 'calc(var(--top) + 16px)' : `calc(${tab === 'tongMon' ? 236 : 150}px + var(--safe-t))`}
    />

    <AwaySummary {away} open={awayOpen} onclose={() => (awayOpen = false)} />
  {:else}
    <Home game={game ?? preview} {now} still />
    {#if status !== 'boot'}
      <Title
        mode={status === 'nosect' ? 'first' : 'splash'}
        wait={entered && !game}
        onstart={found}
        onlogin={how => (net ? net.login(how) : Promise.resolve('offline'))}
        ondone={() => (entered = true)}
      />
    {/if}
  {/if}
</svelte:boundary>
<Conn {status} onretry={() => net?.retry()} onfresh={() => (status = 'nosect')} />

<style>
  .crash {
    position: fixed;
    inset: 0;
    z-index: var(--z-toast);
    display: grid;
    place-items: center;
    max-width: var(--col);
    margin: 0 auto;
    padding: var(--sp-5);
    background: var(--lacquer);
  }
</style>
