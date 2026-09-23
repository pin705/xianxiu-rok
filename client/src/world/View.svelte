<script module lang="ts">
  import type { Container } from 'pixi.js'
  // Một cảnh WebGL cuộn dọc (núi tông môn, bản đồ)
  export type Scene = { root: Container; tick(dt: number, camDU: number): void; destroy(): void }
</script>

<script lang="ts">
  // Khung chung cho cảnh WebGL cuộn dọc: lớp cuộn gốc của trình duyệt (quán tính như app thật) nhận cử chỉ,
  // lớp `hits` (nút vô hình, cuộn theo) cho chạm/bàn phím/trình đọc màn hình, lớp `pins` (HTML hiển thị)
  // dịch theo camera trong cùng khung hình với WebGL nên không lệch. k = px CSS mỗi DU.
  import { onMount, type Snippet } from 'svelte'
  import { cssPerDU, getApp } from './stage'

  let {
    make,
    height,
    hidden = false,
    start = 0,
    scroller = $bindable(),
    scene = $bindable(),
    hits,
    pins,
  }: {
    make: () => Scene
    height: number // chiều cao cảnh (DU)
    hidden?: boolean
    start?: number // vị trí cuộn ban đầu 0..1
    scroller?: HTMLDivElement
    scene?: Scene
    hits?: Snippet<[number]>
    pins?: Snippet<[number]>
  } = $props()

  let k = $state(cssPerDU())
  let layer = $state<HTMLDivElement>()

  onMount(() => {
    let dead = false
    let off = () => {}
    const resize = () => (k = cssPerDU())
    addEventListener('resize', resize)
    requestAnimationFrame(() => scroller && (scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * start))
    getApp().then(app => {
      if (dead) return
      if (!app.canvas.isConnected) document.body.prepend(app.canvas)
      const s = make()
      app.stage.addChild(s.root)
      scene = s
      const tick = () => {
        if (!s.root.visible) return
        const kk = cssPerDU()
        const top = scroller?.scrollTop ?? 0
        s.root.scale.set(kk)
        s.root.position.set((innerWidth - 400 * kk) / 2, -top)
        if (layer) layer.style.transform = `translate3d(0, ${-top}px, 0)`
        s.tick(app.ticker.deltaMS / 1000, top / kk)
      }
      app.ticker.add(tick)
      off = () => {
        app.ticker.remove(tick)
        s.destroy()
      }
    })
    return () => {
      dead = true
      removeEventListener('resize', resize)
      off()
    }
  })

  $effect(() => {
    if (scene) scene.root.visible = !hidden
  })
</script>

<div class="scroller" class:off={hidden} bind:this={scroller}>
  <div class="space" style:width="{400 * k}px" style:height="{height * k}px">{@render hits?.(k)}</div>
</div>
{#if pins}
  <div class="overlay" class:off={hidden} aria-hidden="true">
    <div class="vignette"></div>
    <div class="layer" bind:this={layer} style:width="{400 * k}px">{@render pins(k)}</div>
  </div>
{/if}

<style>
  .scroller {
    position: fixed;
    inset: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .space {
    position: relative;
    margin: 0 auto;
  }
  .off {
    visibility: hidden;
  }
  .overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    overflow: hidden;
    pointer-events: none;
  }
  /* tối dần ra mép như khung tranh, kéo mắt vào giữa cảnh */
  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 70% at 50% 48%, transparent 58%, color-mix(in srgb, var(--ink) 26%, transparent) 100%);
  }
  .layer {
    position: relative;
    height: 100%;
    margin: 0 auto;
    will-change: transform;
  }
  /* Ghim HTML theo toạ độ cảnh: style="left:…;top:…" */
  .layer :global(.pin) {
    position: absolute;
    translate: -50% -50%;
    white-space: nowrap;
  }
  .space :global(.hit) {
    position: absolute;
    border-radius: 12px;
  }
  .space :global(.hit:focus-visible) {
    outline: 2px dashed var(--gold-l);
  }
</style>
