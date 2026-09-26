<script lang="ts">
  // Hoàng Kim Mê Cảnh (Golden Kingdom của RoK — luật ở rules/sect/maze.ts): chọn tối đa 3 đội ảo rồi vào; mê cung 4 × 4 ô phủ sương,
  // chạm ô kề ô đã mở để thám (server rút loại ô bằng mầm — ô gõ nhịp chờ patch), yêu binh / thủ lĩnh thì đội đang chọn ra đánh
  // (xem lại trận), thần đàn mời chọn phúc; hạ thủ lĩnh xuống tầng. Mốc quà theo kỷ lục tầng vẽ ở danh sách mốc chung.
  import {
    MAZE_FLOORS,
    MAZE_TEAMS,
    count,
    mazeAlive,
    mazeDone,
    mazeKind,
    mazeNear,
    mazeToday,
    type Army,
    type ElderId,
    type Report,
    type State,
  } from '@rok/rules'
  import { Icon, Portrait, type IconName } from '@rok/art'
  import ArmyPick from './Army.svelte'
  import { Button, Card, Tag } from './ui'
  import { L, LOOK, num } from './lib'
  import { useGame } from './game'

  let {
    s,
    onfight,
    onreplay,
  }: {
    s: State
    onfight?: (i: number, team: number) => Promise<Report | null>
    onreplay?: (r: Report) => void
  } = $props()
  const g = useGame()
  const m = $derived(mazeToday(s))
  let picks = $state<{ elder: ElderId; army: Army }[]>([])
  let lead = $state(0)
  let busy = $state<number | null>(null) // ô đang chờ server
  let last = $state<Report | null>(null)
  const ICON: Record<string, IconName> = {
    foe: 'swords',
    boss: 'skull',
    gift: 'thachNang',
    shrine: 'star',
    spring: 'heal',
    trap: 'bolt',
    start: 'flag',
  }
  async function enter() {
    if (g.act({ type: 'mazeStart', teams: picks }, 'tap')) picks = []
  }
  async function open(i: number) {
    if (!m) return
    const kind = mazeKind(m.tiles[i])
    const fightNow = kind === 'foe' || kind === 'boss'
    busy = i
    // ô đã lộ yêu binh / thủ lĩnh, hay ô sương (có thể là trận): server giải, client chờ kết quả
    const r = fightNow || m.tiles[i] < 0 ? await onfight?.(i, lead) : null
    busy = null
    if (r) last = r
  }
  // đội ra trận: đội đang chọn ngã thì tự đổi sang đội còn quân
  $effect(() => {
    if (m && !mazeAlive(m, lead)) {
      const k = m.teams.findIndex((_, t) => mazeAlive(m, t))
      if (k >= 0) lead = k
    }
  })
</script>

{#if !m}
  <p class="t-small t-strong">{L.maze.teams(picks.length, MAZE_TEAMS)}</p>
  {#each picks as p, k (k)}
    <p class="row t-small">
      <Portrait look={LOOK[p.elder]} size={28} /><span class="grow"
        >{L.elders[p.elder].name} · {num(count(p.army))}</span
      >
      <Button size="sm" variant="quiet" onclick={() => (picks = picks.filter((_, j) => j !== k))}>✕</Button>
    </p>
  {/each}
  {#if picks.length < MAZE_TEAMS}
    <ArmyPick
      cta={L.maze.add}
      field
      disabled={g.busy}
      onsubmit={(elder, army) => (picks = [...picks.filter(p => p.elder !== elder), { elder, army }])}
    />
  {/if}
  <Button variant="gold" wide disabled={!picks.length || g.busy} onclick={enter}>{L.maze.enter}</Button>
{:else}
  <p class="row between">
    <b class="t-gold">{L.maze.floor(Math.min(m.floor + 1, MAZE_FLOORS), MAZE_FLOORS)}</b>
    <small class="t-tiny t-soft">{L.maze.tap}</small>
  </p>
  {#if m.floor >= MAZE_FLOORS}
    <Tag icon="check" tone="good">{L.maze.clear}</Tag>
  {:else if m.over}
    <Tag icon="skull" tone="bad">{L.maze.over}</Tag>
  {:else}
    <div class="cave">
      {#each m.tiles as x, i (i)}
        {@const kind = mazeKind(x)}
        {@const can =
          !m.offer && ((x < 0 && mazeNear(m.tiles, i)) || ((kind === 'foe' || kind === 'boss') && !mazeDone(x)))}
        <button
          class="cell"
          class:fog={x < 0}
          class:done={mazeDone(x)}
          class:boss={kind === 'boss'}
          class:busy={busy === i}
          disabled={!can || busy !== null}
          aria-label={kind ? L.maze.kinds[kind] : L.maze.tap}
          onclick={() => open(i)}
          >{#if kind}<Icon name={ICON[kind]} size={22} />{/if}</button
        >
      {/each}
    </div>
  {/if}
  {#if m.offer}
    <Card tone="glow">
      <b class="t-small">{L.maze.pick}</b>
      <div class="stack" style:--gap="6px">
        {#each m.offer as b, k (b)}
          <Button size="sm" variant="ghost" onclick={() => g.act({ type: 'mazePick', k }, 'reward')}
            >{L.maze.blessName[b]} — {L.maze.blessFx[b]}</Button
          >
        {/each}
      </div>
    </Card>
  {/if}
  {#if last}
    <div class="row">
      <span class="grow t-small" class:t-good={last.win} class:t-bad={!last.win}>{L.maze.last(last.win)}</span>
      <Button size="sm" variant="ghost" icon="arrow" onclick={() => last && onreplay?.(last)}>{L.report.replay}</Button>
    </div>
  {/if}
  <p class="t-small t-strong">{L.maze.lead}</p>
  <div class="teams" role="radiogroup">
    {#each m.teams as tm, t (t)}
      <button
        role="radio"
        class="team"
        class:on={t === lead}
        aria-checked={t === lead}
        disabled={!mazeAlive(m, t)}
        onclick={() => (lead = t)}
      >
        <Portrait look={LOOK[tm.elder]} size={30} />
        <small class="t-tiny t-num">{num(count(tm.army))}/{num(count(tm.full))}</small>
      </button>
    {/each}
  </div>
  {#if m.bless.length}
    <p class="row wrap t-tiny" style:--gap="4px">
      <span class="t-soft">{L.maze.bless}:</span>
      {#each m.bless as b (b)}<Tag size="sm" tone="good">{L.maze.blessName[b]}</Tag>{/each}
    </p>
  {/if}
{/if}

<style>
  .cave {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    width: 100%;
    max-width: 260px;
    margin: var(--sp-2) auto;
  }
  .cell {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    background: var(--paper2);
    border: 1.5px solid var(--gold-d);
    border-radius: 8px;
  }
  .cell.fog {
    background:
      radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.35), transparent 50%),
      linear-gradient(145deg, #c9a24a, #8a6a25);
  }
  .cell.boss {
    border-color: var(--bad, #b8322a);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--bad, #b8322a) 40%, transparent);
  }
  .cell.done {
    opacity: 0.5;
  }
  .cell:disabled {
    cursor: default;
  }
  .cell.busy {
    animation: knock 0.3s linear infinite;
  }
  @keyframes knock {
    50% {
      translate: 0 2px;
    }
  }
  .teams {
    display: flex;
    gap: var(--sp-2);
  }
  .team {
    display: grid;
    justify-items: center;
    padding: 4px 8px;
    background: var(--paper2);
    border: 1.5px solid var(--paper3);
    border-radius: 10px;
  }
  .team.on {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--gold) 45%, transparent);
  }
  .team:disabled {
    opacity: 0.4;
  }
</style>
