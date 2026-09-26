<script module lang="ts">
  import type { Container } from 'pixi.js'
  import { keyBlocked } from '../lib'
  // Một cảnh WebGL cuộn dọc (núi tông môn, bản đồ)
  export type Scene = { root: Container; tick(dt: number, camDU: number): void; destroy(): void }
</script>

<script lang="ts">
  // Khung chung cho cảnh WebGL cuộn dọc: lớp cuộn gốc của trình duyệt (quán tính như app thật) nhận cử chỉ,
  // lớp `hits` (nút vô hình, cuộn theo) cho chạm/bàn phím/trình đọc màn hình, lớp `pins` (HTML hiển thị)
  // dịch theo camera trong cùng khung hình với WebGL nên không lệch. k = px CSS mỗi DU.
  import { onMount, type Snippet } from 'svelte'
  import { cssPerDU, mountScene, sceneX } from './stage'
  import { Stage } from '../ui'

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
    art,
  }: {
    make: () => Scene
    height: number // chiều cao cảnh (DU)
    hidden?: boolean
    start?: number // vị trí cuộn ban đầu 0..1
    scroller?: HTMLDivElement
    scene?: Scene
    hits?: Snippet<[number]>
    pins?: Snippet<[number]>
    art?: readonly string[] // gói tranh cảnh cần (artPack): cảnh dựng khi đã về
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
    const resize = () => (k = cssPerDU() * zoom)
    addEventListener('resize', resize)
    const wheel = (e: WheelEvent) => {
      if (!zoomable || !e.ctrlKey) return
      e.preventDefault() // không để trình duyệt phóng cả trang
      zoomTo(zoom * Math.exp(-e.deltaY * 0.004))
    }
    const keys = (e: KeyboardEvent) => {
      if (!zoomable || hidden || keyBlocked(e)) return
      if (e.key === '+' || e.key === '=') zoomTo(zoom * 1.15)
      if (e.key === '-') zoomTo(zoom / 1.15)
    }
    scroller?.addEventListener('wheel', wheel, { passive: false })
    addEventListener('keydown', keys)
    requestAnimationFrame(
      () => scroller && (scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) * start),
    )
    const unmount = mountScene({
      make,
      art,
      ready: s => (scene = s),
      tick: (s, app) => {
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
      },
    })
    return () => {
      removeEventListener('resize', resize)
      removeEventListener('keydown', keys)
      scroller?.removeEventListener('wheel', wheel)
      unmount()
    }
  })

  $effect(() => {
    if (scene) scene.root.visible = !hidden
  })
</script>

{#snippet hitLayer()}{@render hits?.(k)}{/snippet}
{#snippet pinLayer()}{@render pins?.(k)}{/snippet}
<Stage
  width={400 * k}
  height={height * k}
  {hidden}
  bind:scroller
  bind:space
  bind:layer
  hits={hitLayer}
  pins={pins ? pinLayer : undefined}
/>
