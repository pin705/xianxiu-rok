<script lang="ts">
  // Tinh Binh Luận Kiếm (Keener Blades của RoK) dưới Diễn Võ Trường — chỉ hiện khi mùa này giới theo luật Tinh Binh: mỗi hệ một hàng
  // (cấp tinh binh, công / máu thêm của cấp kế, giá, nút luyện)
  import { ELITE, ELITE_MAX, TYPES, eliteCost, eliteOn, tierOpen } from '@rok/rules'
  import { Bag, Button, Card } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const open = $derived(tierOpen(game, 5))
</script>

{#if eliteOn(game)}
  <Card tone="silk">
    <div class="stack" style:--gap="6px">
      <b class="t-small">{L.elite.title}</b>
      <p class="t-tiny t-soft t-lore">{L.elite.lore}</p>
      {#if !open}<small class="t-tiny t-bad">{L.elite.locked}</small>{/if}
      {#each TYPES as ty (ty)}
        {@const lv = game.elite?.[ty] ?? 0}
        <div class="row between">
          <span class="stack" style:--gap="2px">
            <b class="t-small">{L.units[ty]} · {L.elite.lv(lv, ELITE_MAX)}</b>
            <small class="t-tiny t-good"
              >{[
                ELITE[ty].atk && L.bonus(`atk.${ty}`, ELITE[ty].atk * Math.max(1, lv)),
                ELITE[ty].hp && L.bonus(`hp.${ty}`, ELITE[ty].hp * Math.max(1, lv)),
              ]
                .filter(Boolean)
                .join(' · ')}</small
            >
            {#if lv < ELITE_MAX}<Bag res={eliteCost(lv)} have={game.res} size="sm" />{/if}
          </span>
          <Button
            size="sm"
            variant="gold"
            disabled={!open || lv >= ELITE_MAX}
            onclick={() => g.act({ type: 'elite', unit: ty }, 'reward')}
            >{lv >= ELITE_MAX ? L.elite.max : L.elite.up}</Button
          >
        </div>
      {/each}
    </div>
  </Card>
{/if}
