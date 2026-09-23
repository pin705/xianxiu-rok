<script lang="ts">
  // Biển tên công trình trên núi: tấm gỗ sơn mài, số tầng khắc trên dấu son.
  let { name, level = 0, dim = false }: { name: string; level?: number; dim?: boolean } = $props()
</script>

<span class="plate lacquer" class:dim>
  {#if level}<b class="lv">{level}</b>{/if}<span class="t-ellipsis">{name}</span>
</span>

<style>
  .plate {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    max-width: 150px;
    padding: 2px 10px 2px 3px;
    font-size: var(--fs-2);
    font-weight: 800;
    line-height: 1.3;
    white-space: nowrap;
    box-shadow: inset 0 0 0 1px var(--gold-d), var(--shadow-1);
    clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%);
  }
  .plate:not(:has(.lv)) {
    padding-left: 10px;
  }
  .dim {
    opacity: 0.8;
  }
  .lv {
    display: grid;
    place-items: center;
    min-width: 18px;
    height: 16px;
    padding: 0 3px;
    font-size: var(--fs-1);
    color: var(--silk);
    background: var(--cinnabar);
    clip-path: polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px);
  }
</style>
