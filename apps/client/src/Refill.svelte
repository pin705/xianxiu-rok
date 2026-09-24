<script lang="ts">
  // Bù tài nguyên thiếu một chạm (như "Use resource items" / Quick Replenish của RoK): mỗi loại thiếu một dòng —
  // "Thiếu N · đợi ~T", mở nang vừa đủ (nhỏ trước cho đỡ phí), hoặc đổi phần dư loại khác ở Thương hội.
  import { BAG, BAG_IDS, RESOURCES, rate, storeNeed, tradeKeep, type Bag, type BagId, type Res } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Button } from './ui'
  import { L, clock, num } from './lib'
  import { useGame } from './game'

  let { cost }: { cost: Bag } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  // kho không chứa nổi chi phí thì không bù được — bảng đã chỉ đường nâng Tàng Bảo Các
  const short = $derived(
    storeNeed(game, cost)
      ? []
      : RESOURCES.filter(r => game.res[r] < cost[r]).map(r => ({ r, n: cost[r] - game.res[r] })),
  )
  const packsOf = (r: Res) =>
    BAG_IDS.filter(id => {
      const d = BAG[id]
      return d.use === 'res' && d.res === r && (game.items[id] ?? 0) > 0
    }).sort((a, b) => amount(a) - amount(b))
  const amount = (id: BagId) => {
    const d = BAG[id]
    return d.use === 'res' ? d.n : 0
  }
  // nang cần mở cho đủ n: nang nhỏ trước; nếu nang nhỏ hết mà vẫn thiếu thì mở nang lớn hơn
  function plan(r: Res, n: number) {
    const out: [BagId, number][] = []
    let left = n
    for (const id of packsOf(r)) {
      if (left <= 0) break
      const k = Math.min(game.items[id] ?? 0, Math.ceil(left / amount(id)))
      out.push([id, k])
      left -= k * amount(id)
    }
    return left > 0 ? null : out
  }
  // đổi ở Thương hội: lấy loại dư nhiều nhất (sau khi trừ chi phí của chính nó)
  function swap(r: Res, n: number) {
    if (game.levels.tangBaoCac < 1) return null
    const pay = Math.ceil(n / tradeKeep(game))
    const from = RESOURCES.filter(x => x !== r && game.res[x] - cost[x] >= pay).sort(
      (a, b) => game.res[b] - cost[b] - (game.res[a] - cost[a]),
    )[0]
    return from ? { from, pay } : null
  }
  function open(p: [BagId, number][]) {
    for (const [item, n] of p) act({ type: 'use', item, n }, 'reward')
  }
</script>

{#if short.length}
  <ul class="refill stack">
    {#each short as { r, n } (r)}
      {@const p = plan(r, n)}
      {@const sw = swap(r, n)}
      {@const wait = rate(game, r) > 0 ? (n / rate(game, r)) * 3_600_000 : 0}
      <li class="stack">
        <p class="row t-small">
          <Icon name={r} size={16} /><b class="t-bad">{L.refill.short(num(n), L.res[r])}</b>
          {#if wait}<span class="t-soft">· {L.refill.wait(clock(wait))}</span>{/if}
        </p>
        <div class="row wrap">
          {#if p}
            <Button size="sm" variant="gold" onclick={() => open(p)}
              >{L.refill.packs(p.reduce((k, [, x]) => k + x, 0))}</Button
            >
          {/if}
          {#if sw}
            <Button
              size="sm"
              variant="ghost"
              onclick={() => act({ type: 'trade', from: sw.from, to: r, n: sw.pay }, 'reward')}
              >{L.refill.trade(num(sw.pay), L.res[sw.from])}</Button
            >
          {/if}
        </div>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .refill {
    margin: var(--sp-2) 0 0;
    padding: var(--sp-2) var(--sp-3);
    list-style: none;
    background: color-mix(in srgb, var(--cinnabar) 7%, transparent);
    border: 1px dashed color-mix(in srgb, var(--cinnabar) 45%, transparent);
    border-radius: 10px;
  }
  .wrap {
    flex-wrap: wrap;
  }
</style>
