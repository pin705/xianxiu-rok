<script lang="ts">
  // Hương Hỏa (như VIP của RoK, không bán): cấp, điểm tới cấp sau, chuỗi ngày vào game (mai được bao nhiêu), rương hôm nay,
  // tăng ích cấp này và cấp sau, số phút xong miễn phí; Hương Hỏa Các (VIP Store): món mở theo cấp, mua bằng tài nguyên.
  import {
    VIP_CHEST,
    VIP_FREE,
    VIP_LEVELS,
    VIP_PERKS,
    VIP_SHOP,
    dayOf,
    nextWeek,
    vipGot,
    vipLevel,
    vipToday,
    type Bonus,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Meter, Sheet } from './ui'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'
  import { L, clock, num } from './lib'
  import { useGame } from './game'

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const lv = $derived(vipLevel(game))
  const next = $derived(VIP_LEVELS[lv + 1])
  const got = $derived(game.vip.chest === dayOf(now))
  const bought = $derived(vipGot(game, now))
  const perks = (i: number) => Object.entries(VIP_PERKS[i] ?? {}) as [Bonus, number][]
</script>

<Sheet {open} {onclose} title={L.vip.title} sub={L.vip.level(lv)}>
  <div class="stack">
    <p class="t-small t-lore">{L.vip.lore}</p>
    <Card tone="glow">
      <div class="stack" style:--gap="6px">
        <p class="row between">
          <b>{L.vip.level(lv)}</b>
          <small class="t-num t-soft">{next ? `${num(game.vip.pts)} / ${num(next)}` : num(game.vip.pts)}</small>
        </p>
        {#if next}<Meter value={(game.vip.pts - VIP_LEVELS[lv]) / (next - VIP_LEVELS[lv])} size="md" />{/if}
        <p class="t-small">{L.vip.streak(game.vip.streak, vipToday(game.vip.streak + 1))}</p>
      </div>
    </Card>
    <Card>
      <div class="stack" style:--gap="6px">
        <p class="row between"><b>{L.vip.chest}</b></p>
        <Bag res={VIP_CHEST[lv].res} items={VIP_CHEST[lv].items} size="sm" />
        {#if got}
          <small class="t-soft">{L.vip.chestGot}</small>
        {:else}
          <Button variant="gold" onclick={() => act({ type: 'vipChest' }, 'reward')}>{L.vip.open}</Button>
        {/if}
      </div>
    </Card>
    <Card>
      <div class="stack" style:--gap="6px">
        <b>{L.vip.shop}</b>
        <small class="t-small t-soft">{L.vip.shopLore} · {L.merchant.next(clock(nextWeek(now) - now))}</small>
        <ul class="goods">
          {#each VIP_SHOP as x (x.item)}
            {@const left = x.week - (bought[x.item] ?? 0)}
            {@const cost = x.price * game.levels.chuDien}
            <li class="good" class:dim={lv < x.lv || left <= 0}>
              <ItemCell id={x.item} n={x.n} />
              <b class="t-tiny">{itemName(x.item)}</b>
              {#if lv < x.lv}
                <small class="t-tiny t-soft row" style:--gap="3px"
                  ><Icon name="lock" size={12} />{L.vip.shopNeed(x.lv)}</small
                >
              {:else}
                <small class="t-tiny t-num row" style:--gap="3px"><Icon name={x.res} size={14} />{num(cost)}</small>
                <small class="t-tiny t-soft">{L.vip.shopLeft(left, x.week)}</small>
                <Button
                  size="sm"
                  variant="gold"
                  wide
                  disabled={left <= 0 || game.res[x.res] < cost}
                  onclick={() => act({ type: 'vipBuy', item: x.item }, 'reward')}>{L.vip.buy}</Button
                >
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    </Card>
    {#each [lv, lv + 1] as i (i)}
      {#if i < VIP_LEVELS.length}
        <Card tone={i === lv ? undefined : 'silk'}>
          <p class="t-small t-strong">{i === lv ? L.vip.now(i) : L.vip.nextLv(i)}</p>
          <ul class="perks t-small">
            {#each perks(i) as [k, v] (k)}<li>
                {L.vip.perk[k as keyof typeof L.vip.perk] ?? k} +{Math.round(v * 100)}%
              </li>{/each}
            {#if VIP_FREE[i]}<li>{L.vip.free(VIP_FREE[i])}</li>{/if}
            {#if !perks(i).length && !VIP_FREE[i]}<li class="t-soft">—</li>{/if}
          </ul>
        </Card>
      {/if}
    {/each}
  </div>
</Sheet>

<style>
  .goods {
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
    align-content: start;
    gap: 3px;
    padding: 6px;
    text-align: center;
    background: var(--paper2);
    border: 1.5px solid var(--paper3);
    border-radius: 12px;
  }
  .dim {
    opacity: 0.55;
  }
  .perks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px var(--sp-3);
    margin: var(--sp-1) 0 0;
    padding: 0;
    list-style: none;
  }
</style>
