<script lang="ts">
  import { onMount } from 'svelte'
  import {
    BUILDINGS, IDS, MAP_HALL, REALMS, RESOURCES, SECTS, TECH_IDS, advance, apply, newGame, questDone, questOf, storage,
    type Action, type Army, type Bag as Res, type BuildingId, type ElderId, type Report, type State, type Target,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Sheet, Toasts, type ToastItem } from './ui'
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
  import { L, TABS, isMuted, load, nowMs, num, rawSave, reportName, save, setMuted, sfx, track, watchSave, wipe, type Tab } from './lib'

  const saved = load(nowMs())
  const start = saved && advance(saved, nowMs())
  const away = saved && start ? summarize(saved, start) : null
  if (start) save(start) // mở rồi tắt ngay thì lần sau không hiện lại Xuất quan cũ
  const preview = newGame(nowMs()) // cảnh nền cho người mới ở màn tiêu đề

  let game: State | null = $state.raw(start)
  let now = $state(nowMs())
  let screen: 'title' | 'game' = $state('title')
  let tab: Tab = $state('tongMon')
  let selected: BuildingId | null = $state(null)
  let view: string | null = $state(null) // thẻ mở sẵn trong bảng công trình
  let target: Target | null = $state(null)
  let replay: Report | null = $state(null)
  let outcome: Outcome | null = $state(null) // kết quả độ kiếp / luân hồi
  let storm = $state<number | null>(null) // đang độ kiếp: tầng Chủ điện trước khi đột phá (giấu kết quả tới khi sét đánh xong)
  let reportsOpen = $state(false)
  let settingsOpen = $state(false)
  let dailyOpen = $state(false)
  let bursts: { id: BuildingId; level: number; t: number }[] = $state([])
  let gain: { bag: Partial<Res>; t: number } | null = $state(null)
  let toasts: ToastItem[] = $state([])
  let awayOpen = $state(false)
  let muted = $state(isMuted())
  let world = $state<HTMLDivElement>()

  // Mũi tên chỉ đường: công trình của nhiệm vụ, khi tạp dịch rảnh và chưa mở bảng
  const guide = $derived.by(() => {
    const q = game && questOf(game)
    if (!game || selected || game.queue.length || q?.k !== 'build' || questDone(game)) return null
    return q.id as BuildingId
  })

  // Chủ điện lên tầng n: báo những gì vừa mở (UX.md mục 4 — mở dần theo tầng)
  function unlocks(n: number) {
    const opened = [
      ...IDS.filter(id => id !== 'chuDien' && BUILDINGS[id].unlock === n).map(id => L.b[id].name),
      ...TABS.filter(t => t.unlock === n).map(t => L.tabs[t.id]),
      ...(n === MAP_HALL ? [L.map.title] : []),
      ...SECTS.flatMap((d, i) => (d.hall === n ? [L.sects[i].name] : [])),
      ...REALMS.flatMap((d, i) => (d.hall === n ? [L.realms[i].name] : [])),
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

  // So state trước/sau để mừng việc vừa xong — dù xong theo giờ hay nhờ Tụ Khí Đan.
  // reports: báo chiến báo mới (trận ở bí cảnh/độ kiếp người chơi đang xem tận mắt thì không cần)
  function notice(prev: State, next: State, reports: boolean) {
    for (const id of IDS) {
      if (next.levels[id] > prev.levels[id]) {
        bursts = [...bursts, { id, level: next.levels[id], t: nowMs() }]
        sfx('done')
        if (id === 'chuDien') {
          track('hall', { n: next.levels[id], rebirths: next.rebirths })
          unlocks(next.levels[id])
        }
      }
    }
    if (reports) for (const r of next.reports.filter(r => r.id >= prev.nextId)) toast(L.report.fresh(reportName(r), r.win), { report: r, bad: !r.win })
    if (next.stats.trained > prev.stats.trained) toast(L.away.trained(next.stats.trained - prev.stats.trained))
    if (next.stats.healed > prev.stats.healed) toast(L.away.healed(next.stats.healed - prev.stats.healed))
    if (next.stats.brewed > prev.stats.brewed) toast(L.away.brewed(next.stats.brewed - prev.stats.brewed))
    for (const t of TECH_IDS) if ((next.tech[t] ?? 0) > (prev.tech[t] ?? 0)) toast(L.away.tech(L.techs[t], next.tech[t]!))
  }

  onMount(() => {
    const tick = setInterval(() => {
      now = nowMs()
      if (!game) return
      const next = advance(game, now)
      if (next === game || next.time === game.time) return
      notice(game, next, true)
      const events = next.nextId !== game.nextId || next.stats !== game.stats || next.tech !== game.tech || next.levels !== game.levels
      game = next
      if (events) save(next)
      if (bursts.length && now - bursts[0].t > 2000) bursts = bursts.filter(b => now - b.t < 2000)
    }, 250)
    if (game) track('open', { hall: game.levels.chuDien, rebirths: game.rebirths, away: away ? Math.round(away.ms / 60_000) : 0 })
    const hide = () => document.hidden && game && save(game)
    const leave = () => game && save(game) // Safari iOS có lúc bỏ qua visibilitychange khi tắt app
    document.addEventListener('visibilitychange', hide)
    addEventListener('pagehide', leave)
    const unwatch = watchSave(s => (s ? (game = s) : location.reload()))
    if (import.meta.env.DEV)
      Object.assign((globalThis as any).rok, {
        get: () => game,
        set: (s: State) => {
          game = s
          save(s)
        },
      })
    return () => {
      clearInterval(tick)
      document.removeEventListener('visibilitychange', hide)
      removeEventListener('pagehide', leave)
      unwatch()
    }
  })

  // Vào game: cuộn tới giữa núi, rồi mở Xuất quan nếu vắng lâu
  $effect(() => {
    if (screen !== 'game' || !world) return
    if (away) awayOpen = true
  })

  // Mọi thao tác đi qua đây: áp luật, lưu, báo lỗi nếu có. quiet: độ kiếp tự diễn phần mừng sau khi sét đánh xong
  function act(a: Action, quiet = false): State | null {
    if (!game) return null
    const r = apply(game, a, nowMs())
    if (!r.ok) {
      sfx('err')
      toast(L.err[r.error], { bad: true })
      return null
    }
    if (!quiet) notice(game, r.state, false)
    game = r.state
    save(game)
    return game
  }

  function found(name: string) {
    game = newGame(nowMs(), name)
    save(game)
    screen = 'game'
    track('found')
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

  function claim() {
    const q = game && questOf(game)
    if (!q || !act({ type: 'claim' })) return
    gain = { bag: q.reward, t: nowMs() }
    sfx('reward')
  }

  function goQuest() {
    const q = game && questOf(game)
    if (!game || !q) return
    if (q.k === 'build') focus(q.id as BuildingId, 'upgrade')
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

  // Trận đánh ngay (bí cảnh, độ kiếp) người chơi xem tận mắt: không tính là chiến báo chưa đọc
  function fightNow(a: Action) {
    const fresh = !!game && game.reports.every(r => r.id <= game!.seen)
    const s = act(a, a.type === 'trib')
    return s && fresh ? (act({ type: 'seen' }) ?? s) : s
  }

  function march(t: Target, elder: ElderId, army: Army) {
    if (t.kind === 'realm') {
      const s = fightNow({ type: 'realm', i: t.i, elder, army })
      if (!s) return
      target = null
      replay = s.reports.at(-1)!
      return
    }
    if (!act({ type: 'march', target: t, elder, army })) return
    sfx('march')
    target = null
  }

  // Độ kiếp: về núi, trời tối, ba đợt sét đánh xuống Chủ điện, rồi hiện kết quả
  function trib(elder: ElderId, army: Army, pill: boolean) {
    const from = game?.levels.chuDien ?? null
    const s = fightNow({ type: 'trib', elder, army, pill })
    if (!s) return
    const r = s.reports.at(-1)!
    track('trib', { win: r.win, hall: s.levels.chuDien })
    selected = null
    tab = 'tongMon'
    requestAnimationFrame(() => world?.querySelector('[data-b="chuDien"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    storm = from
    r.fights.forEach((_, i) => setTimeout(() => sfx('thunder'), 700 + i * 1200))
    setTimeout(() => {
      storm = null
      outcome = { kind: 'trib', report: r }
      sfx(r.win ? 'win' : 'lose')
      if (r.win) {
        bursts = [...bursts, { id: 'chuDien', level: s.levels.chuDien, t: nowMs() }]
        unlocks(s.levels.chuDien)
      }
    }, 800 + r.fights.length * 1200)
  }

  function rebirth() {
    const s = act({ type: 'rebirth' })
    if (!s) return
    selected = null
    tab = 'tongMon'
    outcome = { kind: 'rebirth', n: s.rebirths }
    sfx('done')
    track('rebirth', { n: s.rebirths })
  }

  function openReports() {
    reportsOpen = true
    if (game && game.seen < game.nextId - 1) act({ type: 'seen' })
  }

  function summarize(before: State, after: State) {
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
        <p class="han crash-han">{L.gameHan}</p>
        <h2 class="t-title">{L.crash.title}</h2>
        <p class="t-lore">{L.crash.body}</p>
        <Button variant="gold" wide onclick={() => location.reload()}>{L.crash.reload}</Button>
        <Button
          variant="ghost"
          wide
          onclick={() => {
            const a = document.createElement('a')
            a.href = URL.createObjectURL(new Blob([rawSave() ?? ''], { type: 'application/json' }))
            a.download = 'son-ha-tien-tong-save.json'
            a.click()
          }}>{L.settings.export}</Button
        >
        <small class="t-tiny t-faint t-ellipsis">{String(error)}</small>
      </div>
    </Card>
  </div>
{/snippet}

<svelte:boundary failed={crashed} onerror={e => console.error(e)}>
{#if screen === 'game' && game}
  {@const shown = storm ? { ...game, levels: { ...game.levels, chuDien: storm } } : game}
  <Home bind:scroller={world} game={shown} {now} {selected} {guide} {bursts} storm={!!storm} hidden={tab !== 'tongMon'} onselect={id => select(id)} />
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
    ontab={t => {
      sfx('tap')
      tab = t
      selected = null
    }}
    onsettings={() => (settingsOpen = true)}
    ondaily={() => (dailyOpen = true)}
  />
  <Daily {game} {now} open={dailyOpen} onclose={() => (dailyOpen = false)} {act} />
  <Panel {game} {now} id={selected} {view} {act} onupgrade={upgrade} onclose={() => (selected = null)} onselect={focus} ontrib={trib} onrebirth={rebirth} />
  <TargetSheet {game} {now} {target} onclose={() => (target = null)} onmarch={march} onrecruit={() => focus('dienVoTruong', 'train')} />
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
    onload={s => {
      game = s
      save(s)
      settingsOpen = false
      toast(L.settings.imported)
    }}
    toast={t => toast(t)}
  />

  <Toasts list={toasts} top="calc({tab === 'tongMon' ? 236 : 150}px + var(--safe-t))" />

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
      <div class="mt-4"><Button variant="gold" size="lg" wide onclick={() => (awayOpen = false)}>{L.away.enter}</Button></div>
    {/if}
  </Sheet>
{:else}
  <Home game={game ?? preview} {now} still />
  <Title mode={game ? 'splash' : 'first'} onstart={found} ondone={() => (screen = 'game')} />
{/if}
</svelte:boundary>

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
  .crash-han {
    font-size: 40px;
    color: var(--cinnabar);
  }
</style>
