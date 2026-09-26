<script lang="ts">
  // Thương nhân vân du (như Mysterious Merchant của RoK): 6 món, mỗi 8 giờ đổi hàng, mua bằng tài nguyên dư — mỗi món một lần.
  // Bố cục sạp hàng: biển sạp (tranh sạp chợ, tên, đồng hồ đổi hàng trên dải son), hàng hoá bày thành kệ, nút giá
  // dưới mỗi món; món đã mua đóng dấu son.
  import { MERCHANT_EVERY, MERCHANT_HALL, merchantBought, merchantSlot, merchantStock } from '@rok/rules'
  import { Icon, artOf } from '@rok/art'
  import { Button, Card } from './ui'
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
  const stall = artOf('ui:ev-market')?.src
</script>

{#if game.levels.tangBaoCac >= MERCHANT_HALL}
  <section class="stall">
    <Card>
      <header class="sign">
        {#if stall}<img class="art" src={stall} alt="" draggable="false" />{/if}
        <b class="name">{L.merchant.title}</b>
        <small class="ends">{L.merchant.next(clock(left))}</small>
        <p class="t-tiny t-lore lore">{L.merchant.lore}</p>
      </header>
    </Card>
    <ul class="goods">
      {#each stock as x, i (x.item)}
        {@const sold = bought.includes(i)}
        <li class:sold>
          <ItemCell id={x.item} n={x.n} />
          <b class="t-tiny nm">{itemName(x.item)}</b>
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
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .stall {
    margin-top: var(--sp-4);
  }
  /* biển sạp: tên + dải son bên trái, tranh sạp nghiêng bên phải */
  .sign {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 72px;
    gap: 4px 8px;
    align-items: start;
  }
  .art {
    grid-area: 1 / 2 / 3 / 3;
    width: 72px;
    rotate: 4deg;
  }
  .name {
    font-size: var(--fs-5);
    line-height: 1.1;
  }
  .ends {
    justify-self: start;
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--text-inv);
    background: var(--cinnabar);
  }
  .lore {
    grid-column: 1 / -1;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .goods {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px 8px;
    margin-top: var(--sp-2);
    padding: 0;
    list-style: none;
  }
  .goods li {
    display: grid;
    grid-template-rows: 64px auto 38px;
    justify-items: center;
    align-items: center;
    gap: 2px;
    padding-bottom: 6px;
    text-align: center;
    border-bottom: 6px solid var(--ochre);
  }
  .nm {
    max-width: 100%;
    overflow: hidden;
    line-height: 1.2;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .sold :global(.cell) {
    opacity: 0.5;
  }
</style>
