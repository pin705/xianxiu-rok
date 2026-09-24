<script lang="ts">
  // Cống Hiến Các (như Alliance Shop của RoK): ô hàng với số còn, giá cống hiến; người trong minh đổi từng món, trưởng lão
  // và minh chủ nhập thêm bằng Minh khố (mỗi lần tối đa 5 món).
  import { ALLY_SHOP, ALLY_SHOP_MAX, type BagId } from '@rok/rules'
  import { SHOP_IDS, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Button, Card, Sheet } from './ui'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  let {
    open,
    onclose,
    ally,
    officer,
    send,
  }: {
    open: boolean
    onclose: () => void
    ally: AllyInfo
    officer: boolean
    send: (a: WorldAction) => Promise<Ack>
  } = $props()
  const g = useGame()
  const credit = $derived(g.game.contrib?.credit ?? 0)
  const fund = $derived(ally.fund ?? 0)
  const ids = SHOP_IDS as BagId[]
  const have = (id: BagId) => ally.stock?.[id] ?? 0
  // số món nhập được một lần: tối đa 5, không quá tồn tối đa, đủ Minh khố
  const batch = (id: BagId) => Math.min(5, ALLY_SHOP_MAX - have(id), Math.floor(fund / ALLY_SHOP[id]!.stock))
  const go = async (a: WorldAction) => {
    if ((await send(a)).ok) sfx('reward')
  }
</script>

<Sheet {open} {onclose} title={L.guild.shop} lore={L.guild.shopLore}>
  <div class="stack">
    <Card tone="glow">
      <p class="row between">
        <span><b>{L.guild.credit}</b> <span class="t-num">{num(credit)}</span></span>
        <span class="t-soft"><b>{L.guild.fund}</b> <span class="t-num">{num(fund)}</span></span>
      </p>
      <small class="t-tiny t-soft">{L.guild.creditHint}</small>
    </Card>
    <ul class="grid">
      {#each ids as id (id)}
        <li>
          <Card>
            <div class="good">
              <ItemCell {id} n={have(id)} />
              <div class="stack" style:--gap="2px">
                <b class="t-small">{itemName(id)}</b>
                <small class="t-tiny t-num">{L.guild.price(num(ALLY_SHOP[id]!.price))}</small>
                <small class="t-tiny" class:t-soft={have(id) > 0} class:t-bad={!have(id)}
                  >{have(id) ? L.guild.stock(have(id)) : L.guild.empty}</small
                >
              </div>
            </div>
            <div class="row wrap mt-2">
              <Button
                size="sm"
                variant="gold"
                disabled={!have(id) || credit < ALLY_SHOP[id]!.price}
                onclick={() => go({ type: 'allyBuy', item: id, n: 1 })}>{L.guild.buy}</Button
              >
              {#if officer}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={batch(id) < 1}
                  label={L.guild.cost(num(ALLY_SHOP[id]!.stock * Math.max(1, batch(id))))}
                  onclick={() => go({ type: 'allyStock', item: id, n: batch(id) })}
                  >{L.guild.restock} ×{Math.max(1, batch(id))}</Button
                >
              {/if}
            </div>
            {#if officer}<small class="t-tiny t-soft">{L.guild.cost(num(ALLY_SHOP[id]!.stock))}</small>{/if}
          </Card>
        </li>
      {/each}
    </ul>
  </div>
</Sheet>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .good {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }
</style>
