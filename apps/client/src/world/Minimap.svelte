<script lang="ts">
  // Bản đồ nhỏ (Minimap của RoK) ở góc bản đồ Giới: cả giới thu vào một ô vuông — ba vòng vùng, lãnh thổ các tiên minh, mê
  // vụ của mình, tông môn mình / đồng minh, khung đang nhìn. Chạm hay kéo trên đó để đưa khung nhìn tới; thu gọn được.
  import { untrack } from 'svelte'
  import { MAP_W, snapClaims, territoryGrid, type Atlas, type MapSnap } from '@rok/rules/world'
  import { FOG_CELL, FOG_N, clear, type Fog } from '@rok/rules'
  import { MapInset } from '../ui'
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
  // khung đang nhìn cắt trong giới, theo tỉ lệ 0..1
  const box = $derived({
    x: Math.max(0, view.x) / MAP_W,
    y: Math.max(0, view.y) / MAP_W,
    w: (Math.min(MAP_W, view.x + view.w) - Math.max(0, view.x)) / MAP_W,
    h: (Math.min(MAP_W, view.y + view.h) - Math.max(0, view.y)) / MAP_W,
  })
  // chạm / kéo: đưa khung nhìn tới chỗ ngón tay
  const jump = (fx: number, fy: number) =>
    onjump(
      Math.min(MAP_W - 1, Math.max(0, Math.floor(fx * MAP_W))),
      Math.min(MAP_W - 1, Math.max(0, Math.floor(fy * MAP_W))),
    )
</script>

<MapInset
  bind:open
  bind:canvas
  px={MAP_W}
  dots={dots.map(d => ({ id: d.pid, x: (d.x + 0.5) / MAP_W, y: (d.y + 0.5) / MAP_W, me: d.me }))}
  view={box}
  label={L.world.minimap}
  hideLabel={L.world.minimapHide}
  onpoint={jump}
/>
