<script lang="ts">
  // Minh vụ đường (như Alliance Mobilization của RoK): trống trận + điểm cả minh với 5 mốc quà (hạt son trên thanh), việc mình
  // đang làm (lệnh bài ghim: tiến độ, hạn, nộp), bảng việc chung (bùa giấy ghim — nhận một việc, việc mới thế chỗ), đường mốc quà.
  // Việc đo bằng phần tăng thêm từ lúc nhận.
  import { MOB_GOALS, MOB_MIN, MOB_REWARDS, MOB_TAKES, nextWeek, type Metric } from '@rok/rules'
  import { boardOf, mobOf, mobProgress, mobTask, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Icon, type IconName } from '@rok/art'
  import { Bag, Banner, Board, Button, Meter, Note, Section, Sheet } from './ui'
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
  <!-- trống trận: điểm cả minh, phần mình góp, lượt nhận hôm nay; thanh điểm với hạt son ở 5 mốc -->
  <div class="mt-2">
    <Banner title={L.mob.pts(num(board.pts))} art="ally-mob" picSize={84} picLeft>
      {#snippet lead()}
        <small class="t-small">{L.mob.mine(mine)}</small>
        <small class="t-tiny t-soft">{L.mob.takes(mob.took, MOB_TAKES)}</small>
      {/snippet}
      <div class="mt-1">
        <Meter
          value={Math.min(1, board.pts / top)}
          tone="gold"
          size="md"
          marks={MOB_GOALS.map(goal => ({ at: goal / top, label: L.mob.goal(num(goal)) }))}
        />
      </div>
    </Banner>
  </div>

  <Section title={L.mob.task}>
    {#if mob.task}
      {@const t = mob.task}
      {@const v = Math.min(t.n, mobProgress(game, mob))}
      {@const late = t.until < now}
      <!-- lệnh bài đang cầm: tờ giấy ghim son, xong thì viền son sáng -->
      <Note tilt={-0.5} ready={v >= t.n && !late}>
        <div class="row" style:--gap="10px">
          <Icon name={ICON[t.m] ?? 'star'} size={30} />
          <span class="grow stack" style:--gap="3px">
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
      </Note>
    {:else}
      <p class="t-small t-soft">{L.mob.none}</p>
    {/if}
  </Section>

  <Section title={L.mob.board}>
    <!-- bảng việc: tấm gỗ, mỗi việc một lá bùa ghim son (nghiêng nhẹ), điểm việc viết son -->
    <Board min={140}>
      {#each board.board as i, slot (i)}
        {@const t = mobTask(ally.id, board.week, i)}
        <Note tilt={slot % 2 ? 1 : -1}>
          <span class="row between"
            ><Icon name={ICON[t.m] ?? 'star'} size={26} /><b class="t-num t-big t-bad">+{t.pts}</b></span
          >
          <small class="t-tiny">{text(t.m, t.n)}</small>
          <Button
            size="sm"
            variant="ghost"
            wide
            disabled={(!!mob.task && mob.task.until > now) || mob.took >= MOB_TAKES}
            onclick={() => go({ type: 'mobTake', slot })}>{L.mob.take}</Button
          >
        </Note>
      {/each}
    </Board>
  </Section>

  <Section title={L.mob.rewards}>
    <!-- đường mốc quà: hạt son khi cả minh đạt mốc; đã nhận: dấu son -->
    <ol class="path">
      {#each MOB_GOALS as goal, k (goal)}
        {@const got = mob.got.includes(k)}
        {@const ready = board.pts >= goal && mine >= MOB_MIN}
        <li class:hit={board.pts >= goal}>
          <div class="row ruled" class:on={ready && !got}>
            <span class="grow stack" style:--gap="3px"
              ><b class="t-small">{L.mob.goal(num(goal))}</b><Bag items={MOB_REWARDS[k].items} size="sm" />
              {#if board.pts >= goal && mine < MOB_MIN}<small class="t-tiny t-soft">{L.mob.need(MOB_MIN)}</small>{/if}
            </span>
            {#if got}
              <span class="stamp">{L.fest.claimed}</span>
            {:else}
              <Button
                size="sm"
                variant="gold"
                disabled={!ready}
                onclick={() => go({ type: 'mobClaim', tier: k }, 'reward')}>{L.mob.claim}</Button
              >
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  </Section>
</Sheet>
