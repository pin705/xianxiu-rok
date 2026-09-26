<script lang="ts">
  // Huy hiệu + chữ loang ra như mực giữa màn cảnh rồi tan (đợt lôi kiếp mới). Neo mép dưới ngay trên nhãn lượt (tâm 56%):
  // không đè chữ, màn cao hay thấp cũng vậy.
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="flash stack center">{@render children()}</div>

<style>
  .flash {
    position: absolute;
    z-index: 1;
    left: 50%;
    bottom: calc(44% + 26px);
    width: min(100% - 24px, calc(var(--col) - 24px));
    translate: -50% 0;
    justify-items: center;
    color: var(--silk);
    text-shadow: 0 2px 10px rgb(0 0 0 / 0.6);
    pointer-events: none;
    animation: flash 1.6s var(--ease) forwards;
  }
  @keyframes flash {
    0% {
      opacity: 0;
      scale: 1.25;
      filter: blur(6px);
    }
    18%,
    70% {
      opacity: 1;
      scale: 1;
      filter: blur(0);
    }
    100% {
      opacity: 0;
      scale: 0.96;
    }
  }
</style>
