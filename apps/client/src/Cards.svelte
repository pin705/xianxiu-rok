<script lang="ts">
  // Phiên Bài Kỳ Ngộ (Card King của RoK) trong trung tâm sự kiện: 12 lá úp (6 đôi quà), lật liền hai lá giống thì ghép nhận quà;
  // không giống thì hiện một chút rồi úp lại — người chơi phải nhớ. Lá úp chưa rõ do server rút mặt (chờ patch).
  import {
    FESTS,
    bagFamily,
    cardsAt,
    festTokens,
    flipError,
    type BagId,
    type FestId,
    type Items,
    type Metric,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Card, Cell } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  let { id }: { id: FestId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const d = $derived.by(() => {
    const def = FESTS[id]
    return def.kind === 'cards' ? def : null
  })
  const c = $derived(cardsAt(game, id))
  const stage = $derived(d ? d.stages[Math.min(game.fest[id]?.stage ?? 0, d.stages.length - 1)] : {})
  const first = (r: { items?: Items }) => Object.entries(r.items ?? {})[0] as [BagId, number] | undefined
  // cặp vừa lật không khớp: cho xem hai mặt một lúc rồi úp lại
  let peek = $state<number[]>([])
  let timer: ReturnType<typeof setTimeout> | undefined
  let wait = $state<number | null>(null)
  function flip(i: number) {
    const was = c.pending
    if (!g.act({ type: 'flip', id, i }, 'tap')) return
    wait = i
    clearTimeout(timer)
    if (was >= 0) {
      peek = [was, i]
      timer = setTimeout(() => (peek = []), 1100)
    }
  }
  $effect(() => {
    if (wait !== null && c.cards[wait]) wait = null // server đã rút mặt lá vừa lật
  })
  // ghép được đôi: tiếng nhận quà
  let matched = 0 // không phản ứng: chỉ để so lần trước
  $effect(() => {
    const n = c.cards.filter(x => x > 10).length
    if (n > matched) sfx('reward')
    matched = n
  })
  $effect(() => () => clearTimeout(timer))
  const faceUp = (k: number) => c.cards[k] > 10 || k === c.pending || peek.includes(k)
</script>

{#if d}
  <p class="row between">
    <b class="t-gold">{L.cards.game(Math.min(c.games + 1, d.games), d.games)}</b>
    <small class="t-tiny t-soft">{c.flips < d.free ? L.cards.free(d.free - c.flips) : L.cards.cost(d.cost)}</small>
  </p>
  {#if c.games >= d.games}
    <p class="t-small t-soft">{L.cards.over}</p>
  {:else}
    <div class="grid" style:--cols="4">
      {#each c.cards as x, k (k)}
        {@const it = x ? first(d.pairs[(x % 10) - 1]) : undefined}
        <Cell
          back="card"
          ratio="3 / 4"
          up={faceUp(k)}
          done={x > 10}
          busy={wait === k}
          disabled={x > 10 || k === c.pending || !!flipError({ ...game, time: now }, id, k)}
          onclick={() => flip(k)}
          >{#if faceUp(k) && it}<Icon name={bagFamily(it[0])} size={24} />{/if}</Cell
        >
      {/each}
    </div>
  {/if}
  <p class="row between">
    <b class="t-num t-gold">{L.fest.tokens(num(festTokens(game, id)), L.fest.tokenName[id])}</b>
  </p>
  <Card>
    <b class="t-small">{L.cards.pairs}</b>
    <div class="grid mt-1" style:--cols="3" style:--gap="4px">
      {#each d.pairs as r, k (k)}<Bag items={r.items} size="sm" />{/each}
    </div>
    <small class="t-tiny t-soft">{L.cards.done}</small>
    <Bag items={d.done.items} size="sm" />
  </Card>
  <Card>
    <ul class="stack" style:--gap="2px">
      {#each Object.entries(stage) as [m, v] (m)}
        <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
      {/each}
    </ul>
  </Card>
{/if}
