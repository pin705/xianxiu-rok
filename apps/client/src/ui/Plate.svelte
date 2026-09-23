<script lang="ts">
  // Biển tên công trình trên núi: tấm biển sơn mài hai đầu vát, viền vàng kẻ tay; số tầng trên giọt son.
  let { name, level = 0, dim = false }: { name: string; level?: number; dim?: boolean } = $props()
</script>

<span class="plate" class:dim>
  {#if level}<b class="lv">{level}</b>{/if}<span class="t-ellipsis">{name}</span>
</span>

<style>
  .plate {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    max-width: 156px;
    padding: 4px 14px 5px 7px;
    font-size: var(--fs-2);
    font-weight: 800;
    line-height: 1.3;
    white-space: nowrap;
    color: var(--text-inv);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.5);
    border: 0 solid transparent;
    border-image: var(--sk-sign);
  }
  .plate:not(:has(.lv)) {
    padding-left: 14px;
  }
  .dim {
    opacity: 0.8;
  }
  .lv {
    display: grid;
    place-items: center;
    min-width: 21px;
    height: 18px;
    padding: 0 5px 1px;
    font-size: var(--fs-1);
    color: var(--silk);
    border: 0 solid transparent;
    border-image: var(--sk-badge);
  }
</style>
