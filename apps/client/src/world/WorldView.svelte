<script lang="ts">
  // Bản đồ giới: cảnh WebGL (worldmap.ts) + lớp HTML nhận cử chỉ (kéo có quán tính, chụm, con lăn, phím) + ghim tên tông môn
  // + dải trên (ngày, pha mùa, biên niên). Dữ liệu sống: ảnh chụp server đẩy khi đổi (watch). Chạm: cờ hành quân → tông môn → điểm → ô.
  import { chronText } from '@rok/i18n'
  import { onMount, type Snippet } from 'svelte'
  import { MAP_W, SEASON_DAYS, dayIn, phaseOf, type MapSnap } from '@rok/rules/world'
  import type { WorldInfo } from '@rok/protocol'
  import { Icon } from '@rok/art'
  import { Button, Card } from '../ui'
  import { L, clock, keyBlocked } from '../lib'
  import { mountScene, railPx } from './stage'
  import { FINE_Z, WORLD_DU, WorldScene, type Cam, type Pick, type Rel } from './worldmap'
  import { useGame } from '../game'

  let {
    info,
    me,
    snap,
    allies = [],
    onpick,
    toggle,
  }: {
    info: WorldInfo
    me: number | null
    snap: MapSnap | null
    allies?: number[] // mã tông môn cùng minh (tô màu đồng minh)
    onpick: (p: Pick) => void
    toggle?: Snippet // nút gạt Giới | Vùng (MapTab)
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  const T = WORLD_DU / MAP_W
  const home = () => ({ x: ((game.seat?.x ?? MAP_W / 2) + 0.5) * T, y: ((game.seat?.y ?? MAP_W / 2) + 0.5) * T })
  let cam = $state<Cam>({ ...home(), z: 0.55 })
  onMount(() => void (cam = clamp(cam)))
  let scene = $state.raw<WorldScene>()
  let layer = $state<HTMLDivElement>()
  let chronOpen = $state(false)
  const day = $derived(dayIn(info.opened, now))
  const phase = $derived(phaseOf(day))
  const zMin = () => Math.min(innerWidth - railPx(), innerHeight) / WORLD_DU
  const center = () => ({ x: railPx() + (innerWidth - railPx()) / 2, y: innerHeight / 2 })
  // giữ khung nhìn trong giới: phóng to thì mép màn không vượt mép giới (thu nhỏ hết thì giới nằm giữa)
  const clamp = (c: Cam): Cam => {
    const z = Math.min(1.4, Math.max(zMin(), c.z))
    const hx = (innerWidth - railPx()) / 2 / z,
      hy = innerHeight / 2 / z
    const fit = (v: number, h: number) => (h * 2 >= WORLD_DU ? WORLD_DU / 2 : Math.min(WORLD_DU - h, Math.max(h, v)))
    return { z, x: fit(c.x, hx), y: fit(c.y, hy) }
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
    if (k[e.key]) (e.preventDefault(), k[e.key]())
  }

  onMount(() => {
    addEventListener('keydown', keys)
    const unmount = mountScene({
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

  const rel = (pid: number): Rel =>
    pid === me ? 'me' : allies.includes(pid) ? 'ally' : snap?.seats.find(s => s.pid === pid)?.npc ? 'npc' : 'other'
  $effect(() => {
    if (scene && snap) scene.setData(snap, rel, phase, now)
  })

  // Ghim tên: tối đa 60 tông môn gần tâm nhìn nhất, chỉ khi đủ phóng để đọc
  const pins = $derived.by(() => {
    if (!snap || cam.z < FINE_Z * 0.8) return []
    const c = typeof innerWidth === 'undefined' ? { x: 0, y: 0 } : center()
    return snap.seats
      .map(s => ({ s, x: c.x + ((s.x + 0.5) * T - cam.x) * cam.z, y: c.y + ((s.y + 0.5) * T - cam.y) * cam.z }))
      .filter(p => p.x > -40 && p.y > -40 && p.x < innerWidth + 40 && p.y < innerHeight + 40)
      .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))
      .slice(0, 60)
  })
</script>

<div
  class="touch"
  bind:this={layer}
  role="application"
  aria-label={L.world.toggle.world}
  onpointerdown={pointerdown}
  onpointermove={pointermove}
  onpointerup={pointerup}
  onpointercancel={pointerup}
  onwheel={wheel}
></div>
<div class="pins" aria-hidden="true">
  {#each pins as p (p.s.pid)}
    <span class="pin" class:mine={p.s.pid === me} style="left:{p.x}px;top:{p.y + 18}px">{p.s.name}</span>
  {/each}
</div>

<div class="top stack" style:--gap="6px">
  {#if toggle}<div class="row">{@render toggle()}</div>{/if}
  <Card tone="silk">
    <div class="row">
      <span class="grow stack" style:--gap="0">
        <b class="t-small">{L.rank.fameRow(info.season)} · {L.world.day(day, SEASON_DAYS)} · {L.world.phase[phase]}</b>
        <small class="t-tiny t-soft">{L.world.phaseHint[phase]}</small>
      </span>
      <Button size="sm" variant="ghost" onclick={() => (cam = clamp({ ...home(), z: Math.max(cam.z, 0.7) }))}
        ><Icon name="flag" size={14} />{L.world.you}</Button
      >
    </div>
    {#if snap?.chron.length}
      <button class="chron" onclick={() => (chronOpen = !chronOpen)} aria-expanded={chronOpen}>
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
</div>

<style>
  .touch {
    position: fixed;
    inset: 0 0 0 var(--rail);
    touch-action: none;
    cursor: grab;
  }
  .pins {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    overflow: hidden;
    pointer-events: none;
  }
  .pin {
    position: absolute;
    translate: -50% 0;
    padding: 0 5px;
    font-size: var(--fs-1);
    font-weight: 700;
    color: var(--silk);
    white-space: nowrap;
    background: color-mix(in srgb, var(--ink) 62%, transparent);
    border-radius: 6px;
  }
  .mine {
    color: var(--ink);
    background: color-mix(in srgb, var(--gold-l) 85%, transparent);
  }
  /* cùng chỗ với thanh trên của bản đồ vùng (MapView) */
  .top {
    position: fixed;
    top: calc(142px + var(--safe-t));
    left: 50%;
    z-index: var(--z-page);
    width: min(100%, var(--col));
    padding: 0 var(--sp-3);
    translate: -50% 0;
    pointer-events: none;
  }
  .top > :global(*) {
    pointer-events: auto;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .top {
      top: calc(var(--top) + var(--sp-4));
      left: calc(var(--rail) + (100% - var(--rail)) / 2);
      width: min(100% - var(--rail), 640px);
    }
  }
  .chron {
    display: block;
    width: 100%;
    margin-top: 4px;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;
  }
</style>
