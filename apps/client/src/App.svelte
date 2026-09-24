<script lang="ts">
  import { flushSync, onMount } from 'svelte'
  import {
    BUILDINGS, IDS, MAP_HALL, REALMS, TOWER, RESOURCES, SECTS, TECH_IDS, MAX_LEVEL, cost, newGame, questDone, questOf, storage, storeNeed,
    type Action, type Army, type Bag as Res, type BuildingId, type ElderId, type Report, type State, type Target,
  } from '@rok/rules'
  import type { Seen } from '@rok/protocol'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Medal, Sheet, Toasts, fly, type ToastItem } from './ui'
  import Conn from './Conn.svelte'
  import Daily from './Daily.svelte'
  import Disciples from './Disciples.svelte'
  import Hud from './Hud.svelte'
  import MapView from './world/MapView.svelte'
  import Panel from './Panel.svelte'
  import Replay from './Replay.svelte'
  import Reports from './Reports.svelte'
  import Result, { type Outcome } from './Result.svelte'
  import Home from './world/Home.svelte'
  import Settings from './Settings.svelte'
  import TargetSheet from './Target.svelte'
  import Title from './Title.svelte'
  import Vault from './Vault.svelte'
  import { createNet, type Net, type Status } from './net'
  import { DESK, L, LANG, TABS, forgetP1, isMuted, reportName, setMuted, sfx, type Tab } from './lib'

  const preview = newGame(Date.now()) // cảnh nền cho màn tiêu đề

  let net: Net | undefined
  let status: Status = $state('boot')
  let game: State | null = $state.raw(null)
  let now = $state(Date.now())
  let screen: 'title' | 'game' = $state('title')
  let entered = $state(false) // màn tiêu đề đã xong (đợi thêm welcome của server nếu mạng chậm)
  let tab: Tab = $state('tongMon')
  let selected: BuildingId | null = $state(null)
  let view: string | null = $state(null) // thẻ mở sẵn trong bảng công trình
  let target: Target | null = $state(null)
  let replay: Report | null = $state(null)
  let outcome: Outcome | null = $state(null) // kết quả độ kiếp / luân hồi
  let storm = $state<{ hall: number; strikes: number } | null>(null) // đang độ kiếp: tầng Chủ điện trước khi đột phá (giấu kết quả tới khi sét đánh xong), số đợt sét
  let busy = $state(false) // đang chờ server giải trận (bí cảnh, tháp, độ kiếp)
  let quiet = false // độ kiếp tự diễn phần mừng sau khi sét đánh xong: tạm không báo
  let reportsOpen = $state(false)
  let settingsOpen = $state(false)
  let dailyOpen = $state(false)
  let bursts: { id: BuildingId; level: number; t: number }[] = $state([])
  let gain: { bag: Partial<Res>; t: number } | null = $state(null)
  let toasts: ToastItem[] = $state([])
  let away: ReturnType<typeof summarize> = $state.raw(null)
  let seen: Seen | undefined
  let awayOpen = $state(false)
  let muted = $state(isMuted())
  let world = $state<HTMLDivElement>()

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
  function toast(text: string, opt: { bad?: boolean; report?: Report } = {}) {
    const id = ++tid
    const r = opt.report
    toasts = [...toasts.slice(-2), { id, text, bad: opt.bad, ...(r && { action: L.report.replay, onaction: () => (replay = r) }) }]
    setTimeout(() => (toasts = toasts.filter(t => t.id !== id)), r ? 6000 : 2600)
  }

  // So state trước/sau để mừng việc vừa xong — dù xong theo giờ, nhờ Tụ Khí Đan hay do server đẩy xuống.
  // reports: báo chiến báo mới (trận ở bí cảnh/độ kiếp người chơi đang xem tận mắt thì không cần)
  function notice(prev: State, next: State, reports: boolean) {
    for (const id of IDS) {
      if (next.levels[id] > prev.levels[id]) {
        bursts = [...bursts, { id, level: next.levels[id], t: now }]
        if (!document.hidden) sfx('done') // tab ẩn (tab khác cùng người chơi đang bấm) thì im
        if (id === 'chuDien') unlocks(next.levels[id])
      }
    }
    if (reports) for (const r of next.reports.filter(r => r.id >= prev.nextId)) toast(L.report.fresh(reportName(r), r.win), { report: r, bad: !r.win })
    if (next.stats.trained > prev.stats.trained) toast(L.away.trained(next.stats.trained - prev.stats.trained))
    if (next.stats.healed > prev.stats.healed) toast(L.away.healed(next.stats.healed - prev.stats.healed))
    if (next.stats.brewed > prev.stats.brewed) toast(L.away.brewed(next.stats.brewed - prev.stats.brewed))
    for (const t of TECH_IDS) if ((next.tech[t] ?? 0) > (prev.tech[t] ?? 0)) toast(L.away.tech(L.techs[t], next.tech[t]!))
  }

  onMount(() => {
    const n = createNet(
      {
        state(prev, next, why) {
          if (why === 'first' && seen) away = summarize(seen, next)
          if (prev && screen === 'game' && why !== 'first' && !quiet) notice(prev, next, why !== 'mine')
          game = next
        },
        status: s => (status = s),
        welcome: w => (seen = w.seen),
        reports: () => {},
        error(code) {
          sfx('err')
          toast((L.err as Record<string, string>)[code] ?? L.err.unavailable, { bad: true })
        },
      },
      LANG,
    )
    net = n
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
      if (!t || !game || screen !== 'game' || e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as Element).closest?.('input, textarea, select') || document.querySelector('dialog:modal')) return
      if (game.levels.chuDien >= t.unlock && t.id !== tab) switchTab(t.id, new MouseEvent('click', { clientX: innerWidth / 2, clientY: innerHeight / 2 }))
    }
    addEventListener('keydown', keys)
    // Bản dev (server bật ALLOW_WARP): rok.warp(60) tua giới 60 phút, rok.get() / rok.set(state)
    if (import.meta.env.DEV)
      Object.assign(globalThis, {
        rok: { get: () => game, warp: (min: number) => n.dev('warp', { min }), set: (s: State) => n.dev('state', { state: s }) },
      })
    return () => {
      clearInterval(tick)
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
  function act(a: Action): State | null {
    return net?.act(a) ?? null
  }

  // null: đã lập xong (đang nối tới server); chuỗi: mã lỗi để màn đặt tên báo
  async function found(name: string) {
    return net ? net.found(name) : 'offline'
  }

  function select(id: BuildingId, v: string | null = null) {
    sfx('tap')
    view = v
    selected = id
  }

  // Từ HUD, nhiệm vụ, trang khác: về núi, cuộn tới công trình rồi mở bảng
  function focus(id: BuildingId, v: string | null = null) {
    tab = 'tongMon'
    target = null
    requestAnimationFrame(() => world?.querySelector(`[data-b="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
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
    if (!document.startViewTransition || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return go()
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

  // Trận đánh ngay (bí cảnh, tháp, độ kiếp): server giải bằng mầm bí mật, client chờ kết quả rồi diễn.
  // Người chơi xem tận mắt nên không tính là chiến báo chưa đọc.
  async function fightNow(a: Action) {
    if (!net || busy) return null
    const fresh = !!game && game.reports.every(r => r.id <= game!.seen)
    busy = true
    quiet = a.type === 'trib'
    const r = await net.send(a)
    quiet = false
    busy = false
    const rep = r.ok ? (r.rep?.at(-1) ?? null) : null
    if (rep && fresh) act({ type: 'seen' })
    return rep
  }

  async function march(t: Target, elder: ElderId, army: Army) {
    // bí cảnh, tháp: đánh ngay tại chỗ, xem trận luôn
    if (t.kind === 'realm' || t.kind === 'tower') {
      const rep = await fightNow(t.kind === 'tower' ? { type: 'tower', elder, army } : { type: 'realm', i: t.i, elder, army })
      if (!rep) return
      target = null
      replay = rep
      return
    }
    if (!act({ type: 'march', target: t, elder, army })) return
    sfx('march')
    target = null
  }

  // Độ kiếp: về núi, trời tối, ba đợt sét đánh xuống Chủ điện, rồi hiện kết quả
  async function trib(elder: ElderId, army: Army, pill: boolean) {
    const from = game?.levels.chuDien ?? null
    storm = from === null ? null : { hall: from, strikes: 0 } // giấu tầng mới ngay khi server trả kết quả
    const r = await fightNow({ type: 'trib', elder, army, pill })
    if (!r || !game) {
      storm = null
      return
    }
    const hall = game.levels.chuDien
    selected = null
    tab = 'tongMon'
    requestAnimationFrame(() => world?.querySelector('[data-b="chuDien"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    storm = from === null ? null : { hall: from, strikes: r.fights.length }
    r.fights.forEach((_, i) => setTimeout(() => sfx('thunder'), 700 + i * 1200))
    setTimeout(() => {
      storm = null
      outcome = { kind: 'trib', report: r }
      sfx(r.win ? 'win' : 'lose')
      if (r.win) {
        bursts = [...bursts, { id: 'chuDien', level: hall, t: now }]
        unlocks(hall)
      }
    }, 800 + r.fights.length * 1200)
  }

  async function rebirth() {
    if (!net || busy) return
    busy = true
    const r = await net.send({ type: 'rebirth' })
    busy = false
    if (!r.ok || !game) return
    selected = null
    tab = 'tongMon'
    outcome = { kind: 'rebirth', n: game.rebirths }
    sfx('done')
  }

  function openReports() {
    reportsOpen = true
    if (game && game.seen < game.nextId - 1) act({ type: 'seen' })
  }

  // Xuất quan: so lát state lúc rời game (server lưu khi kết nối cuối đóng) với state lúc quay lại
  function summarize(before: Seen, after: State) {
    const ms = after.time - before.time
    if (ms < 60_000) return null
    const d = (k: keyof State['stats']) => after.stats[k] - before.stats[k]
    return {
      ms,
      gains: RESOURCES.filter(r => after.res[r] > before.res[r]).map(r => ({ r, n: after.res[r] - before.res[r] })),
      done: IDS.filter(id => after.levels[id] > before.levels[id]).map(id => ({ id, level: after.levels[id] })),
      techs: TECH_IDS.filter(t => (after.tech[t] ?? 0) > (before.tech[t] ?? 0)).map(t => L.away.tech(L.techs[t], after.tech[t]!)),
      misc: [
        d('trained') && L.away.trained(d('trained')),
        d('healed') && L.away.healed(d('healed')),
        d('brewed') && L.away.brewed(d('brewed')),
        (d('won') || d('lost')) && L.away.battles(d('won'), d('lost')),
      ].filter(Boolean) as string[],
      full: RESOURCES.some(r => after.res[r] >= storage(after)),
    }
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
  <Home bind:scroller={world} game={shown} {now} {selected} {guide} {bursts} storm={storm?.strikes ?? 0} hidden={tab !== 'tongMon'} onselect={id => select(id)} />
  {#if tab === 'monHa'}
    <Disciples {game} {now} {act} onfocus={focus} />
  {:else if tab === 'banDo'}
    <MapView {game} {now} onpick={t => (target = t)} onreports={openReports} />
  {:else if tab === 'baoKho'}
    <Vault {game} {now} {act} onfocus={focus} />
  {/if}
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
    onfocus={focus}
  />
  <Daily {game} {now} open={dailyOpen} onclose={() => (dailyOpen = false)} {act} />
  <Panel {game} {now} id={selected} {view} {act} {busy} onupgrade={upgrade} onclose={() => (selected = null)} onselect={focus} ontrib={trib} onrebirth={rebirth} />
  <TargetSheet {game} {now} {target} {busy} onclose={() => (target = null)} onmarch={march} onrecruit={() => focus('dienVoTruong', 'train')} />
  <Reports {game} open={reportsOpen} onclose={() => (reportsOpen = false)} onopen={r => (replay = r)} />
  <Replay report={replay} onclose={() => (replay = null)} />
  <Result {outcome} {game} onclose={() => (outcome = null)} onreplay={r => (replay = r)} />
  <Settings
    {game}
    open={settingsOpen}
    {muted}
    onclose={() => (settingsOpen = false)}
    onmute={() => {
      muted = !muted
      setMuted(muted)
    }}
    toast={t => toast(t)}
  />

  <Toasts list={toasts} top={DESK?.matches ? 'calc(var(--top) + 16px)' : `calc(${tab === 'tongMon' ? 236 : 150}px + var(--safe-t))`} />

  <Sheet open={awayOpen && !!away} onclose={() => (awayOpen = false)} center title={L.away.title} sub={away ? L.away.for(L.ago(away.ms)) : ''}>
    {#if away}
      {#if away.gains.length}
        <p class="t-small t-strong t-soft mt-2">{L.away.got}</p>
        <Bag res={Object.fromEntries(away.gains.map(g => [g.r, g.n]))} />
      {/if}
      {#if away.done.length || away.techs.length || away.misc.length}
        <p class="t-small t-strong t-soft mt-3">{L.away.done}</p>
        <ul class="stack mt-2" style:--gap="4px">
          {#each away.done as d (d.id)}<li class="row t-good"><Icon name="check" size={16} /><span class="t-strong">{L.b[d.id].name} · {L.level(d.level)}</span></li>{/each}
          {#each [...away.techs, ...away.misc] as m (m)}<li class="row t-good"><Icon name="check" size={16} /><span class="t-strong">{m}</span></li>{/each}
        </ul>
      {/if}
      {#if away.full}<p class="t-small t-bad mt-3">{L.away.full}</p>{/if}
      <div class="mt-4">
        <Button
          variant="gold"
          size="lg"
          wide
          onclick={e => {
            const from = e.currentTarget as Element
            const bag = Object.fromEntries((away?.gains ?? []).map(g => [g.r, g.n]))
            awayOpen = false
            requestAnimationFrame(() => fly(from, bag, document.body)) // bay sau khi hộp thoại đóng
          }}>{L.away.enter}</Button
        >
      </div>
    {/if}
  </Sheet>
{:else}
  <Home game={game ?? preview} {now} still />
  {#if status !== 'boot'}
    <Title mode={status === 'nosect' ? 'first' : 'splash'} wait={entered && !game} onstart={found} ondone={() => (entered = true)} />
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
