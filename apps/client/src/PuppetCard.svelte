<script lang="ts">
  // Cơ Quan Khôi Lỗi (Shifting Gears của RoK) dưới Luyện Khí Phòng — chỉ hiện khi mùa này giới theo luật Khôi Lỗi: số khôi lỗi / kho,
  // giá mỗi con, chế ×1 / ×5 / ×10 (đội đi cướp tự mang theo — rules/world/raid.ts)
  import { PUPPET_COST, puppetCap, puppetOn } from '@rok/rules'
  import { Bag, Button, Card } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const have = $derived(game.puppet ?? 0)
  const cap = $derived(puppetCap(game))
</script>

{#if puppetOn(game)}
  <Card tone="silk">
    <div class="stack mt-2" style:--gap="6px">
      <b class="t-small">{L.puppet.title}</b>
      <p class="t-tiny t-soft t-lore">{L.puppet.lore}</p>
      <p class="row between t-small">
        <b>{L.puppet.have(have, cap)}</b>
        <span class="row t-tiny t-soft" style:--gap="4px"
          >{L.puppet.each} <Bag res={PUPPET_COST} have={game.res} size="sm" /></span
        >
      </p>
      <div class="row wrap" style:--gap="6px">
        {#each [1, 5, 10] as n (n)}
          <Button
            size="sm"
            variant="gold"
            disabled={have + n > cap}
            onclick={() => g.act({ type: 'puppet', n }, 'reward')}>{L.puppet.make(n)}</Button
          >
        {/each}
      </div>
    </div>
  </Card>
{/if}
