<script lang="ts">
  // Bản đồ giới: cảnh WebGL (worldmap.ts) + lớp HTML nhận cử chỉ (kéo có quán tính, chụm, con lăn, phím) + ghim tên tông môn
  // + dải trên (ngày, pha mùa, biên niên). Dữ liệu sống: ảnh chụp server đẩy khi đổi (watch). Chạm: cờ hành quân → tông môn → điểm → ô.
  import { chronText } from '@rok/i18n'
  import { onMount, type Snippet } from 'svelte'
  import {
    MAP_W,
    SEASON_DAYS,
    atlas,
    dayIn,
    fires,
    nanOpen,
    shutFrom,
    phaseOf,
    PHASE_CH,
    route,
    snapClaims,
    territoryGrid,
    type MapSnap,
    type Mark,
    type WorldAction,
  } from '@rok/rules/world'
  import {
    DIG_FRAGS,
    DIG_MAX,
    BLESSINGS,
    DECREE_MAX,
    BOOK,
    BOOK_TOP,
    EVE_CHEST_N,
    HONOR_TIERS,
    RESOURCES,
    thoiAt,
    type Bonus,
    cellOf,
    clear,
    dayOf,
    fogOf,
    type BlessKey,
  } from '@rok/rules'
  import type { Ack, WorldInfo } from '@rok/protocol'
  import { Icon } from '@rok/art'
  import {
    Badge,
    Bag,
    Button,
    Caption,
    Card,
    Dock,
    Expander,
    IconButton,
    Marker,
    NameTag,
    Overlay,
    Pin,
    Ping,
  } from '../ui'
  import { L, clock, keyBlocked, num } from '../lib'
  import { mountScene, railPx } from './stage'
  import { FINE_Z, WORLD_DU, WorldScene, type Cam, type Layer, type Pick, type Rel } from './worldmap'
  import { useGame } from '../game'
  import { social } from '../social.svelte'
  import { terrColor } from './territory'
  import Minimap from './Minimap.svelte'
  import Holdings from './Holdings.svelte'
  import FirstLook from '../FirstLook.svelte'
  import Paper from './Paper.svelte'
  import type { Net } from '../net'

  let {
    info,
    me,
    snap,
    allies = [],
    marks = [],
    goto = null,
    ongone,
    onpick,
    toggle,
    send,
    ask,
  }: {
    info: WorldInfo
    me: number | null
    snap: MapSnap | null
    allies?: number[] // mã tông môn cùng minh (tô màu đồng minh)
    marks?: Mark[] // dấu của minh (Alliance Markers)
    goto?: { x: number; y: number } | null // nhảy tới ô này
    ongone?: () => void
    onpick: (p: Pick) => void
    toggle?: Snippet // nút gạt Giới | Vùng (MapTab)
    send?: (a: WorldAction) => Promise<Ack> // Giới Chủ ban phúc
    ask?: Net['ask'] // Giới Báo
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  let picking = $state(false) // đang chọn chỉ lệnh Thiên Thời
  const fxText = (fx: Partial<Record<Bonus, number>>) =>
    Object.entries(fx)
      .map(([k, v]) => L.bonus(k as Bonus, v ?? 0))
      .join(' · ')
  const now = $derived(g.now)

  const T = WORLD_DU / MAP_W
  // giữ khung nhìn trong giới: phóng to thì mép màn không vượt mép giới (thu nhỏ hết thì giới nằm giữa)
  // Kéo quá mép bằng chiều cao lớp phủ (px CSS): trên — HUD + thẻ mùa (đo thật: thẻ cao lên khi mở biên niên, tìm…),
  // dưới — tab + dải chat. Tông môn / điểm sát mép giới vẫn kéo ra được chỗ trống giữa màn, không nằm kẹt dưới thẻ
  let topCard = $state<HTMLDivElement>()
  const PAD = { top: 260, bottom: 160, side: 48 }
  const padTop = () => Math.max(PAD.top, (topCard?.getBoundingClientRect().bottom ?? 0) + 40)
  // tông môn mình: giữa khoảng trống dưới thẻ mùa và trên tab + dải chat (thẻ cao quá giữa màn thì không nằm dưới thẻ)
  const home = (z: number): Cam => {
    const dy = typeof innerHeight === 'undefined' ? 0 : (padTop() - PAD.bottom) / 2
    return { x: ((game.seat?.x ?? MAP_W / 2) + 0.5) * T, y: ((game.seat?.y ?? MAP_W / 2) + 0.5) * T - dy / z, z }
  }
  let cam = $state<Cam>(home(0.55))
  onMount(() => void (cam = clamp(cam)))
  let scene = $state.raw<WorldScene>()
  let layer = $state<HTMLDivElement>()
  let chronOpen = $state(false)
  let paperOpen = $state(false) // Giới Báo
  // thẻ mùa thu gọn (chỉ dòng mùa + Công Huân + nút): mặc định gọn — thẻ mở rộng che một phần ba bản đồ trên điện thoại;
  // người chơi mở ra thì nhớ theo máy
  const SLIM = 'rok.worldCard'
  let slim = $state(
    (() => {
      try {
        return localStorage.getItem(SLIM) !== '0'
      } catch {
        return true
      }
    })(),
  )
  function fold() {
    slim = !slim
    try {
      localStorage.setItem(SLIM, slim ? '1' : '0')
    } catch {
      /* chế độ riêng tư: chỉ nhớ trong phiên */
    }
  }
  // Lớp tình hình (lọc bản đồ): tắt yêu thú / mỏ / hành quân / lãnh thổ cho bản đồ đỡ rối — nhớ theo máy
  const LAYERS: Layer[] = ['wild', 'mine', 'march', 'terr']
  const HIDE = 'rok.mapHide'
  let hide = $state<Layer[]>(
    (() => {
      try {
        return (JSON.parse(localStorage.getItem(HIDE) ?? '[]') as Layer[]).filter(k => LAYERS.includes(k))
      } catch {
        return []
      }
    })(),
  )
  let layering = $state(false)
  function flip(k: Layer) {
    hide = hide.includes(k) ? hide.filter(x => x !== k) : [...hide, k]
    try {
      localStorage.setItem(HIDE, JSON.stringify(hide))
    } catch {
      /* chế độ riêng tư: chỉ nhớ trong phiên */
    }
  }
  $effect(() => scene?.setHide(new Set(hide)))
  let bookOpen = $state(false)
  const day = $derived(dayIn(info.opened, now))
  const phase = $derived(phaseOf(day, snap?.book?.done))
  // thu nhỏ hết cỡ: cả giới vừa khoảng trống giữa thẻ mùa và tab (như bản đồ vương quốc của RoK)
  const zMin = () =>
    Math.max(120, Math.min(innerWidth - railPx() - 2 * PAD.side, innerHeight - padTop() - PAD.bottom)) / WORLD_DU
  const center = () => ({ x: railPx() + (innerWidth - railPx()) / 2, y: innerHeight / 2 })
  // thẻ đổi cỡ (dữ liệu bản đồ tới sau): chưa ai kéo / nhảy khung nhìn thì đưa lại về tông môn, khỏi nằm dưới thẻ
  let steered = false
  onMount(() => {
    const ro = new ResizeObserver(() => void (steered || (cam = clamp(home(cam.z)))))
    if (topCard) ro.observe(topCard)
    return () => ro.disconnect()
  })
  const clamp = (c: Cam): Cam => {
    const z = Math.min(1.4, Math.max(zMin(), c.z))
    const hx = (innerWidth - railPx()) / 2 / z,
      hy = innerHeight / 2 / z
    // giới lọt thỏm trong khung: đặt giữa khoảng trống (trên chừa thẻ mùa, dưới chừa tab), không phải giữa màn
    const fit = (v: number, h: number, lo: number, hi: number) =>
      h * 2 >= WORLD_DU + lo + hi ? WORLD_DU / 2 + (hi - lo) / 2 : Math.min(WORLD_DU - h + hi, Math.max(h - lo, v))
    return { z, x: fit(c.x, hx, PAD.side / z, PAD.side / z), y: fit(c.y, hy, padTop() / z, PAD.bottom / z) }
  }
  // Đổi độ phóng mà giữ nguyên điểm dưới (sx, sy)
  function zoomAt(k: number, sx: number, sy: number) {
    const c = center()
    const wx = cam.x + (sx - c.x) / cam.z,
      wy = cam.y + (sy - c.y) / cam.z
    const z = Math.min(1.4, Math.max(zMin(), cam.z * k))
    cam = clamp({ z, x: wx - (sx - c.x) / z, y: wy - (sy - c.y) / z })
  }

  // ---------- cử chỉ ----------
  const pts = new Map<number, { x: number; y: number }>()
  let vel = { x: 0, y: 0 }
  let down: { x: number; y: number; t: number; moved: number } | null = null
  let pinch = 0
  function pointerdown(e: PointerEvent) {
    steered = true
    layer?.setPointerCapture(e.pointerId)
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    vel = { x: 0, y: 0 }
    if (pts.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]
      pinch = Math.hypot(a.x - b.x, a.y - b.y)
      down = null
    }
  }
  function pointermove(e: PointerEvent) {
    const p = pts.get(e.pointerId)
    if (!p) return
    const dx = e.clientX - p.x,
      dy = e.clientY - p.y
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch) zoomAt(d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2)
      pinch = d
      return
    }
    cam = clamp({ ...cam, x: cam.x - dx / cam.z, y: cam.y - dy / cam.z })
    vel = { x: dx, y: dy }
    if (down) down.moved += Math.abs(dx) + Math.abs(dy)
  }
  function pointerup(e: PointerEvent) {
    pts.delete(e.pointerId)
    if (pts.size < 2) pinch = 0
    // chạm (không kéo): chọn vật dưới ngón
    if (down && down.moved < 8 && performance.now() - down.t < 500 && scene && snap) {
      const c = center()
      onpick(scene.pick(cam.x + (e.clientX - c.x) / cam.z, cam.y + (e.clientY - c.y) / cam.z, cam.z, snap.seats, now))
      vel = { x: 0, y: 0 }
    }
    down = null
  }
  function wheel(e: WheelEvent) {
    steered = true
    e.preventDefault()
    zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY)
  }
  function keys(e: KeyboardEvent) {
    if (keyBlocked(e)) return
    const step = 120 / cam.z
    const k: Record<string, () => void> = {
      ArrowLeft: () => (cam = clamp({ ...cam, x: cam.x - step })),
      ArrowRight: () => (cam = clamp({ ...cam, x: cam.x + step })),
      ArrowUp: () => (cam = clamp({ ...cam, y: cam.y - step })),
      ArrowDown: () => (cam = clamp({ ...cam, y: cam.y + step })),
      '+': () => zoomAt(1.2, center().x, center().y),
      '=': () => zoomAt(1.2, center().x, center().y),
      '-': () => zoomAt(1 / 1.2, center().x, center().y),
    }
    if (k[e.key]) {
      e.preventDefault()
      steered = true
      k[e.key]()
    }
  }

  onMount(() => {
    addEventListener('keydown', keys)
    const unmount = mountScene({
      art: ['world'],
      make: () => new WorldScene(info.map),
      ready: s => (scene = s),
      tick: s => {
        // quán tính: trượt tiếp rồi chậm dần khi thả tay
        if (!pts.size && (Math.abs(vel.x) > 0.3 || Math.abs(vel.y) > 0.3)) {
          cam = clamp({ ...cam, x: cam.x - vel.x / cam.z, y: cam.y - vel.y / cam.z })
          vel = { x: vel.x * 0.9, y: vel.y * 0.9 }
        }
        const c = center()
        s.tick(cam, c.x, c.y, now)
      },
    })
    return () => {
      removeEventListener('keydown', keys)
      unmount()
    }
  })

  // Thôn Trang Gặp Nạn: thôn đang cháy đổi theo giờ — chỉ tính lại khi sang giờ mới
  const hour = $derived(Math.floor(now / 3_600_000))
  const burning = $derived(nanOpen(game, hour * 3_600_000) ? fires(atlas(info.map), hour * 3_600_000) : [])
  const rel = (pid: number): Rel => {
    if (pid === me) return 'me'
    if (allies.includes(pid)) return 'ally'
    return snap?.seats.find(s => s.pid === pid)?.npc ? 'npc' : 'other'
  }
  $effect(() => {
    if (scene && snap)
      scene.setData(
        snap,
        rel,
        phase,
        now,
        game.seat ? { fog: fogOf(game), visited: game.visited ?? [], fires: burning } : undefined,
      )
  })

  const honorReady = $derived.by(() => {
    const t = HONOR_TIERS[game.honorGot ?? 0]
    return !!t && (game.honor ?? 0) >= t.n
  })
  // Giới Chủ (chạm: hồ sơ, sắc phong nếu mình là Giới Chủ)
  const lordSeat = $derived(snap?.lord ? snap.seats.find(s => s.pid === snap.lord) : undefined)
  // Ô (x, y) của giới → toạ độ trên màn; null: ngoài màn
  const onScreen = (x: number, y: number, pad = 40) => {
    if (typeof innerWidth === 'undefined') return null
    const c = center()
    const p = { x: c.x + ((x + 0.5) * T - cam.x) * cam.z, y: c.y + ((y + 0.5) * T - cam.y) * cam.z }
    return p.x > -pad && p.y > -pad && p.x < innerWidth + pad && p.y < innerHeight + pad ? p : null
  }
  // chọn vật ở ô (x, y) như chạm vào đó
  const pickAt = (x: number, y: number) => {
    if (scene && snap) onpick(scene.pick((x + 0.5) * T, (y + 0.5) * T, cam.z, snap.seats, now))
  }
  // Nhảy tới ô (toạ độ trong chat, dấu của minh): đưa khung nhìn tới, nháy vòng son vài giây
  let ping = $state<{ x: number; y: number; until: number } | null>(null)
  $effect(() => {
    if (!goto) return
    steered = true
    cam = clamp({ x: (goto.x + 0.5) * T, y: (goto.y + 0.5) * T, z: Math.max(cam.z, 0.9) })
    ping = { ...goto, until: now + 4000 }
    ongone?.()
  })
  const pingAt = $derived(ping && ping.until > now ? onScreen(ping.x, ping.y) : null)

  // bản đồ nhỏ: khung đang nhìn theo ô; chạm trên đó thì bay tới (giữ độ phóng)
  const viewTiles = $derived.by(() => {
    if (typeof innerWidth === 'undefined') return { x: 0, y: 0, w: MAP_W, h: MAP_W }
    const hw = (innerWidth - railPx()) / 2 / cam.z,
      hh = innerHeight / 2 / cam.z
    return { x: (cam.x - hw) / T, y: (cam.y - hh) / T, w: (2 * hw) / T, h: (2 * hh) / T }
  })
  function jumpTo(x: number, y: number) {
    steered = true
    cam = clamp({ x: (x + 0.5) * T, y: (y + 0.5) * T, z: cam.z })
  }

  // Tìm (như kính lúp của RoK): điểm gần nhất theo loại + cấp, còn sống, có đường đi — bay tới và mở bảng của điểm đó
  type Find = 'mine' | 'vein' | 'boss' | 'wild'
  let finding = $state(false)
  let decree = $state('') // Giới Chủ soạn chiếu
  let want = $state<{ kind: Find; lv: number }>({ kind: 'mine', lv: 1 })
  let miss = $state(false)
  function find() {
    steered = true
    const a = atlas(info.map),
      from = game.seat
    if (!from) return
    const dead = new Set((snap?.spots ?? []).filter(x => (x.until ?? 0) > now).map(x => x.i))
    const d = (p: { x: number; y: number }) => Math.hypot(p.x - from.x, p.y - from.y)
    const hit = a.points
      // yêu thú: "cấp" 1/2/3 là nhóm cấp 1–5 / 6–10 / 11–15
      .filter(p => p.kind === want.kind && (p.kind === 'wild' ? Math.ceil(p.lv / 5) : p.lv) === want.lv)
      .filter(p => !dead.has(p.i) && route(a, from, p, phase, shut))
      .sort((p, q) => d(p) - d(q))[0]
    miss = !hit
    if (!hit) return
    finding = false
    fly(hit.x, hit.y)
  }
  // bay tới ô (x, y), nháy vòng son, mở bảng của vật ở đó (Tìm, Sơn Hà Xã Tắc Đồ)
  function fly(x: number, y: number) {
    steered = true
    cam = clamp({ x: (x + 0.5) * T, y: (y + 0.5) * T, z: Math.max(cam.z, 0.9) })
    ping = { x, y, until: now + 4000 }
    pickAt(x, y)
  }
  let overview = $state(false) // Sơn Hà Xã Tắc Đồ
  const side = $derived(snap?.seats.find(s => s.pid === me)?.aid ?? -(me ?? 0)) // phe của mình (như SpotView.side)
  // cửa ải phe khác đang giữ (Tìm bỏ qua điểm bị chặn đường)
  const shut = $derived(
    snap
      ? shutFrom(
          snap.spots.map(x => [x.i, x.side] as [number, number | undefined]),
          atlas(info.map).gates.length,
          side,
        )
      : undefined,
  )

  // Ghim tên: tối đa 60 tông môn gần tâm nhìn nhất, chỉ khi đủ phóng để đọc; dưới mê vụ của mình thì không lộ tên
  const pins = $derived.by(() => {
    if (!snap || cam.z < FINE_Z * 0.8) return []
    const c = typeof innerWidth === 'undefined' ? { x: 0, y: 0 } : center()
    const fog = game.seat ? fogOf(game) : null
    return snap.seats
      .filter(s => !fog || clear(fog, cellOf(s).cx, cellOf(s).cy, now))
      .map(s => ({ s, x: c.x + ((s.x + 0.5) * T - cam.x) * cam.z, y: c.y + ((s.y + 0.5) * T - cam.y) * cam.z }))
      .filter(p => p.x > -40 && p.y > -40 && p.x < innerWidth + 40 && p.y < innerHeight + 40)
      .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))
      .slice(0, 60)
  })
  // Toàn cảnh giới (Kingdom Map của RoK): thu nhỏ tới lúc không còn ghim tên tông môn thì hiện hiệu mỗi tiên minh giữa lãnh
  // thổ của họ (ô của minh gần trọng tâm nhất — lãnh thổ rời vẫn nằm trên đất minh). Tính lại khi ảnh chụp đổi / mỗi phút.
  const minute = $derived(Math.floor(now / 60_000))
  const far = $derived(cam.z < FINE_Z * 0.8)
  const terrTags = $derived.by(() => {
    if (!snap || !far) return []
    const own = territoryGrid(snapClaims(snap, atlas(info.map), minute * 60_000))
    const sum = new Map<number, [x: number, y: number, n: number]>()
    own.forEach((o, k) => {
      const a = o ? (sum.get(o) ?? [0, 0, 0]) : null
      if (a) sum.set(o, [a[0] + (k % MAP_W), a[1] + Math.floor(k / MAP_W), a[2] + 1])
    })
    return [...sum].map(([aid, [sx, sy, n]]) => {
      let best = 0,
        bd = Infinity
      own.forEach((o, k) => {
        const d = o === aid ? ((k % MAP_W) - sx / n) ** 2 + (Math.floor(k / MAP_W) - sy / n) ** 2 : Infinity
        if (d < bd) [best, bd] = [k, d]
      })
      const tag = snap.allies?.find(a => a.id === aid)?.tag ?? '?'
      return { aid, tag, x: best % MAP_W, y: Math.floor(best / MAP_W), color: terrColor(aid, side) }
    })
  })
  // nút Toàn giới: thu nhỏ hết cỡ để nhìn cả giới; bấm lại thì về độ phóng cũ quanh chỗ đang nhìn
  let before = 0.7
  function whole() {
    steered = true
    if (cam.z > zMin() * 1.05) {
      before = cam.z
      cam = clamp({ ...cam, z: zMin() })
    } else zoomAt(before / cam.z, center().x, center().y)
  }
</script>

<Overlay
  touch
  bind:el={layer}
  role="application"
  aria-label={L.world.toggle.world}
  onpointerdown={pointerdown}
  onpointermove={pointermove}
  onpointerup={pointerup}
  onpointercancel={pointerup}
  onwheel={wheel}
/>
<Overlay aria-hidden="true">
  {#each pins as p (p.s.pid)}
    {@const tag = p.s.aid ? snap?.allies?.find(a => a.id === p.s.aid)?.tag : undefined}
    <NameTag x={p.x} y={p.y + 18} mine={p.s.pid === me}>{tag ? `[${tag}] ` : ''}{p.s.name}</NameTag>
  {/each}
  {#each terrTags as t (t.aid)}
    {@const p = onScreen(t.x, t.y)}
    <!-- hiệu tiên minh giữa lãnh thổ khi thu nhỏ (toàn cảnh giới): chữ màu lãnh thổ viền giấy, minh mình to hơn -->
    {#if p}<Pin x={p.x} y={p.y}
        ><Caption size={t.aid === side ? 'lg' : 'md'} color="#{t.color.toString(16).padStart(6, '0')}" spaced
          >[{t.tag}]</Caption
        ></Pin
      >{/if}
  {/each}
</Overlay>

<!-- dấu của minh: cờ son + lời ghi, bấm được (chọn vật ở ô đó); ghi nhớ của mình: sao vàng -->
<Overlay>
  {#each marks as m (`${m.x},${m.y}`)}
    {@const p = onScreen(m.x, m.y)}
    {#if p}<Marker x={p.x} y={p.y} icon="flag" text={m.text} onclick={() => pickAt(m.x, m.y)} />{/if}
  {/each}
  {#each game.pins ?? [] as m (`p${m.x},${m.y}`)}
    {@const p = onScreen(m.x, m.y)}
    {#if p}<Marker x={p.x} y={p.y} icon="star" tone="gold" text={m.text} onclick={() => pickAt(m.x, m.y)} />{/if}
  {/each}
  {#if pingAt}<Ping x={pingAt.x} y={pingAt.y} />{/if}
</Overlay>

<Minimap
  atlas={atlas(info.map)}
  {snap}
  fog={game.seat ? fogOf(game) : null}
  {me}
  {allies}
  view={viewTiles}
  {now}
  onjump={jumpTo}
/>

<FirstLook id="world" />
<Holdings
  open={overview}
  atlas={atlas(info.map)}
  {snap}
  {side}
  {phase}
  fog={game.seat ? fogOf(game) : null}
  {now}
  onclose={() => (overview = false)}
  onfly={(x, y) => {
    overview = false
    finding = false
    fly(x, y)
  }}
/>

<!-- công cụ bản đồ (góc phải dưới): lớp tình hình (chấm vàng khi có lớp đang tắt), Toàn giới / Phóng gần -->
<Dock at="tools">
  {#if layering}
    <Card tone="silk">
      <div class="row wrap justify-end" style:--gap="4px">
        {#each LAYERS as k (k)}
          <Button
            size="sm"
            variant={hide.includes(k) ? 'quiet' : 'gold'}
            icon={hide.includes(k) ? 'cross' : 'check'}
            onclick={() => flip(k)}>{L.world.layer[k]}</Button
          >
        {/each}
      </div>
    </Card>
  {/if}
  <IconButton icon="scroll" label={L.world.layers} onclick={() => (layering = !layering)}
    >{#if hide.length}<Badge dot />{/if}</IconButton
  >
  <IconButton icon={far ? 'plus' : 'minus'} label={far ? L.world.near : L.world.whole} onclick={whole} />
</Dock>

<Dock at="top" class="stack" --gap="6px" bind:el={topCard}>
  {#if toggle}<div class="row">{@render toggle()}</div>{/if}
  <Card tone="silk">
    <div class="row">
      <span class="grow stack" style:--gap="0">
        <b class="t-small">{L.rank.fameRow(info.season)} · {L.world.day(day, SEASON_DAYS)} · {L.world.phase[phase]}</b>
        <!-- Công Huân mùa: điểm của mình, chấm son khi có mốc nhận được -->
        <button class="t-action t-tiny" onclick={() => (social.honor = true)}
          ><Icon name="star" size={12} />{L.honor.chip(num(game.honor ?? 0))}{#if honorReady}<Badge dot />{/if}</button
        >
        {#if send && ((game.items.baoDo ?? 0) > 0 || game.digs?.length)}
          <!-- Tàng Bảo Đồ: tàn phiến đang có, điểm đào; đủ mảnh thì ghép → điểm đào mới gần tông môn -->
          <span class="row t-tiny" style:--gap="6px"
            ><Icon name="baoDo" size={14} />{L.world.dig.frags(
              game.items.baoDo ?? 0,
              DIG_FRAGS,
              game.digs?.length ?? 0,
            )}
            {#if (game.items.baoDo ?? 0) >= DIG_FRAGS && (game.digs?.length ?? 0) < DIG_MAX}<Button
                size="sm"
                variant="gold"
                onclick={() => send({ type: 'digMap' })}>{L.world.dig.make}</Button
              >{/if}</span
          >
        {/if}
        {#if lordSeat}<button class="t-action t-tiny" onclick={() => (social.profile = lordSeat.pid)}
            ><Icon name="flag" size={12} />{L.lord.now(lordSeat.name)}</button
          >{/if}
        {#if !slim && snap?.bless && snap.bless.until > now}<small class="t-tiny t-gold"
            >{L.lord.blessed(L.lord.blessKeys[snap.bless.key], clock(snap.bless.until - now))}</small
          >{/if}
        <!-- Chiếu Giới Chủ (Kingdom Announcement của RoK): cả giới thấy tới hết hạn -->
        {#if !slim && snap?.decree}<small class="t-small t-lore"
            >{L.lord.decree(snap.decree.by, snap.decree.text)}</small
          >{/if}
        {#if !slim && send && snap?.lord === me}
          <form
            class="row"
            style:--gap="4px"
            onsubmit={e => {
              e.preventDefault()
              if (decree.trim()) void send({ type: 'decree', text: decree }).then(r => r.ok && (decree = ''))
            }}
          >
            <input
              class="field grow"
              bind:value={decree}
              maxlength={DECREE_MAX}
              placeholder={L.lord.decreeHint}
              aria-label={L.lord.decreeHint}
            />
            <Button size="sm" type="submit" disabled={!decree.trim()}>{L.lord.decreeGo}</Button>
          </form>
        {/if}
        {#if !slim && send && snap?.lord === me && snap?.bless?.day !== dayOf(now)}
          <!-- mình là Giới Chủ, hôm nay chưa ban phúc -->
          <span class="row wrap" style:--gap="4px">
            <small class="t-tiny">{L.lord.bless}:</small>
            {#each Object.keys(BLESSINGS) as BlessKey[] as k (k)}
              <Button size="sm" variant="ghost" onclick={() => send({ type: 'bless', key: k })}
                >{L.lord.blessKeys[k]}</Button
              >
            {/each}
          </span>
        {/if}
        {#if !slim}<small class="t-tiny t-soft">{L.world.phaseHint[phase]}</small>{/if}
        {#if !slim && snap?.eveWin && snap.eveWin.until > now && snap.eveWin.tags.length}<small class="t-tiny t-gold"
            >{L.eve.won(snap.eveWin.tags.join(', '), clock(snap.eveWin.until - now))}</small
          >{/if}
      </span>
      <Button size="sm" variant="ghost" onclick={() => (finding = !finding)}
        ><Icon name="globe" size={14} />{L.world.find}</Button
      >
      <Button size="sm" variant="ghost" label={L.world.you} onclick={() => (cam = clamp(home(Math.max(cam.z, 0.7))))}
        ><Icon name="flag" size={14} /><span class="hidden-narrow">{L.world.you}</span></Button
      >
      <Expander open={!slim} label={slim ? L.world.more : L.world.less} onclick={fold} />
    </div>
    {#if !slim}
      <!-- Thiên Thời: thời ngũ hành đang chạy (tăng ích cả giới); chỉ lệnh riêng cho thời này ẩn sau một nút cho thẻ gọn -->
      {@const t = thoiAt(day)}
      <div class="row wrap" style:--gap="6px">
        <small class="t-tiny grow" title={L.thoi.hint}
          ><b>{L.thoi.names[t.el]}</b> · {fxText(t.fx)} · {L.thoi.left(t.end - day)}{#if game.thoi?.n === t.n}
            · <span class="t-gold">{L.thoi.picked}: {fxText(t.picks[game.thoi?.pick ?? 0] ?? {})}</span>{/if}</small
        >
        {#if send && game.thoi?.n !== t.n}<Button size="sm" variant="gold" onclick={() => (picking = !picking)}
            >{L.thoi.pick}</Button
          >{/if}
      </div>
      {#if picking && send && game.thoi?.n !== t.n}
        <div class="row wrap" style:--gap="4px">
          {#each t.picks as p, k (k)}
            <Button
              size="sm"
              variant="ghost"
              onclick={() => {
                picking = false
                void send({ type: 'thoi', pick: k })
              }}>{fxText(p)}</Button
            >
          {/each}
        </div>
      {/if}
    {/if}
    {#if !slim && phase === 0}
      <!-- Khai Giới Trảm Tà: yêu thú giới rơi tàn quyển (đủ thì đổi rương), giới vận của các minh đầu -->
      <span class="row wrap" style:--gap="6px">
        <small class="t-tiny" title={L.eve.hint}><b>{L.eve.title}</b> · {L.eve.frags(game.frag ?? 0)}</small>
        {#if (game.frag ?? 0) >= EVE_CHEST_N}<Button
            size="sm"
            variant="gold"
            onclick={() => g.act({ type: 'eveChest' }, 'reward')}>{L.eve.open}</Button
          >{/if}
      </span>
      {#if snap?.eve}<small class="t-tiny t-soft"
          >{L.eve.top(snap.eve.map(x => `[${x.tag}] ${num(x.pts)}`).join(' · '))}</small
        >{/if}
    {/if}
    {#if finding}
      <div class="stack" style:--gap="6px">
        <div class="row wrap" style:--gap="4px">
          {#each ['wild', 'mine', 'vein', 'boss'] as const as k (k)}
            <Button size="sm" variant={want.kind === k ? 'gold' : 'ghost'} onclick={() => (want = { ...want, kind: k })}
              >{L.world.point[k]}</Button
            >
          {/each}
        </div>
        <div class="row wrap" style:--gap="4px">
          {#each [1, 2, 3] as lv (lv)}
            <Button size="sm" variant={want.lv === lv ? 'gold' : 'quiet'} onclick={() => (want = { ...want, lv })}
              >{want.kind === 'wild' ? L.world.wildLv(lv * 5 - 4, lv * 5) : L.lv(lv)}</Button
            >
          {/each}
          <Button size="sm" variant="gold" icon="arrow" onclick={find}>{L.world.findGo}</Button>
        </div>
        {#if miss}<small class="t-tiny t-bad">{L.world.findNone}</small>{/if}
        <Button size="sm" variant="quiet" icon="scroll" onclick={() => (overview = true)}>{L.world.overview}</Button>
        {#if game.pins?.length}
          <small class="t-tiny t-soft">{L.world.pins}</small>
          <div class="row wrap" style:--gap="4px">
            {#each game.pins as m (`${m.x},${m.y}`)}
              <Button
                size="sm"
                variant="quiet"
                icon="star"
                onclick={() => {
                  cam = clamp({ x: (m.x + 0.5) * T, y: (m.y + 0.5) * T, z: Math.max(cam.z, 0.9) })
                  ping = { x: m.x, y: m.y, until: now + 4000 }
                  finding = false
                  pickAt(m.x, m.y)
                }}>{m.text} {L.world.coord(m.x, m.y)}</Button
              >
            {/each}
          </div>
        {/if}
      </div>
    {/if}
    {#if !slim && snap?.book}
      {@const b = snap.book}
      {@const g = BOOK[b.ch]}
      <!-- Thiên Đạo Biên Niên (Monument): chương đang mở của cả giới, chạm để xem mọi chương -->
      <button class="line-btn" onclick={() => (bookOpen = !bookOpen)} aria-expanded={bookOpen}>
        <small class="t-tiny"
          ><b>{L.book.title}:</b>
          {g
            ? `${L.book.names[b.ch]} — ${L.book.goal[g.m](g.n)} · ${Math.min(b.value, g.n)}/${g.n} · ${L.book.left(Math.max(0, g.day - day + 1))}`
            : L.book.end}</small
        >
      </button>
      {#if g?.m === 'repair' && send}
        <!-- Tu Bổ Thiên Môn: góp tài nguyên vào thanh chung của giới, được Công Huân -->
        <span class="row wrap" style:--gap="4px">
          {#each [10_000, 100_000, 1_000_000] as n (n)}
            <Button
              size="sm"
              variant="ghost"
              disabled={RESOURCES.some(r => game.res[r] < n)}
              onclick={() => send({ type: 'repair', res: { linhThach: n, linhThao: n, linhKhoang: n } })}
              >{L.book.give(num(n))}</Button
            >
          {/each}
        </span>
        <small class="t-tiny t-soft">{L.book.gave}</small>
      {/if}
      {#if b.by}
        <!-- công đầu chương (đóng góp từng người vào chương có chỉ số riêng): hạng của mình, mở ra xem top -->
        {@const k = b.by.findIndex(([p]) => p === me)}
        {#if k >= 0}<small class="t-tiny t-gold">{L.book.mine(k + 1, num(b.by[k][1]))}</small>{/if}
        {#if bookOpen}
          <small class="t-tiny t-strong">{L.book.top(BOOK_TOP)}</small>
          <ol class="stack" style:--gap="2px">
            {#each b.by.slice(0, 5) as [p, n], i (p)}
              <li class="row between t-tiny" class:t-strong={p === me}>
                <span>{i + 1}. {snap.seats.find(x => x.pid === p)?.name ?? '?'}</span><b class="t-num">{num(n)}</b>
              </li>
            {/each}
          </ol>
        {/if}
      {/if}
      {#if bookOpen}
        <ol class="stack" style:--gap="4px">
          {#each BOOK as x, k (k)}
            <li class="row between t-tiny" class:t-soft={k > b.ch}>
              <span
                >{L.book.chapter(k + 1, BOOK.length)} · <b>{L.book.names[k]}</b> — {L.book.goal[x.m](x.n)} ·
                {b.done.includes(k)
                  ? L.book.done
                  : k < b.ch
                    ? L.book.missed
                    : L.book.by(x.day)}{#if PHASE_CH.includes(k)}
                  · <b class="t-gold">{L.book.opens(L.world.phase[PHASE_CH.indexOf(k)])}</b>{/if}</span
              >
              <Bag items={x.reward.items} size="sm" />
            </li>
          {/each}
        </ol>
      {/if}
    {/if}
    {#if !slim && ask}
      <!-- Giới Báo: số báo mỗi sáng (kỷ lục hôm trước), cạnh dòng biên niên -->
      <div class="row between" style:--gap="6px">
        <small class="t-tiny t-soft">{L.paper.line}</small>
        <Button size="sm" variant="ghost" icon="scroll" onclick={() => (paperOpen = true)}>{L.paper.open}</Button>
      </div>
    {/if}
    {#if !slim && snap?.chron.length}
      <button class="line-btn" onclick={() => (chronOpen = !chronOpen)} aria-expanded={chronOpen}>
        <small class="t-tiny"><b>{L.world.chron}:</b> {chronText(L, snap.chron.at(-1)!)}</small>
      </button>
      {#if chronOpen}
        <ol class="stack" style:--gap="2px">
          {#each [...snap.chron].reverse().slice(0, 8) as c, i (i)}
            <li class="t-tiny">
              {chronText(L, c)} ·
              <span class="t-faint">{clock(Math.max(0, now - c.at)).replace(/:\d\d$/, '')}</span>
            </li>
          {/each}
        </ol>
      {/if}
    {/if}
  </Card>
</Dock>
<Paper open={paperOpen} onclose={() => (paperOpen = false)} {ask} {send} />
