<script lang="ts">
  // Bản đồ nhỏ (Minimap của RoK) ở góc bản đồ Giới: cả giới thu vào một ô vuông — ba vòng vùng, lãnh thổ các tiên minh, mê
  // vụ của mình, tông môn mình / đồng minh, khung đang nhìn. Chạm hay kéo trên đó để đưa khung nhìn tới; thu gọn được.
  import { untrack } from 'svelte'
  import { MAP_W, snapClaims, territoryGrid, type Atlas, type MapSnap } from '@rok/rules/world'
  import { FOG_CELL, FOG_N, clear, type Fog } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { L } from '../lib'
  import { terrColor } from './territory'

  let {
    atlas,
    snap,
    fog,
    me,
    allies,
    view,
    now,
    onjump,
  }: {
    atlas: Atlas
    snap: MapSnap | null
    fog: Fog | null // mê vụ của mình (null: chưa có chỗ trên bản đồ)
    me: number | null
    allies: number[] // tông môn cùng minh
    view: { x: number; y: number; w: number; h: number } // khung đang nhìn, theo ô
    now: number
    onjump: (x: number, y: number) => void // đưa khung nhìn tới ô (x, y)
  } = $props()
  let open = $state(true)
  let canvas = $state<HTMLCanvasElement>()
  // ba vòng: ngoài (giấy), giữa (lục nhạt), tâm Thiên Môn (vàng); mê vụ phủ xám như trên bản đồ lớn
  const RING = [
    [222, 206, 168],
    [196, 196, 150],
    [230, 196, 110],
  ]
  const FOG = [162, 169, 172]
  // mê vụ đổi thì vẽ lại (fogOf có thể dựng đối tượng mới mỗi lần — so theo ô đã khai)
  const fogKey = $derived.by(() => {
    if (!fog) return ''
    let k = ''
    for (let cy = 0; cy < FOG_N; cy++) for (let cx = 0; cx < FOG_N; cx++) k += clear(fog, cx, cy, now) ? '1' : '0'
    return k
  })
  $effect(() => {
    const key = fogKey
    if (!canvas || !open) return
    const t = untrack(() => now)
    const own = snap ? territoryGrid(snapClaims(snap, atlas, t)) : null
    const mine = snap?.seats.find(s => s.pid === me)?.aid
    const img = new ImageData(MAP_W, MAP_W)
    for (let y = 0; y < MAP_W; y++)
      for (let x = 0; x < MAP_W; x++) {
        const i = y * MAP_W + x
        const r = atlas.tiles[i]
        let c = RING[atlas.regions[r].ring]
        // biên vùng: đậm hơn một chút
        const edge = (x + 1 < MAP_W && atlas.tiles[i + 1] !== r) || (y + 1 < MAP_W && atlas.tiles[i + MAP_W] !== r)
        if (edge) c = c.map(v => v * 0.82)
        const o = own?.[i]
        if (o) {
          const tc = terrColor(o, mine)
          const rgb = [(tc >> 16) & 255, (tc >> 8) & 255, tc & 255]
          c = c.map((v, k) => v * 0.45 + rgb[k] * 0.55)
        }
        if (key && key[Math.floor(y / FOG_CELL) * FOG_N + Math.floor(x / FOG_CELL)] === '0')
          c = c.map((v, k) => v * 0.45 + FOG[k] * 0.55)
        img.data.set([c[0], c[1], c[2], 255], i * 4)
      }
    const g = canvas.getContext('2d')!
    g.putImageData(img, 0, 0)
  })
  // tông môn trên bản đồ nhỏ: mình (vàng), đồng minh (ngọc) — người khác đã có màu lãnh thổ
  const dots = $derived(
    (snap?.seats ?? [])
      .filter(s => s.pid === me || allies.includes(s.pid))
      .map(s => ({ pid: s.pid, x: s.x, y: s.y, me: s.pid === me })),
  )
  const pct = (v: number) => `${(v / MAP_W) * 100}%`
  // chạm / kéo: đưa khung nhìn tới chỗ ngón tay
  let dragging = false
  function jump(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * MAP_W),
      y = Math.floor(((e.clientY - r.top) / r.height) * MAP_W)
    onjump(Math.min(MAP_W - 1, Math.max(0, x)), Math.min(MAP_W - 1, Math.max(0, y)))
  }
</script>

<div class="mini" class:shut={!open}>
  {#if open}
    <div
      class="map"
      role="button"
      tabindex="-1"
      aria-label={L.world.minimap}
      onpointerdown={e => {
        e.stopPropagation()
        dragging = true
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        jump(e)
      }}
      onpointermove={e => dragging && jump(e)}
      onpointerup={() => (dragging = false)}
      onpointercancel={() => (dragging = false)}
    >
      <canvas bind:this={canvas} width={MAP_W} height={MAP_W}></canvas>
      {#each dots as d (d.pid)}
        <span class="dot" class:me={d.me} style:left={pct(d.x + 0.5)} style:top={pct(d.y + 0.5)}></span>
      {/each}
      <span
        class="view"
        style:left={pct(Math.max(0, view.x))}
        style:top={pct(Math.max(0, view.y))}
        style:width={pct(Math.min(MAP_W, view.x + view.w) - Math.max(0, view.x))}
        style:height={pct(Math.min(MAP_W, view.y + view.h) - Math.max(0, view.y))}
      ></span>
    </div>
  {/if}
  <button
    class="toggle"
    aria-label={open ? L.world.minimapHide : L.world.minimap}
    aria-expanded={open}
    onclick={() => (open = !open)}><Icon name="globe" size={16} /></button
  >
</div>

<style>
  .mini {
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
    .mini {
      top: calc(var(--top) + 16px);
      right: 16px;
      bottom: auto;
      left: auto;
      flex-direction: row-reverse;
      align-items: flex-start;
    }
  }
</style>
