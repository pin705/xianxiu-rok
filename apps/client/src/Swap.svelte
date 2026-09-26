<script lang="ts">
  // Hoá Kiến Vi Binh (War and Peace của RoK — luật ở rules/sect/fest.ts swap): mỗi mệnh giá một dòng, Lỗ Ban Phù đang có → Luyện
  // Binh Phù cùng mệnh giá; kéo chọn số lá (tới hạn mức còn lại của mệnh giá đó) rồi bấm Đổi.
  import { FESTS, SPEED_MIN, type BagId, type FestId } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Button, Card, Slider, Tag } from './ui'
  import { L } from './lib'
  import { denom } from './bag'
  import { useGame } from './game'

  let { id }: { id: FestId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const d = $derived.by(() => {
    const def = FESTS[id]
    return def.kind === 'swap' ? def : null
  })
  let pick = $state<number[]>([]) // số lá đang chọn mỗi mệnh giá (0: mặc định — đổi hết phần được)
  const rows = $derived(
    d
      ? SPEED_MIN.map((min, i) => {
          const from = `${d.from}${min}` as BagId
          const have = game.items[from] ?? 0
          const left = d.max - (game.fest[id]?.sp?.[i] ?? 0)
          const cap = Math.min(have, left)
          return { i, from, to: `${d.to}${min}` as BagId, have, left, cap, n: Math.min(pick[i] || cap, cap) }
        }).filter(r => r.have > 0 || r.left < d.max)
      : [],
  )
  function trade(i: number, n: number) {
    if (g.act({ type: 'swap', id, i, n }, 'reward')) pick[i] = 0
  }
</script>

{#if d}
  <p class="t-small t-strong">{L.swap.row(L.bag.family.loBan.name, L.bag.family.luyenBinh.name)}</p>
  {#if !rows.length}<p class="t-small t-soft">{L.swap.none}</p>{/if}
  {#each rows as r (r.i)}
    <Card>
      <p class="row between">
        <span class="row" style:--gap="6px">
          <Icon name="loBan" size={26} /><b class="t-num">{denom(r.from)}</b>
          <Icon name="arrow" size={16} />
          <Icon name="luyenBinh" size={26} /><b class="t-num">{denom(r.to)}</b>
        </span>
        <span class="stack t-right" style:--gap="0">
          <small class="t-tiny">{L.swap.have(r.have)}</small>
          <small class="t-tiny t-soft">{L.swap.left(r.left, d.max)}</small>
        </span>
      </p>
      <div class="row">
        {#if r.cap > 1}
          <span class="grow">
            <Slider
              value={r.n}
              min={1}
              max={r.cap}
              label={L.swap.row(denom(r.from), denom(r.to))}
              onchange={v => (pick[r.i] = v)}
            />
          </span>
        {/if}
        {#if !r.left}
          <Tag icon="check" tone="good">{L.swap.full}</Tag>
        {:else}
          <Button size="sm" variant="gold" disabled={!r.cap || g.busy} onclick={() => trade(r.i, r.n)}
            >{L.swap.go(r.n)}</Button
          >
        {/if}
      </div>
    </Card>
  {/each}
{/if}
