<script lang="ts">
  import { onMount } from 'svelte'
  import { cubicOut } from 'svelte/easing'
  import {
    advance, apply, buildTime, capAt, cost, storage, upgradeError,
    BUILDINGS, IDS, MAX_LEVEL, RESOURCES, type BuildingId, type State,
  } from '@rok/rules'
  import { L, SEAL, TABS, clock, load, num, save } from './lib'

  const saved = load(Date.now())
  const start = advance(saved, Date.now())
  const away = summarize(saved, start)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')

  let game: State = $state.raw(start)
  let now = $state(start.time)
  let sheet = $state<HTMLDialogElement>()

  const hall = $derived(game.levels.chuDien)
  const cap = $derived(storage(game))
  const job = $derived(game.queue[0])
  const goal = $derived(IDS.find(id => game.levels[id] === 0 && hall >= BUILDINGS[id].unlock) ?? 'chuDien')

  onMount(() => {
    if (away) sheet?.showModal()
    const tick = setInterval(() => {
      now = Date.now()
      game = advance(game, now)
    }, 250)
    return () => clearInterval(tick)
  })

  function upgrade(b: BuildingId) {
    const r = apply(game, { type: 'upgrade', building: b }, Date.now())
    if (!r.ok) return // nút đã hiện lý do
    game = r.state
    save(game)
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

  // Tác dụng hiện tại + phần tăng thêm nếu nâng tầng
  function effect(id: BuildingId) {
    const { makes, rate = 0 } = BUILDINGS[id]
    const lv = game.levels[id]
    const more = lv < MAX_LEVEL
    if (makes) return { text: L.makes(num(rate * Math.max(lv, 1)), makes), gain: lv && more ? rate : 0 }
    if (id === 'tangBaoCac') return { text: L.holds(num(capAt(lv))), gain: more ? capAt(lv + 1) - capAt(lv) : 0 }
    return { text: L.b[id].does, gain: 0 }
  }

  // Ấn rơi xuống, xoay nhẹ, loang mực. Chỉ chạy khi tầng đổi, không chạy lúc mở app.
  function stamp(_: Element) {
    return {
      duration: reduceMotion.matches ? 0 : 450,
      easing: cubicOut,
      css: (t: number) => {
        const ring = Math.max(0, (t - 0.6) / 0.4)
        return `transform: scale(${1 + (1 - t) * 0.6}) rotate(${-2 - (1 - t) * 12}deg); opacity: ${Math.min(1, t * 1.6)};
          box-shadow: inset 0 0 0 2px rgb(247 249 245 / 0.35), 0 0 0 ${ring * 10}px rgb(194 59 34 / ${0.35 * (1 - ring)})`
      },
    }
  }
</script>

<div class="app">
  <header class="top">
    <svg class="paint" viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color: var(--azurite)" />
          <stop offset="0.5" style="stop-color: var(--malachite)" />
          <stop offset="1" style="stop-color: var(--mist); stop-opacity: 0" />
        </linearGradient>
      </defs>
      <path opacity="0.28" fill="url(#ridge)" d="M0 92 C22 74 36 50 58 52 C78 54 88 30 112 24 C134 19 146 54 170 52 C196 50 210 14 238 16 C262 18 276 50 300 48 C322 46 338 28 360 30 C380 32 392 50 400 54 V150 H0 Z" />
      <path opacity="0.55" fill="url(#ridge)" d="M0 118 C26 96 46 82 72 86 C98 90 112 60 142 58 C170 56 184 90 212 88 C238 86 254 64 282 66 C310 68 324 98 350 94 C372 91 388 80 400 82 V150 H0 Z" />
      <path opacity="0.9" fill="url(#ridge)" d="M0 138 C28 120 52 108 82 114 C112 120 132 100 164 104 C198 108 216 128 248 124 C278 120 302 106 332 112 C362 118 382 128 400 124 V150 H0 Z" />
    </svg>
    <div class="title">
      <span class="seal big" aria-hidden="true">宗</span>
      <div>
        <h1>{L.sect}</h1>
        <p class="realm">{L.realm(hall)}</p>
      </div>
    </div>
  </header>

  <main>
    <div class="dock">
      <ul class="res">
        {#each RESOURCES as r (r)}
          {@const full = game.res[r] >= cap}
          <li class:full>
            <span class="coin" aria-hidden="true">{SEAL[r]}</span>
            <span class="amt">
              <b>{num(game.res[r])}</b><small>{full ? L.full : `/${num(cap)}`}</small><span class="sr"> {L.res[r]}</span>
            </span>
            <span class="bar"><i style:width="{Math.min(100, (game.res[r] / cap) * 100)}%"></i></span>
          </li>
        {/each}
      </ul>

      <section class="worker">
        {#if job}
          <p><span>{L.working(L.b[job.building].name, job.level)}</span><b>{clock(job.finishAt - now)}</b></p>
          <span class="bar">
            <i style:width="{Math.min(100, (1 - (job.finishAt - now) / buildTime(job.building, job.level)) * 100)}%"></i>
          </span>
        {:else}
          <p><span>{L.idle}</span><span class="hint">{L.suggest(L.b[goal].name, game.levels[goal] === 0)}</span></p>
        {/if}
      </section>
    </div>

    <ol class="list">
      {#each IDS as id (id)}
        {@const lv = game.levels[id]}
        {@const next = lv + 1}
        {@const locked = lv === 0 && hall < BUILDINGS[id].unlock}
        {@const building = game.queue.find(j => j.building === id)}
        {@const err = upgradeError(game, id)}
        <li class="card" class:locked class:guided={!job && id === goal}>
          {#key lv}
            <span class="seal" class:blank={lv === 0} in:stamp aria-hidden="true">{SEAL[id]}</span>
          {/key}
          <div>
            <h2>{L.b[id].name}{#if lv}<span class="lv">{L.level(lv)}</span>{/if}</h2>
            {#if locked}
              <p class="why">{L.opensAt(BUILDINGS[id].unlock)}</p>
            {:else}
              {@const fx = effect(id)}
              <p class="does">{fx.text}{#if fx.gain}<span class="gain"> +{num(fx.gain)}</span>{/if}</p>
              {#if building}
                <p class="doing">{L.upgrading(next)} · {clock(building.finishAt - now)}</p>
              {:else if err === 'max_level'}
                <p class="doing">{L.maxed}</p>
              {:else}
                {@const c = cost(id, next)}
                <div class="act">
                  <ul class="cost">
                    {#each RESOURCES as r (r)}
                      {#if c[r]}
                        <li class:short={game.res[r] < c[r]}>
                          <span class="coin" aria-hidden="true">{SEAL[r]}</span>{num(c[r])}<span class="sr"> {L.res[r]}</span>
                        </li>
                      {/if}
                    {/each}
                    <li class="time">
                      <span class="coin" aria-hidden="true">{SEAL.time}</span>{clock(buildTime(id, next))}<span class="sr"> {L.duration}</span>
                    </li>
                  </ul>
                  {#if err === 'need_main_hall'}
                    <p class="req">{L.needHall(next)}</p>
                  {:else}
                    <!-- Tạp dịch bận thì dải trên đã báo, không lặp lại ở từng thẻ -->
                    <button disabled={!!err} onclick={() => upgrade(id)} aria-label={L.upgradeFull(L.b[id].name, next)}>
                      {lv ? L.upgradeTo(next) : L.build}
                    </button>
                  {/if}
                </div>
              {/if}
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  </main>

  <nav class="tabs">
    {#each TABS as t (t.id)}
      {@const on = t.id === 'tongMon'}
      <button class:on disabled={!on} aria-current={on ? 'page' : undefined}>
        <span class="mark" aria-hidden="true">{t.glyph}</span>
        <span>{L.tabs[t.id]}</span>
        {#if !on}<small>{hall < t.unlock ? L.level(t.unlock) : L.soon}</small>{/if}
      </button>
    {/each}
  </nav>

  <dialog bind:this={sheet} class="sheet" aria-labelledby="away-title">
    {#if away}
      <h2 id="away-title">{L.away.title}</h2>
      <p>{L.away.for(L.ago(away.ms))}</p>
      {#if away.gains.length}
        <h3>{L.away.got}</h3>
        <ul>
          {#each away.gains as g (g.r)}
            <li><span class="coin" aria-hidden="true">{SEAL[g.r]}</span>+{num(g.n)} {L.res[g.r]}</li>
          {/each}
        </ul>
      {/if}
      {#if away.done.length}
        <h3>{L.away.done}</h3>
        <ul>
          {#each away.done as d (d.id)}
            <li><span class="seal small" aria-hidden="true">{SEAL[d.id]}</span>{L.b[d.id].name} · {L.level(d.level)}</li>
          {/each}
        </ul>
      {/if}
      {#if away.full}<p class="why">{L.away.full}</p>{/if}
      <form method="dialog"><button class="primary">{L.away.enter}</button></form>
    {/if}
  </dialog>
</div>

<style>
  .app {
    max-width: 480px;
    min-height: 100dvh;
    margin: 0 auto;
    padding: 0 12px calc(84px + env(safe-area-inset-bottom));
  }

  /* Tranh sơn thủy lam–lục phía sau tên tông môn */
  .top {
    position: relative;
    height: 164px;
    margin: 0 -12px;
    padding-top: calc(18px + env(safe-area-inset-top));
    overflow: hidden;
    background: linear-gradient(var(--silk), var(--mist));
  }
  .paint {
    position: absolute;
    inset: auto 0 0 0;
    width: 100%;
    height: 112px;
  }
  .title {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
  }
  h1 {
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
  }
  .realm {
    margin-top: 3px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--azurite);
  }

  /* Ấn triện: bạch văn = đã xây; nét đứt = chưa khắc */
  .seal {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    font: 30px/1 var(--seal);
    color: var(--silk);
    background: var(--cinnabar);
    border-radius: 7px;
    box-shadow: inset 0 0 0 2px rgb(247 249 245 / 0.35);
    transform: rotate(-2deg);
  }
  .seal.blank {
    color: var(--wash);
    background: none;
    border: 1.5px dashed var(--line);
    box-shadow: none;
    transform: none;
  }
  .seal.big {
    width: 52px;
    height: 52px;
    font-size: 34px;
  }
  .seal.small {
    width: 26px;
    height: 26px;
    font-size: 16px;
    border-radius: 5px;
  }

  /* Chu văn tròn = tài nguyên */
  .coin {
    display: inline-grid;
    flex: none;
    place-items: center;
    width: 22px;
    height: 22px;
    font: 14px/1 var(--seal);
    color: var(--cinnabar);
    border: 1.5px solid currentColor;
    border-radius: 50%;
  }

  .bar {
    display: block;
    height: 3px;
    overflow: hidden;
    background: var(--line);
    border-radius: 2px;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--azurite);
    transition: width 0.25s linear;
  }

  .dock {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 8px 0 4px;
    background: var(--mist);
  }
  /* thẻ cuộn qua thì mờ dần dưới dải dính, thay vì bị cắt ngang */
  .dock::after {
    content: '';
    position: absolute;
    inset: 100% 0 auto;
    height: 12px;
    background: linear-gradient(var(--mist), transparent);
    pointer-events: none;
  }
  .res {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 0 4px;
    list-style: none;
  }
  .res li {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 5px 6px;
  }
  .res .bar {
    grid-column: 1 / -1;
  }
  .res .bar i {
    background: var(--malachite);
  }
  .amt b {
    font-size: 15px;
    font-weight: 600;
  }
  .amt small {
    margin-left: 1px;
    font-size: 11px;
    color: var(--wash);
  }
  .full .amt small {
    font-weight: 600;
    color: var(--cinnabar);
  }
  .full .bar i {
    background: var(--cinnabar);
  }

  .worker {
    margin-top: 10px;
    padding: 10px 12px;
    background: var(--silk);
    border: 1px solid var(--line);
    border-radius: var(--r);
  }
  .worker p {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
  }
  .worker .hint {
    font-weight: 600;
    color: var(--malachite);
  }
  .worker .bar {
    margin-top: 8px;
  }

  .list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
    padding: 0;
    list-style: none;
  }
  .card {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 12px;
    padding: 14px;
    background: var(--silk);
    border: 1px solid var(--line);
    border-radius: var(--r);
  }
  .card.guided {
    border-color: var(--malachite);
    box-shadow: inset 0 0 0 1px var(--malachite);
  }
  .card.locked {
    background: none;
  }
  .card.locked h2,
  .card.locked .seal {
    opacity: 0.55;
  }
  h2 {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
  }
  .lv {
    margin-left: 8px;
    font-size: 12px;
    font-weight: 400;
    color: var(--wash);
  }
  .does {
    margin-top: 2px;
    font-size: 13px;
    color: var(--wash);
  }
  .doing {
    margin-top: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--azurite);
  }
  .why {
    margin-top: 6px;
    font-size: 12px;
    color: var(--wash);
  }
  .gain {
    margin-left: 0.35em;
    font-weight: 600;
    color: var(--malachite);
  }
  /* chi phí bên trái (tự xuống dòng), nút luôn nằm phải */
  .act {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px 12px;
    margin-top: 10px;
  }
  .req {
    max-width: 9em;
    font-size: 12px;
    line-height: 1.35;
    text-align: right;
    color: var(--wash);
  }
  .cost {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    padding: 0;
    font-size: 13px;
    list-style: none;
  }
  .cost li {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .cost .coin {
    width: 18px;
    height: 18px;
    font-size: 11px;
  }
  .cost .short {
    font-weight: 600;
    color: var(--cinnabar);
  }
  .cost .time,
  .cost .time .coin {
    color: var(--wash);
  }

  .act button,
  .primary {
    min-height: 40px;
    padding: 0 16px;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    color: var(--silk);
    background: var(--azurite);
    border: 0;
    border-radius: 8px;
    cursor: pointer;
  }
  .act button:disabled {
    color: var(--wash);
    background: none;
    box-shadow: inset 0 0 0 1px var(--line);
    cursor: default;
  }
  .act button:not(:disabled):active {
    transform: translateY(1px);
  }

  .tabs {
    position: fixed;
    bottom: 0;
    left: 50%;
    z-index: 3;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    width: min(100%, 480px);
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
    background: var(--silk);
    border-top: 1px solid var(--line);
    translate: -50% 0;
  }
  .tabs button {
    display: grid;
    justify-items: center;
    gap: 3px;
    padding: 4px 0;
    font-size: 12px;
    line-height: 1.2;
    background: none;
    border: 0;
  }
  .tabs .mark {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    font: 19px/1 var(--seal);
    color: var(--cinnabar);
    border: 1.5px solid var(--cinnabar);
    border-radius: 6px;
  }
  .tabs .on {
    font-weight: 600;
  }
  .tabs .on .mark {
    color: var(--silk);
    background: var(--cinnabar);
  }
  .tabs button:disabled {
    color: var(--wash);
  }
  .tabs button:disabled .mark {
    color: var(--wash);
    border-color: var(--line);
  }
  .tabs small {
    font-size: 10px;
    color: var(--wash);
  }

  .sheet {
    width: min(100%, 480px);
    max-width: 100%;
    margin: auto auto 0;
    padding: 22px 20px calc(20px + env(safe-area-inset-bottom));
    color: var(--ink);
    background: var(--silk);
    border: 0;
    border-radius: 16px 16px 0 0;
  }
  .sheet::backdrop {
    background: rgb(23 35 42 / 0.45);
  }
  .sheet h2 {
    font-size: 20px;
  }
  .sheet h3 {
    margin-top: 16px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--wash);
  }
  .sheet ul {
    display: grid;
    gap: 8px;
    margin-top: 8px;
    padding: 0;
    list-style: none;
  }
  .sheet li {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sheet form {
    margin-top: 20px;
  }
  .sheet .primary {
    width: 100%;
  }
</style>
