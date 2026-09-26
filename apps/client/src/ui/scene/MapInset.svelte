<script lang="ts">
  // Bản đồ nhỏ góc màn (điện thoại: trái dưới; desktop: phải trên): ô vuông viền mực chứa canvas vẽ sẵn (màn giữ `canvas`
  // để vẽ), chấm tông môn (me: vàng to; còn lại ngọc), khung đang nhìn; chạm/kéo báo điểm theo tỉ lệ 0..1 (onpoint).
  // Nút tròn cạnh bên thu/mở. Toạ độ chấm, khung theo tỉ lệ 0..1 của bản đồ.
  import { Icon } from '@rok/art'

  let {
    open = $bindable(true),
    canvas = $bindable(),
    px,
    dots,
    view,
    label,
    hideLabel,
    onpoint,
  }: {
    open?: boolean
    canvas?: HTMLCanvasElement
    px: number // cỡ canvas (điểm ảnh gốc)
    dots: { id: number; x: number; y: number; me?: boolean }[]
    view: { x: number; y: number; w: number; h: number }
    label: string
    hideLabel: string
    onpoint: (fx: number, fy: number) => void
  } = $props()
  const pct = (v: number) => `${v * 100}%`
  let dragging = false
  function point(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onpoint((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
  }
</script>

<div class="inset">
  {#if open}
    <div
      class="map"
      role="button"
      tabindex="-1"
      aria-label={label}
      onpointerdown={e => {
        e.stopPropagation()
        dragging = true
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        point(e)
      }}
      onpointermove={e => dragging && point(e)}
      onpointerup={() => (dragging = false)}
      onpointercancel={() => (dragging = false)}
    >
      <canvas bind:this={canvas} width={px} height={px}></canvas>
      {#each dots as d (d.id)}
        <span class="dot" class:me={d.me} style:left={pct(d.x)} style:top={pct(d.y)}></span>
      {/each}
      <span
        class="view"
        style:left={pct(view.x)}
        style:top={pct(view.y)}
        style:width={pct(view.w)}
        style:height={pct(view.h)}
      ></span>
    </div>
  {/if}
  <button class="toggle" aria-label={open ? hideLabel : label} aria-expanded={open} onclick={() => (open = !open)}
    ><Icon name="globe" size={16} /></button
  >
</div>

<style>
  .inset {
    position: fixed;
    left: calc(var(--rail) + 12px);
    bottom: calc(var(--safe-b) + 128px);
    z-index: var(--z-page);
    display: flex;
    align-items: flex-end;
    gap: 4px;
  }
  .map {
    position: relative;
    width: 116px;
    height: 116px;
    overflow: hidden;
    border: 2px solid var(--rim, var(--ink3));
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(var(--shade) / 0.35);
    touch-action: none;
    cursor: crosshair;
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
  .dot {
    position: absolute;
    width: 6px;
    height: 6px;
    background: var(--malachite);
    border: 1px solid var(--paper);
    border-radius: 50%;
    translate: -50% -50%;
    pointer-events: none;
  }
  .dot.me {
    width: 9px;
    height: 9px;
    background: var(--gold-l);
    border-color: var(--text);
  }
  .view {
    position: absolute;
    border: 1.5px solid var(--paper);
    outline: 1px solid rgb(var(--shade) / 0.6);
    pointer-events: none;
  }
  .toggle {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    padding: 0;
    color: var(--paper);
    background: color-mix(in srgb, var(--ink) 78%, transparent);
    border: 1px solid var(--gold-d);
    border-radius: 50%;
    cursor: pointer;
  }
  /* desktop: góc trên phải (dải chat nằm dưới giữa màn), nút thu ở bên trái bản đồ */
  @media (min-width: 1024px) and (min-height: 600px) {
    .map {
      width: 168px;
      height: 168px;
    }
    .inset {
      top: calc(var(--top) + 16px);
      right: 16px;
      bottom: auto;
      left: auto;
      flex-direction: row-reverse;
      align-items: flex-start;
    }
  }
</style>
