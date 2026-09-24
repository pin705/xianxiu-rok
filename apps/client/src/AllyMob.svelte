<script lang="ts">
  // Minh vụ đường (như Alliance Mobilization của RoK): thanh điểm cả minh với 5 mốc quà, việc mình đang làm (tiến độ, hạn,
  // nộp), bảng việc chung (nhận một việc — việc mới thế chỗ). Việc đo bằng phần tăng thêm từ lúc nhận.
  import { MOB_GOALS, MOB_MIN, MOB_REWARDS, MOB_TAKES, nextWeek, type Metric } from '@rok/rules'
  import { boardOf, mobOf, mobProgress, mobTask, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Icon, type IconName } from '@rok/art'
  import { Bag, Button, Card, Meter, Section, Sheet } from './ui'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'

  let {
    open,
    onclose,
    ally,
    me,
    send,
  }: {
    open: boolean
    onclose: () => void
    ally: AllyInfo
    me: number | null
    send: (a: WorldAction) => Promise<Ack>
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  const ICON: Partial<Record<Metric, IconName>> = {
    build: 'hammer',
    train: 'people',
    heal: 'heal',
    brew: 'cauldron',
    tech: 'scroll',
    win: 'swords',
    hunt: 'skull',
    speed: 'thoiQuang',
    gather: 'linhKhoang',
    draw: 'nganDuyen',
    raid: 'swords',
    realm: 'flag',
    ally: 'people',
  }
  const board = $derived(boardOf(ally, now))
  const mob = $derived(mobOf(game, now))
  const mine = $derived(me === null ? 0 : (board.by[me] ?? 0))
  const top = MOB_GOALS[MOB_GOALS.length - 1]
  const text = (m: Metric, n: number) => (L.fest.gain[m] ?? L.fest.task[m])(num(n))
  const go = async (a: WorldAction, sound: 'reward' | 'tap' = 'tap') => {
    if ((await send(a)).ok) sfx(sound)
  }
</script>

<Sheet {open} {onclose} title={L.mob.title} lore={L.mob.lore} sub={L.mob.reset(clock(nextWeek(now) - now))}>
  <div class="stack">
    <Card tone="glow">
      <p class="row between">
        <b>{L.mob.pts(num(board.pts))}</b><small class="t-soft">{L.mob.mine(mine)}</small>
      </p>
      <Meter value={Math.min(1, board.pts / top)} tone="gold" size="md" />
      <small class="t-tiny t-soft">{L.mob.takes(mob.took, MOB_TAKES)}</small>
    </Card>

    <Section title={L.mob.task}>
      {#if mob.task}
        {@const t = mob.task}
        {@const v = Math.min(t.n, mobProgress(game, mob))}
        {@const late = t.until < now}
        <Card tone={v >= t.n && !late ? 'glow' : 'silk'}>
          <div class="row">
            <Icon name={ICON[t.m] ?? 'star'} size={28} />
            <span class="grow stack" style:--gap="2px">
              <b class="t-small">{text(t.m, t.n)}</b>
              <Meter value={v / t.n} size="sm" tone={late ? 'bad' : 'spirit'} />
              <small class="t-tiny t-soft t-num"
                >{num(v)}/{num(t.n)} · +{t.pts} · {late ? L.mob.late : L.mob.left(clock(t.until - now))}</small
              >
            </span>
            <Button
              size="sm"
              variant={late ? 'quiet' : 'gold'}
              disabled={!late && v < t.n}
              onclick={() => go({ type: 'mobDone' }, 'reward')}>{L.mob.done}</Button
            >
          </div>
        </Card>
      {:else}
        <p class="t-small t-soft">{L.mob.none}</p>
      {/if}
    </Section>

    <Section title={L.mob.board}>
      <ul class="grid">
        {#each board.board as i, slot (i)}
          {@const t = mobTask(ally.id, board.week, i)}
          <li class="task">
            <Icon name={ICON[t.m] ?? 'star'} size={28} />
            <small class="t-tiny">{text(t.m, t.n)}</small>
            <b class="t-small t-gold">+{t.pts}</b>
            <Button
              size="sm"
              variant="ghost"
              wide
              disabled={(!!mob.task && mob.task.until > now) || mob.took >= MOB_TAKES}
              onclick={() => go({ type: 'mobTake', slot })}>{L.mob.take}</Button
            >
          </li>
        {/each}
      </ul>
    </Section>

    <Section title={L.mob.rewards}>
      <ul class="stack">
        {#each MOB_GOALS as goal, k (goal)}
          {@const got = mob.got.includes(k)}
          {@const ready = board.pts >= goal && mine >= MOB_MIN}
          <li>
            <Card tone={ready && !got ? 'glow' : 'silk'}>
              <div class="row">
                <span class="grow stack" style:--gap="3px"
                  ><b class="t-small">{L.mob.goal(num(goal))}</b><Bag items={MOB_REWARDS[k].items} size="sm" /></span
                >
                {#if got}
                  <span class="t-good"><Icon name="check" size={22} /></span>
                {:else}
                  <Button
                    size="sm"
                    variant="gold"
                    disabled={!ready}
                    onclick={() => go({ type: 'mobClaim', tier: k }, 'reward')}>{L.mob.claim}</Button
                  >
                {/if}
              </div>
              {#if board.pts >= goal && mine < MOB_MIN}<small class="t-tiny t-soft">{L.mob.need(MOB_MIN)}</small>{/if}
            </Card>
          </li>
        {/each}
      </ul>
    </Section>
  </div>
</Sheet>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .task {
    display: grid;
    justify-items: center;
    gap: 3px;
    padding: 8px;
    text-align: center;
    background: var(--silk);
    border: 1.5px solid var(--paper3);
    border-radius: 12px;
  }
</style>
