<script lang="ts">
  // Màn che toàn màn hình, một thẻ ở giữa (mất mạng, cập nhật, lỗi vỡ màn). tone: ink (mực mờ, thấy cảnh sau lưng) ·
  // lacquer (sơn son kín, trong cột game). Các thuộc tính khác (role, aria-*, data-*) đặt thẳng lên lớp che.
  import type { Snippet } from 'svelte'

  let {
    tone = 'ink',
    children,
    ...rest
  }: { tone?: 'ink' | 'lacquer'; children: Snippet; [k: string]: unknown } = $props()
</script>

<div class="veil {tone}" {...rest}>{@render children()}</div>

<style>
  .veil {
    position: fixed;
    inset: 0;
    z-index: var(--z-toast);
    display: grid;
    place-items: center;
    padding: var(--sp-5);
  }
  .ink {
    background: color-mix(in srgb, var(--ink) 55%, transparent);
  }
  .ink > :global(*) {
    max-width: 360px;
  }
  .lacquer {
    max-width: var(--col);
    margin: 0 auto;
    background: var(--lacquer);
  }
</style>
