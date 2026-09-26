<script lang="ts">
  // Trung tâm sự kiện (như Events của RoK): hàng thẻ sự kiện đang mở (chấm đỏ = quà chờ nhận; thẻ đầu là Tu Tiên Lệnh — thẻ mùa),
  // chi tiết sự kiện đang chọn: đồng hồ kết thúc, rồi theo kiểu — 7 ô ngày đăng nhập · danh sách mục tiêu · điểm hôm nay + các mốc rương.
  import {
    FESTS,
    FEST_IDS,
    FEST_RANKED,
    FEST_TOP,
    DAY,
    FEST_ALLY_PRIZES,
    PASS_HALL,
    advance,
    festBought,
    festCalendar,
    festDone,
    festEnds,
    festGot,
    festOpen,
    festPoints,
    festRewards,
    festTokens,
    festValue,
    festStar,
    FEST_STAR_TOKENS,
    passReady,
    wheelFree,
    type Army,
    type DropSrc,
    type ElderId,
    type Report,
    type FestId,
    type Metric,
  } from '@rok/rules'
  import { Icon, Portrait, type IconName } from '@rok/art'
  import { Badge, Bag, Button, Card, Meter, Sheet, Tabs } from './ui'
  import { L, LOOK, num, sfx } from './lib'
  import { useGame } from './game'
  import Rescue from './Rescue.svelte'
  import type { FestView } from '@rok/protocol'
  import type { Net } from './net'
  import Wheel from './Wheel.svelte'
  import Pass from './Pass.svelte'
  import SeasonCal from './SeasonCal.svelte'
  import Trial from './Trial.svelte'

  let {
    open,
    onclose,
    api = null,
    opened,
    onfight,
    onreplay,
  }: {
    open: boolean
    onclose: () => void
    api?: Pick<Net, 'ask'> | null
    opened?: number // lúc mở mùa của giới (Lịch giới)
    onfight?: (elder: ElderId, army: Army) => Promise<Report | null> // trận Thí Luyện: server giải, client xem lại
    onreplay?: (r: Report) => void
  } = $props()
  const g = useGame()
  const now = $derived(g.now)
  // state đưa tới bây giờ: sang ngày mới thì sự kiện mới mở ngay, không chờ thao tác kế tiếp
  const s = $derived(open ? advance(g.game, now) : g.game)
  const act = g.act

  const ICON: Record<FestId, IconName> = {
    nhatKhoa: 'scroll',
    thatNhat: 'star',
    tanThu: 'flag',
    tongLenh: 'kimDuyen',
    khaiVu: 'globe',
    binhThe: 'skull',
    tranhBa: 'swords',
    sanYeu: 'bolt',
    thoMoc: 'hammer',
    luyenBinh: 'people',
    tuKhiTranh: 'clock',
    thuLinh: 'globe',
    tangKinh: 'scroll',
    tramYeu: 'skull',
    tichCoc: 'cauldron',
    tamBao: 'globe',
    khaiDien: 'star',
    gioiChu: 'swords',
    yeuHoang: 'skull',
    linhDia: 'bolt',
    lienTram: 'shield',
    dongTam: 'people',
    tranhPhong: 'swords',
    conLon: 'hammer',
    thucSon: 'swords',
    ngaMi: 'cauldron',
    trungThu: 'star',
    tanXuan: 'mail',
    dongChi: 'star',
    thatTich: 'heal',
    quyTiet: 'skull',
    thonTrang: 'shield',
    thienCo: 'star',
  }
  // lịch 7 ngày (sự kiện tương lai chưa mở vẫn hiện để người chơi chuẩn bị, như Event Calendar của RoK)
  const cal = $derived(
    open ? festCalendar(s, now, 7).map(d => ({ ...d, ids: d.ids.filter(id => !FESTS[id].panel) })) : [],
  )
  const weekday = (day: number) => L.fest.weekday[(((day - 4) % 7) + 7) % 7]
  // sự kiện của bảng khác (Nhật Khóa ở bảng Nhiệm vụ ngày) không lặp lại ở đây
  const list = $derived(FEST_IDS.filter(id => !FESTS[id].panel && festOpen(s, id, now)))
  // kho đổi: một chấm khi có món đổi được (không đếm từng món, không "nhận tất cả")
  const shop = (id: FestId) => FESTS[id].kind === 'shop'
  const waiting = (id: FestId) => {
    if (FESTS[id].kind === 'wheel') return wheelFree(s, id, now) ? 1 : 0 // vòng quà: còn lượt miễn phí
    const n = festRewards(id).filter((_, i) => festDone(s, id, i) && !got(id, i)).length
    return shop(id) ? Math.min(1, n) : n
  }
  const got = (id: FestId, i: number) => festGot(s, id, i)
  let pick = $state<FestId | null>(null)
  let scroll = $state(false) // đang xem Tu Tiên Lệnh
  let season = $state(false) // đang xem Lịch giới
  let dayPick = $state<number | null>(null) // ngày đang xem của lễ có nhánh theo ngày (null: ngày mới mở nhất)
  const hasPass = $derived(s.levels.chuDien >= PASS_HALL)
  function choose(id: FestId) {
    pick = id
    show(null)
  }
  function show(k: 'pass' | 'season' | null) {
    scroll = k === 'pass'
    season = k === 'season'
  }
  const cur = $derived(pick && list.includes(pick) ? pick : (list[0] ?? null))
  const def = $derived(cur ? FESTS[cur] : null)
  const stage = $derived(
    cur && (def?.kind === 'points' || def?.kind === 'shop')
      ? def.stages[Math.min(s.fest[cur]?.stage ?? 0, def.stages.length - 1)]
      : null,
  )
  const pts = $derived(cur ? festPoints(s, cur) : 0)
  // lễ có xếp hạng (Tông Môn Tranh Bá): hỏi server bảng của lượt đang mở mỗi lần mở / đổi sang lễ đó
  let board = $state<FestView | null>(null)
  let whole = $state(false) // bảng cả lượt (mặc định: bảng ải hôm nay của lễ có ải)
  $effect(() => {
    const id = open && cur && (FEST_RANKED as readonly FestId[]).includes(cur) ? cur : null
    board = null
    if (id) void api?.ask({ k: 'fest', id }).then(b => cur === id && (board = b))
  })
  const claim = (i: number) => cur && act({ type: 'fest', id: cur, i }, 'reward')
  // Nhận tất cả: mọi quà đã đủ điều kiện ở mọi sự kiện đang mở trong bảng này
  const ready = $derived(list.filter(id => !shop(id)).reduce((n, id) => n + waiting(id), 0))
  function claimAll() {
    let any = false
    for (const id of list.filter(x => !shop(x)))
      festRewards(id).forEach((_, i) => {
        if (festDone(s, id, i) && !got(id, i)) any = !!act({ type: 'fest', id, i }) || any
      })
    if (any) sfx('reward')
  }
</script>

<Sheet {open} {onclose} title={L.fest.title}>
  {#if hasPass || list.length}
    <div class="chips" role="tablist">
      {#if hasPass}
        {@const n = passReady(s).length}
        <button role="tab" class="chip" class:on={scroll} aria-selected={scroll} onclick={() => show('pass')}>
          <Icon name="scroll" size={26} />
          <span>{L.pass.title}</span>
          {#if n}<Badge {n} />{/if}
        </button>
      {/if}
      {#if opened}
        <button role="tab" class="chip" class:on={season} aria-selected={season} onclick={() => show('season')}>
          <Icon name="clock" size={26} />
          <span>{L.scal.title}</span>
        </button>
      {/if}
      {#each list as id (id)}
        {@const n = waiting(id)}
        <button
          role="tab"
          class="chip"
          class:on={!scroll && id === cur}
          aria-selected={!scroll && id === cur}
          onclick={() => choose(id)}
        >
          <Icon name={ICON[id]} size={26} />
          <span>{L.fest.names[id].name}</span>
          {#if n}<Badge {n} />{/if}
        </button>
      {/each}
    </div>
  {/if}
  {#if season && opened}
    <SeasonCal {opened} {now} />
  {:else if scroll && hasPass}
    <Pass {s} />
  {:else if !list.length}
    <p class="t-soft">{L.fest.none}</p>
  {:else}
    {#if ready > 1}<Button variant="gold" wide onclick={claimAll}>{L.mail.claimAll(ready)}</Button>{/if}

    {#if cur && def}
      {@const f = s.fest[cur]!}
      <div class="stack head">
        <p class="row between">
          <b class="name">{L.fest.names[cur].name}</b>
          <small class="t-soft">{L.fest.ends(L.ago(Math.max(0, festEnds(s, cur, now) - now)))}</small>
        </p>
        <p class="t-small t-lore">{L.fest.names[cur].desc}</p>
        {#if festStar(cur, f.key)}
          {@const star = festStar(cur, f.key)!}
          <!-- trưởng lão của đợt (MGE): top hạng nhận tín vật người này -->
          <p class="row t-small">
            <Portrait look={LOOK[star]} size={34} /><span class="stack" style:--gap="0"
              ><b class="t-gold">{L.fest.star(L.elders[star].name)}</b><small class="t-tiny t-soft"
                >{L.fest.starHint(FEST_STAR_TOKENS.length, FEST_STAR_TOKENS[0])}</small
              ></span
            >
          </p>
        {/if}
      </div>

      {#if def.kind === 'login'}
        <p class="t-small t-strong">{L.fest.days(Math.min(f.days, def.rewards.length), def.rewards.length)}</p>
        <ul class="days">
          {#each def.rewards as r, i (i)}
            {@const done = festDone(s, cur, i)}
            <li class="day" class:ready={done && !got(cur, i)} class:dim={!done}>
              <b class="t-small">{L.fest.day(i + 1)}</b>
              <Bag res={r.res} items={r.items} size="sm" />
              {#if r.elder}<small class="t-gold">{L.elders[r.elder].name}</small>{/if}
              {#if got(cur, i)}
                <small class="t-soft"><Icon name="check" size={14} /> {L.fest.claimed}</small>
              {:else if done}
                <Button size="sm" variant="gold" onclick={() => claim(i)}>{L.fest.claim}</Button>
              {/if}
            </li>
          {/each}
        </ul>
      {:else if def.kind === 'tasks'}
        {#if cur === 'yeuHoang'}<Trial {s} {onfight} {onreplay} />{/if}
        {@const days = [...new Set(def.tasks.map(t => t.day ?? 0))]}
        {@const day = Math.min(dayPick ?? f.stage, days.at(-1) ?? 0)}
        {#if days.length > 1}
          <!-- nhánh theo ngày (Khai Sơn Thất Nhật): ngày chưa mở có khoá và giờ mở; chấm đỏ = quà chờ nhận trong ngày đó -->
          <div class="chips" role="tablist">
            {#each days as d (d)}
              {@const n = def.tasks.filter((t, i) => (t.day ?? 0) === d && festDone(s, cur, i) && !got(cur, i)).length}
              <button
                role="tab"
                class="chip"
                class:on={d === day}
                aria-selected={d === day}
                onclick={() => (dayPick = d)}
              >
                <b class="t-small">{L.fest.day(d + 1)}</b>
                <small class="t-tiny">{L.fest.branch[d]}</small>
                {#if d > f.stage}<Icon name="lock" size={14} />{:else if n}<Badge {n} />{/if}
              </button>
            {/each}
          </div>
          {#if day > f.stage && s.born !== undefined}<p class="t-small t-soft">
              {L.fest.opensIn(L.ago(Math.max(0, s.born + day * DAY - now)))}
            </p>{/if}
        {/if}
        <ul class="stack rows">
          {#each def.tasks as t, i (i)}
            {@const v = festValue(s, cur, t.m)}
            <li hidden={(t.day ?? 0) !== day && days.length > 1}>
              <Card tone={festDone(s, cur, i) && !got(cur, i) ? 'glow' : undefined}>
                <div class="stack" style:--gap="4px">
                  <p class="row between">
                    <b class="t-small">{L.fest.task[t.m as Metric](num(t.n))}</b><small class="t-num t-soft"
                      >{num(Math.min(v, t.n))}/{num(t.n)}</small
                    >
                  </p>
                  <Meter value={Math.min(1, v / t.n)} size="sm" />
                  <div class="row between">
                    <Bag res={t.reward.res} items={t.reward.items} size="sm" />
                    {#if got(cur, i)}<small class="t-soft">{L.fest.claimed}</small>
                    {:else if festDone(s, cur, i)}<Button size="sm" variant="gold" onclick={() => claim(i)}
                        >{L.fest.claim}</Button
                      >{/if}
                  </div>
                </div>
              </Card>
            </li>
          {/each}
        </ul>
        {#if def.chests}
          <!-- rương cuối theo số việc đã nhận quà -->
          {@const done = f.got.filter(k => k < def.tasks.length).length}
          <h3 class="cal-h">{L.fest.chests}</h3>
          <ul class="stack rows">
            {#each def.chests as c, k (k)}
              {@const i = def.tasks.length + k}
              <li>
                <Card tone={festDone(s, cur, i) && !got(cur, i) ? 'glow' : undefined}>
                  <div class="stack" style:--gap="4px">
                    <p class="row between">
                      <b class="t-small">{L.fest.chestNeed(c.need)}</b><small class="t-num t-soft"
                        >{Math.min(done, c.need)}/{c.need}</small
                      >
                    </p>
                    <Meter value={Math.min(1, done / c.need)} size="sm" />
                    <div class="row between">
                      <Bag items={c.reward.items} size="sm" />
                      {#if got(cur, i)}<small class="t-soft">{L.fest.claimed}</small>
                      {:else if festDone(s, cur, i)}<Button size="sm" variant="gold" onclick={() => claim(i)}
                          >{L.fest.claim}</Button
                        >{/if}
                    </div>
                  </div>
                </Card>
              </li>
            {/each}
          </ul>
        {/if}
      {:else if def.kind === 'wheel'}
        <Wheel id={cur} />
      {:else if def.kind === 'shop'}
        <p class="row between">
          <b class="pts t-num t-gold">{L.fest.tokens(num(festTokens(s, cur)), L.fest.tokenName[cur])}</b>
        </p>
        {#if cur === 'thonTrang'}<Rescue />{/if}
        {#if stage}
          <Card>
            <ul class="today">
              {#each Object.entries(stage) as [m, v] (m)}
                <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
              {/each}
            </ul>
          </Card>
        {/if}
        <ul class="stack rows">
          {#each def.shop as it, i (i)}
            {@const left = it.max - festBought(s, cur, i)}
            <li>
              <Card tone={left && festDone(s, cur, i) ? 'glow' : undefined}>
                <div class="row between">
                  <span class="stack" style:--gap="2px"
                    ><Bag res={it.reward.res} items={it.reward.items} size="sm" /><small class="t-tiny t-soft"
                      >{left ? L.fest.left(left, it.max) : L.fest.soldOut}</small
                    ></span
                  >
                  <Button size="sm" disabled={!left || !festDone(s, cur, i)} onclick={() => claim(i)}
                    >{L.fest.buy(num(it.price))}</Button
                  >
                </div>
              </Card>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="row between">
          <b class="pts t-num t-gold">{def.kind === 'drop' ? L.fest.pouches(num(pts)) : L.fest.points(num(pts))}</b>
        </p>
        {#if def.kind === 'drop'}
          <!-- lễ rơi đồ: việc nào có thể rơi Linh Nang, tỉ lệ -->
          <Card>
            <ul class="today">
              {#each Object.entries(def.chance) as [src, p] (src)}
                <li class="t-small">{L.fest.dropFrom[src as DropSrc](Math.round((p ?? 0) * 100))}</li>
              {/each}
            </ul>
          </Card>
        {/if}
        {#if stage}
          <Card>
            <p class="t-small t-strong">{L.fest.today}</p>
            <ul class="today">
              {#each Object.entries(stage) as [m, v] (m)}
                <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
              {/each}
            </ul>
          </Card>
        {/if}
        <ul class="stack rows">
          {#each def.goals as goal, i (i)}
            <li>
              <Card tone={festDone(s, cur, i) && !got(cur, i) ? 'glow' : undefined}>
                <div class="stack" style:--gap="4px">
                  <p class="row between">
                    <b class="t-small">{L.fest.goal(num(goal))}</b><small class="t-num t-soft"
                      >{num(Math.min(pts, goal))}/{num(goal)}</small
                    >
                  </p>
                  <Meter value={Math.min(1, pts / goal)} size="sm" />
                  <div class="row between">
                    <Bag res={def.rewards[i].res} items={def.rewards[i].items} size="sm" />
                    {#if got(cur, i)}<small class="t-soft">{L.fest.claimed}</small>
                    {:else if festDone(s, cur, i)}<Button size="sm" variant="gold" onclick={() => claim(i)}
                        >{L.fest.claim}</Button
                      >{/if}
                  </div>
                </div>
              </Card>
            </li>
          {/each}
        </ul>
        {#if board}
          <!-- bảng xếp hạng của lượt lễ (như Mightiest Governor): hết tuần top FEST_TOP nhận quà qua thư; lễ có ải thêm bảng ải hôm nay -->
          {@const rows = board.stage && !whole ? board.stage : board}
          <h3 class="cal-h">{L.fest.board}</h3>
          {#if board.stage}
            <Tabs
              items={[
                { id: 'stage', label: L.fest.tabStage(board.stage.k + 1) },
                { id: 'all', label: L.fest.tabAll },
              ]}
              value={whole ? 'all' : 'stage'}
              onchange={id => (whole = id === 'all')}
            />
          {/if}
          <p class="t-tiny t-soft">{rows === board ? L.fest.boardHint(FEST_TOP) : L.fest.stageHint(FEST_TOP)}</p>
          {#if rows.me}<p class="t-small t-gold t-strong">{L.rank.me}: #{rows.me.rank} · {num(rows.me.pts)}</p>{/if}
          <ol class="stack board" style:--gap="3px">
            {#each rows.top as r, k (r.pid)}
              <li class="row between t-small" class:t-strong={k + 1 === rows.me?.rank} class:t-gold={k < 3}>
                <span>{k + 1}. {r.name}</span><b class="t-num">{num(r.pts)}</b>
              </li>
            {/each}
          </ol>
          {#if !rows.top.length}<p class="t-small t-soft">{L.rank.none}</p>{/if}
          {#if board.allies}
            <!-- bảng tiên minh (như Clarion Call): tổng điểm người trong minh -->
            <h3 class="cal-h">{L.fest.allyBoard}</h3>
            <p class="t-tiny t-soft">{L.fest.allyHint(FEST_ALLY_PRIZES.length)}</p>
            {#if board.myAlly}<p class="t-small t-gold t-strong">
                {L.fest.myAlly(board.myAlly.rank, num(board.myAlly.pts))}
              </p>{/if}
            <ol class="stack board" style:--gap="3px">
              {#each board.allies as r, k (r.id)}
                <li class="row between t-small" class:t-strong={k + 1 === board.myAlly?.rank} class:t-gold={k < 3}>
                  <span>{k + 1}. [{r.tag}]</span><b class="t-num">{num(r.pts)}</b>
                </li>
              {/each}
            </ol>
            {#if !board.allies.length}<p class="t-small t-soft">{L.rank.none}</p>{/if}
          {/if}
        {/if}
      {/if}
    {/if}
  {/if}
  <!-- Lịch 7 ngày: hôm nay và các sự kiện sắp mở -->
  <h3 class="cal-h">{L.fest.calendar}</h3>
  <ul class="cal">
    {#each cal as d, k (d.day)}
      <li class:today={k === 0}>
        <b class="wd">{k === 0 ? L.fest.todayShort : weekday(d.day)}</b>
        <span class="evs">
          {#each d.ids as id (id)}
            <button
              class="ev"
              class:on={list.includes(id)}
              onclick={() => list.includes(id) && choose(id)}
              disabled={!list.includes(id)}><Icon name={ICON[id]} size={14} />{L.fest.names[id].name}</button
            >
          {:else}
            <small class="t-soft">—</small>
          {/each}
        </span>
      </li>
    {/each}
  </ul>
</Sheet>

<style>
  .board {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .cal-h {
    margin: var(--sp-4) 0 var(--sp-2);
    font-size: var(--fs-3);
  }
  .cal {
    display: grid;
    gap: 4px;
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .cal li {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-2);
    padding: 4px 0;
    border-bottom: 1px dashed var(--paper3);
  }
  .cal li.today .wd {
    color: var(--cinnabar);
  }
  .wd {
    flex: none;
    width: 64px;
    font-size: var(--fs-2);
  }
  .evs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .ev {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 1px 8px 2px 5px;
    font-size: var(--fs-1);
    color: var(--text-soft);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 999px;
  }
  .ev.on {
    color: var(--text);
    border-color: var(--gold);
    cursor: pointer;
  }
  .chips {
    display: flex;
    gap: var(--sp-2);
    padding-bottom: var(--sp-2);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .chip {
    position: relative;
    display: grid;
    flex: none;
    justify-items: center;
    gap: 2px;
    width: 84px;
    padding: var(--sp-2) var(--sp-1);
    border: 1.5px solid var(--paper3);
    border-radius: 12px;
    background: var(--paper2);
    font-size: var(--fs-1);
    font-weight: 700;
    line-height: 1.15;
    text-align: center;
    color: var(--text-soft);
  }
  .chip.on {
    border-color: var(--gold);
    color: var(--text);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--gold) 40%, transparent);
  }
  .chip :global(.badge) {
    position: absolute;
    top: -4px;
    right: -4px;
  }
  .head {
    margin: var(--sp-2) 0 var(--sp-3);
  }
  .name {
    font-size: var(--fs-5);
  }
  .days {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: var(--sp-2);
    padding: 0;
    list-style: none;
  }
  .day {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 4px;
    min-height: 118px;
    padding: var(--sp-2);
    border: 1.5px solid var(--paper3);
    border-radius: 12px;
    background: var(--paper2);
    text-align: center;
  }
  .day.ready {
    border-color: var(--gold);
    box-shadow: 0 0 10px rgb(var(--gold-glow) / 0.55);
  }
  .day.dim {
    opacity: 0.6;
  }
  .rows,
  .today {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .pts {
    font-size: var(--fs-6);
  }
</style>
