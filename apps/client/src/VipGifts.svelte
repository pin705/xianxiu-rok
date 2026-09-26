<script lang="ts">
  // Lễ vật tấn cấp (Special Privilege Chest của RoK — luật ở rules/sect/vip.ts vipGift): mỗi cấp Hương Hỏa một lễ vật mua đúng một
  // lần bằng linh thạch (giá theo tầng Chủ điện); cấp chưa tới có khoá, đã mua đóng dấu son
  import { VIP_GIFTS, vipGiftCost, vipGiftError } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Section } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
</script>

<Section title={L.vip.gifts}>
  <p class="t-tiny t-soft">{L.vip.giftsLore}</p>
  <ul class="ledger">
    {#each VIP_GIFTS.slice(1) as x, k (k)}
      {@const at = k + 1}
      {@const why = vipGiftError(game, at)}
      <li class="row" class:on={!why || why === 'not_enough'}>
        <b class="t-small nowrap">{L.vip.level(at)}</b>
        <span class="grow"><Bag items={x.reward.items} size="sm" /></span>
        {#if why === 'claimed'}<span class="stamp">{L.mail.got}</span>
        {:else if why === 'locked'}<Icon name="lock" size={14} />
        {:else}
          <Button
            size="sm"
            variant="ink"
            label={L.vip.buy}
            disabled={!!why || g.busy}
            onclick={() => g.act({ type: 'vipGift', lv: at }, 'reward')}
            ><Icon name="linhThach" size={16} />{num(vipGiftCost(game, at))}</Button
          >
        {/if}
      </li>
    {/each}
  </ul>
</Section>
