<script lang="ts">
  // Minh vụ đường (như Alliance Mobilization của RoK): trống trận + điểm cả minh với 5 mốc quà (hạt son trên thanh), việc mình
  // đang làm (lệnh bài ghim: tiến độ, hạn, nộp), bảng việc chung (bùa giấy ghim — nhận một việc, việc mới thế chỗ), đường mốc quà.
  // Việc đo bằng phần tăng thêm từ lúc nhận.
  import { MOB_GOALS, MOB_MIN, MOB_REWARDS, MOB_TAKES, nextWeek, type Metric } from '@rok/rules'
  import { boardOf, mobOf, mobProgress, mobTask, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Icon, artOf, type IconName } from '@rok/art'
  import { Bag, Button, Meter, Section, Sheet } from './ui'
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
  const drum = artOf('ui:ally-mob')?.src
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
  <header class="drum">
    <span class="pic"
      >{#if drum}<img src={drum} alt="" draggable="false" />{:else}<Icon name="scroll" size={40} />{/if}</span
    >
    <div class="stack" style:--gap="2px">
      <b class="pts t-num">{L.mob.pts(num(board.pts))}</b>
      <small class="t-small">{L.mob.mine(mine)}</small>
      <small class="t-tiny t-soft">{L.mob.takes(mob.took, MOB_TAKES)}</small>
    </div>
    <div class="track">
      <Meter value={Math.min(1, board.pts / top)} tone="gold" size="md" />
      {#each MOB_GOALS as goal (goal)}<i
          class="bead"
          class:hit={board.pts >= goal}
          style:left="{(goal / top) * 100}%"
          title={L.mob.goal(num(goal))}
        ></i>{/each}
    </div>
  </header>

  <Section title={L.mob.task}>
    {#if mob.task}
      {@const t = mob.task}
      {@const v = Math.min(t.n, mobProgress(game, mob))}
      {@const late = t.until < now}
      <!-- lệnh bài đang cầm: tờ giấy ghim son, xong thì viền son sáng -->
      <div class="note order" class:ready={v >= t.n && !late}>
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
    {:else}
      <p class="t-small t-soft">{L.mob.none}</p>
    {/if}
  </Section>

  <Section title={L.mob.board}>
    <!-- bảng việc: tấm gỗ, mỗi việc một lá bùa ghim son (nghiêng nhẹ), điểm việc viết son -->
    <ul class="board">
      {#each board.board as i, slot (i)}
        {@const t = mobTask(ally.id, board.week, i)}
        <li class="note">
          <span class="row between"
            ><Icon name={ICON[t.m] ?? 'star'} size={26} /><b class="gain t-num">+{t.pts}</b></span
          >
          <small class="t-tiny task">{text(t.m, t.n)}</small>
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
    <!-- đường mốc quà: hạt son khi cả minh đạt mốc; đã nhận: dấu son -->
    <ol class="path">
      {#each MOB_GOALS as goal, k (goal)}
        {@const got = mob.got.includes(k)}
        {@const ready = board.pts >= goal && mine >= MOB_MIN}
        <li class:hit={board.pts >= goal}>
          <div class="step" class:ready={ready && !got}>
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

<style>
  /* ---------- trống trận ---------- */
  .drum {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 6px 12px;
    align-items: center;
    margin-top: var(--sp-2);
    padding: 8px 14px 14px 8px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .pic img {
    display: block;
    width: 84px;
    height: 84px;
    rotate: -4deg;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.25));
  }
  .pts {
    font-size: var(--fs-5);
    line-height: 1.15;
  }
  .track {
    position: relative;
    grid-column: 1 / -1;
    margin: 4px 6px 0;
  }
  /* hạt mốc trên thanh: mực khi chưa tới, son khi cả minh đạt */
  .bead {
    position: absolute;
    top: 50%;
    width: 13px;
    height: 13px;
    translate: -50% -50%;
    background: var(--paper);
    border: 2px solid var(--rim, var(--ink3));
    border-radius: 50%;
  }
  .bead.hit {
    background: var(--cinnabar);
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--cinnabar);
  }
  /* ---------- lá bùa ghim son ---------- */
  .note {
    position: relative;
    display: grid;
    gap: 5px;
    padding: 12px 10px 10px;
    background: #fbf7ec;
    border: 1px solid #d8cdb4;
    border-radius: 3px;
    box-shadow: 0 3px 6px rgb(0 0 0 / 0.14);
  }
  .note::before {
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
  .order {
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 14px 12px 12px;
    rotate: -0.5deg;
  }
  .note.ready {
    border-color: var(--cinnabar);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cinnabar) 35%, transparent),
      0 0 14px rgb(var(--gold-glow) / 0.6);
  }
  /* bảng việc: tấm gỗ nâu, bùa ghim so le */
  .board {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px 10px;
    margin: 0;
    padding: 18px 12px 12px;
    list-style: none;
    background: linear-gradient(#9a6b43, #7a5132);
    border: 3px solid #5c3a1f;
    border-radius: 4px;
    box-shadow:
      inset 0 2px 6px rgb(0 0 0 / 0.25),
      0 3px 8px rgb(var(--shade) / 0.2);
  }
  .board .note:nth-child(odd) {
    rotate: -1deg;
  }
  .board .note:nth-child(even) {
    rotate: 1deg;
  }
  .gain {
    font-size: var(--fs-4);
    font-weight: 900;
    color: var(--cinnabar);
  }
  .task {
    min-height: 2.6em;
    line-height: 1.3;
  }
  /* ---------- đường mốc quà ---------- */
  .step {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 6px 8px 8px;
    border-bottom: 1px dashed var(--paper3);
  }
  .step.ready {
    background: color-mix(in srgb, var(--cinnabar) 8%, transparent);
    border-radius: 6px;
  }
</style>
