<script lang="ts">
  // Bong bóng đồng hồ trên công trình: biểu tượng việc, thời gian còn lại, dải tiến độ.
  import { Icon, type IconName } from '@rok/art'
  import Meter from './Meter.svelte'

  let { icon, time, value }: { icon: IconName; time: string; value: number } = $props()
</script>

<span class="bubble lacquer">
  <span class="ic"><Icon name={icon} size={12} /></span>
  <span class="stack">
    <b class="t-num">{time}</b>
    <Meter {value} size="xs" />
  </span>
</span>

<style>
  .bubble {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px 4px 3px;
    font-size: var(--fs-2);
    border-radius: 14px;
    box-shadow: inset 0 0 0 1px var(--gold-d), var(--shadow-1);
  }
  .stack {
    --gap: 2px;
    min-width: 40px;
  }
  .ic {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    color: var(--gold-l);
    background: var(--azurite-d);
    border-radius: 50%;
  }
</style>
