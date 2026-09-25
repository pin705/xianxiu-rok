<script lang="ts">
  // HUD: dải giấy bồi lụa trên cùng (chưởng môn, thế lực, tài nguyên), thẻ nhiệm vụ giấy, nút tạp dịch,
  // dải tab dưới cùng — mọi mặt đều vẽ tay (da từ theme.ts, icon/huy hiệu từ @rok/art), cùng họ màu với tranh.
  import { untrack } from 'svelte'
  import { Tween } from 'svelte/motion'
  import {
    DAILY_HALL,
    LEGION_WAVES,
    PVP_HALL,
    weekOf,
    arenaOf,
    RESOURCES,
    count,
    achCount,
    dailyReady,
    sideReady,
    dayOf,
    festReady,
    tavernFree,
    burning,
    mendReady,
    wallHp,
    wallMax,
    vipLevel,
    isWeekend,
    power,
    questDone,
    questOf,
    questProgress,
    rate,
    storage,
    unitOf,
    type Bag as Res,
    type Res as ResId,
    type BuildingId,
    type State,
  } from '@rok/rules'
  import Buffs from './Buffs.svelte'
  import PowerSheet from './PowerSheet.svelte'
  import ResSheet from './ResSheet.svelte'
  import VipSheet from './VipSheet.svelte'
  import { useGame } from './game'
  import { social } from './social.svelte'
  import { helpsOf, legionAt, type AllyInfo } from '@rok/rules/world'
  import { Icon, Portrait, emblemArt, type IconName, paintedUrl, portraitRing, tabIcon, type Look } from '@rok/art'
  import { Badge, Bag, IconButton, Meter, Tag } from './ui'
  import { L, TABS, clock, num, progress, sfx, visitTab, visitedTabs, type Tab, type PanelTab } from './lib'

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
    onfests = () => {},
    onranks = () => {},
    onmail = () => {},
    onfocus,
    ally = null,
    me = null,
    onhelp,
    onrecall = () => {},
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
    onfests?: () => void // trung tâm sự kiện
    onranks?: () => void // chạm chân dung khi chưa vào giới: xếp hạng
    onmail?: () => void
    onfocus: (id: BuildingId, view?: PanelTab) => void // mở bảng công trình (danh sách việc đang chạy)
    ally?: AllyInfo | null // tiên minh của mình: nút giúp đỡ nổi (như bàn tay giúp của RoK)
    me?: number | null
    onhelp?: () => Promise<unknown>
    onrecall?: (id: number) => void // gọi đội khai mỏ về (địch đang tới cướp khoáng)
  } = $props()

  const MASTER: Look = {
    id: 'master',
    robe: '#1b4566',
    trim: '#c9a14a',
    hair: '#211c17',
    style: 'bun',
    bg: '#78a6c2',
    mark: '#b8382a',
  }
  const ready = $derived(dailyReady(game) + festReady(game, now, 'daily') + sideReady(game))
  const fests = $derived(festReady(game, now))
  // chấm trên tab: Bảo khố = thành tựu chờ nhận; Môn hạ còn chấm khi Chiêu Hiền Đài có lượt miễn phí
  const tavernReady = $derived(
    (['silver', 'gold'] as const).some(k => tavernFree({ ...game, time: now }, k)) && !!game.tavern,
  )
  let resOpen = $state<ResId | null>(null)
  let vipOpen = $state(false)
  let powOpen = $state(false) // bảng Thế lực
  // đội địch đang kéo tới (chưa tới nơi) và Hộ Sơn Phù nhỏ nhất đang có để bật khiên ngay
  const g = useGame()
  // đội địch đang kéo tới; các đội tới cùng lúc là một kết trận — một thẻ, đếm số đội
  const incoming = $derived.by(() => {
    // cướp khoáng: khiên không che đội khai; đội đã gọi về (không còn khai ở đó) thì thôi báo
    const digs = (i: number) =>
      game.marches.some(m => m.target.kind === 'spot' && m.target.i === i && (m.mine?.end ?? 0) > now)
    const live = (game.incoming ?? []).filter(
      x => x.at > now && (x.spot === undefined ? game.shield <= now : digs(x.spot)),
    )
    return live
      .filter((x, k) => live.findIndex(y => y.at === x.at) === k)
      .map(x => ({
        ...x,
        n: live.filter(y => y.at === x.at).length,
      }))
  })
  const ward = $derived((['hoSon8', 'hoSon24', 'hoSon72'] as const).find(id => (game.items[id] ?? 0) > 0))
  let visited = $state(visitedTabs())
  // Ghé tab bằng cách nào cũng tính (bấm tab, hay nhiệm vụ dẫn sang bản đồ)
  $effect(() => {
    visitTab(tab)
    visited = visitedTabs()
  })

  const hall = $derived(game.levels.chuDien)
  const duels = $derived(hall >= PVP_HALL ? arenaOf(game, now).left : 0) // lượt Luận Kiếm Đài còn hôm nay
  // việc đồng minh đang nhờ mà mình giúp được: nút nổi, một chạm giúp tất cả
  const helpable = $derived(
    ally && me !== null
      ? ally.helps.filter(h => h.pid !== me && !h.by.includes(me) && h.by.length < helpsOf(ally)).length
      : 0,
  )
  // Ma Triều Công Sơn sắp tới / đang đánh (minh mình đã ghi danh): đợt kế và lúc giáng
  const legion = $derived.by(() => {
    const wk = weekOf(now)
    const lg = ally?.legion
    if (!lg?.signed || lg.week !== wk || lg.done >= LEGION_WAVES) return null
    const at = legionAt(wk, lg.done)
    return now >= legionAt(wk, 0) - 15 * 60_000 ? { k: lg.done, at } : null
  })
  const cap = $derived(storage(game))
  const job = $derived(game.queue[0])
  const live = $derived(questOf(game))
  const liveProg = $derived(
    live && live.k !== 'build' && live.k !== 'hunt' && live.k !== 'sect' ? questProgress(game, live) : null,
  )
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
  // Tiên minh: việc đồng minh nhờ giúp + đơn xin vào / lời đề nghị minh ước chờ trưởng lão, minh chủ trả lời
  const allyTodo = $derived(
    helpable +
      (ally && me !== null && (ally.members[me] ?? 0) >= 1
        ? (ally.applicants?.length ?? 0) + (ally.napIn?.length ?? 0)
        : 0),
  )
  const tabCount = $derived<Partial<Record<Tab, number>>>({
    banDo: unread,
    baoKho: game.ach ? achCount(game) : 0,
    tienMinh: allyTodo,
  })
  const hurt = $derived(!game.heal && count(game.wounded) > 0)
  // thư mới chưa đọc hoặc còn quà chưa nhận
  const letters = $derived(game.mail.filter(m => m.id > game.seen || (m.gift && !m.got)).length)

  // Cột trái desktop: mọi việc có đồng hồ, bấm là mở đúng công trình (hành quân → bản đồ)
  type Run = { key: string; icon: IconName; text: string; end: number; go: (e: MouseEvent) => void }
  const runs = $derived.by(() => {
    const out: Run[] = []
    for (const j of game.queue)
      out.push({
        key: `b${j.building}`,
        icon: 'hammer',
        text: `${L.b[j.building].name} · ${L.level(j.level)}`,
        end: j.finishAt,
        go: () => onfocus(j.building, 'upgrade'),
      })
    if (game.train) {
      const u = unitOf(game.train.unit)
      out.push({
        key: 't',
        icon: 'people',
        text: L.train.doing(game.train.n, `${L.units[u.type]} ${L.tiers[u.tier]}`),
        end: game.train.finishAt,
        go: () => onfocus('dienVoTruong', 'train'),
      })
    }
    if (game.heal)
      out.push({
        key: 'h',
        icon: 'heal',
        text: L.alchemy.healing(count(game.heal.troops)),
        end: game.heal.finishAt,
        go: () => onfocus('danPhong', 'alchemy'),
      })
    if (game.brew)
      out.push({
        key: 'p',
        icon: 'cauldron',
        text: L.alchemy.brewing(game.brew.n, L.pills[game.brew.pill].name),
        end: game.brew.finishAt,
        go: () => onfocus('danPhong', 'alchemy'),
      })
    if (game.forge)
      out.push({
        key: 'f',
        icon: 'hammer',
        text: L.forge.doing(L.gear[game.forge.gear], game.forge.level),
        end: game.forge.finishAt,
        go: () => onfocus('luyenKhiPhong', 'forge'),
      })
    if (game.study)
      out.push({
        key: 's',
        icon: 'scroll',
        text: L.library.doing(L.techs[game.study.tech], game.study.level),
        end: game.study.finishAt,
        go: () => onfocus('tangKinhCac', 'library'),
      })
    for (const m of game.marches)
      out.push({
        key: `m${m.id}`,
        icon: 'flag',
        text: L.activity.march(L.elders[m.elder].name, L.target(m.target)),
        end: now < m.arriveAt ? m.arriveAt : m.returnAt,
        go: e => (m.target.kind === 'trib' ? onfocus('chuDien', 'upgrade') : ontab('banDo', e)),
      })
    // nhà rảnh (như "idle" của RoK): có nhà mà không làm gì — chip son nhấp nháy, chạm là tới đúng bảng
    const idle = (key: string, icon: IconName, b: BuildingId, view: PanelTab, text: string) =>
      out.push({ key, icon, text, end: 0, go: () => onfocus(b, view) })
    if (!game.train && game.levels.dienVoTruong > 0) idle('ti', 'people', 'dienVoTruong', 'train', L.train.tab)
    if (!game.study && game.levels.tangKinhCac > 0) idle('si', 'scroll', 'tangKinhCac', 'library', L.library.tab)
    if (!game.brew && game.levels.danPhong > 0) idle('pi', 'cauldron', 'danPhong', 'alchemy', L.alchemy.brew)
    return out.sort((a, b) => a.end - b.end)
  })

  // Số chạy mượt khi tăng/giảm
  const powerT = Tween.of(() => power(game), { duration: 700 })
  // thế lực tăng (xây / tuyển / lĩnh ngộ xong…): "+N" bay lên cạnh con số như RoK, gộp các lần tăng sát nhau
  let powUp = $state<{ n: number; t: number } | null>(null)
  let lastPow = -1 // −1: chưa đo (lần đầu không bay)
  $effect(() => {
    const p = Math.round(power(game))
    const d = lastPow < 0 ? 0 : p - lastPow
    lastPow = p
    if (d > 0) untrack(() => (powUp = { n: (powUp && Date.now() - powUp.t < 1500 ? powUp.n : 0) + d, t: Date.now() }))
  })
  const resT = RESOURCES.map(r => Tween.of(() => game.res[r], { duration: 450 }))
</script>

<div class="hud">
  <header class="topbar strip">
    <div class="who">
      <!-- chân dung: chạm xem hồ sơ của mình (như RoK; chưa vào giới thì xem xếp hạng); vòng khiên xanh khi được bảo hộ -->
      <button
        class="avatar"
        class:shielded={game.shield > now}
        onclick={() => (me !== null ? (social.profile = me) : onranks())}
        aria-label={me !== null ? L.profile.mine : L.rank.open}
      >
        <Portrait look={MASTER} size={50} /><img
          class="frame"
          src={paintedUrl('ring', portraitRing, 62)}
          alt=""
          draggable="false"
        />
        {#if game.shield > now}<span class="shield" title={L.pvp.shield(clock(game.shield - now))}
            ><Icon name="shield" size={18} /></span
          >{/if}
      </button>
      <div class="grow id">
        <b class="t-ellipsis">{game.name}</b>
        <span class="realm"
          ><img
            src={paintedUrl('lotus', () => emblemArt('lotus'), 18)}
            width="18"
            height="18"
            alt=""
            draggable="false"
          />{L.realm(hall)}</span
        >
        <!-- Hương Hỏa (VIP): chấm son khi lễ vật hôm nay chưa nhận -->
        <button class="vip" onclick={() => (vipOpen = true)} aria-label={L.vip.level(vipLevel(game))}
          >{L.vip.short(vipLevel(game))}{#if game.vip && game.vip.chest !== dayOf(now)}<Badge dot />{/if}</button
        >
      </div>
      <button class="pow" title={L.power} onclick={() => (powOpen = true)}
        ><Icon name="power" size={14} /><span class="sr">{L.power}</span>{num(
          Math.round(powerT.current),
        )}{#if powUp}{#key powUp.t}<span class="float up" aria-hidden="true">+{num(powUp.n)}</span>{/key}{/if}</button
      >
      <IconButton icon="mail" label="{L.mail.title}{letters ? ` (${letters})` : ''}" size={34} onclick={onmail}
        ><Badge n={letters} /></IconButton
      >
      <IconButton icon="gear" label={L.settings.open} size={34} onclick={onsettings} />
      <!-- dải tăng ích (khiên, phù, đan…) dưới cụm nút, chạm để xem từng nguồn và hạn -->
      <span class="boosts"><Buffs /></span>
    </div>
    <ul class="res">
      {#each RESOURCES as r, i (r)}
        {@const full = game.res[r] >= cap}
        <li
          class:full
          data-res={r}
          title="{L.res[r]}: {num(game.res[r])} / {num(cap)} · +{num(rate(game, r))}{L.panel.perHour}"
        >
          <Icon name={r} size={22} />
          <span class="stack">
            <b class="t-num">{num(Math.round(resT[i].current))}<span class="sr"> {L.res[r]}</span></b>
            <Meter value={game.res[r] / cap} tone={full ? 'bad' : 'spirit'} size="xs" />
          </span>
          {#if full}<em>{L.full}</em>{/if}
          <!-- chạm ô: bảng tài nguyên (sản lượng, sức chứa, mở nang, đổi ở Thương hội) -->
          <button class="rb" aria-label="{L.res[r]}: {num(game.res[r])} / {num(cap)}" onclick={() => (resOpen = r)}
          ></button>
          {#if gain && gain.bag[r] && now - gain.t < 1400}
            {#key gain.t}<span class="float">+{num(gain.bag[r] ?? 0)}</span>{/key}
          {/if}
        </li>
      {/each}
    </ul>
    <!-- Bế Quan Lệnh: đang bế quan — nói rõ vì sao không làm được gì, xuất quan ngay tại đây -->
    {#if game.seclude && game.seclude.until > now}
      <div class="alarm calm" role="status">
        <Icon name="shield" size={18} />
        <span class="grow"
          ><b>{L.seclude.on(clock(game.seclude.until - now))}</b><br /><small>{L.seclude.onHint}</small></span
        >
        <button class="shieldup" onclick={() => g.act({ type: 'unseclude' }, 'tap')}>{L.seclude.off}</button>
      </div>
    {/if}
    <!-- Linh hỏa thiêu sơn (thành cháy của RoK): núi đang cháy, trận lực tụt — dập lửa / tu bổ ngay tại đây -->
    {#if burning(game, now)}
      <div class="alarm" role="alert">
        <Icon name="shield" size={18} />
        <span class="grow"
          ><b>{L.wall.alarm(Math.round((wallHp(game, now) / wallMax(game)) * 100), clock(game.wall!.fire - now))}</b><br
          /><small>{L.wall.alarmHint}</small></span
        >
        {#if game.items.tucHoa}
          <button class="shieldup" onclick={() => g.act({ type: 'use', item: 'tucHoa', n: 1 }, 'reward')}
            >{L.wall.douse(game.items.tucHoa)}</button
          >
        {:else if mendReady(game, now)}
          <button class="shieldup" onclick={() => g.act({ type: 'mend' }, 'tap')}>{L.wall.mend}</button>
        {/if}
      </div>
    {/if}
    <!-- Tháp canh (như RoK): đội địch đang kéo tới — thẻ son ở mọi tab, bật khiên ngay tại đây -->
    {#each incoming as x (`${x.pid}:${x.id}`)}
      {@const digger = game.marches.find(
        m => m.target.kind === 'spot' && m.target.i === x.spot && m.mine && m.mine.end > now,
      )}
      <div class="alarm" role="alert">
        <Icon name="swords" size={18} />
        <span class="grow"
          ><b
            >{x.spot !== undefined
              ? L.pvp.robIncoming(x.foe)
              : x.n > 1
                ? L.pvp.incomingRally(x.foe, x.n)
                : L.pvp.incoming(x.foe)}</b
          >
          <span class="t-num">{clock(x.at - now)}</span><br /><small
            >{x.spot !== undefined ? L.pvp.robIncomingHint : L.pvp.incomingHint}</small
          ></span
        >
        {#if digger}<button class="shieldup" onclick={() => onrecall(digger.id)}>{L.world.recall}</button>{/if}
        {#if ward && x.spot === undefined}
          <button
            class="shieldup"
            disabled={(game.frenzy ?? 0) > now}
            onclick={() => g.act({ type: 'use', item: ward, n: 1 }, 'reward')}>{L.pvp.shieldUp}</button
          >
        {/if}
      </div>
    {/each}
    <!-- Ma Triều Công Sơn: minh đã ghi danh, từ 15 phút trước đợt đầu tới hết đợt cuối — nhắc kéo viện binh, chữa thương -->
    {#if legion}
      <button class="alarm legion" onclick={e => ontab('tienMinh', e)}>
        <Icon name="shield" size={18} />
        <span class="grow"
          ><b>{L.legion.next(legion.k + 1, clock(legion.at - now))}</b><br /><small>{L.legion.alarm}</small></span
        >
      </button>
    {/if}
  </header>

  <!-- màn hẹp: chỉ ở tab Tông môn; desktop: luôn nằm trong cột trái (CSS .away) -->
  {#if !storm}
    <div class="side" class:away={tab !== 'tongMon'}>
      {#if quest}
        <button class="quest" class:done class:enter={!held} onclick={done ? claim : onquest}>
          <span class="stack grow" style:--gap="3px">
            <small class="row"
              >{L.quest.title}{#if prog}<b class="t-num">{num(Math.min(prog[0], prog[1]))}/{num(prog[1])}</b
                >{/if}</small
            >
            <b class="qt">{L.quest.text(quest)}</b>
            <Bag res={quest.reward} items={quest.items} size="sm" />
          </span>
          {#if held}
            <span class="stamp"
              ><img
                src={paintedUrl('tick', () => emblemArt('tick'), 48)}
                width="48"
                height="48"
                alt=""
                draggable="false"
              /></span
            >
          {:else if done}
            <span class="claim"><Tag tone="gold" icon="star">{L.quest.claim}</Tag></span>
          {:else}
            <span class="go"><Icon name="arrow" size={16} /></span>
          {/if}
        </button>
      {:else}
        <p class="quest t-small t-lore">{L.quest.allDone}</p>
      {/if}
      <!-- trung tâm sự kiện: luôn có (sự kiện tân thủ từ ngày đầu), chấm đỏ = quà chờ nhận -->
      <span class="daily" class:ready={fests > 0}>
        <IconButton icon="star" label="{L.fest.button}{fests ? ` (${fests})` : ''}" size={46} onclick={onfests}
          ><Badge n={fests} /></IconButton
        >
      </span>
      <!-- Luận Kiếm Đài: từ tầng mở Tranh đoạt, chấm đỏ = còn lượt hôm nay -->
      {#if hall >= PVP_HALL}
        <span class="daily" class:ready={duels > 0}>
          <IconButton
            icon="swords"
            label="{L.arena.title}{duels ? ` (${duels})` : ''}"
            size={46}
            onclick={() => (social.arena = true)}><Badge n={duels} /></IconButton
          >
        </span>
      {/if}
      {#if hall >= DAILY_HALL}
        <span class="daily" class:ready={ready > 0}>
          <IconButton icon="scroll" label="{L.daily.button}{ready ? ` (${ready})` : ''}" size={46} onclick={ondaily}
            ><Badge n={ready} /></IconButton
          >
          <!-- sự kiện cuối tuần đang diễn ra: nhãn vàng ngay dưới nút nhiệm vụ (chi tiết trong bảng nhiệm vụ) -->
          {#if isWeekend(now)}<Tag tone="gold" size="sm" icon="star">{L.weekend.tag}</Tag>{/if}
        </span>
      {/if}
      <section class="runs" aria-label={L.activity.title}>
        <h3>{L.activity.title}</h3>
        {#each runs as r (r.key)}
          <button
            class="run"
            class:idle={!r.end}
            onclick={r.go}
            aria-label="{r.text}: {r.end ? clock(r.end - now) : L.builder.idle}"
            ><Icon name={r.icon} size={16} /><span class="grow t-ellipsis">{r.text}</span><b class="t-num"
              >{r.end ? clock(r.end - now) : L.builder.idle}</b
            ></button
          >
        {:else}
          <p class="t-small">{L.activity.empty}</p>
        {/each}
      </section>
    </div>

    <button
      class="builder"
      class:away={tab !== 'tongMon'}
      class:idle={!job}
      onclick={onbuilder}
      aria-label="{L.builder.label}: {job ? clock(job.finishAt - now) : L.builder.idle}"
    >
      <svg class="ring" viewBox="0 0 60 60" aria-hidden="true">
        <circle class="rbg" cx="30" cy="30" r="26" />
        <circle class="rfg" cx="30" cy="30" r="26" stroke-dasharray="{ring * 163.4} 163.4" />
      </svg>
      <Icon name="hammer" size={24} />
      <span class="btime">{job ? clock(job.finishAt - now) : L.builder.idle}</span>
      <!-- tạp dịch thứ hai (Tạp Dịch Lệnh) đang rảnh: chấm son nhắc xây thêm một công trình -->
      {#if job && (game.builder2 ?? 0) > now && game.queue.length < 2}<Badge dot />{/if}
    </button>
  {/if}

  {#if helpable && onhelp && !storm}
    <button
      class="helpall"
      onclick={async () => {
        await onhelp()
        sfx('reward')
      }}
      aria-label={L.ally.helpAll(helpable)}><Icon name="people" size={26} /><Badge n={helpable} /></button
    >
  {/if}

  <nav class="tabs strip">
    {#each TABS as t (t.id)}
      {@const on = t.id === tab}
      {@const locked = hall < t.unlock}
      {@const fresh = !locked && !visited.includes(t.id)}
      <button
        class:on
        class:locked
        disabled={locked}
        data-tab={t.id}
        aria-current={on ? 'page' : undefined}
        onclick={e => !on && ontab(t.id, e)}
      >
        <span class="medal">
          <img
            src={paintedUrl(`tab:${t.id}`, () => tabIcon(t.id), 44)}
            width="40"
            height="40"
            alt=""
            draggable="false"
          />
          {#if locked}<span class="lk"><Icon name="lock" size={10} /></span>{/if}
          {#if !on}<Badge n={tabCount[t.id] ?? 0} dot={t.id === 'monHa' && (hurt || tavernReady)} {fresh} />{/if}
        </span>
        <span class="tl">{L.tabs[t.id]}</span>
        {#if locked}<small>{t.unlock > 15 ? L.soonTag : L.level(t.unlock)}</small>{/if}
      </button>
    {/each}
  </nav>
</div>
<ResSheet res={resOpen} onclose={() => (resOpen = null)} {onfocus} />
<VipSheet open={vipOpen} onclose={() => (vipOpen = false)} />
<PowerSheet open={powOpen} {game} onclose={() => (powOpen = false)} {onfocus} {ontab} />

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
    filter: drop-shadow(0 4px 10px rgb(var(--shade) / 0.18));
  }
  /* điện thoại: chân dung, tên cao hai hàng; hàng dưới của cụm nút là dải tăng ích */
  .who {
    display: grid;
    grid-template-columns: auto 1fr auto auto auto;
    grid-template-rows: 34px auto;
    gap: 2px var(--sp-2);
    align-items: center;
  }
  .avatar,
  .id {
    grid-row: span 2;
  }
  .boosts {
    grid-column: 3 / -1;
    justify-self: end;
    min-height: 22px;
  }
  .avatar {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 56px;
    height: 56px;
    padding: 0;
    background: none;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
  }
  .shielded {
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--malachite) 70%, transparent),
      0 0 10px color-mix(in srgb, var(--malachite) 50%, transparent);
  }
  .shield {
    position: absolute;
    right: -4px;
    bottom: -4px;
    line-height: 0;
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
  }
  .realm {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--cinnabar);
  }
  .pow {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 13px 6px 11px;
    font-weight: 800;
    color: var(--text);
    border: 0 solid transparent;
    border-image: var(--sk-tag-silk);
  }
  /* ô tài nguyên: viên giấy viền mực */
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
    border-image: var(--sk-capsule);
  }
  .res .stack {
    flex: 1;
    min-width: 0;
    --gap: 4px;
  }
  .rb {
    position: absolute;
    inset: 0;
    cursor: pointer;
    background: none;
    border: 0;
  }
  /* Tháp canh: thẻ son nhấp nháy viền khi có đội địch kéo tới */
  .alarm {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 6px 10px;
    font-size: var(--fs-2);
    color: var(--silk);
    pointer-events: auto;
    background: color-mix(in srgb, var(--cinnabar) 88%, var(--ink));
    border: 1.5px solid var(--gold-l);
    border-radius: 10px;
    animation: alarm 1.2s var(--ease) infinite;
  }
  /* bế quan: dải lam lục yên tĩnh, không nhấp nháy như báo động */
  .alarm.calm {
    background: color-mix(in srgb, var(--jade, #3f7f6f) 85%, var(--ink));
    animation: none;
  }
  .alarm small {
    opacity: 0.85;
  }
  /* Ma triều: chàm sẫm (không phải đội người đang kéo tới), chạm sang tab Tiên minh */
  .legion {
    width: 100%;
    font: inherit;
    font-size: var(--fs-2);
    text-align: left;
    cursor: pointer;
    background: color-mix(in srgb, var(--indigo) 86%, var(--ink));
    animation: none;
  }
  .shieldup {
    flex: none;
    padding: 4px 10px;
    font-weight: 800;
    color: var(--text);
    background: var(--gold-l);
    border: 0;
    border-radius: 8px;
    cursor: pointer;
  }
  .shieldup:disabled {
    opacity: 0.5;
  }
  @keyframes alarm {
    0%,
    100% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--cinnabar) 60%, transparent);
    }
    50% {
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--cinnabar) 0%, transparent);
    }
  }
  /* Hương Hỏa: nhãn vàng nhỏ dưới cảnh giới, như huy hiệu VIP cạnh chân dung của RoK */
  .vip {
    position: relative;
    justify-self: start;
    width: max-content;
    min-height: 22px;
    margin-top: 2px;
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--gold-d);
    background: color-mix(in srgb, var(--paper) 70%, transparent);
    border: 1px solid color-mix(in srgb, var(--rim) 80%, transparent);
    border-radius: 999px;
    cursor: pointer;
  }
  .vip :global(.badge) {
    position: absolute;
    top: -4px;
    right: -6px;
  }
  .res b {
    font-size: var(--fs-4);
    line-height: 1;
  }
  .full b {
    color: var(--cinnabar);
  }
  em {
    position: absolute;
    top: -9px;
    right: 2px;
    padding: 1px 7px 2px;
    font: 800 var(--fs-1) / 1.4 var(--font);
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
    color: var(--gold-d);
    -webkit-text-stroke: 3px var(--paper);
    paint-order: stroke fill;
    pointer-events: none;
    animation: float 1.4s var(--ease) forwards;
  }
  .float.up {
    left: 50%;
    top: 100%;
    font-size: var(--fs-3);
    color: var(--malachite);
    white-space: nowrap;
    translate: -50% 0;
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
    filter: drop-shadow(0 4px 8px rgb(var(--shade) / 0.3));
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
    filter: drop-shadow(0 0 12px rgb(var(--gold-glow) / 0.75));
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
    0% {
      opacity: 0;
      scale: 2.6;
      rotate: -16deg;
    }
    60% {
      opacity: 1;
      scale: 0.92;
      rotate: 0deg;
    }
    100% {
      opacity: 1;
      scale: 1;
    }
  }
  .enter {
    animation: enter var(--dur-3) var(--spring);
  }
  @keyframes enter {
    from {
      opacity: 0;
      translate: -14px 0;
    }
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
  .daily {
    display: grid;
    justify-items: end;
    gap: 4px;
    white-space: nowrap;
  }
  .daily.ready :global(.ib) {
    animation: glow 1.6s var(--ease) infinite;
    border-radius: 50%;
  }
  @keyframes glow {
    0% {
      filter: drop-shadow(0 0 0 rgb(var(--gold-glow) / 0.9));
    }
    60%,
    100% {
      filter: drop-shadow(0 0 9px rgb(var(--gold-glow) / 0));
    }
  }

  /* Nút tạp dịch: đĩa lụa lam lục vòng vàng vẽ tay, vòng tiến độ linh khí */
  .builder {
    position: absolute;
    right: var(--sp-3);
    bottom: calc(112px + var(--safe-b));
    display: grid;
    place-items: center;
    width: 66px;
    height: 66px;
    color: var(--text);
    background: var(--img-disc-silk) center / 100% 100% no-repeat;
  }
  .builder:active {
    transform: scale(0.94);
  }
  /* giúp đỡ đồng minh: đĩa vàng nổi trên nút tạp dịch, mọi tab */
  .helpall {
    position: absolute;
    right: calc(var(--sp-3) + 8px);
    bottom: calc(190px + var(--safe-b));
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    color: var(--text);
    pointer-events: auto;
    background: var(--img-disc-gold) center / 100% 100% no-repeat;
    border: 0;
    animation: glow 1.6s var(--ease) infinite;
    cursor: pointer;
  }
  .helpall:active {
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
    stroke: color-mix(in srgb, var(--ivory) 15%, transparent);
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
    color: var(--text);
    white-space: nowrap;
    border: 0 solid transparent;
    border-image: var(--sk-tag-silk);
    translate: -50% 0;
  }
  .idle .btime {
    color: var(--silk);
    border-image: var(--sk-tag-red);
  }

  /* Dải tab: giấy bồi lụa lam lục; tab đang mở nhô lên, icon toả ánh vàng nhạt, tên màu son gạch nét son */
  .tabs {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 12px 14px calc(14px + var(--safe-b));
    filter: drop-shadow(0 -4px 10px rgb(var(--shade) / 0.18));
  }
  .tabs button {
    display: grid;
    justify-items: center;
    gap: 1px;
    font-size: var(--fs-2);
    font-weight: 700;
    color: var(--text-soft);
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
    opacity: 0.85;
    filter: saturate(0.85);
  }
  .on .medal {
    transform: translateY(-7px) scale(1.14);
    filter: drop-shadow(0 0 7px rgb(201 161 74 / 0.55));
  }
  .on .medal img {
    opacity: 1;
    filter: none;
  }
  .on .tl {
    padding: 0 6px 5px;
    font-weight: 800;
    color: var(--cinnabar);
    background: var(--stroke-red) no-repeat center bottom / 100% 5px;
  }
  .locked .medal img {
    opacity: 0.55;
    filter: grayscale(1);
  }
  .lk {
    position: absolute;
    right: -2px;
    bottom: -2px;
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    color: var(--text);
    background: var(--img-disc-silk) center / 100% 100% no-repeat;
  }
  .tabs small {
    font-size: var(--fs-1);
    color: var(--text-faint);
  }
  .away {
    display: none;
  }
  /* Điện thoại: dải "Đang diễn ra" dưới thẻ nhiệm vụ — chip biểu tượng + đồng hồ, chip "Rảnh" son nhấp nháy;
     cột phải là các đĩa (Sự kiện, Nhiệm vụ ngày) xếp dọc như cột biểu tượng của RoK */
  .side {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    justify-items: start;
  }
  /* điện thoại: cột nhiệm vụ chỉ ở tab Tông môn (desktop luôn hiện trong cột trái — xem @media dưới) */
  .side.away {
    display: none;
  }
  .side > .quest {
    grid-column: 1;
    grid-row: 1;
  }
  .side > .daily {
    grid-column: 2;
  }
  .runs {
    grid-column: 1;
    grid-row: 2 / span 2;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    max-width: 100%;
  }
  .runs h3,
  .runs > p {
    display: none;
  }
  .run {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px 3px 6px;
    font-size: var(--fs-2);
    color: var(--text);
    pointer-events: auto;
    background: color-mix(in srgb, var(--paper2) 90%, transparent);
    border: 1px solid var(--paper3);
    border-radius: 999px;
    box-shadow: 0 1px 3px rgb(var(--shade) / 0.18);
  }
  .run span {
    display: none;
  }
  .run b {
    color: var(--gold-d);
  }
  .run.idle {
    border-color: var(--cinnabar);
    animation: nudge 1.8s var(--ease) infinite;
  }
  .run.idle b {
    color: var(--cinnabar);
  }
  /* màn hẹp: nhà rảnh chỉ còn icon viền son (chữ "Rảnh" nằm trong aria-label) — ba viên cùng ghi "Rảnh" đè lên cảnh, rối mắt */
  @media (max-width: 1023px), (max-height: 599px) {
    .run.idle {
      padding: 4px 7px;
    }
    .run.idle b {
      display: none;
    }
  }
  @keyframes nudge {
    0%,
    70%,
    100% {
      transform: none;
    }
    80% {
      transform: translateY(-2px);
    }
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
      order: 2;
    }
    .pow {
      order: 3;
    }
    /* thư, cài đặt về cuối hàng; dải tăng ích (con cuối) ngay sau tên */
    .who > :global(:nth-last-child(2)),
    .who > :global(:nth-last-child(3)) {
      order: 4;
    }
    .boosts {
      order: 1;
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
      filter: drop-shadow(4px 0 10px rgb(var(--shade) / 0.18));
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
      background: color-mix(in srgb, var(--azurite-l) 18%, transparent);
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
      filter: drop-shadow(0 4px 12px rgb(var(--gold-glow) / 0.35));
    }
    .daily {
      align-self: flex-start;
      justify-items: start;
    }
    .runs {
      display: grid;
      gap: 2px;
      margin-top: var(--sp-3);
      color: var(--text-soft);
    }
    .runs h3 {
      margin-bottom: var(--sp-1);
      font-size: var(--fs-1);
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--cinnabar);
    }
    .run {
      display: flex;
      align-items: center;
      gap: var(--sp-2);
      min-width: 0;
      padding: 7px var(--sp-2);
      font-size: var(--fs-2);
      text-align: left;
      color: var(--text);
      background: none;
      border: 0;
      border-radius: 8px;
      box-shadow: none;
    }
    .run span {
      display: block;
    }
    .run:hover {
      background: color-mix(in srgb, var(--azurite-l) 18%, transparent);
    }
    .run b {
      color: var(--gold-d);
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
