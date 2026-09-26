<script lang="ts">
  // Viên báo nhỏ giữa mép trên màn hình (đang nối lại…): nền mực chữ giấy, không chặn chạm.
  // Các thuộc tính khác (role, data-*) đặt thẳng lên viên báo.
  import type { Snippet } from 'svelte'

  let { children, ...rest }: { children: Snippet; [k: string]: unknown } = $props()
</script>

<div class="notice" {...rest}>{@render children()}</div>

<style>
  .notice {
    position: fixed;
    top: calc(var(--safe-t) + 6px);
    left: 50%;
    z-index: var(--z-toast);
    translate: -50% 0;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 700;
    color: var(--paper);
    background: color-mix(in srgb, var(--ink) 82%, transparent);
    border-radius: 999px;
    pointer-events: none;
  }
</style>
