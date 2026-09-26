<script lang="ts">
  // Thẻ giờ cạnh nút ấn son: thời gian việc cần (số to + đồng hồ) và dòng phụ ("Xong lúc 13:50", lý do chưa làm được).
  import { Icon } from '@rok/art'

  let { time, sub }: { time: string; sub?: string } = $props()
</script>

<span class="timer">
  <b class="t-num"><Icon name="clock" size={14} />{time}</b>
  {#if sub}<small>{sub}</small>{/if}
</span>

<style>
  .timer {
    display: grid;
    gap: 2px;
    max-width: 150px;
    padding: 6px 12px;
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 8px;
  }
  b {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-4);
  }
  small {
    font-size: var(--fs-1);
    color: var(--text-faint);
  }
</style>
