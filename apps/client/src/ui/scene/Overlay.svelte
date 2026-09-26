<script lang="ts">
  // Lớp phủ toàn khung cảnh bản đồ giới: mặc định lớp ghim (không chặn chạm — con nào bấm được tự nhận chạm, như Marker);
  // touch: lớp nhận cử chỉ kéo/chụm/chạm (chừa cột trái desktop). Các thuộc tính khác (role, aria-*, on*) đặt thẳng lên lớp.
  import type { Snippet } from 'svelte'

  let {
    touch = false,
    el = $bindable(),
    children,
    ...rest
  }: { touch?: boolean; el?: HTMLDivElement; children?: Snippet; [k: string]: unknown } = $props()
</script>

<div class="overlay" class:touch bind:this={el} {...rest}>{@render children?.()}</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    overflow: hidden;
    pointer-events: none;
  }
  .touch {
    inset: 0 0 0 var(--rail);
    z-index: auto;
    overflow: visible;
    touch-action: none;
    pointer-events: auto;
    cursor: grab;
  }
</style>
