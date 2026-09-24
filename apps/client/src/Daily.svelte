<script lang="ts">
  // Nhiệm vụ ngày (4 việc quen tay mỗi phiên, làm mới 0h giờ VN) và nhiệm vụ tuần (mục tiêu gộp cả tuần, làm mới 0h thứ Hai).
  // Mỗi phần: từng việc nhận thưởng riêng, xong hết thì mở rương.
  import {
    DAILY,
    DAILY_BONUS,
    DAILY_HALL,
    EVENT_GOALS,
    EVENT_REWARDS,
    RESOURCES,
    WEEKLY,
    WEEKLY_BONUS,
    dailyDone,
    dailyReward,
    eventOf,
    isWeekend,
    nextDay,
    nextWeek,
    weeklyDone,
    weeklyReward,
    type PillId,
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

  const perDay = $derived(Object.fromEntries(RESOURCES.map(r => [r, dailyReward(game)])))
  const perWeek = $derived(Object.fromEntries(RESOURCES.map(r => [r, weeklyReward(game)])))
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
  {#if game.levels.chuDien >= DAILY_HALL}
    <!-- Sự kiện tuần: chủ đề đổi theo tuần, đủ mốc nhận quà, top của giới nhận thư lúc hết tuần -->
    {@const theme = eventOf(game.ev.week)}
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
  <ul class="stack mt-2">
    {#each DAILY as d, i (d.id)}
      {@render task(
        L.daily.task[d.id](d.n),
        game.daily.n[d.id],
        d.n,
        game.daily.got[i],
        dailyDone(game, i),
        perDay,
        () => act({ type: 'daily', i }),
      )}
    {/each}
  </ul>
  {@render chest(L.daily.bonus, DAILY_BONUS, game.daily.got.every(Boolean), game.daily.bonus, () =>
    act({ type: 'dailyBonus' }),
  )}

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
