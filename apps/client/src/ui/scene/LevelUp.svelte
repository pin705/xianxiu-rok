<script lang="ts">
  // Chữ lên tầng bay lên rồi tan trên công trình vừa nâng (chữ ngà viền vàng đậm), đặt trong Pin.
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<b class="lvup">{@render children()}</b>

<style>
  .lvup {
    display: block;
    font-size: var(--fs-5);
    font-weight: 900;
    color: var(--silk);
    -webkit-text-stroke: 3px var(--gold-d);
    paint-order: stroke fill;
    animation: lvup 1.6s var(--ease) forwards;
  }
  @keyframes lvup {
    0% {
      opacity: 0;
      transform: translateY(8px) scale(0.6);
    }
    20% {
      opacity: 1;
      transform: translateY(0) scale(1.15);
    }
    100% {
      opacity: 0;
      transform: translateY(-26px);
    }
  }
</style>
