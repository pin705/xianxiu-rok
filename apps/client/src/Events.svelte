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
  import { Icon, Portrait, artOf, type IconName } from '@rok/art'
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
  // tranh thẻ sự kiện vẽ tay (ui:fx-*): cột trái, băng rôn đầu sự kiện, lịch; tắt art thì về Icon
  const FX: Record<FestId, string> = {
    nhatKhoa: 'scroll',
    thatNhat: 'login',
    tanThu: 'flag',
    tongLenh: 'treasure',
    khaiVu: 'explore',
    binhThe: 'demon',
    tranhBa: 'battle',
    sanYeu: 'bolt',
    thoMoc: 'build',
    luyenBinh: 'train',
    tuKhiTranh: 'clock',
    thuLinh: 'explore',
    tangKinh: 'scroll',
    tramYeu: 'demon',
    tichCoc: 'cauldron',
    tamBao: 'treasure',
    khaiDien: 'login',
    gioiChu: 'battle',
    yeuHoang: 'demon',
    linhDia: 'bolt',
    lienTram: 'shield',
    dongTam: 'train',
    tranhPhong: 'battle',
    conLon: 'build',
    thucSon: 'battle',
    ngaMi: 'cauldron',
    trungThu: 'moon',
    tanXuan: 'spring',
    dongChi: 'moon',
    thatTich: 'love',
    quyTiet: 'demon',
    thonTrang: 'shield',
    thienCo: 'moon',
  }
  const fx = (n: string) => artOf(`ui:fx-${n}`)?.src
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

{#snippet tag(img: string | undefined, icon: IconName, label: string, on: boolean, n: number, pick: () => void)}
  <button role="tab" class="tag" class:on aria-selected={on} onclick={pick}>
    <span class="pic">
      {#if img}<img src={img} alt="" draggable="false" />{:else}<Icon name={icon} size={30} />{/if}
    </span>
    <span class="tn">{label}</span>
    {#if n}<Badge {n} />{/if}
  </button>
{/snippet}

<Sheet {open} {onclose} title={L.fest.title}>
  <!-- bố cục trung tâm sự kiện của game: cột thẻ tranh bên trái (cuộn riêng, dính đầu), sự kiện đang chọn bên phải -->
  <div class="fest">
    {#if hasPass || opened || list.length}
      <div class="rail" role="tablist">
        {#if hasPass}
          {@render tag(fx('pass'), 'scroll', L.pass.title, scroll, passReady(s).length, () => show('pass'))}
        {/if}
        {#if opened}
          {@render tag(fx('calendar'), 'clock', L.scal.title, season, 0, () => show('season'))}
        {/if}
        {#each list as id (id)}
          {@render tag(fx(FX[id]), ICON[id], L.fest.names[id].name, !scroll && !season && id === cur, waiting(id), () =>
            choose(id),
          )}
        {/each}
      </div>
    {/if}
    <div class="pane">
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
          <!-- băng rôn sự kiện: tranh thẻ lớn nghiêng bên phải, tên viết bút lông, đồng hồ kết thúc trên dải son -->
          <header class="banner">
            {#if fx(FX[cur])}<img class="art" src={fx(FX[cur])} alt="" draggable="false" />{/if}
            <b class="name">{L.fest.names[cur].name}</b>
            <small class="ends">{L.fest.ends(L.ago(Math.max(0, festEnds(s, cur, now) - now)))}</small>
            <p class="t-small t-lore">{L.fest.names[cur].desc}</p>
          </header>
          <div class="stack head">
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
                    <span class="stamp">{L.fest.claimed}</span>
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
                  {@const n = def.tasks.filter(
                    (t, i) => (t.day ?? 0) === d && festDone(s, cur, i) && !got(cur, i),
                  ).length}
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
                        {#if got(cur, i)}<span class="stamp">{L.fest.claimed}</span>
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
              <ol class="path">
                {#each def.chests as c, k (k)}
                  {@const i = def.tasks.length + k}
                  <li class:hit={done >= c.need}>
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
                          {#if got(cur, i)}<span class="stamp">{L.fest.claimed}</span>
                          {:else if festDone(s, cur, i)}<Button size="sm" variant="gold" onclick={() => claim(i)}
                              >{L.fest.claim}</Button
                            >{/if}
                        </div>
                      </div>
                    </Card>
                  </li>
                {/each}
              </ol>
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
            <ol class="path">
              {#each def.goals as goal, i (i)}
                <li class:hit={pts >= goal}>
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
                        {#if got(cur, i)}<span class="stamp">{L.fest.claimed}</span>
                        {:else if festDone(s, cur, i)}<Button size="sm" variant="gold" onclick={() => claim(i)}
                            >{L.fest.claim}</Button
                          >{/if}
                      </div>
                    </div>
                  </Card>
                </li>
              {/each}
            </ol>
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
                  <li class="row between t-small" class:me={k + 1 === rows.me?.rank}>
                    <span class="row" style:--gap="6px"><i class="rank-no r{k + 1}">{k + 1}</i>{r.name}</span><b
                      class="t-num">{num(r.pts)}</b
                    >
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
                    <li class="row between t-small" class:me={k + 1 === board.myAlly?.rank}>
                      <span class="row" style:--gap="6px"><i class="rank-no r{k + 1}">{k + 1}</i>[{r.tag}]</span><b
                        class="t-num">{num(r.pts)}</b
                      >
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
                  disabled={!list.includes(id)}
                  >{#if fx(FX[id])}<img src={fx(FX[id])} alt="" />{:else}<Icon name={ICON[id]} size={14} />{/if}{L.fest
                    .names[id].name}</button
                >
              {:else}
                <small class="t-soft">—</small>
              {/each}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</Sheet>

<style>
  /* ---------- khung: cột thẻ tranh + sự kiện ---------- */
  .fest {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    margin-top: var(--sp-2);
  }
  .fest:not(:has(.rail)) {
    grid-template-columns: minmax(0, 1fr);
  }
  .rail {
    position: sticky;
    top: 0;
    z-index: 1;
    display: grid;
    gap: 10px;
    max-height: min(68dvh, 620px);
    padding: 4px 2px 12px;
    overflow-y: auto;
    scrollbar-width: none;
    /* thanh gỗ dọc sau hàng thẻ */
    background: linear-gradient(90deg, transparent 33px, #8a5c38 33px, #5c3a1f 39px, transparent 39px) 0 0 / 100% 100%
      no-repeat;
  }
  .tag {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 2px;
    color: var(--text-soft);
  }
  .tag .pic {
    position: relative;
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    transition:
      transform var(--dur-2) var(--spring),
      filter var(--dur-2) var(--ease);
    filter: saturate(0.75) drop-shadow(0 2px 3px rgb(0 0 0 / 0.2));
  }
  .tag img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .tag :global(.badge) {
    position: absolute;
    top: -3px;
    right: 1px;
  }
  .tn {
    display: -webkit-box;
    max-width: 74px;
    padding: 1px 4px 2px;
    overflow: hidden;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    background: var(--paper);
    border-radius: 4px;
  }
  .tag.on {
    color: #fff;
  }
  .tag.on .pic {
    transform: scale(1.08) rotate(-2deg);
    filter: drop-shadow(0 0 0 var(--cinnabar)) drop-shadow(0 3px 6px rgb(0 0 0 / 0.3));
  }
  .tag.on .tn {
    background: var(--cinnabar);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
  }
  .tag:active .pic {
    transform: scale(0.94);
  }
  .pane {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  /* ---------- băng rôn sự kiện ---------- */
  .banner {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 76px;
    gap: 4px 8px;
    align-items: start;
    padding: 12px 10px 12px 14px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 320% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .banner .art {
    grid-area: 1 / 2 / 3 / 3;
    width: 76px;
    margin: -4px -4px 0 0;
    rotate: 4deg;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.25));
  }
  .banner p {
    grid-column: 1 / -1;
  }
  .banner .name {
    font-size: var(--fs-6);
    line-height: 1.1;
  }
  .ends {
    justify-self: start;
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: #fff;
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%);
  }
  .board {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .board li {
    padding: 3px 6px;
    border-bottom: 1px dashed var(--paper3);
  }
  .board li.me {
    font-weight: 800;
    background: color-mix(in srgb, var(--cinnabar) 10%, transparent);
    border-radius: 6px;
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
  .ev img {
    width: 18px;
    height: 18px;
    margin: -2px 0;
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
  /* nhánh theo ngày: thẻ tre nhỏ, thẻ đang xem viền son + vệt son đầu */
  .chip {
    position: relative;
    display: grid;
    flex: none;
    justify-items: center;
    gap: 1px;
    width: 76px;
    padding: 8px 4px 6px;
    font-size: var(--fs-1);
    font-weight: 700;
    line-height: 1.15;
    text-align: center;
    color: var(--text-faint);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 4px;
  }
  .chip.on {
    color: var(--text);
    background: var(--paper);
    border-color: var(--cinnabar);
    box-shadow: 0 2px 5px rgb(0 0 0 / 0.12);
  }
  .chip.on::before {
    content: '';
    position: absolute;
    inset: 2px 6px auto;
    height: 3px;
    border-radius: 2px;
    background: var(--cinnabar);
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
  /* lễ đăng nhập: mỗi ngày một lá bùa giấy ghim son trên dây, ngày chờ nhận sáng viền son */
  .days {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 14px 8px;
    padding: 8px 0 0;
    list-style: none;
  }
  .day {
    position: relative;
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 4px;
    min-height: 118px;
    padding: 14px 4px 8px;
    text-align: center;
    background: #fbf7ec;
    border: 1px solid #d8cdb4;
    border-radius: 3px;
    box-shadow: 0 3px 6px rgb(0 0 0 / 0.14);
  }
  .day:nth-child(odd) {
    rotate: -1.2deg;
  }
  .day:nth-child(even) {
    rotate: 1deg;
  }
  .day::before {
    content: '';
    position: absolute;
    top: -6px;
    left: calc(50% - 6px);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #f07a62, var(--cinnabar) 60%, #6e1f18);
    box-shadow: 0 2px 2px rgb(0 0 0 / 0.3);
  }
  .day.ready {
    border-color: var(--cinnabar);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cinnabar) 35%, transparent),
      0 0 14px rgb(var(--gold-glow) / 0.6);
  }
  .day.dim {
    opacity: 0.62;
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
