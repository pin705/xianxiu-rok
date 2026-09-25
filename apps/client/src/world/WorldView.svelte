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
    phaseOf,
    route,
    type MapSnap,
    type Mark,
    type WorldAction,
  } from '@rok/rules/world'
  import { BLESSINGS, BOOK, cellOf, clear, dayOf, fogOf, type BlessKey } from '@rok/rules'
  import type { Ack, WorldInfo } from '@rok/protocol'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card } from '../ui'
  import { L, clock, keyBlocked } from '../lib'
  import { mountScene, railPx } from './stage'
  import { FINE_Z, WORLD_DU, WorldScene, type Cam, type Pick, type Rel } from './worldmap'
  import { useGame } from '../game'
  import { social } from '../social.svelte'

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
  let bookOpen = $state(false)
  const day = $derived(dayIn(info.opened, now))
  const phase = $derived(phaseOf(day))
  const zMin = () => Math.min(innerWidth - railPx(), innerHeight) / WORLD_DU
  const center = () => ({ x: railPx() + (innerWidth - railPx()) / 2, y: innerHeight / 2 })
  // giữ khung nhìn trong giới: phóng to thì mép màn không vượt mép giới (thu nhỏ hết thì giới nằm giữa)
  // Kéo quá mép bằng chiều cao lớp phủ (px CSS): trên — HUD + thẻ mùa (đo thật: thẻ cao lên khi mở biên niên, tìm…),
  // dưới — tab + dải chat. Tông môn / điểm sát mép giới vẫn kéo ra được chỗ trống giữa màn, không nằm kẹt dưới thẻ
  let topCard = $state<HTMLDivElement>()
  const PAD = { top: 260, bottom: 160, side: 48 }
  const padTop = () => Math.max(PAD.top, (topCard?.getBoundingClientRect().bottom ?? 0) + 40)
  // thẻ đổi cỡ (dữ liệu bản đồ tới sau): chưa ai kéo / nhảy khung nhìn thì đưa lại về tông môn, khỏi nằm dưới thẻ
  let steered = false
  onMount(() => {
    const ro = new ResizeObserver(() => void (steered || (cam = clamp({ ...home(), z: cam.z }))))
    if (topCard) ro.observe(topCard)
    return () => ro.disconnect()
  })
  const clamp = (c: Cam): Cam => {
    const z = Math.min(1.4, Math.max(zMin(), c.z))
    const hx = (innerWidth - railPx()) / 2 / z,
      hy = innerHeight / 2 / z
    const fit = (v: number, h: number, lo: number, hi: number) =>
      h * 2 >= WORLD_DU + lo + hi ? WORLD_DU / 2 : Math.min(WORLD_DU - h + hi, Math.max(h - lo, v))
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

  const rel = (pid: number): Rel => {
    if (pid === me) return 'me'
    if (allies.includes(pid)) return 'ally'
    return snap?.seats.find(s => s.pid === pid)?.npc ? 'npc' : 'other'
  }
  $effect(() => {
    if (scene && snap)
      scene.setData(snap, rel, phase, now, game.seat ? { fog: fogOf(game), visited: game.visited ?? [] } : undefined)
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

  // Tìm (như kính lúp của RoK): điểm gần nhất theo loại + cấp, còn sống, có đường đi — bay tới và mở bảng của điểm đó
  type Find = 'mine' | 'vein' | 'boss' | 'wild'
  let finding = $state(false)
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
      .filter(p => !dead.has(p.i) && route(a, from, p, phase))
      .sort((p, q) => d(p) - d(q))[0]
    miss = !hit
    if (!hit) return
    cam = clamp({ x: (hit.x + 0.5) * T, y: (hit.y + 0.5) * T, z: Math.max(cam.z, 0.9) })
    ping = { x: hit.x, y: hit.y, until: now + 4000 }
    finding = false
    pickAt(hit.x, hit.y)
  }

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

<div class="marks">
  {#each marks as m (`${m.x},${m.y}`)}
    {@const p = onScreen(m.x, m.y)}
    {#if p}
      <button class="mark" style="left:{p.x}px;top:{p.y}px" onclick={() => pickAt(m.x, m.y)}
        ><Icon name="flag" size={16} /><span>{m.text}</span></button
      >
    {/if}
  {/each}
  {#each game.pins ?? [] as m (`p${m.x},${m.y}`)}
    {@const p = onScreen(m.x, m.y)}
    {#if p}
      <button class="mark pin" style="left:{p.x}px;top:{p.y}px" onclick={() => pickAt(m.x, m.y)}
        ><Icon name="star" size={14} /><span>{m.text}</span></button
      >
    {/if}
  {/each}
  {#if pingAt}<span class="ping" style="left:{pingAt.x}px;top:{pingAt.y}px" aria-hidden="true"></span>{/if}
</div>

<div class="top stack" style:--gap="6px" bind:this={topCard}>
  {#if toggle}<div class="row">{@render toggle()}</div>{/if}
  <Card tone="silk">
    <div class="row">
      <span class="grow stack" style:--gap="0">
        <b class="t-small">{L.rank.fameRow(info.season)} · {L.world.day(day, SEASON_DAYS)} · {L.world.phase[phase]}</b>
        {#if lordSeat}<button class="lord t-tiny" onclick={() => (social.profile = lordSeat.pid)}
            ><Icon name="flag" size={12} />{L.lord.now(lordSeat.name)}</button
          >{/if}
        {#if snap?.bless && snap.bless.until > now}<small class="t-tiny t-gold"
            >{L.lord.blessed(L.lord.blessKeys[snap.bless.key], clock(snap.bless.until - now))}</small
          >{/if}
        {#if send && snap?.lord === me && snap?.bless?.day !== dayOf(now)}
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
        <small class="t-tiny t-soft">{L.world.phaseHint[phase]}</small>
      </span>
      <Button size="sm" variant="ghost" onclick={() => (finding = !finding)}
        ><Icon name="globe" size={14} />{L.world.find}</Button
      >
      <Button size="sm" variant="ghost" onclick={() => (cam = clamp({ ...home(), z: Math.max(cam.z, 0.7) }))}
        ><Icon name="flag" size={14} />{L.world.you}</Button
      >
    </div>
    {#if finding}
      <div class="stack find" style:--gap="6px">
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
    {#if snap?.book}
      {@const b = snap.book}
      {@const g = BOOK[b.ch]}
      <!-- Thiên Đạo Biên Niên (Monument): chương đang mở của cả giới, chạm để xem mọi chương -->
      <button class="chron" onclick={() => (bookOpen = !bookOpen)} aria-expanded={bookOpen}>
        <small class="t-tiny"
          ><b>{L.book.title}:</b>
          {g
            ? `${L.book.names[b.ch]} — ${L.book.goal[g.m](g.n)} · ${Math.min(b.value, g.n)}/${g.n} · ${L.book.left(Math.max(0, g.day - day + 1))}`
            : L.book.end}</small
        >
      </button>
      {#if bookOpen}
        <ol class="stack" style:--gap="4px">
          {#each BOOK as x, k (k)}
            <li class="row between t-tiny" class:t-soft={k > b.ch}>
              <span
                >{L.book.chapter(k + 1, BOOK.length)} · <b>{L.book.names[k]}</b> — {L.book.goal[x.m](x.n)} ·
                {b.done.includes(k) ? L.book.done : k < b.ch ? L.book.missed : L.book.by(x.day)}</span
              >
              <Bag items={x.reward.items} size="sm" />
            </li>
          {/each}
        </ol>
      {/if}
    {/if}
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
  /* dấu của minh: cờ son + lời ghi, bấm được (chọn vật ở ô đó) */
  .marks {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    overflow: hidden;
    pointer-events: none;
  }
  .mark {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 1px 6px 1px 2px;
    font: inherit;
    font-size: var(--fs-1);
    font-weight: 700;
    color: var(--silk);
    white-space: nowrap;
    background: color-mix(in srgb, var(--cinnabar) 82%, var(--ink));
    border: 1px solid var(--gold-l);
    border-radius: 8px;
    translate: -50% -100%;
    pointer-events: auto;
    cursor: pointer;
  }
  .mark.pin {
    color: var(--ink);
    background: color-mix(in srgb, var(--gold-l) 90%, transparent);
    border-color: var(--gold-d);
  }
  .ping {
    position: absolute;
    width: 44px;
    height: 44px;
    border: 3px solid var(--cinnabar);
    border-radius: 50%;
    translate: -50% -50%;
    animation: ping 1s var(--ease) infinite;
  }
  @keyframes ping {
    from {
      scale: 0.4;
      opacity: 1;
    }
    to {
      scale: 1.6;
      opacity: 0;
    }
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
  .lord {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 0;
    font: inherit;
    font-weight: 700;
    color: var(--gold-d);
    background: none;
    border: 0;
    cursor: pointer;
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
