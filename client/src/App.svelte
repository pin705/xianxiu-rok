<script lang="ts">
  import { onMount } from 'svelte'
  import {
    IDS, RESOURCES, advance, apply, newGame, questDone, questOf, storage, type Bag, type BuildingId, type State,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import Hud from './Hud.svelte'
  import Panel from './Panel.svelte'
  import Scene from './Scene.svelte'
  import Title from './Title.svelte'
  import { L, isMuted, load, num, save, setMuted, sfx } from './lib'

  const saved = load(Date.now())
  const start = saved && advance(saved, Date.now())
  const away = saved && start ? summarize(saved, start) : null
  const preview = newGame(Date.now()) // cảnh nền cho người mới ở màn tiêu đề

  let game: State | null = $state.raw(start)
  let now = $state(Date.now())
  let screen: 'title' | 'game' = $state('title')
  let selected: BuildingId | null = $state(null)
  let bursts: { id: BuildingId; level: number; t: number }[] = $state([])
  let gain: { bag: Partial<Bag>; t: number } | null = $state(null)
  let muted = $state(isMuted())
  let world = $state<HTMLDivElement>()
  let sheet = $state<HTMLDialogElement>()

  // Mũi tên chỉ đường: công trình của nhiệm vụ, khi tạp dịch rảnh và chưa mở bảng
  const guide = $derived.by(() => {
    if (!game || selected || game.queue.length || questDone(game)) return null
    return questOf(game)?.building ?? null
  })

  onMount(() => {
    const tick = setInterval(() => {
      now = Date.now()
      if (!game) return
      const next = advance(game, now)
      for (const id of IDS) {
        if (next.levels[id] > game.levels[id]) {
          bursts = [...bursts, { id, level: next.levels[id], t: now }]
          sfx('done')
        }
      }
      game = next
      if (bursts.length && now - bursts[0].t > 2000) bursts = bursts.filter(b => now - b.t < 2000)
    }, 250)
    return () => clearInterval(tick)
  })

  // Vào game: cuộn tới giữa núi, rồi mở Xuất quan nếu vắng lâu
  $effect(() => {
    if (screen !== 'game' || !world) return
    world.scrollTop = (world.scrollHeight - world.clientHeight) * 0.3
    if (away) sheet?.showModal()
  })

  function found(name: string) {
    game = newGame(Date.now(), name)
    save(game)
    screen = 'game'
  }

  function select(id: BuildingId) {
    sfx('tap')
    selected = id
  }

  // Từ HUD (nhiệm vụ, tạp dịch): cuộn tới công trình rồi mở bảng
  function focus(id: BuildingId) {
    world?.querySelector(`[data-b="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    select(id)
  }

  function upgrade(id: BuildingId) {
    if (!game) return
    const r = apply(game, { type: 'upgrade', building: id }, Date.now())
    if (!r.ok) return // bảng đã hiện lý do
    game = r.state
    save(game)
    sfx('build')
    selected = null
  }

  function claim() {
    if (!game) return
    const q = questOf(game)
    const r = apply(game, { type: 'claim' }, Date.now())
    if (!r.ok || !q) return
    game = r.state
    save(game)
    gain = { bag: q.reward, t: Date.now() }
    sfx('reward')
  }

  function builder() {
    if (!game) return
    const job = game.queue[0]
    focus(job?.building ?? guide ?? questOf(game)?.building ?? 'chuDien')
  }

  function summarize(before: State, after: State) {
    const ms = after.time - before.time
    if (ms < 60_000) return null
    return {
      ms,
      gains: RESOURCES.filter(r => after.res[r] > before.res[r]).map(r => ({ r, n: after.res[r] - before.res[r] })),
      done: IDS.filter(id => after.levels[id] > before.levels[id]).map(id => ({ id, level: after.levels[id] })),
      full: RESOURCES.some(r => after.res[r] >= storage(after)),
    }
  }
</script>

{#if screen === 'game' && game}
  <div class="world" bind:this={world}>
    <Scene {game} {now} {selected} {guide} {bursts} onselect={select} />
  </div>
  <Hud
    {game}
    {now}
    {muted}
    {gain}
    onclaim={claim}
    onquest={() => { const q = game && questOf(game); if (q) focus(q.building) }}
    onbuilder={builder}
    onmute={() => { muted = !muted; setMuted(muted) }}
  />
  <Panel {game} {now} id={selected} onupgrade={upgrade} onclose={() => (selected = null)} onselect={focus} />

  <dialog bind:this={sheet} class="away" aria-labelledby="away-title">
    {#if away}
      <h2 id="away-title">{L.away.title}</h2>
      <p>{L.away.for(L.ago(away.ms))}</p>
      {#if away.gains.length}
        <h3>{L.away.got}</h3>
        <ul>
          {#each away.gains as g (g.r)}
            <li><Icon name={g.r} size={24} /><b>+{num(g.n)}</b> {L.res[g.r]}</li>
          {/each}
        </ul>
      {/if}
      {#if away.done.length}
        <h3>{L.away.done}</h3>
        <ul>
          {#each away.done as d (d.id)}
            <li><Icon name="check" size={18} />{L.b[d.id].name} · {L.level(d.level)}</li>
          {/each}
        </ul>
      {/if}
      {#if away.full}<p class="warn">{L.away.full}</p>{/if}
      <form method="dialog"><button class="enter">{L.away.enter}</button></form>
    {/if}
  </dialog>
{:else}
  <div class="world still"><Scene game={game ?? preview} {now} still /></div>
  <Title mode={game ? 'splash' : 'first'} onstart={found} ondone={() => (screen = 'game')} />
{/if}

<style>
  .world {
    position: fixed;
    inset: 0;
    max-width: 480px;
    margin: 0 auto;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    box-shadow: 0 0 40px rgb(0 0 0 / 0.25);
  }
  .world::-webkit-scrollbar {
    display: none;
  }
  .still {
    overflow: hidden;
  }

  .away {
    width: min(100% - 32px, 400px);
    margin: auto; /* app.css reset margin về 0 cho mọi thẻ, phải trả lại để dialog căn giữa */
    padding: 24px 20px 20px;
    color: #f6f1e4;
    background: linear-gradient(#1a2c36, #0f1d25);
    border: 1px solid var(--gold);
    border-radius: 18px;
    box-shadow: 0 20px 50px rgb(0 0 0 / 0.5);
  }
  .away[open] {
    animation: pop 0.35s cubic-bezier(0.3, 1.4, 0.5, 1);
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.85);
    }
  }
  .away::backdrop {
    background: rgb(8 16 22 / 0.55);
  }
  .away h2 {
    font: 30px/1.1 var(--font);
    font-weight: 600;
    text-align: center;
    color: var(--gold-l);
    letter-spacing: 0.06em;
  }
  .away > p {
    margin-top: 6px;
    text-align: center;
    color: #c9d4d7;
  }
  .away h3 {
    margin-top: 18px;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold-l);
  }
  .away ul {
    display: grid;
    gap: 6px;
    margin-top: 8px;
    padding: 0;
    list-style: none;
  }
  .away li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgb(255 255 255 / 0.06);
    border-radius: 10px;
  }
  .away li b {
    font-size: 17px;
    color: #9be3a5;
  }
  .away li :global(svg[width='18']) {
    color: #9be3a5;
  }
  .warn {
    margin-top: 14px;
    font-size: 13px;
    color: #ffb4a4;
  }
  .enter {
    width: 100%;
    min-height: 50px;
    margin-top: 20px;
    font-size: 17px;
    font-weight: 700;
    color: #2b2210;
    background: linear-gradient(#f8e3a0, #c9a14a);
    border: 0;
    border-radius: 14px;
    box-shadow: 0 4px 0 #7c5f22;
    cursor: pointer;
  }
  .enter:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #7c5f22;
  }
</style>
