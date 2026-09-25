<script lang="ts">
  // Thương nhân vân du (như Mysterious Merchant của RoK): 6 món, mỗi 8 giờ đổi hàng, mua bằng tài nguyên dư — mỗi món một lần.
  import { MERCHANT_EVERY, MERCHANT_HALL, merchantBought, merchantSlot, merchantStock } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Button, Section } from './ui'
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
  <Section title={L.merchant.title}>
    <p class="t-small t-soft">{L.merchant.lore} · {L.merchant.next(clock(left))}</p>
    <ul class="grid">
      {#each stock as x, i (x.item)}
        <li class="good" class:sold={bought.includes(i)}>
          <ItemCell id={x.item} n={x.n} />
          <b class="t-tiny">{itemName(x.item)}</b>
          <small class="t-tiny t-num row" style:--gap="3px"><Icon name={x.res} size={14} />{num(x.cost)}</small>
          <Button
            size="sm"
            variant="gold"
            wide
            disabled={bought.includes(i) || game.res[x.res] < x.cost}
            onclick={() => g.act({ type: 'buy', i }) && sfx('reward')}
            >{bought.includes(i) ? L.merchant.sold : L.merchant.buy}</Button
          >
        </li>
      {/each}
    </ul>
  </Section>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .good {
    display: grid;
    justify-items: center;
    gap: 3px;
    padding: 6px;
    text-align: center;
    background: var(--silk);
    border: 1.5px solid var(--paper3);
    border-radius: 12px;
  }
  .sold {
    opacity: 0.55;
  }
</style>
