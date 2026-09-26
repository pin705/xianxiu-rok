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
    passReady,
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
  import { artOf, emblemArt, type IconName, paintedUrl, portraitRing, tabIcon } from '@rok/art'
  import {
    Alarm,
    Avatar,
    Badge,
    Bag,
    EventTile,
    HelpDisc,
    HudFrame,
    HudSide,
    IconButton,
    NamePlate,
    NavBadge,
    NavBar,
    PowerPill,
    QuestNote,
    ResPill,
    RunList,
    TopBar,
    Worker,
    WorkerSlot,
  } from './ui'
  import {
    L,
    LOOK,
    MASTER,
    TABS,
    clock,
    num,
    progress,
    sfx,
    visitTab,
    visitedTabs,
    type Tab,
    type PanelTab,
  } from './lib'

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

  // Đồ vật giao diện vẽ tay (tools/art make.py ui — concept 'creative-home'): có tranh thì HUD dựng theo đồ vật (khung ngọc, vật chứa
  // tài nguyên, ô tranh sự kiện, chú thợ, huy hiệu menu trên dải mây); thiếu tranh (?art=0, mất mạng lần đầu) thì giữ HUD cũ.
  const ui = (n: string) => artOf(`ui:${n}`)?.src
  const ink = !!ui('nav-tongMon')
  const ready = $derived(dailyReady(game) + festReady(game, now, 'daily') + sideReady(game))
  const fests = $derived(festReady(game, now) + passReady(game).length) // chấm đỏ Sự kiện: cả quà Tu Tiên Lệnh
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
  // tạp dịch thứ hai (thuê bằng Tạp Dịch Lệnh): đang thuê thì hiện việc thứ hai; chưa thuê thì chạm để dùng lệnh, hết lệnh thì gợi ý
  const rent2 = $derived((game.builder2 ?? 0) > now)
  let hint2 = $state(false)
  function second() {
    if (rent2) return onbuilder()
    if (game.items.tapDich48) return void g.act({ type: 'use', item: 'tapDich48', n: 1 }, 'reward')
    hint2 = true
    setTimeout(() => (hint2 = false), 4000)
  }
  const slot2 = $derived(
    rent2 ? (game.queue[1] ? clock(game.queue[1].finishAt - now) : L.builder.idle) : L.builder.rent,
  )
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
  const runItems = $derived(
    runs.map(r => {
      const time = r.end ? clock(r.end - now) : L.builder.idle
      return { ...r, time, idle: !r.end, label: `${r.text}: ${time}` }
    }),
  )

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

<HudFrame {ink}>
  <TopBar {ink}>
    {#snippet avatar()}
      <!-- chân dung: chạm xem hồ sơ của mình (như RoK; chưa vào giới thì xem xếp hạng); vòng khiên xanh khi được bảo hộ -->
      <Avatar
        {ink}
        look={game.face ? LOOK[game.face] : MASTER}
        frame={game.frame && game.frame !== 'basic'
          ? paintedUrl(`ring:${game.frame}`, () => portraitRing(game.frame), 62)
          : (ui('frame-portrait') ?? paintedUrl('ring', portraitRing, 62))}
        shield={game.shield > now ? L.pvp.shield(clock(game.shield - now)) : undefined}
        label={me !== null ? L.profile.mine : L.rank.open}
        onclick={() => (me !== null ? (social.profile = me) : onranks())}
      />
    {/snippet}
    {#snippet name()}
      <!-- Hương Hỏa (VIP): chấm son khi lễ vật hôm nay chưa nhận -->
      <NamePlate
        {ink}
        name={game.name}
        realm={L.realm(hall)}
        lotus={paintedUrl('lotus', () => emblemArt('lotus'), 18)}
        vip={L.vip.short(vipLevel(game))}
        vipLabel={L.vip.level(vipLevel(game))}
        dot={!!game.vip && game.vip.chest !== dayOf(now)}
        onvip={() => (vipOpen = true)}
      />
    {/snippet}
    {#snippet power()}
      <PowerPill
        {ink}
        label={L.power}
        value={num(Math.round(powerT.current))}
        up={powUp && { text: `+${num(powUp.n)}`, key: powUp.t }}
        onclick={() => (powOpen = true)}
      />
    {/snippet}
    {#snippet tools()}
      <IconButton icon="mail" label="{L.mail.title}{letters ? ` (${letters})` : ''}" size={34} onclick={onmail}
        ><Badge n={letters} /></IconButton
      >
      <IconButton icon="gear" label={L.settings.open} size={34} onclick={onsettings} />
    {/snippet}
    {#snippet boosts()}
      <!-- dải tăng ích (khiên, phù, đan…) dưới cụm nút, chạm để xem từng nguồn và hạn -->
      <Buffs />
    {/snippet}
    {#snippet res()}
      <!-- chạm viên: bảng tài nguyên (sản lượng, sức chứa, mở nang, đổi ở Thương hội) -->
      {#each RESOURCES as r, i (r)}
        <ResPill
          {ink}
          id={r}
          icon={r}
          img={ui(`res-${r}`)}
          name={L.res[r]}
          value={num(Math.round(resT[i].current))}
          ratio={game.res[r] / cap}
          full={game.res[r] >= cap}
          fullLabel={L.full}
          title="{L.res[r]}: {num(game.res[r])} / {num(cap)} · +{num(rate(game, r))}{L.panel.perHour}"
          label="{L.res[r]}: {num(game.res[r])} / {num(cap)}"
          gain={gain && gain.bag[r] && now - gain.t < 1400 ? { text: `+${num(gain.bag[r] ?? 0)}`, key: gain.t } : null}
          onclick={() => (resOpen = r)}
        />
      {/each}
    {/snippet}
    <!-- Bế Quan Lệnh: đang bế quan — nói rõ vì sao không làm được gì, xuất quan ngay tại đây -->
    {#if game.seclude && game.seclude.until > now}
      <Alarm
        tone="calm"
        icon="shield"
        title={L.seclude.on(clock(game.seclude.until - now))}
        hint={L.seclude.onHint}
        actions={[{ label: L.seclude.off, onclick: () => g.act({ type: 'unseclude' }, 'tap') }]}
      />
    {/if}
    <!-- Linh hỏa thiêu sơn (thành cháy của RoK): núi đang cháy, trận lực tụt — dập lửa / tu bổ ngay tại đây -->
    {#if burning(game, now)}
      <Alarm
        icon="shield"
        title={L.wall.alarm(Math.round((wallHp(game, now) / wallMax(game)) * 100), clock(game.wall!.fire - now))}
        hint={L.wall.alarmHint}
        actions={game.items.tucHoa
          ? [
              {
                label: L.wall.douse(game.items.tucHoa),
                onclick: () => g.act({ type: 'use', item: 'tucHoa', n: 1 }, 'reward'),
              },
            ]
          : mendReady(game, now)
            ? [{ label: L.wall.mend, onclick: () => g.act({ type: 'mend' }, 'tap') }]
            : []}
      />
    {/if}
    <!-- Tháp canh (như RoK): đội địch đang kéo tới — thẻ son ở mọi tab, bật khiên ngay tại đây -->
    {#each incoming as x (`${x.pid}:${x.id}`)}
      {@const digger = game.marches.find(
        m => m.target.kind === 'spot' && m.target.i === x.spot && m.mine && m.mine.end > now,
      )}
      <Alarm
        icon="swords"
        title={x.spot !== undefined
          ? L.pvp.robIncoming(x.foe)
          : x.n > 1
            ? L.pvp.incomingRally(x.foe, x.n)
            : L.pvp.incoming(x.foe)}
        time={clock(x.at - now)}
        hint={x.spot !== undefined ? L.pvp.robIncomingHint : L.pvp.incomingHint}
        actions={[
          ...(digger ? [{ label: L.world.recall, onclick: () => onrecall(digger.id) }] : []),
          ...(ward && x.spot === undefined
            ? [
                {
                  label: L.pvp.shieldUp,
                  disabled: (game.frenzy ?? 0) > now,
                  onclick: () => g.act({ type: 'use', item: ward, n: 1 }, 'reward'),
                },
              ]
            : []),
        ]}
      />
    {/each}
    <!-- Ma Triều Công Sơn: minh đã ghi danh, từ 15 phút trước đợt đầu tới hết đợt cuối — nhắc kéo viện binh, chữa thương -->
    {#if legion}
      <Alarm
        tone="legion"
        icon="shield"
        title={L.legion.next(legion.k + 1, clock(legion.at - now))}
        hint={L.legion.alarm}
        onclick={e => ontab('tienMinh', e)}
      />
    {/if}
  </TopBar>

  <!-- màn hẹp: chỉ ở tab Tông môn; desktop: luôn nằm trong cột trái -->
  {#if !storm}
    <HudSide {ink} away={tab !== 'tongMon'}>
      {#snippet note()}
        {#if quest}
          <QuestNote
            {ink}
            title={L.quest.title}
            prog={prog ? `${num(Math.min(prog[0], prog[1]))}/${num(prog[1])}` : undefined}
            text={L.quest.text(quest)}
            state={held ? 'held' : done ? 'done' : 'todo'}
            tick={paintedUrl('tick', () => emblemArt('tick'), 48)}
            claim={L.quest.claim}
            onclick={done ? claim : onquest}><Bag res={quest.reward} items={quest.items} size="sm" /></QuestNote
          >
        {:else}
          <QuestNote {ink} empty={L.quest.allDone} />
        {/if}
      {/snippet}
      {#snippet events()}
        <!-- trung tâm sự kiện: luôn có (sự kiện tân thủ từ ngày đầu), chấm đỏ = quà chờ nhận -->
        <EventTile {ink} img={ui('ev-fest')} icon="star" label={L.fest.button} n={fests} onclick={onfests} />
        <!-- Luận Kiếm Đài: từ tầng mở Tranh đoạt, chấm đỏ = còn lượt hôm nay -->
        {#if hall >= PVP_HALL}
          <EventTile
            {ink}
            img={ui('ev-arena')}
            icon="swords"
            label={L.arena.title}
            n={duels}
            onclick={() => (social.arena = true)}
          />
        {/if}
        <!-- sự kiện cuối tuần đang diễn ra: nhãn dưới nút nhiệm vụ ngày (chi tiết trong bảng nhiệm vụ) -->
        {#if hall >= DAILY_HALL}
          <EventTile
            {ink}
            img={ui('ev-daily')}
            icon="scroll"
            label={L.daily.button}
            n={ready}
            tag={isWeekend(now) ? L.weekend.tag : undefined}
            onclick={ondaily}
          />
        {/if}
      {/snippet}
      {#snippet jobs()}
        <RunList {ink} title={L.activity.title} empty={L.activity.empty} items={runItems} />
      {/snippet}
    </HudSide>

    <Worker
      {ink}
      img={ui('worker')}
      away={tab !== 'tongMon'}
      idle={!job}
      {ring}
      time={job ? clock(job.finishAt - now) : L.builder.idle}
      label="{L.builder.label}: {job ? clock(job.finishAt - now) : L.builder.idle}"
      dot={!!job && (game.builder2 ?? 0) > now && game.queue.length < 2}
      onclick={onbuilder}
    />
    <!-- ô tạp dịch thứ hai (như hàng xây thứ hai của RoK) -->
    <WorkerSlot
      away={tab !== 'tongMon'}
      locked={!rent2}
      text={slot2}
      label="{L.builder.second}: {slot2}"
      hint={hint2 ? L.builder.rentHint(L.bag.family.tapDich.name) : undefined}
      onclick={second}
    />
  {/if}

  {#if helpable && onhelp && !storm}
    <HelpDisc
      n={helpable}
      label={L.ally.helpAll(helpable)}
      onclick={async () => {
        await onhelp()
        sfx('reward')
      }}
    />
  {/if}

  <NavBar {ink}>
    {#each TABS as t (t.id)}
      {@const on = t.id === tab}
      {@const locked = hall < t.unlock}
      <NavBadge
        {ink}
        id={t.id}
        img={ui(`nav-${t.id}`) ?? paintedUrl(`tab:${t.id}`, () => tabIcon(t.id), 44)}
        label={L.tabs[t.id]}
        {on}
        {locked}
        sub={locked ? (t.unlock > 15 ? L.soonTag : L.level(t.unlock)) : undefined}
        onclick={e => !on && ontab(t.id, e)}
        >{#if !on}<Badge
            n={tabCount[t.id] ?? 0}
            dot={t.id === 'monHa' && (hurt || tavernReady)}
            fresh={!locked && !visited.includes(t.id)}
          />{/if}</NavBadge
      >
    {/each}
  </NavBar>
</HudFrame>
<ResSheet res={resOpen} onclose={() => (resOpen = null)} {onfocus} />
<VipSheet open={vipOpen} onclose={() => (vipOpen = false)} />
<PowerSheet open={powOpen} {game} onclose={() => (powOpen = false)} {onfocus} {ontab} />
