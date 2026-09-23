<script lang="ts">
  import { Tween } from 'svelte/motion'
  import { RESOURCES, buildTime, power, questDone, questOf, storage, type Bag, type State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { L, TABS, clock, num } from './lib'

  let {
    game,
    now,
    muted,
    gain,
    onclaim,
    onquest,
    onbuilder,
    onmute,
  }: {
    game: State
    now: number
    muted: boolean
    gain: { bag: Partial<Bag>; t: number } | null
    onclaim: () => void
    onquest: () => void
    onbuilder: () => void
    onmute: () => void
  } = $props()

  const hall = $derived(game.levels.chuDien)
  const cap = $derived(storage(game))
  const job = $derived(game.queue[0])
  const quest = $derived(questOf(game))
  const done = $derived(questDone(game))
  const progress = $derived(job ? Math.min(1, 1 - (job.finishAt - now) / buildTime(job.building, job.level)) : 0)

  // Số chạy mượt khi tăng/giảm
  const powerT = Tween.of(() => power(game), { duration: 700 })
  const resT = RESOURCES.map(r => Tween.of(() => game.res[r], { duration: 450 }))
</script>

<div class="hud">
  <div class="topcol">
    <header class="top">
      <div class="who">
        <div class="avatar">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <radialGradient id="avBg" cx=".5" cy=".3">
                <stop offset="0" stop-color="#d9ebe7" />
                <stop offset="1" stop-color="#7fa9b3" />
              </radialGradient>
            </defs>
            <circle cx="24" cy="24" r="24" fill="url(#avBg)" />
            <path d="M5 48C7 38 15 33.5 24 33.5S41 38 43 48Z" fill="#1d4e73" />
            <path d="M18 33.6 24 44 30 33.6Z" fill="#f3f1ea" />
            <path d="M24 44 18 33.6M24 44 30 33.6" stroke="#0f2536" stroke-width=".8" />
            <rect x="21" y="28" width="6" height="7" fill="#efd3b8" />
            <ellipse cx="24" cy="22" rx="8" ry="9.5" fill="#f3dcc4" />
            <path d="M15.6 22C15 13 19 10 24 10S33 13 32.4 22C31 17 28.2 15.2 24 15.2S17 17 15.6 22Z" fill="#17232a" />
            <ellipse cx="24" cy="8.6" rx="4.6" ry="3.6" fill="#17232a" />
            <path d="M17.4 8.2H30.6" stroke="#e3c16f" stroke-width="1.4" stroke-linecap="round" />
            <path d="M19.4 22.2q1.8 1.2 3.4 0M25.2 22.2q1.8 1.2 3.4 0" stroke="#17232a" stroke-width=".9" fill="none" stroke-linecap="round" />
            <path d="M19.3 19.3l3.3 -.7M25.4 18.6l3.3 .7" stroke="#17232a" stroke-width=".9" stroke-linecap="round" />
            <path d="M24 16.4l.9 1.6 -.9 1.1 -.9 -1.1Z" fill="#c23b22" />
          </svg>
        </div>
        <div class="id">
          <b class="sect">{game.name}</b>
          <span class="realm">{L.realm(hall)}</span>
        </div>
        <div class="pow" title={L.power}>
          <Icon name="power" size={14} />
          <span class="sr">{L.power}</span>
          <span>{num(Math.round(powerT.current))}</span>
        </div>
        <button class="mute" onclick={onmute} aria-label={muted ? L.sound.off : L.sound.on}>
          <Icon name={muted ? 'mute' : 'sound'} size={18} />
        </button>
      </div>
      <ul class="res">
        {#each RESOURCES as r, i (r)}
          {@const full = game.res[r] >= cap}
          <li class:full>
            <Icon name={r} size={24} />
            <span class="amt"><b>{num(Math.round(resT[i].current))}</b><span class="sr"> {L.res[r]}</span></span>
            <span class="bar"><i style:width="{Math.min(100, (game.res[r] / cap) * 100)}%"></i></span>
            {#if full}<em>{L.full}</em>{/if}
            {#if gain && gain.bag[r] && now - gain.t < 1400}
              {#key gain.t}<span class="float">+{num(gain.bag[r] ?? 0)}</span>{/key}
            {/if}
          </li>
        {/each}
      </ul>
    </header>

    {#if quest}
      <button class="quest" class:done onclick={done ? onclaim : onquest}>
        <span class="qbody">
          <small>{L.quest.title}</small>
          <b>{L.quest.text(quest)}</b>
          <span class="qreward">
            {#each RESOURCES as r (r)}
              {#if quest.reward[r]}<span><Icon name={r} size={15} />{num(quest.reward[r] ?? 0)}</span>{/if}
            {/each}
          </span>
        </span>
        {#if done}
          <span class="claim">{L.quest.claim}</span>
        {:else}
          <span class="go"><Icon name="arrow" size={16} /></span>
        {/if}
      </button>
    {:else}
      <p class="quest over">{L.quest.allDone}</p>
    {/if}
  </div>

  <button class="builder" class:idle={!job} onclick={onbuilder} aria-label="{L.builder.label}: {job ? clock(job.finishAt - now) : L.builder.idle}">
    <svg class="ring" viewBox="0 0 60 60" aria-hidden="true">
      <circle class="rbg" cx="30" cy="30" r="26" />
      <circle class="rfg" cx="30" cy="30" r="26" stroke-dasharray="{progress * 163.4} 163.4" />
    </svg>
    <Icon name="hammer" size={24} />
    <span class="btime">{job ? clock(job.finishAt - now) : L.builder.idle}</span>
  </button>

  <nav class="tabs">
    {#each TABS as t (t.id)}
      {@const on = t.id === 'tongMon'}
      {@const locked = hall < t.unlock}
      <button class:on class:locked disabled={!on} aria-current={on ? 'page' : undefined}>
        <span class="medal">
          <span class="glyph" aria-hidden="true">{t.glyph}</span>
          {#if locked}<span class="lk"><Icon name="lock" size={10} /></span>{/if}
        </span>
        <span class="tl">{L.tabs[t.id]}</span>
        {#if !on}<small>{locked ? L.level(t.unlock) : L.soonTag}</small>{/if}
      </button>
    {/each}
  </nav>
</div>

<style>
  .hud {
    position: fixed;
    inset: 0;
    z-index: 5;
    max-width: 480px;
    margin: 0 auto;
    pointer-events: none;
    color: #f6f1e4;
  }
  .top,
  .quest,
  .builder,
  .tabs {
    pointer-events: auto;
  }
  .topcol {
    position: absolute;
    inset: 0 0 auto;
    display: grid;
    justify-items: start;
    gap: 8px;
    padding: calc(8px + env(safe-area-inset-top)) 10px 0;
  }
  .top {
    display: grid;
    gap: 8px;
    width: 100%;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .avatar {
    position: relative;
    z-index: 1;
    flex: none;
    width: 58px;
    height: 58px;
    padding: 3px;
    border-radius: 50%;
    background: conic-gradient(from 210deg, #f6e19b, #a57a2c, #f6e19b, #8a6424, #f6e19b);
    box-shadow: 0 3px 8px rgb(0 0 0 / 0.35);
  }
  .avatar svg {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
  .id {
    display: grid;
    min-width: 0;
    margin-left: -22px;
    padding: 5px 14px 5px 22px;
    background: linear-gradient(90deg, rgb(13 24 31 / 0.86), rgb(13 24 31 / 0.6));
    border: 1px solid rgb(201 161 74 / 0.55);
    border-left: 0;
    border-radius: 0 16px 16px 0;
  }
  .sect {
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .realm {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--gold-l);
  }
  .pow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
    padding: 6px 11px;
    font-size: 13px;
    font-weight: 600;
    background: rgb(13 24 31 / 0.75);
    border: 1px solid rgb(201 161 74 / 0.55);
    border-radius: 999px;
  }
  .pow :global(svg) {
    color: var(--gold-l);
  }
  .mute {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    color: #f6f1e4;
    background: rgb(13 24 31 / 0.75);
    border: 1px solid rgb(201 161 74 / 0.55);
    border-radius: 50%;
    cursor: pointer;
  }

  .res {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 0;
    list-style: none;
  }
  .res li {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 3px 6px;
    padding: 5px 10px 6px 6px;
    background: rgb(13 24 31 / 0.75);
    border: 1px solid rgb(201 161 74 / 0.45);
    border-radius: 12px;
  }
  .res b {
    font-size: 15px;
    font-weight: 600;
  }
  .res .bar {
    grid-column: 1 / -1;
    height: 3px;
    overflow: hidden;
    background: rgb(255 255 255 / 0.15);
    border-radius: 2px;
  }
  .res .bar i {
    display: block;
    height: 100%;
    background: var(--spirit-ui);
    transition: width 0.25s linear;
  }
  .res .full {
    border-color: var(--cinnabar);
  }
  .res .full .bar i {
    background: var(--cinnabar);
  }
  .res em {
    position: absolute;
    top: -8px;
    right: 8px;
    padding: 1px 6px;
    font: 700 9px/1.4 var(--font);
    font-style: normal;
    color: #fff;
    background: var(--cinnabar);
    border-radius: 6px;
  }
  .float {
    position: absolute;
    top: -4px;
    left: 30px;
    font-size: 14px;
    font-weight: 700;
    color: var(--gold-l);
    text-shadow: 0 1px 3px rgb(0 0 0 / 0.7);
    pointer-events: none;
    animation: float 1.4s ease-out forwards;
  }
  @keyframes float {
    from {
      opacity: 1;
      transform: translateY(18px) scale(1.2);
    }
    to {
      opacity: 0;
      transform: translateY(-14px);
    }
  }

  .quest {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 100%;
    padding: 8px 10px 8px 12px;
    font: inherit;
    color: inherit;
    text-align: left;
    background: linear-gradient(90deg, rgb(13 24 31 / 0.88), rgb(13 24 31 / 0.68));
    border: 1px solid rgb(201 161 74 / 0.6);
    border-radius: 12px;
    cursor: pointer;
  }
  .quest.done {
    border-color: var(--gold-l);
  }
  .quest.over {
    font-size: 12px;
    color: #d6dde0;
  }
  .qbody {
    display: grid;
    gap: 2px;
  }
  .qbody small {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold-l);
  }
  .qbody b {
    font-size: 13.5px;
    font-weight: 600;
  }
  .qreward {
    display: flex;
    gap: 10px;
    font-size: 12px;
    color: #dbe4e6;
  }
  .qreward span {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .claim {
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
    color: #2b2210;
    white-space: nowrap;
    background: linear-gradient(#f8e3a0, #c9a14a);
    border-radius: 10px;
    animation: glow 1.4s ease-in-out infinite;
  }
  .go {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    color: var(--gold-l);
    border: 1px solid rgb(201 161 74 / 0.6);
    border-radius: 50%;
  }
  @keyframes glow {
    0% {
      box-shadow: 0 0 0 0 rgb(248 227 160 / 0.7);
    }
    70%,
    100% {
      box-shadow: 0 0 0 8px rgb(248 227 160 / 0);
    }
  }

  .builder {
    position: absolute;
    right: 14px;
    bottom: calc(110px + env(safe-area-inset-bottom));
    display: grid;
    place-items: center;
    width: 62px;
    height: 62px;
    padding: 0;
    color: var(--gold-l);
    background: radial-gradient(circle at 50% 35%, #29434f, #0f1f28);
    border: 0;
    border-radius: 50%;
    box-shadow: 0 3px 10px rgb(0 0 0 / 0.4), inset 0 0 0 2px rgb(201 161 74 / 0.75);
    cursor: pointer;
  }
  .builder.idle {
    animation: glow 1.6s ease-in-out infinite;
  }
  .ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .rbg {
    fill: none;
    stroke: rgb(255 255 255 / 0.12);
    stroke-width: 4;
  }
  .rfg {
    fill: none;
    stroke: var(--spirit-ui);
    stroke-width: 4;
    stroke-linecap: round;
    transition: stroke-dasharray 0.25s linear;
  }
  .btime {
    position: absolute;
    bottom: -10px;
    left: 50%;
    padding: 1px 8px;
    font: 600 11px/1.5 var(--font);
    font-variant-numeric: tabular-nums;
    color: #fff;
    white-space: nowrap;
    background: rgb(13 24 31 / 0.92);
    border: 1px solid rgb(201 161 74 / 0.6);
    border-radius: 8px;
    translate: -50% 0;
  }
  .idle .btime {
    background: var(--cinnabar);
  }

  .tabs {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
    background: linear-gradient(rgb(11 21 28 / 0.9), rgb(11 21 28 / 0.98));
    border-top: 1px solid rgb(201 161 74 / 0.6);
    box-shadow: 0 -6px 18px rgb(0 0 0 / 0.25);
  }
  .tabs button {
    display: grid;
    justify-items: center;
    gap: 3px;
    padding: 0;
    font-size: 11px;
    color: #cfd6d8;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .tabs button:disabled {
    cursor: default;
  }
  .medal {
    position: relative;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    background: radial-gradient(circle at 50% 35%, #2a4452, #13232c);
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px rgb(201 161 74 / 0.55);
    transition: transform 0.2s;
  }
  .glyph {
    font: 22px/1 var(--seal);
    color: #e9e2cf;
  }
  .on .medal {
    background: radial-gradient(circle at 50% 35%, #e0573c, #9e2c18);
    box-shadow: inset 0 0 0 2px var(--gold-l), 0 0 14px rgb(224 87 60 / 0.6);
    transform: translateY(-6px) scale(1.08);
  }
  .on .glyph,
  .on .tl {
    color: #fff;
  }
  .on .tl {
    font-weight: 700;
  }
  .locked .medal {
    filter: grayscale(1) brightness(0.7);
  }
  .lk {
    position: absolute;
    right: -2px;
    bottom: -2px;
    display: grid;
    place-items: center;
    width: 17px;
    height: 17px;
    color: var(--gold-l);
    background: #0e1a21;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(201 161 74 / 0.6);
  }
  .tabs small {
    font-size: 9.5px;
    color: #93a1a6;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
  }
</style>
