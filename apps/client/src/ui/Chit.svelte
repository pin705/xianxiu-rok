<script lang="ts">
  // Mẩu giấy báo nổi trên thanh tab (vừa nhận quà…): popover lên lớp trên cùng, tờ giấy nhỏ viền mực đôi mảnh (gọn, không
  // phải dải to kín bề ngang), tranh đồ vật nhỏ bên trái (ui:<art>, tắt art thì bỏ), tiêu đề son, phần con bên dưới;
  // chạm để tắt. Màn giữ `el` để mở/đóng.
  import type { Snippet } from 'svelte'
  import { artOf } from '@rok/art'

  let {
    el = $bindable(),
    show,
    art,
    title,
    onclick,
    children,
  }: {
    el?: HTMLElement
    show: boolean
    art?: string
    title: string
    onclick: () => void
    children: Snippet
  } = $props()
  const src = $derived(art ? artOf(`ui:${art}`)?.src : undefined)
</script>

<div class="chit" popover="manual" bind:this={el}>
  {#if show}
    <button aria-live="polite" class:boxed={!!src} {onclick}>
      {#if src}<img {src} alt="" draggable="false" />{/if}
      <b class="t-small">{title}</b>
      {@render children()}
    </button>
  {/if}
</div>

<style>
  .chit {
    position: fixed;
    inset: auto auto calc(var(--nav-h, 96px) + 12px + var(--safe-b, 0px)) 50%; /* trên thanh tab */
    width: min(100% - 32px, 340px);
    margin: 0;
    padding: 0;
    overflow: visible;
    color: var(--text);
    background: none;
    border: 0;
    translate: -50% 0;
  }
  button {
    display: grid;
    justify-items: center;
    gap: 4px;
    width: 100%;
    padding: 8px 14px 9px;
    background: var(--paper);
    border: 1.5px solid var(--rim, var(--ink3));
    border-radius: 10px;
    box-shadow:
      inset 0 0 0 2px var(--paper),
      inset 0 0 0 3px var(--paper3),
      0 4px 10px rgb(var(--shade) / 0.28);
    animation: rise var(--dur-3) var(--spring);
  }
  .boxed {
    grid-template-columns: 36px minmax(0, 1fr);
    justify-items: start;
    column-gap: 10px;
    padding-left: 10px;
    text-align: left;
  }
  .boxed img {
    grid-row: span 2;
    width: 36px;
    height: 36px;
    object-fit: contain;
    rotate: -6deg;
    filter: drop-shadow(0 2px 3px rgb(var(--shade) / 0.25));
  }
  .boxed b {
    color: var(--cinnabar);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    button {
      animation: none;
    }
  }
</style>
