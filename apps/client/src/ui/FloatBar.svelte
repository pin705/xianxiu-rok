<script lang="ts">
  // Dải tin nổi đáy cảnh (trên thanh tab): giấy mờ bo tròn, một dòng chữ; chạm để mở. narrow: dạt trái, chừa chỗ nút bên
  // phải (tạp dịch ở núi).
  import type { Snippet } from 'svelte'

  let {
    narrow = false,
    label,
    onclick,
    children,
  }: { narrow?: boolean; label: string; onclick: () => void; children: Snippet } = $props()
</script>

<button type="button" class="float-bar" class:narrow aria-label={label} {onclick}>{@render children()}</button>

<style>
  .float-bar {
    position: fixed;
    left: 50%;
    bottom: calc(var(--safe-b) + var(--nav-h, 88px));
    z-index: var(--z-hud);
    display: flex;
    align-items: center;
    gap: 6px;
    width: min(92vw, calc(var(--col) - 24px));
    padding: 6px 12px;
    font-size: 13px;
    color: var(--text);
    text-align: left;
    white-space: nowrap;
    /* nền giấy mờ thay viên mực đen: hoà vào tranh thủy mặc, không thành vệt tối đè ngang cảnh */
    background: color-mix(in srgb, var(--paper2) 78%, transparent);
    border: 1px solid color-mix(in srgb, var(--paper3) 80%, transparent);
    box-shadow: 0 1px 4px rgb(var(--shade) / 0.15);
    border-radius: 999px;
    translate: -50% 0;
  }
  .narrow {
    left: 12px;
    width: min(calc(100vw - 110px), calc(var(--col) - 110px));
    translate: 0 0;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .narrow {
      left: calc(var(--rail) + 16px);
    }
  }
</style>
