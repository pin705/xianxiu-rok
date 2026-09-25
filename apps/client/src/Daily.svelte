<script lang="ts">
  // Nhiệm vụ ngày = Nhật Khóa (như Daily Objectives của RoK: việc xong cộng hoạt lực, 5 rương mốc, làm mới 0h giờ VN),
  // nhiệm vụ tuần (mục tiêu gộp cả tuần, làm mới 0h thứ Hai: từng việc nhận riêng, xong hết thì mở rương), sự kiện tuần.
  import {
    DAILY_HALL,
    EVENT_GOALS,
    EVENT_REWARDS,
    FESTS,
    RESOURCES,
    SIDE_LINES,
    WEEKLY,
    WEEKLY_BONUS,
    advance,
    festOpen,
    festPoints,
    festProgress,
    themeFor,
    isWeekend,
    nextDay,
    nextWeek,
    sideAt,
    sideProgress,
    weeklyDone,
    weeklyReward,
    type PillId,
    type SideGoal,
    type State,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Meter, Section, Sheet, fly } from './ui'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const perWeek = $derived(Object.fromEntries(RESOURCES.map(r => [r, weeklyReward(game)])))
  // state đưa tới bây giờ: qua 0h thì Nhật Khóa mới mở ngay, không chờ thao tác kế tiếp
  const s = $derived(open ? advance(game, now) : game)
  const nk = $derived(festOpen(s, 'nhatKhoa', now))
  // quà có phần theo tầng Chủ điện (hallRes): hiện số thật người chơi sẽ nhận
  const withHall = (res: Partial<Record<(typeof RESOURCES)[number], number>> = {}, per = 0) =>
    Object.fromEntries(RESOURCES.map(r => [r, (res[r] ?? 0) + per * s.levels.chuDien]))
  const sideText = (q: SideGoal) =>
    q.line === 'linhMach' ? L.side.goal.linhMach(L.b[q.id!].name, q.n) : L.side.goal[q.line](q.n)
</script>

{#snippet task(
  text: string,
  have: number,
  need: number,
  got: boolean,
  done: boolean,
  each: Record<string, number>,
  claim: () => State | null,
)}
  <li>
    <Card tone={done && !got ? 'glow' : 'paper'}>
      <div class="row">
        <span class="grow stack" style:--gap="4px">
          <b>{text}</b>
          <Meter value={Math.min(have, need) / need} tone="gold" size="sm" />
          <span class="row t-small"
            ><b class="t-num">{num(Math.min(have, need))}/{num(need)}</b><Bag res={each} size="sm" /></span
          >
        </span>
        {#if got}
          <span class="t-good"><Icon name="check" size={22} /></span>
        {:else}
          <Button
            variant="gold"
            size="sm"
            disabled={!done}
            onclick={e => {
              if (!claim()) return
              sfx('reward')
              fly(e.currentTarget as Element, each)
            }}>{L.quest.claim}</Button
          >
        {/if}
      </div>
    </Card>
  </li>
{/snippet}

{#snippet chest(
  title: string,
  items: Partial<Record<PillId, number>>,
  ready: boolean,
  opened: boolean,
  claim: () => State | null,
)}
  <div class="mt-3">
    <Card tone={ready && !opened ? 'glow' : 'silk'}>
      <div class="row">
        <Icon name="star" size={30} />
        <span class="grow stack" style:--gap="4px"><b>{title}</b><Bag {items} size="sm" named /></span>
        {#if opened}
          <span class="t-good"><Icon name="check" size={22} /></span>
        {:else}
          <Button
            variant="gold"
            size="sm"
            disabled={!ready}
            onclick={e => {
              if (!claim()) return
              sfx('win')
              fly(e.currentTarget as Element, items)
            }}>{L.daily.open}</Button
          >
        {/if}
      </div>
    </Card>
  </div>
{/snippet}

{#snippet nhat()}
  <!-- Nhật Khóa (Daily Objectives của RoK): mỗi việc xong cộng hoạt lực, đủ mốc mở rương — đầu bảng -->
  {#if nk && open}
    {@const d = FESTS.nhatKhoa}
    {#if d.kind === 'activity'}
      {@const pts = festPoints(s, 'nhatKhoa')}
      {@const max = d.goals[d.goals.length - 1]}
      <Section title="{L.fest.names.nhatKhoa.name} · {L.daily.activity(Math.min(pts, max), max)}">
        <Meter value={Math.min(1, pts / max)} tone="gold" size="md" />
        <ul class="stack mt-2">
          {#each d.goals as goal, i (goal)}
            {@const r = d.rewards[i]}
            {@const got = !!s.fest.nhatKhoa?.got.includes(i)}
            {@const ready = pts >= goal}
            <li>
              <Card tone={ready && !got ? 'glow' : 'silk'}>
                <div class="row">
                  <Icon name="star" size={24} />
                  <span class="grow stack" style:--gap="3px"
                    ><b class="t-small">{L.daily.chest(goal)}</b><Bag
                      res={withHall(r.res, r.hallRes)}
                      items={r.items}
                      size="sm"
                    /></span
                  >
                  {#if got}
                    <span class="t-good"><Icon name="check" size={22} /></span>
                  {:else}
                    <Button
                      variant="gold"
                      size="sm"
                      disabled={!ready}
                      onclick={() => act({ type: 'fest', id: 'nhatKhoa', i }, 'win')}>{L.daily.open}</Button
                    >
                  {/if}
                </div>
              </Card>
            </li>
          {/each}
        </ul>
        <ul class="stack mt-2">
          {#each d.tasks as t (t.m)}
            {@const v = festProgress(s, 'nhatKhoa', t.m)}
            <li class="row between t-small" class:done={v >= t.n}>
              <span class="row" style:--gap="6px"
                ><Icon name={v >= t.n ? 'check' : 'clock'} size={16} />{(L.fest.gain[t.m] ?? L.fest.task[t.m])(
                  num(t.n),
                )}</span
              >
              <span class="row" style:--gap="8px"
                ><span class="t-num t-soft">{num(Math.min(v, t.n))}/{num(t.n)}</span><b class="t-gold"
                  >{L.daily.pts(t.pts)}</b
                ></span
              >
            </li>
          {/each}
        </ul>
      </Section>
    {/if}
  {/if}
{/snippet}

<Sheet {open} {onclose} title={L.daily.title} sub={L.daily.reset(clock(nextDay(now) - now))}>
  {#if isWeekend(now)}
    <div class="mt-2">
      <Card tone="glow"
        ><div class="row">
          <Icon name="star" size={24} /><span class="stack" style:--gap="2px"
            ><b>{L.weekend.title}</b><span class="t-small">{L.weekend.body}</span></span
          >
        </div></Card
      >
    </div>
  {/if}
  {@render nhat()}
  <!-- Tông vụ (Side Quests của RoK): 4 dòng song song, mỗi dòng một việc; nhận xong hiện việc kế -->
  <Section title={L.side.title}>
    <p class="t-small t-soft">{L.side.hint}</p>
    <ul class="stack mt-2">
      {#each SIDE_LINES as line, i (line)}
        {@const q = sideAt(s, i)}
        {@const have = q ? sideProgress(s, q) : 0}
        <li>
          <Card tone={q && have >= q.n ? 'glow' : 'paper'}>
            <div class="row">
              <span class="grow stack" style:--gap="4px">
                <small class="t-tiny t-gold t-strong">{L.side.lines[line]}</small>
                {#if q}
                  <b>{sideText(q)}</b>
                  <Meter value={Math.min(have, q.n) / q.n} tone="gold" size="sm" />
                  <span class="row t-small"
                    ><b class="t-num">{num(Math.min(have, q.n))}/{num(q.n)}</b><Bag
                      items={q.reward.items}
                      size="sm"
                    /></span
                  >
                {:else}
                  <b class="t-good">{L.side.done}</b>
                {/if}
              </span>
              {#if q}<Button
                  variant="gold"
                  size="sm"
                  disabled={have < q.n}
                  onclick={() => act({ type: 'side', line: i }, 'reward')}>{L.quest.claim}</Button
                >{/if}
            </div>
          </Card>
        </li>
      {/each}
    </ul>
  </Section>
  {#if game.levels.chuDien >= DAILY_HALL}
    <!-- Sự kiện tuần: chủ đề đổi theo tuần, đủ mốc nhận quà, top của giới nhận thư lúc hết tuần -->
    {@const theme = themeFor(game, game.ev.week)}
    <Section title="{L.event.title} · {L.event.theme[theme]}">
      {#snippet aside()}{L.event.pts(game.ev.pts)}{/snippet}
      <p class="t-small t-soft">{L.event.how[theme]} · {L.weekly.reset(nextWeek(now) - now)}</p>
      <ul class="stack">
        {#each EVENT_GOALS as goal, i (goal)}
          {@const r = EVENT_REWARDS[i]}
          {@const got = game.ev.got[i]}
          {@const ready = game.ev.pts >= goal}
          <li>
            <Card tone={ready && !got ? 'glow' : 'paper'}>
              <div class="row">
                <span class="grow stack" style:--gap="4px">
                  <b>{L.event.goal(goal)}</b>
                  <Meter value={Math.min(game.ev.pts, goal) / goal} tone="gold" size="sm" />
                  <Bag res={r.res} items={r.items} size="sm" />
                  {#if r.elder && game.elders[r.elder] === undefined}<small class="t-tiny t-gold t-strong"
                      >{L.report.newElder}: {L.elders[r.elder].name}</small
                    >{/if}
                </span>
                {#if got}
                  <span class="t-good"><Icon name="check" size={22} /></span>
                {:else}
                  <Button
                    variant="gold"
                    size="sm"
                    disabled={!ready}
                    onclick={e => {
                      if (act({ type: 'event', i }, 'reward')) fly(e.currentTarget as Element, r.res ?? {})
                    }}>{L.event.claim}</Button
                  >
                {/if}
              </div>
            </Card>
          </li>
        {/each}
      </ul>
      <p class="t-small t-lore">{L.event.top}</p>
    </Section>
  {/if}

  <Section title={L.weekly.title}>
    <p class="t-small t-soft">{L.weekly.reset(nextWeek(now) - now)}</p>
    <ul class="stack mt-2">
      {#each WEEKLY as w, i (w.id)}
        {@render task(
          L.weekly.task[w.id](w.n),
          game.weekly.n[w.id],
          w.n,
          game.weekly.got[i],
          weeklyDone(game, i),
          perWeek,
          () => act({ type: 'weekly', i }),
        )}
      {/each}
    </ul>
    {@render chest(L.weekly.bonus, WEEKLY_BONUS, game.weekly.got.every(Boolean), game.weekly.bonus, () =>
      act({ type: 'weeklyBonus' }),
    )}
  </Section>
</Sheet>
