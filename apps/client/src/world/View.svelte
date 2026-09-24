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
  import { cssPerDU, getApp, sceneX } from './stage'

  let {
    make,
    height,
    hidden = false,
    start = 0,
    scroller = $bindable(),
    scene = $bindable(),
    hits,
    pins,
    zoomable = false,
  }: {
    make: () => Scene
    height: number // chiều cao cảnh (DU)
    hidden?: boolean
    start?: number // vị trí cuộn ban đầu 0..1
    scroller?: HTMLDivElement
    scene?: Scene
    hits?: Snippet<[number]>
    pins?: Snippet<[number]>
    zoomable?: boolean // Ctrl + con lăn / chụm touchpad / phím +−: thu nhỏ tới 55% (không phóng quá 100% — texture nướng ở 100%)
  } = $props()

  let zoom = $state(1)
  let k = $state(cssPerDU())
  // Đổi độ thu phóng, giữ nguyên điểm giữa khung nhìn
  function zoomTo(z: number) {
    z = Math.min(1, Math.max(0.55, z))
    if (z === zoom || !scroller) return
    const mid = scroller.scrollTop + scroller.clientHeight / 2
    const ratio = z / zoom
    zoom = z
    k = cssPerDU() * zoom
    requestAnimationFrame(() => scroller && (scroller.scrollTop = mid * ratio - scroller.clientHeight / 2))
  }
  let layer = $state<HTMLDivElement>()
  let space = $state<HTMLDivElement>()
  let left = -1

  onMount(() => {
    let dead = false
    let off = () => {}
    const resize = () => (k = cssPerDU() * zoom)
    addEventListener('resize', resize)
    const wheel = (e: WheelEvent) => {
      if (!zoomable || !e.ctrlKey) return
      e.preventDefault() // không để trình duyệt phóng cả trang
      zoomTo(zoom * Math.exp(-e.deltaY * 0.004))
    }
    const keys = (e: KeyboardEvent) => {
      if (!zoomable || hidden || e.metaKey || e.ctrlKey || document.querySelector('dialog:modal')) return
      if ((e.target as Element).closest?.('input, textarea, select')) return
      if (e.key === '+' || e.key === '=') zoomTo(zoom * 1.15)
      if (e.key === '-') zoomTo(zoom / 1.15)
    }
    scroller?.addEventListener('wheel', wheel, { passive: false })
    addEventListener('keydown', keys)
    requestAnimationFrame(
      () => scroller && (scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * start),
    )
    getApp().then(app => {
      if (dead) return
      if (!app.canvas.isConnected) document.body.prepend(app.canvas)
      const s = make()
      app.stage.addChild(s.root)
      scene = s
      const tick = () => {
        if (!s.root.visible) return
        const kk = cssPerDU() * zoom
        const top = scroller?.scrollTop ?? 0
        s.root.scale.set(kk)
        const x = sceneX(kk)
        s.root.position.set(x, -top)
        // lớp chạm và lớp ghim bám đúng mép cảnh (đổi khi cột trái / ngăn kéo desktop thay đổi)
        if (x !== left && space && layer) {
          left = x
          const m = `${x - (scroller?.getBoundingClientRect().left ?? 0)}px`
          space.style.marginLeft = layer.style.marginLeft = m
        }
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
      removeEventListener('keydown', keys)
      scroller?.removeEventListener('wheel', wheel)
      off()
    }
  })

  $effect(() => {
    if (scene) scene.root.visible = !hidden
  })
</script>

<div class="scroller" class:off={hidden} bind:this={scroller}>
  <div class="space" bind:this={space} style:width="{400 * k}px" style:height="{height * k}px">{@render hits?.(k)}</div>
</div>
{#if pins}
  <div class="overlay" class:off={hidden} aria-hidden="true">
    <div class="vignette"></div>
    <div class="layer" bind:this={layer} style:width="{400 * k}px">{@render pins(k)}</div>
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
