<script lang="ts">
  // Trung tâm sự kiện (như Events của RoK): hàng thẻ sự kiện đang mở (chấm đỏ = quà chờ nhận), chi tiết sự kiện đang chọn:
  // đồng hồ kết thúc, rồi theo kiểu — 7 ô ngày đăng nhập · danh sách mục tiêu · điểm hôm nay + các mốc rương.
  import {
    FESTS,
    FEST_IDS,
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
    type FestId,
    type Metric,
  } from '@rok/rules'
  import { Icon, type IconName } from '@rok/art'
  import { Badge, Bag, Button, Card, Meter, Sheet } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
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
    lienTram: 'shield',
    dongTam: 'people',
    tranhPhong: 'swords',
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
    const n = festRewards(id).filter((_, i) => festDone(s, id, i) && !got(id, i)).length
    return shop(id) ? Math.min(1, n) : n
  }
  const got = (id: FestId, i: number) => festGot(s, id, i)
  let pick = $state<FestId | null>(null)
  const cur = $derived(pick && list.includes(pick) ? pick : (list[0] ?? null))
  const def = $derived(cur ? FESTS[cur] : null)
  const stage = $derived(
    cur && (def?.kind === 'points' || def?.kind === 'shop')
      ? def.stages[Math.min(s.fest[cur]?.stage ?? 0, def.stages.length - 1)]
      : null,
  )
  const pts = $derived(cur ? festPoints(s, cur) : 0)
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
  {#if !list.length}
    <p class="t-soft">{L.fest.none}</p>
  {:else}
    <div class="chips" role="tablist">
      {#each list as id (id)}
        {@const n = waiting(id)}
        <button role="tab" class="chip" class:on={id === cur} aria-selected={id === cur} onclick={() => (pick = id)}>
          <Icon name={ICON[id]} size={26} />
          <span>{L.fest.names[id].name}</span>
          {#if n}<Badge {n} />{/if}
        </button>
      {/each}
    </div>

    {#if ready > 1}<Button variant="gold" wide onclick={claimAll}>{L.mail.claimAll(ready)}</Button>{/if}

    {#if cur && def}
      {@const f = s.fest[cur]!}
      <div class="stack head">
        <p class="row between">
          <b class="name">{L.fest.names[cur].name}</b>
          <small class="t-soft">{L.fest.ends(L.ago(Math.max(0, festEnds(s, cur, now) - now)))}</small>
        </p>
        <p class="t-small t-lore">{L.fest.names[cur].desc}</p>
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
        <ul class="stack rows">
          {#each def.tasks as t, i (i)}
            {@const v = festValue(s, cur, t.m)}
            <li>
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
      {:else if def.kind === 'shop'}
        <p class="row between"><b class="pts t-num t-gold">{L.fest.tokens(num(festTokens(s, cur)))}</b></p>
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
          <b class="pts t-num t-gold">{L.fest.points(num(pts))}</b>
        </p>
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
              onclick={() => list.includes(id) && (pick = id)}
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
    background: var(--silk);
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
    background: var(--silk);
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
    background: var(--silk);
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
