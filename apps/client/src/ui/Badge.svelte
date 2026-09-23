<script lang="ts">
  // Báo việc chờ, đặt trong phần tử cha có position: relative. Giọt son vẽ tay viền vàng.
  // n > 0: số việc · dot: chấm son không số (có việc cần làm) · fresh: "!" giọt vàng (mục vừa mở, chưa ghé)
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
    top: -5px;
    right: -6px;
    z-index: 1;
    display: grid;
    place-items: center;
    min-width: 21px;
    height: 19px;
    padding: 0 6px 1px;
    font: 800 11px/1 var(--font);
    color: var(--silk);
    border: 0 solid transparent;
    border-image: var(--sk-badge);
  }
  .dot {
    min-width: 14px;
    height: 13px;
    padding: 0;
  }
  .fresh {
    color: var(--ink);
    border-image: var(--sk-badge-fresh);
  }
</style>
