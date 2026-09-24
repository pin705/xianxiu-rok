<script lang="ts">
  // Một ô vật phẩm trong túi đồ: hình họ vật phẩm, mệnh giá góc trên, số lượng góc dưới (như ô đồ của RoK).
  import { bagFamily, type BagId } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { denom, itemName } from './bag'
  import { num } from './lib'

  let {
    id,
    n,
    selected = false,
    onclick,
  }: { id: BagId; n: number; selected?: boolean; onclick?: () => void } = $props()
</script>

<button
  class="cell"
  class:on={selected}
  type="button"
  aria-label="{itemName(id)} ×{n}"
  aria-pressed={selected}
  {onclick}
>
  <Icon name={bagFamily(id)} size={48} />
  <span class="denom">{denom(id)}</span>
  <b class="n t-num">{num(n)}</b>
</button>

<style>
  .cell {
    position: relative;
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    padding: 0;
    border: 1.5px solid var(--paper3);
    border-radius: 10px;
    background: var(--silk);
    box-shadow: inset 0 0 0 2px color-mix(in srgb, white 40%, transparent);
    cursor: pointer;
    transition:
      transform 0.12s,
      border-color 0.12s;
  }
  .cell:active {
    transform: scale(0.95);
  }
  .cell.on {
    border-color: var(--gold);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--gold) 45%, transparent),
      inset 0 0 0 2px color-mix(in srgb, white 40%, transparent);
  }
  .denom {
    position: absolute;
    top: 2px;
    left: 3px;
    padding: 0 4px;
    border-radius: 6px;
    background: var(--ink);
    color: var(--paper);
    font-size: 11px;
    font-weight: 700;
    line-height: 16px;
  }
  .n {
    position: absolute;
    right: 4px;
    bottom: 1px;
    color: var(--ink);
    font-size: 13px;
    text-shadow:
      0 0 3px white,
      0 0 3px white;
  }
</style>
