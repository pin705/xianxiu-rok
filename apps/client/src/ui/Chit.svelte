<script lang="ts">
  // Mẩu giấy báo nổi trên thanh tab (vừa nhận quà…): popover lên lớp trên cùng, dải giấy hai đầu lụa, tranh đồ vật
  // nghiêng bên trái (ui:<art>, tắt art thì bỏ), tiêu đề son, phần con bên dưới; chạm để tắt. Màn giữ `el` để mở/đóng.
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
    inset: auto auto calc(96px + var(--safe-b, 0px)) 50%; /* trên thanh tab */
    width: min(100% - 32px, 420px);
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
    gap: 6px;
    width: 100%;
    padding: 12px 28px 13px;
    border: 0 solid transparent;
    border-image: var(--sk-slip);
    filter: drop-shadow(0 4px 8px rgb(var(--shade) / 0.35));
    animation: rise var(--dur-3) var(--spring);
  }
  .boxed {
    grid-template-columns: 52px minmax(0, 1fr);
    justify-items: start;
    column-gap: 12px;
    padding-left: 18px;
    text-align: left;
  }
  .boxed img {
    grid-row: span 2;
    width: 52px;
    height: 52px;
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
