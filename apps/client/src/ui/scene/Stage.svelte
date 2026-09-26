<script lang="ts">
  // Khung cảnh WebGL cuộn dọc (núi tông môn, bản đồ vùng): lớp cuộn gốc (cao `height` px, rộng `width` px) chứa nút chạm vô
  // hình `.hit` (hits), lớp ghim HTML (pins) phủ trên cảnh có viền tối dần như khung tranh. Desktop chừa cột trái (--rail).
  // Màn giữ scroller/space/layer để dịch lớp ghim theo camera trong cùng khung hình với WebGL.
  import type { Snippet } from 'svelte'

  let {
    width,
    height,
    hidden = false,
    scroller = $bindable(),
    space = $bindable(),
    layer = $bindable(),
    hits,
    pins,
  }: {
    width: number
    height: number
    hidden?: boolean
    scroller?: HTMLDivElement
    space?: HTMLDivElement
    layer?: HTMLDivElement
    hits?: Snippet
    pins?: Snippet
  } = $props()
</script>

<div class="scroller" class:off={hidden} bind:this={scroller}>
  <div class="space" bind:this={space} style:width="{width}px" style:height="{height}px">{@render hits?.()}</div>
</div>
{#if pins}
  <div class="overlay" class:off={hidden} aria-hidden="true">
    <div class="vignette"></div>
    <div class="layer" bind:this={layer} style:width="{width}px">{@render pins()}</div>
  </div>
{/if}

<style>
  /* desktop: chừa cột trái (--rail), cảnh căn giữa phần còn lại — khớp sceneX() */
  .scroller {
    position: fixed;
    inset: 0 0 0 var(--rail);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .space {
    position: relative;
  }
  .off {
    visibility: hidden;
  }
  .overlay {
    position: fixed;
    inset: 0 0 0 var(--rail);
    z-index: var(--z-overlay);
    overflow: hidden;
    pointer-events: none;
  }
  /* tối dần ra mép như khung tranh, kéo mắt vào giữa cảnh */
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 80% 70% at 50% 48%,
      transparent 58%,
      color-mix(in srgb, var(--ink) 26%, transparent) 100%
    );
  }
  .layer {
    position: relative;
    height: 100%;
    will-change: transform;
  }
  /* nút chạm vô hình trên công trình / mục tiêu: style="left:…;top:…;width:…;height:…" */
  .space :global(.hit) {
    position: absolute;
    border-radius: 12px;
  }
  .space :global(.hit:focus-visible) {
    outline: 2px dashed var(--gold-l);
  }
</style>
