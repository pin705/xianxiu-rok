<script lang="ts">
  // Báo việc chờ, đặt trong phần tử cha có position: relative.
  // n > 0: số việc · dot: chấm đỏ không số (có việc cần làm) · fresh: "!" vàng (mục vừa mở, chưa ghé)
  let { n = 0, dot = false, fresh = false }: { n?: number; dot?: boolean; fresh?: boolean } = $props()
</script>

{#if n > 0}
  <span class="badge" aria-hidden="true">{n}</span>
{:else if dot}
  <span class="badge dot" aria-hidden="true"></span>
{:else if fresh}
  <span class="badge fresh" aria-hidden="true">!</span>
{/if}

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
  .dot {
    min-width: 12px;
    height: 12px;
    padding: 0;
  }
  .fresh {
    color: var(--ink);
    background: var(--gold-l);
    box-shadow: 0 0 0 1.5px var(--cinnabar);
  }
</style>
