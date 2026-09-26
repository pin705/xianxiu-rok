<script lang="ts">
  // Thương nhân vân du (như Mysterious Merchant của RoK): 6 món, mỗi 8 giờ đổi hàng, mua bằng tài nguyên dư — mỗi món một lần.
  // Bố cục sạp hàng: biển sạp (tranh sạp chợ, tên, đồng hồ đổi hàng trên dải son), hàng hoá bày thành kệ, nút giá
  // dưới mỗi món; món đã mua đóng dấu son.
  import { MERCHANT_EVERY, MERCHANT_HALL, merchantBought, merchantSlot, merchantStock } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Banner, Button, Shelf } from './ui'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const stock = $derived(merchantStock(game, now))
  const bought = $derived(merchantBought(game, now))
  const left = $derived((merchantSlot(now) + 1) * MERCHANT_EVERY - now)
</script>

{#if game.levels.tangBaoCac >= MERCHANT_HALL}
  <section class="stack mt-4">
    <Banner title={L.merchant.title} art="ev-market" picSize={72} band={L.merchant.next(clock(left))}>
      <p class="t-tiny t-lore clamp">{L.merchant.lore}</p>
    </Banner>
    <Shelf cols={3} row={142}>
      {#each stock as x, i (x.item)}
        {@const sold = bought.includes(i)}
        <div class="stack middle w-full" style:--gap="2px">
          <span class:dim={sold}><ItemCell id={x.item} n={x.n} /></span>
          <b class="t-tiny t-ellipsis w-full t-center">{itemName(x.item)}</b>
          {#if sold}
            <span class="stamp">{L.merchant.sold}</span>
          {:else}
            <Button
              size="sm"
              variant="gold"
              wide
              disabled={game.res[x.res] < x.cost}
              onclick={() => g.act({ type: 'buy', i }) && sfx('reward')}
              ><Icon name={x.res} size={14} />{num(x.cost)}<span class="sr"> · {L.merchant.buy}</span></Button
            >
          {/if}
        </div>
      {/each}
    </Shelf>
  </section>
{/if}
