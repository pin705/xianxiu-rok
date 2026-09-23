<script lang="ts">
  // Tăng giảm một số nguyên trong [min, max]
  import Button from './Button.svelte'

  let { value, min = 1, max, onchange }: { value: number; min?: number; max: number; onchange: (n: number) => void } = $props()
</script>

<div class="stepper">
  <Button variant="ghost" size="sm" icon="minus" label="−" disabled={value <= min} onclick={() => onchange(value - 1)} />
  <b class="t-num">{value}</b>
  <Button variant="ghost" size="sm" icon="plus" label="+" disabled={value >= max} onclick={() => onchange(value + 1)} />
</div>

<style>
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-3);
  }
  b {
    min-width: 24px;
    font-size: var(--fs-5);
    text-align: center;
  }
</style>
