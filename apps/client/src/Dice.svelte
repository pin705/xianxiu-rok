<script lang="ts">
  // Vạn Hoa Viên (Garden of Infinity của RoK) trong trung tâm sự kiện: bàn 20 ô quanh khung 6×6, quân cờ đi theo mặt xúc
  // xắc (server rút bằng mầm — bấm đổ thì chờ patch rồi quân mới đi từng ô), quà ô dừng, quà qua Khởi điểm, lượt miễn phí, lệnh,
  // rương mốc theo tổng số lượt đổ.
  import {
    FESTS,
    bagFamily,
    diceAt,
    festTokens,
    spinError,
    wheelFree,
    type BagId,
    type FestId,
    type Items,
    type Metric,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  let { id }: { id: FestId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const d = $derived.by(() => {
    const def = FESTS[id]
    return def.kind === 'dice' ? def : null
  })
  const got = $derived(game.fest[id]?.got ?? []) // mặt đã đổ (số âm) và rương mốc đã nhận
  const at = $derived(diceAt(game, id))
  const free = $derived(wheelFree(game, id, now))
  const stage = $derived(d ? d.stages[Math.min(game.fest[id]?.stage ?? 0, d.stages.length - 1)] : {})
  // ô k → hàng / cột trên khung 6×6: trên (trái → phải), phải (xuống), dưới (phải → trái), trái (lên)
  function cell(k: number) {
    if (k < 6) return [1, k + 1]
    if (k < 10) return [k - 4, 6]
    return k < 16 ? [6, 16 - k] : [21 - k, 1]
  }
  const first = (r: { items?: Items }) => Object.entries(r.items ?? {})[0] as [BagId, number] | undefined

  let pending = $state<number | null>(null) // số lượt đã đổ lúc bấm
  let from = 0
  let walk = $state<number | null>(null) // ô quân đang đi qua khi diễn (null: đứng ở ô của state)
  let last = $state<{ face: number; items: Items; lap: boolean } | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  function roll() {
    if (!g.act({ type: 'spin', id, n: 1 })) return
    pending = at.rolls
    from = at.pos
    last = null
    clearTimeout(timer)
    timer = setTimeout(() => (pending = null), 8000) // server im lặng: thôi chờ
  }
  $effect(() => {
    if (!d || pending === null || at.rolls <= pending) return
    const face = -got.filter(x => x < 0).at(-1)!
    pending = null
    clearTimeout(timer)
    let k = 0
    const step = () => {
      walk = (from + ++k) % d.board.length
      sfx('tap')
      if (k < face) timer = setTimeout(step, 220)
      else {
        const lap = from + face >= d.board.length
        const items: Items = { ...d.board[walk].items }
        if (lap)
          for (const [i, n] of Object.entries(d.lap.items ?? {}))
            items[i as keyof Items] = (items[i as keyof Items] ?? 0) + (n ?? 0)
        last = { face, items, lap }
        timer = setTimeout(() => (walk = null), 400)
        sfx('reward')
      }
    }
    timer = setTimeout(step, 300)
  })
  $effect(() => () => clearTimeout(timer))
  const here = $derived(walk ?? at.pos)
</script>

{#if d}
  <div class="board">
    {#each d.board as r, k (k)}
      {@const it = first(r)}
      {@const [row, col] = cell(k)}
      <span class="sq" class:start={k === 0} class:here={k === here} style:grid-row={row} style:grid-column={col}>
        {#if k === 0}<span class="flag" title={L.dice.start}><Icon name="flag" size={14} /></span>{/if}
        {#if it}<Icon name={bagFamily(it[0])} size={22} /><b class="n t-num">×{it[1]}</b>{/if}
        {#if k === here}<span class="pawn" aria-hidden="true"><Icon name="star" size={16} /></span>{/if}
      </span>
    {/each}
    <div class="mid stack center" style:--gap="6px">
      <span class="die t-num" class:rolling={pending !== null}
        >{last?.face ?? (-(got.filter(x => x < 0).at(-1) ?? 0) || '?')}</span
      >
      <small class="t-tiny t-soft">{L.dice.laps(at.laps)}</small>
      <Button
        variant="gold"
        disabled={pending !== null || walk !== null || !!spinError({ ...game, time: now }, id, 1)}
        onclick={roll}>{free ? L.dice.free : L.dice.roll(d.cost)}</Button
      >
    </div>
  </div>
  <p class="row between">
    <b class="t-num t-gold">{L.fest.tokens(num(festTokens(game, id)), L.fest.tokenName[id])}</b>
    {#if pending !== null}<small class="t-small t-soft">{L.dice.rolling}</small>{/if}
  </p>
  {#if last && walk === null}
    <Card tone="glow">
      <div class="stack" style:--gap="6px">
        <b class="t-small">{L.dice.got(last.face)}</b>
        {#if last.lap}<small class="t-small t-gold">{L.dice.lap}</small>{/if}
        <Bag items={last.items} size="sm" named />
      </div>
    </Card>
  {/if}
  <!-- rương mốc theo tổng số lượt đổ (Garden of Infinity: mốc Silver Dice) -->
  <ul class="stack chests" style:--gap="6px">
    {#each d.goals as goal, i (i)}
      <li class="row">
        <b class="t-num n2">{Math.min(at.rolls, goal)}/{goal}</b>
        <span class="grow"><Bag items={d.rewards[i].items} size="sm" /></span>
        {#if got.includes(i)}<small class="t-tiny t-soft">{L.fest.claimed}</small>
        {:else if at.rolls >= goal}<Button
            size="sm"
            variant="gold"
            onclick={() => g.act({ type: 'fest', id, i }, 'reward')}>{L.fest.claim}</Button
          >{/if}
      </li>
    {/each}
  </ul>
  <Card>
    <ul class="today">
      {#each Object.entries(stage) as [m, v] (m)}
        <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
      {/each}
    </ul>
  </Card>
{/if}

<style>
  .board {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    grid-template-rows: repeat(6, minmax(0, 1fr));
    gap: 3px;
    width: 100%;
    max-width: 340px;
    aspect-ratio: 1;
    margin: var(--sp-2) auto;
  }
  .sq {
    position: relative;
    display: grid;
    place-items: center;
    align-content: center;
    min-width: 0;
    padding: 2px;
    background: var(--paper2);
    border: 1.5px solid var(--paper3);
    border-radius: 8px;
    transition: box-shadow 0.15s;
  }
  .sq.start {
    background: color-mix(in srgb, var(--gold-l) 35%, var(--paper2));
    border-color: var(--gold-d);
  }
  .sq.here {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--gold) 55%, transparent);
  }
  .flag {
    position: absolute;
    top: 1px;
    left: 2px;
    color: var(--gold-d);
  }
  .n {
    font-size: var(--fs-1);
    line-height: 1;
  }
  .pawn {
    position: absolute;
    top: -8px;
    right: -6px;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    color: var(--cinnabar, #b8322a);
    background: var(--paper);
    border: 2px solid var(--gold-d);
    border-radius: 50%;
  }
  .mid {
    grid-row: 2 / 6;
    grid-column: 2 / 6;
    display: grid;
    place-content: center;
  }
  .die {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    margin: 0 auto;
    font-size: var(--fs-6, 28px);
    font-weight: 900;
    background: var(--paper);
    border: 2px solid var(--ink, #2b2b2b);
    border-radius: 12px;
    box-shadow: 0 3px 0 var(--paper3);
  }
  .die.rolling {
    animation: tumble 0.5s linear infinite;
  }
  @keyframes tumble {
    to {
      rotate: 360deg;
    }
  }
  .chests {
    margin: var(--sp-2) 0;
    padding: 0;
    list-style: none;
  }
  .n2 {
    min-width: 5ch;
  }
  .today {
    margin: 0;
    padding-left: 1.1em;
  }
</style>
