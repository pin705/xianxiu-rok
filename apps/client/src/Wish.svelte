<script lang="ts">
  // Nguyện Thụ Cầu Duyên (Esmeralda's Prayer của RoK) trong trung tâm sự kiện: cây nguyện 12 quà (4 quà đặc biệt viền vàng), quà đã
  // rút mờ đi; bấm cầu (server rút bằng mầm — chờ patch rồi quà sáng lên), rút đủ quà đặc biệt thì nhận nốt phần còn lại, cây nở lại.
  import {
    FESTS,
    WISH_BLOOM,
    bagFamily,
    festTokens,
    spinError,
    spins,
    wheelFree,
    wishAt,
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
    return def.kind === 'wish' ? def : null
  })
  const at = $derived(wishAt(game, id))
  const n = $derived(spins(game, id))
  const free = $derived(wheelFree(game, id, now))
  const stage = $derived(d ? d.stages[Math.min(game.fest[id]?.stage ?? 0, d.stages.length - 1)] : {})
  const bigs = $derived(d ? d.pool.filter(p => p.big).length : 0)
  const first = (r: { items?: Items }) => Object.entries(r.items ?? {})[0] as [BagId, number] | undefined

  let pending = $state<number | null>(null) // số lượt đã cầu lúc bấm
  let last = $state<{ items: Items; bloom: boolean } | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  function pray() {
    if (!g.act({ type: 'spin', id, n: 1 })) return
    pending = n
    last = null
    clearTimeout(timer)
    timer = setTimeout(() => (pending = null), 8000) // server im lặng: thôi chờ
  }
  // kết quả về: mã cuối (WISH_BLOOM thì quà vừa rút đứng ngay trước) — cây nở thì kèm mọi quà còn lại của vòng đó
  $effect(() => {
    if (!d || pending === null || n <= pending) return
    const got = (game.fest[id]?.got ?? []).filter(x => x < 0)
    const bloom = got.at(-1) === WISH_BLOOM
    const k = -(bloom ? got.at(-2)! : got.at(-1)!) - 1
    // cây nở: quà vừa rút + mọi quà chưa rút của vòng đó
    const prev = got.slice(0, bloom ? -1 : got.length)
    const done = prev.slice(prev.lastIndexOf(WISH_BLOOM) + 1).map(x => -x - 1)
    const give = bloom ? d.pool.map((_, x) => x).filter(x => x === k || !done.includes(x)) : [k]
    const items: Items = {}
    for (const [i, v] of give.flatMap(x => Object.entries(d.pool[x].r.items ?? {})))
      items[i as BagId] = (items[i as BagId] ?? 0) + (v ?? 0)
    last = { items, bloom }
    pending = null
    clearTimeout(timer)
    sfx('reward')
  })
  $effect(() => () => clearTimeout(timer))
</script>

{#if d}
  <p class="row between">
    <b>{L.wish.round(at.round + 1)}</b>
    <small class="t-small t-gold">{L.wish.bigs(at.drawn.filter(k => d.pool[k].big).length, bigs)}</small>
  </p>
  <div class="tree">
    {#each d.pool as p, k (k)}
      {@const it = first(p.r)}
      <span class="gift" class:big={p.big} class:gone={at.drawn.includes(k)}>
        {#if it}<Icon name={bagFamily(it[0])} size={26} /><b class="t-num n">×{it[1]}</b>{/if}
        {#if at.drawn.includes(k)}<span class="tick"><Icon name="check" size={14} /></span>{/if}
      </span>
    {/each}
  </div>
  <p class="row between">
    <b class="t-num t-gold">{L.fest.tokens(num(festTokens(game, id)), L.fest.tokenName[id])}</b>
    {#if pending !== null}<small class="t-small t-soft">{L.wish.wishing}</small>{/if}
  </p>
  <Button variant="gold" wide disabled={pending !== null || !!spinError({ ...game, time: now }, id, 1)} onclick={pray}
    >{free ? L.wish.free : L.wish.one(d.cost)}</Button
  >
  {#if last}
    <Card tone="glow">
      <div class="stack" style:--gap="6px">
        <b class="t-small" class:t-gold={last.bloom}>{last.bloom ? L.wish.bloom : L.wish.got}</b>
        <Bag items={last.items} size="sm" named />
      </div>
    </Card>
  {/if}
  <Card>
    <ul class="today">
      {#each Object.entries(stage) as [m, v] (m)}
        <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
      {/each}
    </ul>
  </Card>
{/if}

<style>
  /* cây nguyện: 12 quà treo, quà đặc biệt viền vàng, quà đã rút mờ và có dấu */
  .tree {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-2);
    margin: var(--sp-2) 0;
  }
  .gift {
    position: relative;
    display: grid;
    place-items: center;
    padding: var(--sp-1);
    background: var(--paper2);
    border: 1.5px solid var(--paper3);
    border-radius: 12px 12px 12px 3px;
  }
  .gift.big {
    background: color-mix(in srgb, var(--gold-l) 30%, var(--paper2));
    border-color: var(--gold-d);
  }
  .gift.gone {
    opacity: 0.45;
    filter: grayscale(0.6);
  }
  .tick {
    position: absolute;
    top: 2px;
    right: 4px;
    color: var(--good, #2f7a4f);
  }
  .n {
    font-size: var(--fs-1);
  }
  .today {
    margin: 0;
    padding-left: 1.1em;
  }
</style>
