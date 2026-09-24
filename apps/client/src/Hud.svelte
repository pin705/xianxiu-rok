<script lang="ts">
  // HUD: ván sơn mài viền vàng trên cùng (chưởng môn, thế lực, tài nguyên), thẻ nhiệm vụ giấy, nút tạp dịch,
  // ván tab dưới cùng — mọi mặt đều vẽ tay (da từ theme.ts, icon/huy hiệu từ @rok/art).
  import { Tween } from 'svelte/motion'
  import {
    DAILY_HALL, RESOURCES, count, dailyReady, power, questDone, questOf, questProgress, rate, storage, unitOf, type Bag as Res, type BuildingId, type State,
  } from '@rok/rules'
  import { Icon, Portrait, emblemArt, type IconName, paintedUrl, portraitRing, tabIcon, type Look } from '@rok/art'
  import { Badge, Bag, IconButton, Meter, Tag } from './ui'
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
    onfocus,
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
    onfocus: (id: BuildingId, view?: string) => void // mở bảng công trình (danh sách việc đang chạy)
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
  // Nhận thưởng: giữ nhiệm vụ vừa xong thêm một nhịp để dấu tích son đóng lên, rồi nhiệm vụ mới trượt vào
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

  // Cột trái desktop: mọi việc có đồng hồ, bấm là mở đúng công trình (hành quân → bản đồ)
  type Run = { key: string; icon: IconName; text: string; end: number; go: (e: MouseEvent) => void }
  const runs = $derived.by(() => {
    const out: Run[] = []
    for (const j of game.queue)
      out.push({ key: `b${j.building}`, icon: 'hammer', text: `${L.b[j.building].name} · ${L.level(j.level)}`, end: j.finishAt, go: () => onfocus(j.building, 'upgrade') })
    if (game.train) {
      const u = unitOf(game.train.unit)
      out.push({ key: 't', icon: 'people', text: L.train.doing(game.train.n, `${L.units[u.type]} ${L.tiers[u.tier]}`), end: game.train.finishAt, go: () => onfocus('dienVoTruong', 'train') })
    }
    if (game.heal) out.push({ key: 'h', icon: 'heal', text: L.alchemy.healing(count(game.heal.troops)), end: game.heal.finishAt, go: () => onfocus('danPhong', 'alchemy') })
    if (game.brew) out.push({ key: 'p', icon: 'cauldron', text: L.alchemy.brewing(game.brew.n, L.pills[game.brew.pill].name), end: game.brew.finishAt, go: () => onfocus('danPhong', 'alchemy') })
    if (game.study) out.push({ key: 's', icon: 'scroll', text: L.library.doing(L.techs[game.study.tech], game.study.level), end: game.study.finishAt, go: () => onfocus('tangKinhCac', 'library') })
    for (const m of game.marches)
      out.push({ key: `m${m.id}`, icon: 'flag', text: L.activity.march(L.elders[m.elder].name, L.target(m.target)), end: now < m.arriveAt ? m.arriveAt : m.returnAt, go: e => ontab('banDo', e) })
    return out.sort((a, b) => a.end - b.end)
  })

  // Số chạy mượt khi tăng/giảm
  const powerT = Tween.of(() => power(game), { duration: 700 })
  const resT = RESOURCES.map(r => Tween.of(() => game.res[r], { duration: 450 }))
</script>

<div class="hud">
  <header class="topbar plank">
    <div class="row who">
      <span class="avatar"><Portrait look={MASTER} size={50} /><img class="frame" src={paintedUrl('ring', portraitRing, 62)} alt="" draggable="false" /></span>
      <div class="grow id">
        <b class="t-ellipsis">{game.name}</b>
        <span class="realm"><img src={paintedUrl('lotus', () => emblemArt('lotus'), 18)} width="18" height="18" alt="" draggable="false" />{L.realm(hall)}</span>
      </div>
      <span class="pow" title={L.power}><Icon name="power" size={14} /><span class="sr">{L.power}</span>{num(Math.round(powerT.current))}</span>
      <IconButton icon="gear" label={L.settings.open} size={34} onclick={onsettings} />
    </div>
    <ul class="res">
      {#each RESOURCES as r, i (r)}
        {@const full = game.res[r] >= cap}
        <li class:full data-res={r} title="{L.res[r]}: {num(game.res[r])} / {num(cap)} · +{num(rate(game, r))}{L.panel.perHour}">
          <Icon name={r} size={22} />
          <span class="stack">
            <b class="t-num">{num(Math.round(resT[i].current))}<span class="sr"> {L.res[r]}</span></b>
            <Meter value={game.res[r] / cap} tone={full ? 'bad' : 'spirit'} size="xs" dark />
          </span>
          {#if full}<em>{L.full}</em>{/if}
          {#if gain && gain.bag[r] && now - gain.t < 1400}
            {#key gain.t}<span class="float">+{num(gain.bag[r] ?? 0)}</span>{/key}
          {/if}
        </li>
      {/each}
    </ul>
  </header>

  <!-- màn hẹp: chỉ ở tab Tông môn; desktop: luôn nằm trong cột trái (CSS .away) -->
  {#if !storm}
    <div class="side" class:away={tab !== 'tongMon'}>
      {#if quest}
        <button class="quest" class:done class:enter={!held} onclick={done ? claim : onquest}>
          <span class="stack grow" style:--gap="3px">
            <small class="row">{L.quest.title}{#if prog}<b class="t-num">{num(Math.min(prog[0], prog[1]))}/{num(prog[1])}</b>{/if}</small>
            <b class="qt">{L.quest.text(quest)}</b>
            <Bag res={quest.reward} items={quest.items} size="sm" />
          </span>
          {#if held}
            <span class="stamp"><img src={paintedUrl('tick', () => emblemArt('tick'), 48)} width="48" height="48" alt="" draggable="false" /></span>
          {:else if done}
            <span class="claim"><Tag tone="gold" icon="star">{L.quest.claim}</Tag></span>
          {:else}
            <span class="go"><Icon name="arrow" size={16} /></span>
          {/if}
        </button>
      {:else}
        <p class="quest t-small t-lore">{L.quest.allDone}</p>
      {/if}
      {#if hall >= DAILY_HALL}
        <span class="daily" class:ready={ready > 0}>
          <IconButton icon="scroll" label="{L.daily.button}{ready ? ` (${ready})` : ''}" size={46} onclick={ondaily}><Badge n={ready} /></IconButton>
        </span>
      {/if}
      <section class="runs" aria-label={L.activity.title}>
        <h3>{L.activity.title}</h3>
        {#each runs as r (r.key)}
          <button class="run" onclick={r.go}><Icon name={r.icon} size={16} /><span class="grow t-ellipsis">{r.text}</span><b class="t-num">{clock(r.end - now)}</b></button>
        {:else}
          <p class="t-small">{L.activity.empty}</p>
        {/each}
      </section>
    </div>

    <button class="builder" class:away={tab !== 'tongMon'} class:idle={!job} onclick={onbuilder} aria-label="{L.builder.label}: {job ? clock(job.finishAt - now) : L.builder.idle}">
      <svg class="ring" viewBox="0 0 60 60" aria-hidden="true">
        <circle class="rbg" cx="30" cy="30" r="26" />
        <circle class="rfg" cx="30" cy="30" r="26" stroke-dasharray="{ring * 163.4} 163.4" />
      </svg>
      <Icon name="hammer" size={24} />
      <span class="btime">{job ? clock(job.finishAt - now) : L.builder.idle}</span>
    </button>
  {/if}

  <nav class="tabs plank">
    {#each TABS as t (t.id)}
      {@const on = t.id === tab}
      {@const locked = hall < t.unlock}
      {@const fresh = !locked && !visited.includes(t.id)}
      <button class:on class:locked disabled={locked} data-tab={t.id} aria-current={on ? 'page' : undefined} onclick={e => !on && ontab(t.id, e)}>
        <span class="medal">
          <img src={paintedUrl(`tab:${t.id}`, () => tabIcon(t.id), 44)} width="40" height="40" alt="" draggable="false" />
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

  /* Ván trên: gỗ sơn mài vân ngang, chỉ vàng đôi kẻ tay, ke góc đồng */
  .topbar {
    display: grid;
    gap: var(--sp-2);
    padding: calc(var(--sp-2) + var(--safe-t)) 20px 18px;
    filter: drop-shadow(0 6px 10px rgb(20 14 10 / 0.35));
  }
  .who {
    gap: var(--sp-2);
  }
  .avatar {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 56px;
    height: 56px;
  }
  .frame {
    position: absolute;
    inset: -3px;
    width: 62px;
    height: 62px;
    pointer-events: none;
  }
  .id {
    display: grid;
    line-height: 1.2;
  }
  .id b {
    font-size: var(--fs-4);
    font-weight: 800;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.6);
  }
  .realm {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--gold-l);
  }
  .pow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 13px 6px 11px;
    font-weight: 800;
    color: var(--gold-l);
    border: 0 solid transparent;
    border-image: var(--sk-tag-dark);
  }
  /* ô tài nguyên: bảng sơn mài bo tròn viền vàng kẻ tay */
  .res {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
  }
  .res li {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 5px 12px 7px 7px;
    border: 0 solid transparent;
    border-image: var(--sk-bubble);
  }
  .res .stack {
    flex: 1;
    min-width: 0;
    --gap: 4px;
  }
  .res b {
    font-size: var(--fs-4);
    line-height: 1;
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.5);
  }
  .full b {
    color: var(--cinnabar-l);
  }
  em {
    position: absolute;
    top: -9px;
    right: 2px;
    padding: 1px 7px 2px;
    font: 800 10px/1.4 var(--font);
    font-style: normal;
    color: var(--silk);
    border: 0 solid transparent;
    border-image: var(--sk-tag-red);
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

  /* Thẻ nhiệm vụ giấy bên trái, nút nhiệm vụ ngày bên phải */
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
    max-width: 80%;
    padding: 11px 12px 13px 15px;
    text-align: left;
    color: var(--text);
    border: 0 solid transparent;
    border-image: var(--sk-card);
    filter: drop-shadow(0 4px 8px rgb(20 14 10 / 0.3));
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
    border-image: var(--sk-card-glow);
    filter: drop-shadow(0 0 12px rgb(236 208 138 / 0.75));
  }
  .claim {
    pointer-events: none;
    animation: glow 1.4s var(--ease) infinite;
  }
  .stamp {
    display: grid;
    padding-inline: var(--sp-2);
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
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    color: var(--cinnabar);
    background: var(--img-disc-paper) center / 100% 100% no-repeat;
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

  /* Nút tạp dịch: đĩa sơn mài vòng vàng vẽ tay, vòng tiến độ linh khí */
  .builder {
    position: absolute;
    right: var(--sp-3);
    bottom: calc(112px + var(--safe-b));
    display: grid;
    place-items: center;
    width: 66px;
    height: 66px;
    color: var(--gold-l);
    background: var(--img-disc) center / 100% 100% no-repeat;
  }
  .builder:active {
    transform: scale(0.94);
  }
  .builder.idle {
    animation: glow 1.6s var(--ease) infinite;
  }
  .ring {
    position: absolute;
    inset: 5px;
    rotate: -90deg;
  }
  .rbg,
  .rfg {
    fill: none;
    stroke-width: 3.5;
  }
  .rbg {
    stroke: rgb(255 255 255 / 0.08);
  }
  .rfg {
    stroke: var(--spirit);
    stroke-linecap: round;
    transition: stroke-dasharray 0.25s linear;
  }
  .btime {
    position: absolute;
    bottom: -9px;
    left: 50%;
    padding: 2px 10px 3px;
    font: 800 var(--fs-1) / 1.4 var(--font);
    font-variant-numeric: tabular-nums lining-nums;
    color: var(--silk);
    white-space: nowrap;
    border: 0 solid transparent;
    border-image: var(--sk-tag-dark);
    translate: -50% 0;
  }
  .idle .btime {
    border-image: var(--sk-tag-red);
  }

  /* Ván tab: gỗ sơn mài viền vàng; tab đang mở nhô lên, icon toả ánh vàng, nét vàng dưới tên */
  .tabs {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 12px 14px calc(14px + var(--safe-b));
    filter: drop-shadow(0 -6px 12px rgb(20 14 10 / 0.3));
  }
  .tabs button {
    display: grid;
    justify-items: center;
    gap: 1px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--text-inv-soft);
  }
  .medal {
    position: relative;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    transition:
      transform var(--dur-2) var(--spring),
      filter var(--dur-2) var(--ease);
  }
  .medal img {
    display: block;
    filter: saturate(0.75) brightness(0.9);
  }
  .on .medal {
    transform: translateY(-7px) scale(1.14);
    filter: drop-shadow(0 0 8px rgb(236 208 138 / 0.85));
  }
  .on .medal img {
    filter: none;
  }
  .on .tl {
    padding: 0 6px 5px;
    font-weight: 800;
    color: var(--gold-l);
    background: var(--stroke-gold) no-repeat center bottom / 100% 5px;
  }
  .locked .medal img {
    filter: grayscale(1) brightness(0.6);
  }
  .lk {
    position: absolute;
    right: -2px;
    bottom: -2px;
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    color: var(--gold-l);
    background: var(--img-disc) center / 100% 100% no-repeat;
  }
  .tabs small {
    font-size: 10px;
    color: color-mix(in srgb, var(--silk) 50%, transparent);
  }
  .away,
  .runs {
    display: none;
  }
  /* điện thoại rất hẹp (320px): nút nhận thưởng xuống dòng, phần thưởng dàn ngang — thẻ không cao lên che biển tên Chủ điện */
  @media (max-width: 360px) {
    .quest {
      flex-wrap: wrap;
      row-gap: 6px;
    }
    .quest > .stack {
      flex-basis: 100%;
    }
  }

  /* ---------- Desktop: thanh trên một hàng, cột trái dọc (điều hướng, nhiệm vụ, tạp dịch) ---------- */
  @media (min-width: 1024px) and (min-height: 600px) {
    .hud {
      max-width: none;
    }
    .topbar {
      display: flex;
      align-items: center;
      gap: var(--sp-4);
      height: var(--top);
      padding: 0 28px;
    }
    .who {
      display: contents;
    }
    .id {
      width: calc(var(--rail) - 120px);
    }
    .res {
      flex: 1;
      max-width: 640px;
      margin: 0 auto;
      gap: var(--sp-3);
    }
    .pow {
      order: 3;
    }
    .who > :global(:last-child) {
      order: 4;
    }
    .res {
      order: 2;
    }

    .tabs {
      top: var(--top);
      right: auto;
      bottom: 0;
      width: var(--rail);
      grid-template-columns: 1fr;
      grid-auto-rows: 58px;
      align-content: start;
      gap: 2px;
      padding: var(--sp-4) var(--sp-4) 0;
      filter: drop-shadow(6px 0 12px rgb(20 14 10 / 0.3));
    }
    .tabs button {
      display: flex;
      align-items: center;
      gap: var(--sp-3);
      padding: 0 var(--sp-3);
      font-size: var(--fs-4);
      border-radius: 10px;
      transition: background var(--dur-2) var(--ease);
    }
    .tabs button:not(:disabled):hover {
      background: rgb(236 208 138 / 0.08);
    }
    .on .medal {
      transform: scale(1.12);
    }
    .tabs small {
      margin-left: auto;
      font-size: var(--fs-1);
    }

    .side,
    .side.away {
      position: absolute;
      top: calc(var(--top) + var(--sp-4) + 5 * 60px + var(--sp-4));
      left: 0;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      bottom: 0;
      justify-content: flex-start;
      width: var(--rail);
      padding: 0 var(--sp-4) var(--sp-4);
      overflow-y: auto;
      scrollbar-width: thin;
    }
    .quest {
      max-width: none;
      cursor: pointer;
    }
    .quest:hover:not(.done) {
      filter: drop-shadow(0 4px 12px rgb(236 208 138 / 0.35));
    }
    .daily {
      align-self: flex-start;
    }
    .runs {
      display: grid;
      gap: 2px;
      margin-top: var(--sp-3);
      color: var(--text-inv-soft);
    }
    .runs h3 {
      margin-bottom: var(--sp-1);
      font-size: var(--fs-1);
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--gold-l);
    }
    .run {
      display: flex;
      align-items: center;
      gap: var(--sp-2);
      min-width: 0;
      padding: 7px var(--sp-2);
      font-size: var(--fs-2);
      text-align: left;
      color: var(--silk);
      border-radius: 8px;
    }
    .run:hover {
      background: rgb(236 208 138 / 0.1);
    }
    .run b {
      color: var(--gold-l);
    }
    /* góc dưới phải vùng cảnh, tránh ngăn kéo đang mở */
    .builder,
    .builder.away {
      right: calc(var(--sp-5) + var(--dockw, 0px));
      bottom: var(--sp-5);
      display: grid;
      transition: right var(--dur-2) var(--ease);
    }
  }
</style>
