<script lang="ts">
  // Chấm đỏ báo việc chờ: số hoặc "!". Đặt trong phần tử cha có position: relative.
  let { n = 0, fresh = false }: { n?: number; fresh?: boolean } = $props()
</script>

{#if n || fresh}<span class="badge" class:fresh aria-hidden="true">{n > 1 ? n : fresh && !n ? '!' : ''}</span>{/if}

<style>
  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    z-index: 1;
    display: grid;
    place-items: center;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    font: 800 10px/1 var(--font);
    color: var(--silk);
    background: var(--cinnabar);
    border-radius: 9px;
    box-shadow: 0 0 0 1.5px var(--gold-l), var(--shadow-1);
  }
  .fresh {
    color: var(--ink);
    background: var(--gold-l);
    box-shadow: 0 0 0 1.5px var(--cinnabar);
  }
</style>
