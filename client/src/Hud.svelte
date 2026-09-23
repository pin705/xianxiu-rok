<script lang="ts">
  // HUD: thanh sơn mài trên cùng (chưởng môn, thế lực, tài nguyên), cuộn nhiệm vụ, nút tạp dịch, thanh tab dưới.
  import { Tween } from 'svelte/motion'
  import { DAILY_HALL, RESOURCES, count, dailyReady, power, questDone, questOf, questProgress, storage, type Bag as Res, type State } from '@rok/rules'
  import { Icon, Portrait, type Look } from '@rok/art'
  import { Badge, Bag, IconButton, Meter, Seal, Tag } from './ui'
  import { L, TABS, clock, num, progress, sfx, visitTab, visitedTabs, type Tab } from './lib'

  let {
    game,
    now,
    tab,
    storm = false,
    gain,
    onclaim,
    onquest,
    onbuilder,
    ontab,
    onsettings,
    ondaily,
  }: {
    game: State
    now: number
    tab: Tab
    storm?: boolean
    gain: { bag: Partial<Res>; t: number } | null
    onclaim: (e: MouseEvent) => void
    onquest: () => void
    onbuilder: () => void
    ontab: (t: Tab, e: MouseEvent) => void
    onsettings: () => void
    ondaily: () => void
  } = $props()

  const MASTER: Look = { robe: '#1b4566', trim: '#c9a14a', hair: '#211c17', style: 'bun', bg: '#78a6c2', mark: '#b8382a' }
  const ready = $derived(dailyReady(game))
  let visited = $state(visitedTabs())
  // Ghé tab bằng cách nào cũng tính (bấm tab, hay nhiệm vụ dẫn sang bản đồ)
  $effect(() => {
    visitTab(tab)
    visited = visitedTabs()
  })

  const hall = $derived(game.levels.chuDien)
  const cap = $derived(storage(game))
  const job = $derived(game.queue[0])
  const live = $derived(questOf(game))
  const liveProg = $derived(live && live.k !== 'build' && live.k !== 'hunt' && live.k !== 'sect' ? questProgress(game, live) : null)
  // Nhận thưởng: giữ nhiệm vụ vừa xong thêm một nhịp để dấu 成 đóng lên, rồi nhiệm vụ mới trượt vào
  let held = $state<{ quest: typeof live; prog: typeof liveProg } | null>(null)
  const quest = $derived(held ? held.quest : live)
  const prog = $derived(held ? held.prog : liveProg)
  const done = $derived(!!held || questDone(game))
  function claim(e: MouseEvent) {
    if (held) return
    held = { quest: live, prog: liveProg }
    onclaim(e)
    sfx('stamp')
    setTimeout(() => (held = null), 750)
  }
  const ring = $derived(job ? progress(job, now) : 0)
  // Huy hiệu trên thanh tab: số chiến báo chưa đọc; chấm đỏ khi có thương binh chờ chữa
  const unread = $derived(game.reports.filter(r => r.id > game.seen).length)
  const hurt = $derived(!game.heal && count(game.wounded) > 0)

  // Số chạy mượt khi tăng/giảm
  const powerT = Tween.of(() => power(game), { duration: 700 })
  const resT = RESOURCES.map(r => Tween.of(() => game.res[r], { duration: 450 }))
</script>

<div class="hud">
  <header class="topbar lacquer">
    <div class="row who">
      <span class="avatar"><Portrait look={MASTER} size={50} /></span>
      <div class="grow id">
        <b class="t-ellipsis">{game.name}</b>
        <span class="realm"><Seal glyph="宗" size={14} />{L.realm(hall)}</span>
      </div>
      <span class="pow" title={L.power}><Icon name="power" size={14} /><span class="sr">{L.power}</span>{num(Math.round(powerT.current))}</span>
      <IconButton icon="gear" label={L.settings.open} size={34} onclick={onsettings} />
    </div>
    <ul class="res">
      {#each RESOURCES as r, i (r)}
        {@const full = game.res[r] >= cap}
        <li class:full data-res={r}>
          <Icon name={r} size={22} />
          <span class="stack">
            <b class="t-num">{num(Math.round(resT[i].current))}<span class="sr"> {L.res[r]}</span></b>
            <Meter value={game.res[r] / cap} tone={full ? 'bad' : 'spirit'} size="xs" />
          </span>
          {#if full}<em>{L.full}</em>{/if}
          {#if gain && gain.bag[r] && now - gain.t < 1400}
            {#key gain.t}<span class="float">+{num(gain.bag[r] ?? 0)}</span>{/key}
          {/if}
        </li>
      {/each}
    </ul>
  </header>

  {#if tab === 'tongMon' && !storm}
    <div class="side">
      {#if quest}
        <button class="quest paper" class:done class:enter={!held} onclick={done ? claim : onquest}>
          <span class="stack grow" style:--gap="3px">
            <small class="row">{L.quest.title}{#if prog}<b class="t-num">{num(Math.min(prog[0], prog[1]))}/{num(prog[1])}</b>{/if}</small>
            <b class="qt">{L.quest.text(quest)}</b>
            <Bag res={quest.reward} items={quest.items} size="sm" />
          </span>
          {#if held}
            <span class="stamp"><Seal glyph="成" size={46} tilt /></span>
          {:else if done}
            <span class="claim"><Tag tone="gold" icon="star">{L.quest.claim}</Tag></span>
          {:else}
            <span class="go"><Icon name="arrow" size={16} /></span>
          {/if}
        </button>
      {:else}
        <p class="quest paper t-small t-lore">{L.quest.allDone}</p>
      {/if}
      {#if hall >= DAILY_HALL}
        <span class="daily" class:ready={ready > 0}>
          <IconButton icon="scroll" label="{L.daily.button}{ready ? ` (${ready})` : ''}" size={46} onclick={ondaily}><Badge n={ready} /></IconButton>
        </span>
      {/if}
    </div>

    <button class="builder" class:idle={!job} onclick={onbuilder} aria-label="{L.builder.label}: {job ? clock(job.finishAt - now) : L.builder.idle}">
      <svg class="ring" viewBox="0 0 60 60" aria-hidden="true">
        <circle class="rbg" cx="30" cy="30" r="26" />
        <circle class="rfg" cx="30" cy="30" r="26" stroke-dasharray="{ring * 163.4} 163.4" />
      </svg>
      <Icon name="hammer" size={24} />
      <span class="btime">{job ? clock(job.finishAt - now) : L.builder.idle}</span>
    </button>
  {/if}

  <nav class="tabs lacquer">
    {#each TABS as t (t.id)}
      {@const on = t.id === tab}
      {@const locked = hall < t.unlock}
      {@const fresh = !locked && !visited.includes(t.id)}
      <button class:on class:locked disabled={locked} data-tab={t.id} aria-current={on ? 'page' : undefined} onclick={e => !on && ontab(t.id, e)}>
        <span class="medal">
          {#if on}<Seal glyph={t.glyph} size={44} />{:else}<span class="han">{t.glyph}</span>{/if}
          {#if locked}<span class="lk"><Icon name="lock" size={10} /></span>{/if}
          {#if !on}<Badge n={t.id === 'banDo' ? unread : 0} dot={t.id === 'monHa' && hurt} {fresh} />{/if}
        </span>
        <span class="tl">{L.tabs[t.id]}</span>
        {#if locked}<small>{t.unlock > 15 ? L.soonTag : L.level(t.unlock)}</small>{/if}
      </button>
    {/each}
  </nav>
</div>

<style>
  .hud {
    position: fixed;
    inset: 0;
    z-index: var(--z-hud);
    max-width: var(--col);
    margin: 0 auto;
    pointer-events: none;
  }
  .topbar,
  .quest,
  .daily,
  .builder,
  .tabs {
    pointer-events: auto;
  }

  /* Thanh trên: sơn mài, mép dưới viền vàng cắt vát */
  .topbar {
    display: grid;
    gap: var(--sp-2);
    padding: calc(var(--sp-2) + var(--safe-t)) var(--sp-3) var(--sp-3);
    box-shadow: inset 0 -1.5px 0 var(--gold), inset 0 -4px 0 rgb(0 0 0 / 0.4), var(--shadow-2);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px));
  }
  .who {
    gap: var(--sp-2);
  }
  .avatar {
    flex: none;
    padding: 2px;
    background: conic-gradient(from 200deg, var(--gold-l), var(--gold-d), var(--gold-l), var(--gold-d), var(--gold-l));
    border-radius: 50%;
    box-shadow: var(--shadow-1);
  }
  .id {
    display: grid;
    line-height: 1.2;
  }
  .id b {
    font-size: var(--fs-4);
    font-weight: 800;
  }
  .realm {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--gold-l);
  }
  .pow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    font-weight: 800;
    color: var(--gold-l);
    background: rgb(0 0 0 / 0.3);
    box-shadow: inset 0 0 0 1px var(--gold-d);
    clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%);
  }
  .res {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--gold-d);
    box-shadow: 0 0 0 1px var(--gold-d);
  }
  .res li {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    background: rgb(20 12 8 / 0.92);
  }
  .res .stack {
    flex: 1;
    --gap: 3px;
  }
  .res b {
    font-size: var(--fs-4);
    line-height: 1;
  }
  .full b {
    color: var(--cinnabar-l);
  }
  em {
    position: absolute;
    top: -7px;
    right: 4px;
    padding: 0 6px;
    font: 800 10px/1.5 var(--font);
    font-style: normal;
    color: var(--silk);
    background: var(--cinnabar);
  }
  .float {
    position: absolute;
    left: 30px;
    font-size: var(--fs-4);
    font-weight: 900;
    color: var(--gold-l);
    text-shadow: var(--text-shadow-inv);
    pointer-events: none;
    animation: float 1.4s var(--ease) forwards;
  }
  @keyframes float {
    from {
      opacity: 1;
      transform: translateY(16px) scale(1.25);
    }
    to {
      opacity: 0;
      transform: translateY(-16px);
    }
  }

  /* Cuộn nhiệm vụ bên trái, nút nhiệm vụ ngày bên phải */
  .side {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-3) 0;
  }
  .quest {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    max-width: 78%;
    padding: var(--sp-2) var(--sp-2) var(--sp-2) var(--sp-3);
    text-align: left;
    box-shadow: inset 3px 0 0 var(--cinnabar), inset 0 0 0 1px color-mix(in srgb, var(--ink) 35%, transparent), var(--shadow-2);
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  }
  .quest small {
    --gap: 6px;
    font-size: var(--fs-1);
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--cinnabar);
  }
  .qt {
    font-size: var(--fs-3);
    font-weight: 800;
    line-height: 1.25;
  }
  .done {
    box-shadow: inset 3px 0 0 var(--gold), inset 0 0 0 1.5px var(--gold), 0 0 16px rgb(236 208 138 / 0.7);
  }
  .claim {
    pointer-events: none;
    animation: glow 1.4s var(--ease) infinite;
  }
  .stamp {
    display: grid;
    padding-inline: var(--sp-3);
    animation: stamp 0.4s cubic-bezier(0.5, 0, 0.75, 0) both;
  }
  @keyframes stamp {
    0% { opacity: 0; scale: 2.6; rotate: -16deg; }
    60% { opacity: 1; scale: 0.92; rotate: 0deg; }
    100% { opacity: 1; scale: 1; }
  }
  .enter {
    animation: enter var(--dur-3) var(--spring);
  }
  @keyframes enter {
    from { opacity: 0; translate: -14px 0; }
  }
  .go {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    color: var(--cinnabar);
    border-radius: 50%;
    box-shadow: inset 0 0 0 1.5px currentColor;
  }
  .daily.ready {
    animation: glow 1.6s var(--ease) infinite;
    border-radius: 50%;
  }
  @keyframes glow {
    0% {
      filter: drop-shadow(0 0 0 rgb(236 208 138 / 0.9));
    }
    60%,
    100% {
      filter: drop-shadow(0 0 9px rgb(236 208 138 / 0));
    }
  }

  /* Nút tạp dịch: đĩa sơn mài, vòng tiến độ linh khí */
  .builder {
    position: absolute;
    right: var(--sp-3);
    bottom: calc(108px + var(--safe-b));
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    color: var(--gold-l);
    background:
      radial-gradient(circle at 50% 32%, rgb(255 255 255 / 0.14), transparent 60%),
      var(--lacquer) var(--lacquer-tex);
    background-size: auto, 96px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px var(--gold), inset 0 0 0 5px rgb(0 0 0 / 0.4), var(--shadow-2);
  }
  .builder:active {
    transform: scale(0.94);
  }
  .builder.idle {
    animation: glow 1.6s var(--ease) infinite;
  }
  .ring {
    position: absolute;
    inset: 0;
    rotate: -90deg;
  }
  .rbg,
  .rfg {
    fill: none;
    stroke-width: 3.5;
  }
  .rbg {
    stroke: rgb(255 255 255 / 0.1);
  }
  .rfg {
    stroke: var(--spirit);
    stroke-linecap: round;
    transition: stroke-dasharray 0.25s linear;
  }
  .btime {
    position: absolute;
    bottom: -10px;
    left: 50%;
    padding: 1px 8px;
    font: 800 var(--fs-1) / 1.5 var(--font);
    font-variant-numeric: tabular-nums lining-nums;
    color: var(--silk);
    white-space: nowrap;
    background: var(--lacquer);
    box-shadow: inset 0 0 0 1px var(--gold-d);
    translate: -50% 0;
  }
  .idle .btime {
    background: var(--cinnabar);
  }

  /* Thanh tab: sơn mài, mép trên viền vàng; tab đang mở là dấu son */
  .tabs {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: var(--sp-2) var(--sp-1) calc(var(--sp-2) + var(--safe-b));
    box-shadow: inset 0 1.5px 0 var(--gold), inset 0 4px 0 rgb(0 0 0 / 0.4), 0 -6px 18px rgb(20 14 10 / 0.3);
    clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%, 0 10px);
  }
  .tabs button {
    display: grid;
    justify-items: center;
    gap: 2px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--text-inv-soft);
  }
  .medal {
    position: relative;
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    transition: transform var(--dur-2) var(--spring);
  }
  .medal .han {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    font-size: 24px;
    color: var(--paper2);
    border-radius: 50%;
    box-shadow: inset 0 0 0 1.5px var(--gold-d), inset 0 0 0 4px rgb(0 0 0 / 0.3);
  }
  .on .medal {
    transform: translateY(-6px) scale(1.06);
    filter: drop-shadow(0 0 10px rgb(217 96 74 / 0.6));
  }
  .on .tl {
    font-weight: 800;
    color: var(--silk);
  }
  .locked .medal {
    opacity: 0.5;
  }
  .lk {
    position: absolute;
    right: 0;
    bottom: 0;
    display: grid;
    place-items: center;
    width: 17px;
    height: 17px;
    color: var(--gold-l);
    background: var(--lacquer);
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--gold-d);
  }
  .tabs small {
    font-size: 10px;
    color: color-mix(in srgb, var(--silk) 50%, transparent);
  }
</style>
