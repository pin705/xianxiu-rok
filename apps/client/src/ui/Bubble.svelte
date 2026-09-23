<script lang="ts">
  // Bong bóng đồng hồ trên công trình: bảng sơn mài bo tròn viền vàng, đĩa lam có biểu tượng việc, thời gian, dải tiến độ.
  import { Icon, type IconName } from '@rok/art'
  import Meter from './Meter.svelte'

  let { icon, time, value }: { icon: IconName; time: string; value: number } = $props()
</script>

<span class="bubble">
  <span class="ic"><Icon name={icon} size={13} /></span>
  <span class="stack">
    <b class="t-num">{time}</b>
    <Meter {value} size="xs" dark />
  </span>
</span>

<style>
  .bubble {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 13px 6px 4px;
    font-size: var(--fs-2);
    color: var(--text-inv);
    border: 0 solid transparent;
    border-image: var(--sk-bubble);
  }
  .stack {
    --gap: 3px;
    min-width: 42px;
  }
  .ic {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    color: var(--gold-l);
    background: var(--img-disc-azure) center / 100% 100% no-repeat;
  }
</style>
