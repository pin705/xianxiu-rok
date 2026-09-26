<script lang="ts">
  // Khảo Cổ Động Phủ (Hunt for History của RoK) trong trung tâm sự kiện: tầng đang đào, chọn giải tối thượng (tầng 5, 10… bảng quý
  // hơn), lưới 16 ô — chạm ô để cuốc (server rút bằng mầm: ô chờ patch rồi mới lộ quà), trúng giải thì xuống tầng sau; rương mốc theo
  // số tầng đã qua.
  import {
    FESTS,
    bagFamily,
    delveError,
    digAt,
    digPicks,
    festTokens,
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
    return def.kind === 'dig' ? def : null
  })
  const got = $derived(game.fest[id]?.got ?? [])
  const at = $derived(digAt(game, id))
  const picks = $derived(d ? digPicks(d, at.layer) : [])
  const grand = $derived((at.layer + 1) % 5 === 0)
  const free = $derived(wheelFree(game, id, now))
  const stage = $derived(d ? d.stages[Math.min(game.fest[id]?.stage ?? 0, d.stages.length - 1)] : {})
  const first = (r: { items?: Items }) => Object.entries(r.items ?? {})[0] as [BagId, number] | undefined

  let pick = $state(0)
  let pending = $state<{ cell: number; n: number } | null>(null) // ô đang cuốc, số nhát đã đào lúc bấm
  let last = $state<{ items: Items; found: boolean } | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  const digs = $derived(got.filter(x => x < 0).length)
  function dig(cell: number) {
    if (!g.act({ type: 'delve', id, cell, pick })) return
    pending = { cell, n: digs }
    last = null
    clearTimeout(timer)
    timer = setTimeout(() => (pending = null), 8000) // server im lặng: thôi chờ
  }
  // kết quả về: mã cuối −(ô × 100 + r + 1) — r = 0 giải tối thượng, còn lại quà thường
  $effect(() => {
    if (!d || !pending || digs <= pending.n) return
    const r = ((-got.filter(x => x < 0).at(-1)! - 1) % 100) - 1
    const found = r < 0
    const prizes = digPicks(d, found ? at.layer - 1 : at.layer)
    last = { items: { ...(found ? prizes[pick] : d.pool[r].r).items }, found }
    pending = null
    clearTimeout(timer)
    sfx(found ? 'reward' : 'tap')
  })
  $effect(() => () => clearTimeout(timer))
  $effect(() => {
    if (pick >= picks.length) pick = 0
  })
  const dugAt = (cell: number) => at.dug.find(x => x.cell === cell)
</script>

{#if d}
  <p class="row between">
    <b class:t-gold={grand}>{L.delve.layer(at.layer + 1, grand)}</b>
    <small class="t-tiny t-soft">{L.delve.layers(at.layer)}</small>
  </p>
  <p class="t-small t-strong">{L.delve.pick}</p>
  <div class="picks" role="radiogroup">
    {#each picks as r, i (i)}
      {@const it = first(r)}
      <button role="radio" class="pick" class:on={i === pick} aria-checked={i === pick} onclick={() => (pick = i)}>
        {#if it}<Icon name={bagFamily(it[0])} size={30} /><b class="t-num n">×{it[1]}</b>{/if}
      </button>
    {/each}
  </div>
  <div class="cave" style:--n={Math.round(Math.sqrt(d.cells))}>
    {#each Array(d.cells) as _, k (k)}
      {@const x = dugAt(k)}
      {@const it = x && x.r >= 0 ? first(d.pool[x.r].r) : undefined}
      {#if x}
        <span class="cell open"
          >{#if it}<Icon name={bagFamily(it[0])} size={22} />{/if}</span
        >
      {:else}
        <button
          class="cell"
          class:busy={pending?.cell === k}
          aria-label={L.delve.tap(d.cost, free)}
          disabled={!!pending || !!delveError({ ...game, time: now }, id, k, pick)}
          onclick={() => dig(k)}
        ></button>
      {/if}
    {/each}
  </div>
  <p class="row between">
    <b class="t-num t-gold">{L.fest.tokens(num(festTokens(game, id)), L.fest.tokenName[id])}</b>
    <small class="t-tiny t-soft">{pending ? L.delve.digging : L.delve.tap(d.cost, free)}</small>
  </p>
  {#if last}
    <Card tone="glow">
      <div class="stack" style:--gap="6px">
        <b class="t-small" class:t-gold={last.found}>{last.found ? L.delve.found : L.delve.got}</b>
        <Bag items={last.items} size="sm" named />
      </div>
    </Card>
  {/if}
  <!-- rương mốc theo số tầng đã qua -->
  <ul class="stack chests" style:--gap="6px">
    {#each d.goals as goal, i (i)}
      <li class="row">
        <b class="t-num n2">{Math.min(at.layer, goal)}/{goal}</b>
        <span class="grow"><Bag items={d.rewards[i].items} size="sm" /></span>
        {#if got.includes(i)}<small class="t-tiny t-soft">{L.fest.claimed}</small>
        {:else if at.layer >= goal}<Button
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
  .picks {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-2);
    margin: var(--sp-1) 0 var(--sp-2);
  }
  .pick {
    display: grid;
    place-items: center;
    padding: var(--sp-1);
    background: var(--paper2);
    border: 1.5px solid var(--paper3);
    border-radius: 10px;
  }
  .pick.on {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--gold) 45%, transparent);
  }
  .n {
    font-size: var(--fs-1);
  }
  /* lưới động phủ: ô đá chưa đào (vân đá), ô đã đào lộ quà */
  .cave {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 4px;
    width: 100%;
    max-width: 260px;
    margin: var(--sp-2) auto;
  }
  .cell {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    background:
      radial-gradient(circle at 30% 30%, rgb(255 255 255 / 0.25), transparent 45%),
      linear-gradient(145deg, #8d7b66, #5f5245);
    border: 1.5px solid #4a3f35;
    border-radius: 8px;
    cursor: pointer;
  }
  .cell:disabled {
    cursor: default;
  }
  .cell.busy {
    animation: knock 0.3s linear infinite;
  }
  .cell.open {
    background: var(--paper2);
    border-color: var(--paper3);
    cursor: default;
  }
  @keyframes knock {
    50% {
      translate: 0 2px;
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
