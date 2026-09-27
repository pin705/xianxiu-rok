<script lang="ts">
  // Khai Linh (Iconic I–V của RoK) dưới đe Luyện Khí Phòng: tầng hiện có (La Mã), hiệu ứng tầng V của ô, giá Khí Linh Tinh, nút khai linh
  // hay điều kiện cấp còn thiếu
  import { AWAKEN_COST, AWAKEN_MAX, GEAR, awakenError, type GearId } from '@rok/rules'
  import { Button, Tag } from './ui'
  import { L } from './lib'
  import { useGame } from './game'
  import { itemName } from './bag'

  let { gear }: { gear: GearId } = $props()
  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V']
  const g = useGame()
  const game = $derived(g.game)
  const aw = $derived(game.gear[gear]?.aw ?? 0)
  const err = $derived(awakenError(game, gear))
</script>

<div class="stack" style:--gap="4px">
  <div class="row wrap between">
    <b class="t-small">{L.forge.awaken.title(ROMAN[aw])}</b>
    {#if aw >= AWAKEN_MAX}
      <span class="stamp">{L.forge.awaken.max}</span>
    {:else if err === 'locked'}
      <Tag icon="lock" size="sm">{L.forge.awaken.need(2 * (aw + 1))}</Tag>
    {:else}
      <span class="row" style:--gap="6px">
        <Tag tone={err === 'no_item' ? 'bad' : 'plain'} size="sm"
          >{itemName('khiTinh')} {game.items.khiTinh ?? 0}/{AWAKEN_COST[aw]}</Tag
        >
        <Button size="sm" variant="gold" disabled={!!err} onclick={() => g.act({ type: 'awaken', gear }, 'reward')}
          >{L.forge.awaken.go}</Button
        >
      </span>
    {/if}
  </div>
  <small class="t-tiny {aw >= AWAKEN_MAX ? 't-good' : 't-soft'}">{L.forge.awaken.v[GEAR[gear].slot]}</small>
  <small class="t-tiny t-soft">{L.forge.awaken.hint}</small>
</div>
