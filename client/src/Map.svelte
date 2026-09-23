<script lang="ts">
  // Bản đồ vùng: tranh thủy mặc trên giấy. Tông môn ở dưới cùng; yêu thú, tông môn đối địch, bí cảnh rải khắp núi sông.
  // Đội xuất quân là lá cờ chạy trên đường nét đứt, vị trí nội suy theo giờ (không có vòng lặp tick riêng).
  import { onMount } from 'svelte'
  import { BEASTS, HOME, MAP_HALL, REALMS, SECTS, coolKey, marchSlots, place, targetError, type State, type Target } from '@rok/rules'
  import { Art, Defs, Icon, Portrait } from '@rok/art'
  import { GLYPH, L, LOOK, SEAL, clock } from './lib'

  let { game, now, onpick, onreports }: { game: State; now: number; onpick: (t: Target) => void; onreports: () => void } = $props()

  let box = $state<HTMLDivElement>()
  onMount(() => box?.scrollTo({ top: box.scrollHeight }))

  type Node = { t: Target; x: number; y: number; glyph: string; lv?: number; name: string }
  const nodes: Node[] = [
    ...BEASTS.map((b, i) => ({ t: { kind: 'beast', i } as Target, x: b.x, y: b.y, glyph: GLYPH.beast[i], lv: i + 1, name: L.beasts[i] })),
    ...SECTS.map((d, i) => ({ t: { kind: 'sect', i } as Target, x: d.x, y: d.y, glyph: GLYPH.sect[i], name: L.sects[i].name })),
    ...REALMS.map((d, i) => ({ t: { kind: 'realm', i } as Target, x: d.x, y: d.y, glyph: GLYPH.realm[i], name: L.realms[i].name })),
  ]
  const unread = $derived(game.reports.filter(r => r.id > game.seen).length)
  const status = (n: Node) => {
    const e = targetError(game, n.t, now)
    return e === 'locked' ? 'locked' : e === 'cooldown' ? 'cool' : e === 'max_level' ? 'done' : e === 'busy' ? 'busy' : 'open'
  }
  // Mục tiêu nên đánh tiếp: yêu thú cấp cao nhất đang mở
  const next = $derived(game.beast < BEASTS.length ? game.beast : -1)
  const bend = (x: number, y: number) => `M${HOME.x} ${HOME.y}Q${(HOME.x + x) / 2 + (x < HOME.x ? 30 : -30)} ${(HOME.y + y) / 2} ${x} ${y}`
  const at = (x: number, y: number, k: number) => {
    // điểm trên đường cong bend() tại tỉ lệ k
    const cx = (HOME.x + x) / 2 + (x < HOME.x ? 30 : -30), cy = (HOME.y + y) / 2
    const u = 1 - k
    return [u * u * HOME.x + 2 * u * k * cx + k * k * x, u * u * HOME.y + 2 * u * k * cy + k * k * y]
  }
  const peak = (x: number, y: number, w: number, h: number) =>
    `M${x - w / 2} ${y}Q${x - w / 5} ${y - h * 0.7} ${x} ${y - h}Q${x + w / 6} ${y - h * 0.62} ${x + w / 2} ${y}Z`
  const PEAKS = [
    [30, 690, 120, 90], [370, 650, 130, 110], [150, 600, 90, 70], [250, 470, 140, 100], [20, 360, 110, 120], [380, 330, 120, 90],
    [160, 260, 150, 120], [340, 160, 120, 110], [60, 170, 130, 100], [230, 110, 170, 90], [110, 900, 120, 60], [300, 960, 150, 70],
  ]
  const PINES = [[40, 880], [352, 862], [130, 640], [270, 700], [20, 520], [205, 440], [370, 540], [100, 360], [300, 350], [150, 180]]
</script>

<div class="map" bind:this={box}>
  <svg viewBox="0 0 400 1000" aria-label={L.map.title}>
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e7dcc0" />
        <stop offset=".5" stop-color="#f2e9d3" />
        <stop offset="1" stop-color="#eadfc4" />
      </linearGradient>
      <linearGradient id="inkPeak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2c4448" stop-opacity=".55" />
        <stop offset="1" stop-color="#2c4448" stop-opacity="0" />
      </linearGradient>
      <radialGradient id="fog">
        <stop offset="0" stop-color="#f7f2e4" stop-opacity=".95" />
        <stop offset="1" stop-color="#f7f2e4" stop-opacity="0" />
      </radialGradient>
    </defs>
    <Defs />
    <rect width="400" height="1000" fill="url(#paper)" />
    <!-- Sông -->
    <path d="M262 0C230 90 300 160 280 250S170 360 200 460 330 560 300 660 190 760 240 860 330 950 320 1000" fill="none" stroke="#9fbcbd" stroke-width="20" stroke-opacity=".45" stroke-linecap="round" />
    <path d="M262 0C230 90 300 160 280 250S170 360 200 460 330 560 300 660 190 760 240 860 330 950 320 1000" fill="none" stroke="#fff" stroke-width="2" stroke-opacity=".6" stroke-dasharray="6 14" />
    <!-- Núi mực -->
    {#each PEAKS as [x, y, w, h]}
      <path d={peak(x, y, w, h)} fill="url(#inkPeak)" />
      <path d="M{x} {y - h}q-6 {h * 0.3} -14 {h * 0.5}M{x + 4} {y - h * 0.8}q8 {h * 0.25} 12 {h * 0.45}" fill="none" stroke="#1f3236" stroke-opacity=".35" stroke-width="1.2" stroke-linecap="round" />
    {/each}
    {#each PINES as [x, y]}
      <g transform="translate({x} {y})" opacity=".55">
        <path d="M0 0V-14" stroke="#3b2f24" stroke-width="1.4" />
        <ellipse cx="3" cy="-11" rx="7" ry="2.6" fill="#2f4a40" />
        <ellipse cx="-2" cy="-15" rx="6.5" ry="2.6" fill="#2f4a40" />
        <ellipse cx="1" cy="-19" rx="4.4" ry="2" fill="#3c5c4f" />
      </g>
    {/each}
    <!-- Mây che vùng xa -->
    <ellipse cx="200" cy="30" rx="260" ry="60" fill="url(#fog)" />

    <!-- Đường từ tông môn tới các nơi đã mở -->
    {#each nodes as n (n.name + n.t.kind)}
      {#if status(n) !== 'locked' && game.levels.chuDien >= MAP_HALL}
        <path d={bend(n.x, n.y)} fill="none" stroke="#5b4a2e" stroke-opacity=".3" stroke-width="1.4" stroke-dasharray="3 5" />
      {/if}
    {/each}
    {#each game.marches as m (m.id)}
      {@const p = place(m.target)}
      <path d={bend(p.x, p.y)} fill="none" stroke="var(--cinnabar)" stroke-opacity=".7" stroke-width="2" stroke-dasharray="5 5" class="march-line" />
    {/each}

    <!-- Tông môn nhà -->
    <g transform="translate({HOME.x} {HOME.y})">
      <ellipse cy="2" rx="44" ry="8" fill="#000" opacity=".12" />
      <g transform="scale(.5)"><Art id="chuDien" level={game.levels.chuDien} glyph={SEAL.chuDien} /></g>
      <g transform="translate(0 18)">
        <rect x="-46" y="-8" width="92" height="16" rx="8" fill="rgb(18 30 38 / .8)" stroke="var(--gold)" stroke-width=".8" />
        <text y="4" text-anchor="middle" class="plate">{game.name}</text>
      </g>
    </g>

    <!-- Mục tiêu -->
    {#each nodes as n (n.name + n.t.kind)}
      {@const st = status(n)}
      {@const hot = n.t.kind === 'beast' && n.t.i === next && st === 'open'}
      <g
        class="node {n.t.kind} {st}"
        class:hot
        transform="translate({n.x} {n.y})"
        role="button"
        tabindex="0"
        aria-label="{n.name}{n.lv ? `, ${L.lv(n.lv)}` : ''}"
        onclick={() => onpick(n.t)}
        onkeydown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onpick(n.t))}
      >
        {#if hot}<circle class="halo" r="24" />{/if}
        <circle class="disc" r="17" />
        <text class="han glyph" y="7" text-anchor="middle">{n.glyph}</text>
        {#if n.lv}
          <g transform="translate(13 -13)">
            <circle r="7.5" class="lvb" />
            <text y="3" text-anchor="middle" class="lvn">{n.lv}</text>
          </g>
        {/if}
        {#if n.t.kind === 'realm'}
          <g transform="translate(13 -13)">
            <rect x="-10" y="-7" width="20" height="14" rx="7" class="lvb" />
            <text y="3" text-anchor="middle" class="lvn">{game.realms[n.t.i]}/5</text>
          </g>
        {/if}
        {#if st === 'locked'}
          <g transform="translate(-6 -6)" class="lock"><Icon name="lock" size={12} /></g>
        {:else if st === 'done'}
          <g transform="translate(-7 -7)" class="ok"><Icon name="check" size={14} /></g>
        {/if}
        <text class="label" y="30" text-anchor="middle">{n.name}</text>
        {#if st === 'cool'}
          <text class="label timer" y="41" text-anchor="middle">{clock((game.cool[coolKey(n.t)] ?? 0) - now)}</text>
        {/if}
      </g>
    {/each}

    <!-- Đội đang hành quân -->
    {#each game.marches as m (m.id)}
      {@const p = place(m.target)}
      {@const out = now < m.arriveAt}
      {@const k = out ? (now - m.startAt) / (m.arriveAt - m.startAt) : 1 - (now - m.arriveAt) / (m.returnAt - m.arriveAt)}
      {@const [x, y] = at(p.x, p.y, Math.max(0, Math.min(1, k)))}
      <g transform="translate({x} {y})" class="troop">
        <circle r="9" fill="rgb(18 30 38 / .85)" stroke="var(--gold)" stroke-width="1" />
        <g transform="translate(-6 -6)" style="color: var(--gold-l)"><Icon name="flag" size={12} /></g>
      </g>
    {/each}
  </svg>
</div>

<div class="bar">
  <h2>{L.map.title}</h2>
  <span class="chip">{L.map.slots(game.marches.length, marchSlots(game))}</span>
  <button class="btn small" onclick={onreports}>
    <Icon name="scroll" size={16} />{L.report.title}
    {#if unread}<span class="dot">{unread}</span>{/if}
  </button>
</div>

{#if game.marches.length}
  <ul class="marches">
    {#each game.marches as m (m.id)}
      {@const out = now < m.arriveAt}
      <li>
        <button onclick={() => onpick(m.target)}>
          <Portrait look={LOOK[m.elder]} size={30} />
          <span class="mt"><b>{L.target(m.target)}</b><small>{out ? L.map.out : L.map.back}</small></span>
          <b class="tm">{clock((out ? m.arriveAt : m.returnAt) - now)}</b>
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .map {
    position: fixed;
    inset: 0;
    max-width: 480px;
    margin: 0 auto;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    background: #e7dcc0;
  }
  .map::-webkit-scrollbar {
    display: none;
  }
  svg {
    display: block;
    width: 100%;
    /* chừa chỗ cho HUD trên và thanh tab dưới */
    margin: calc(96px + env(safe-area-inset-top)) 0 calc(150px + env(safe-area-inset-bottom));
  }
  .plate {
    font: 600 9px var(--font);
    fill: #f6f1e4;
  }
  .node {
    cursor: pointer;
    outline: none;
  }
  .disc {
    stroke: var(--gold-l);
    stroke-width: 2.2;
  }
  .beast .disc {
    fill: #6d4f28;
  }
  .sect .disc {
    fill: #9a3220;
  }
  .realm .disc {
    fill: #256a73;
  }
  .glyph {
    font-size: 20px;
    fill: #fff8e6;
  }
  .lvb {
    fill: var(--cinnabar);
    stroke: #fff;
    stroke-width: 1;
  }
  .lvn {
    font: 700 8px var(--font);
    fill: #fff;
  }
  .label {
    font: 600 9px var(--font);
    fill: var(--ink);
    stroke: #f6efdc;
    stroke-width: 3px;
    paint-order: stroke;
  }
  .timer {
    font-size: 8.5px;
    fill: var(--azurite);
  }
  .locked .disc,
  .locked .lvb {
    fill: #8f8a7e;
    stroke: #cfc6b0;
  }
  .locked {
    opacity: 0.55;
  }
  .lock {
    color: #fff;
  }
  .cool .disc {
    fill: #7d7666;
  }
  .done .disc {
    fill: #4f6b5a;
  }
  .ok {
    color: #cfeccf;
  }
  .node:focus-visible .disc {
    stroke: var(--azurite);
    stroke-width: 3;
  }
  .halo {
    fill: none;
    stroke: var(--gold);
    stroke-width: 2;
    animation: halo 1.6s ease-out infinite;
  }
  @keyframes halo {
    from {
      opacity: 0.9;
      transform: scale(0.75);
    }
    to {
      opacity: 0;
      transform: scale(1.35);
    }
  }
  .march-line {
    animation: dash 1s linear infinite;
  }
  @keyframes dash {
    to {
      stroke-dashoffset: -10;
    }
  }

  .bar {
    position: fixed;
    top: calc(124px + env(safe-area-inset-top));
    left: 50%;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(100%, 480px);
    padding: 6px 10px;
    translate: -50% 0;
    pointer-events: none;
  }
  .bar > * {
    pointer-events: auto;
  }
  .bar h2 {
    padding: 4px 12px;
    font-size: 15px;
    color: #f6f1e4;
    background: rgb(13 24 31 / 0.8);
    border: 1px solid rgb(201 161 74 / 0.55);
    border-radius: 10px;
  }
  .bar .chip {
    color: #f6f1e4;
    background: rgb(13 24 31 / 0.75);
  }
  .bar .btn {
    position: relative;
    margin-left: auto;
  }
  .dot {
    position: absolute;
    top: -6px;
    right: -6px;
    display: grid;
    place-items: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    font-size: 10px;
    background: var(--cinnabar);
    border-radius: 9px;
    box-shadow: 0 0 0 2px #0e1a21;
  }
  .marches {
    position: fixed;
    bottom: calc(96px + env(safe-area-inset-bottom));
    left: 50%;
    z-index: 4;
    display: grid;
    gap: 6px;
    width: min(100% - 20px, 460px);
    padding: 0;
    list-style: none;
    translate: -50% 0;
  }
  .marches button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 5px 12px 5px 5px;
    color: #f6f1e4;
    text-align: left;
    background: rgb(13 24 31 / 0.88);
    border: 1px solid rgb(201 161 74 / 0.55);
    border-radius: 999px;
    cursor: pointer;
  }
  .mt {
    display: grid;
    flex: 1;
  }
  .mt b {
    font-size: 13px;
  }
  .mt small {
    font-size: 11px;
    color: #b9c6ca;
  }
  .tm {
    font-variant-numeric: tabular-nums;
    color: var(--gold-l);
  }
  @media (prefers-reduced-motion: reduce) {
    .halo,
    .march-line {
      animation: none;
    }
  }
</style>
