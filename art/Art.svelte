<svelte:options namespace="svg" />

<script module lang="ts">
  export type Kind = 'chuDien' | 'tuLinhTran' | 'linhDien' | 'khoangMach' | 'tangBaoCac' | 'dienVoTruong' | 'tangKinhCac' | 'danPhong'
</script>

<script lang="ts">
  // Hình vẽ công trình. Gốc (0,0) là chân công trình, vẽ lên phía y âm.
  // Tầng 1–5, 6–10, 11–15 ứng với 3 bậc hình: mái ngói → mái lưu ly hai tầng → mái vàng.
  // glyph: chữ Hán trên biển hiệu.
  let { id, level, glyph }: { id: Kind; level: number; glyph: string } = $props()

  const tier = $derived(level <= 5 ? 1 : level <= 10 ? 2 : 3)
  const tile = $derived(['var(--tile)', 'var(--glaze)', 'var(--gold)'][tier - 1])
  const floors = $derived(Array.from({ length: tier + 2 }, (_, i) => ({ y: -6 - i * 20, w: 40 - i * 6 })))
  const bands = $derived([116, 104, 92, 80].slice(0, tier + 1).map((w, i) => ({ w, y: -6 - i * 10 })))
  const disciples = $derived(
    [[-22, -3], [-8, -1], [7, -4], [21, -2], [-14, 3], [13, 3]].slice(0, Math.min(6, 1 + Math.floor(level / 2))),
  )

  // Mái cong Á Đông: mép dưới võng xuống, hai đầu đao vểnh lên
  function roof(w: number, h: number) {
    const a = w / 2
    const e = h * 0.38
    return (
      `M${-a} ${-e}Q${-a * 0.8} ${-h * 0.04} ${-a * 0.6} 0H${a * 0.6}Q${a * 0.8} ${-h * 0.04} ${a} ${-e}` +
      `Q${a * 0.6} ${-h * 0.45} ${a * 0.32} ${-h}H${-a * 0.32}Q${-a * 0.6} ${-h * 0.45} ${-a} ${-e}Z`
    )
  }
  const pillars = (w: number) => (w < 40 ? [-w / 2 + 2, w / 2 - 2] : [-w / 2 + 2, -w / 6, w / 6, w / 2 - 2])
  const windows = (w: number) => (w < 40 ? [] : [-w / 3, w / 3])
  const band = (w: number, y: number) =>
    `M${-w / 2} ${y}Q0 ${y - 7} ${w / 2} ${y}L${w / 2 - 3} ${y + 6}Q0 ${y - 1} ${-w / 2 + 3} ${y + 6}Z`
  const sprouts = (w: number) => Array.from({ length: Math.floor(w / 8) }, (_, k) => -w / 2 + 6 + k * 8)
</script>

{#snippet Roof(y: number, w: number, h: number, fill: string)}
  <g transform="translate(0 {y})">
    <path d={roof(w, h)} {fill} />
    {#each [-0.24, -0.12, 0, 0.12, 0.24] as k}
      <path d="M{k * w * 0.9} {-h * 0.9}L{k * w * 1.3} {-h * 0.1}" stroke="#000" stroke-opacity=".16" stroke-width=".7" />
    {/each}
    <path d={roof(w, h)} fill="none" stroke="#000" stroke-opacity=".3" stroke-width=".8" />
    <rect x={-w * 0.17} y={-h - 1.6} width={w * 0.34} height="2.6" rx="1.2" fill="var(--ridge)" />
    <path
      d="M{-w * 0.17} {-h - 0.3}q-2.2 -3.4 -4.6 -3M{w * 0.17} {-h - 0.3}q2.2 -3.4 4.6 -3"
      fill="none"
      stroke="var(--ridge)"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </g>
{/snippet}

{#snippet Wall(y: number, w: number, h: number, door: boolean)}
  {@const dh = Math.min(h * 0.8, 13)}
  <g transform="translate(0 {y})">
    <rect x={-w / 2} y={-h} width={w} height={h} fill="var(--wall)" />
    <rect x={-w / 2} y={-h} width={w} height="2.4" fill="#000" fill-opacity=".14" />
    {#each windows(w) as x}
      <rect class="win" x={x - 4.5} y={-h * 0.74} width="9" height={h * 0.44} rx=".8" />
      <path d="M{x} {-h * 0.74}V{-h * 0.3}M{x - 4.5} {-h * 0.52}H{x + 4.5}" stroke="var(--wood-d)" stroke-width=".6" />
    {/each}
    {#each pillars(w) as x}
      <rect x={x - 1.4} y={-h} width="2.8" height={h} fill="var(--cinnabar)" />
    {/each}
    {#if door}
      <rect x="-5.5" y={-dh} width="11" height={dh} fill="var(--door)" />
      <path d="M0 {-dh}V0" stroke="#000" stroke-opacity=".35" stroke-width=".6" />
      <circle cx="-1.6" cy={-dh / 2} r=".7" fill="var(--gold)" />
      <circle cx="1.6" cy={-dh / 2} r=".7" fill="var(--gold)" />
    {/if}
  </g>
{/snippet}

{#snippet Base(w: number, h: number, stairs: boolean)}
  <path d="M{-w / 2} 0L{w / 2} 0L{w / 2 - 3} {-h}L{-w / 2 + 3} {-h}Z" fill="var(--stone)" />
  <path d="M{-w / 2 + 3} {-h}H{w / 2 - 3}" stroke="var(--stone-l)" stroke-width="1.2" />
  <path d="M{-w / 2} 0H{w / 2}" stroke="var(--stone-d)" stroke-width="1.4" />
  {#if stairs}
    <path d="M-10 0L-8 {-h}H8L10 0Z" fill="var(--stone-l)" />
    {#each [0.25, 0.5, 0.75] as k}
      <path d="M{-10 + k * 2} {-h * k}H{10 - k * 2}" stroke="var(--stone-d)" stroke-width=".6" />
    {/each}
  {/if}
{/snippet}

{#snippet Plaque(y: number, s: number)}
  <g transform="translate(0 {y}) scale({s})">
    <rect x="-7" y="-5" width="14" height="10" rx="1.2" fill="var(--plaque)" stroke="var(--gold)" stroke-width=".9" />
    <text class="han" y="3.3" text-anchor="middle" font-size="8.4" fill="var(--gold-l)">{glyph}</text>
  </g>
{/snippet}

{#snippet Lantern(x: number, y: number)}
  <g transform="translate({x} {y})">
    <circle class="glow" cy="3" r="9" fill="url(#lamp)" />
    <path d="M0 -1V1" stroke="var(--ink)" stroke-width=".6" />
    <ellipse cy="3.2" rx="2.3" ry="2.9" fill="var(--cinnabar)" />
    <path d="M-2.3 3.2H2.3" stroke="var(--gold)" stroke-width=".5" />
  </g>
{/snippet}

{#snippet Pillar(x: number, y: number)}
  <g transform="translate({x} {y})">
    <rect x="-2.6" y="-13" width="5.2" height="13" fill="var(--stone-d)" />
    <rect x="-3.4" y="-14.6" width="6.8" height="2.2" rx=".6" fill="var(--stone)" />
    <circle class="orb" cy="-18.5" r="3.6" fill="url(#orb)" />
  </g>
{/snippet}

<g style="--ridge: {tier === 3 ? 'var(--gold-d)' : 'var(--ink)'}">
  {#if id === 'chuDien'}
    {#if tier === 3}
      {#each [-60, 60] as x}
        <g transform="translate({x} 0)">
          {@render Base(40, 6, false)}
          {@render Wall(-6, 30, 16, false)}
          {@render Roof(-22, 42, 13, tile)}
        </g>
      {/each}
    {/if}
    {@render Base(112, 8, true)}
    {@render Wall(-8, 78, 26, true)}
    {@render Plaque(-29, 1)}
    {#if tier >= 2}
      {@render Roof(-34, 106, 24, tile)}
      {@render Wall(-52, 52, 11, false)}
      {@render Roof(-63, 78, 19, tile)}
    {:else}
      {@render Roof(-34, 106, 26, tile)}
    {/if}
    {@render Lantern(-42, -31)}
    {@render Lantern(42, -31)}
  {:else if id === 'tangKinhCac'}
    {@const top = floors[floors.length - 1].y - 26}
    {@render Base(62, 6, true)}
    {#each floors as f, i}
      {@render Wall(f.y, f.w, 13, i === 0)}
      {#if i === 1}{@render Plaque(f.y - 6.5, 0.7)}{/if}
      {@render Roof(f.y - 13, f.w + 18, 11, tile)}
    {/each}
    <path d="M0 {top + 1}V{top - 10}" stroke="var(--gold-d)" stroke-width="1.6" />
    <circle cy={top - 2} r="2.3" fill="var(--gold)" />
    <circle cy={top - 6} r="1.7" fill="var(--gold)" />
    <circle cy={top - 9.4} r="1.1" fill="var(--gold)" />
  {:else if id === 'danPhong'}
    {@render Base(76, 6, true)}
    {@render Wall(-6, 52, 20, true)}
    {@render Plaque(-23.2, 0.7)}
    {@render Roof(-26, 70, 18, tile)}
    <g transform="translate(28 0)">
      <circle class="fire" cy="-9" r="15" fill="url(#fire)" />
      <path d="M-7 -4 -9.5 0M7 -4 9.5 0M0 -3V0.5" stroke="var(--bronze-d)" stroke-width="1.7" stroke-linecap="round" />
      <path d="M-9.5 -13Q-10.5 -3 0 -3Q10.5 -3 9.5 -13Z" fill="var(--bronze)" stroke="var(--bronze-d)" stroke-width=".8" />
      <rect x="-11" y="-15.2" width="22" height="2.8" rx="1.2" fill="var(--bronze-d)" />
      <path d="M-7.5 -15V-18.5M7.5 -15V-18.5" stroke="var(--bronze-d)" stroke-width="1.8" stroke-linecap="round" />
      <path d="M-5 -9H5" stroke="var(--gold)" stroke-width=".7" stroke-opacity=".7" />
      {#each [0, 1, 2] as i}
        <circle class="smoke" cy="-19" r="3.2" style="animation-delay: {i * 1.2}s" />
      {/each}
    </g>
  {:else if id === 'dienVoTruong'}
    <ellipse cy="-5" rx="58" ry="12.5" fill="var(--stone)" />
    <ellipse cy="-6" rx="56" ry="11" fill="var(--stone-l)" />
    <ellipse cy="-6" rx="40" ry="7.5" fill="none" stroke="var(--stone-d)" stroke-opacity=".45" stroke-dasharray="3 2.4" />
    <g transform="translate(0 -14)">
      <rect x="-24" y="-34" width="4" height="34" fill="var(--cinnabar)" />
      <rect x="20" y="-34" width="4" height="34" fill="var(--cinnabar)" />
      <rect x="-30" y="-35" width="60" height="5.5" fill="var(--plaque)" />
      {@render Plaque(-23.5, 0.8)}
      {@render Roof(-35, 70, 12, tile)}
    </g>
    <g transform="translate(-47 -8)">
      <rect x="-7" y="-15" width="14" height="1.8" fill="var(--wood-d)" />
      <rect x="-7" y="-5" width="14" height="1.8" fill="var(--wood-d)" />
      {#each [-4.5, -1.5, 1.5, 4.5] as x}
        <path d="M{x} 1V-22" stroke="var(--wood)" stroke-width="1.1" />
        <path d="M{x} -22l-1.4 3.2h2.8Z" fill="var(--steel)" />
      {/each}
    </g>
    {#each [38, 50] as x, i}
      <g transform="translate({x} -7)">
        <path d="M0 0V-42" stroke="var(--wood-d)" stroke-width="1.3" />
        <path class="flag" style="animation-delay: {i * 0.7}s" d="M0 -42H12L9 -36 12 -30H0Z" fill="var(--cinnabar)" />
      </g>
    {/each}
    {#each disciples as [x, y], i}
      <g transform="translate({x} {y - 4})">
        <g class="drill" style="animation-delay: {i * 0.35}s">
          <path d="M-2.8 0-1.9-6.8H1.9L2.8 0Z" fill="var(--robe)" stroke="#000" stroke-opacity=".3" stroke-width=".4" />
          <rect x="-2" y="-4.8" width="4" height="1" fill="var(--azurite)" />
          <circle cy="-8.6" r="1.9" fill="var(--skin)" />
          <path d="M-1.9 -9.1q1.9 -2.8 3.8 0" fill="var(--ink)" />
          <path class="sword" style="animation-delay: {i * 0.35}s" d="M2 -5.4l4.6 -4.6" stroke="var(--steel)" stroke-width=".8" stroke-linecap="round" />
        </g>
      </g>
    {/each}
  {:else if id === 'tangBaoCac'}
    {@render Base(72, 9, false)}
    <rect x="-31" y="-13" width="62" height="4" fill="var(--stone-d)" />
    {@render Wall(-9, 58, 20, true)}
    {@render Plaque(-25.8, 0.7)}
    {@render Roof(-29, 74, 16, tile)}
    {@render Wall(-42, 40, 11, false)}
    {@render Roof(-53, 56, 14, tile)}
  {:else if id === 'tuLinhTran'}
    <ellipse cy="-3" rx="48" ry="13.5" fill="var(--stone-d)" />
    <ellipse cy="-4.6" rx="46" ry="11.8" fill="var(--stone)" />
    <ellipse class="rune" cy="-4.6" rx="35" ry="8.6" fill="none" stroke="var(--spirit)" stroke-width="1.1" />
    <ellipse class="rune" cy="-4.6" rx="21" ry="5.2" fill="none" stroke="var(--spirit)" stroke-width="1" />
    {#each Array.from({ length: 8 }, (_, k) => (k * Math.PI) / 4) as a}
      <rect x={28 * Math.cos(a) - 2.6} y={-4.6 + 6.9 * Math.sin(a) - 0.6} width="5.2" height="1.2" rx=".6" fill="var(--spirit)" opacity=".85" />
    {/each}
    {@render Pillar(-22, -13)}
    {@render Pillar(22, -13)}
    <rect class="beam" x="-5.5" y="-80" width="11" height="76" fill="url(#beam)" />
    <circle class="orb" cy="-6" r="5.5" fill="url(#orb)" />
    {#if tier >= 2}
      <ellipse class="rune" cy="-58" rx="16" ry="4" fill="none" stroke="var(--spirit)" stroke-width="1.2" />
    {/if}
    {@render Pillar(-40, -3.5)}
    {@render Pillar(40, -3.5)}
  {:else if id === 'khoangMach'}
    <path d="M-56 2C-54 -24 -46 -50 -22 -61C-2 -69 26 -66 42 -51C55 -37 58 -18 56 2Z" fill="url(#crag)" />
    <path d="M-40 -30q6 -8 12 -10M26 -46q8 2 12 10M-30 -48q10 -8 20 -9" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1" stroke-linecap="round" />
    <path d="M-17 0V-19Q-17 -33 0 -33Q17 -33 17 -19V0Z" fill="var(--cave)" />
    <path d="M-12 0V-17Q-12 -27 0 -27Q12 -27 12 -17V0Z" fill="#000" fill-opacity=".35" />
    <rect x="-21" y="-29" width="4.4" height="29" fill="var(--wood)" />
    <rect x="16.6" y="-29" width="4.4" height="29" fill="var(--wood)" />
    <rect x="-24" y="-33.5" width="48" height="5.5" rx="1" fill="var(--wood-d)" />
    {@render Plaque(-38.5, 0.8)}
    <path d="M-4 0L24 3M4 -1L34 1" stroke="var(--steel)" stroke-width=".9" />
    <g transform="translate(27 1)">
      <path d="M-9 -10H9L7 -2H-7Z" fill="var(--wood-d)" stroke="#000" stroke-opacity=".3" stroke-width=".5" />
      <circle cx="-4.5" cy="-10.5" r="2.8" fill="var(--ore)" />
      <circle cx="1" cy="-11.6" r="3.2" fill="var(--crystal)" />
      <circle cx="5.5" cy="-10.4" r="2.3" fill="var(--ore)" />
      <circle cx="-4.5" cy="-1" r="1.7" fill="var(--ink)" />
      <circle cx="4.5" cy="-1" r="1.7" fill="var(--ink)" />
    </g>
    {#each [[-38, 0, 1], [-30, -2, 0.7], [40, -14, 0.8]] as [x, y, s]}
      <g transform="translate({x} {y}) scale({s})">
        <circle class="orb" cy="-6" r="9" fill="url(#orb)" opacity=".5" />
        <path d="M-4 0-2.6-10-1 0ZM-1.2 0 1.2-14 3.2 0ZM2 0 4-8 5.4 0Z" fill="var(--crystal)" stroke="#3b3a7a" stroke-width=".5" />
      </g>
    {/each}
    {#if tier >= 2}
      {@render Lantern(-19, -33)}
      {@render Lantern(19, -33)}
    {/if}
  {:else if id === 'linhDien'}
    {#each bands as b, i}
      <path d={band(b.w, b.y)} fill={i % 2 ? 'var(--field-l)' : 'var(--field)'} stroke="var(--field-d)" stroke-width=".8" />
      {#each sprouts(b.w) as x}
        <path d="M{x} {b.y + 3 - 3.5 * (1 - ((2 * x) / b.w) ** 2)}v-3.4" stroke="var(--field-d)" stroke-width="1" stroke-linecap="round" />
      {/each}
    {/each}
    {#each [[-30, -14], [-8, -22], [18, -12], [2, -30]] as [x, y], i}
      <circle class="herb" cx={x} cy={y} r="1.8" fill="var(--gold-l)" style="animation-delay: {i * 0.8}s" />
    {/each}
    <g transform="translate(46 -24)">
      {@render Wall(0, 22, 11, true)}
      {@render Roof(-11, 32, 11, 'var(--straw)')}
    </g>
    <g transform="translate(-52 -8)">
      <path d="M0 0V-12" stroke="var(--wood-d)" stroke-width="1.2" />
      <rect x="-5.5" y="-20" width="11" height="9" rx="1" fill="var(--plaque)" stroke="var(--gold)" stroke-width=".7" />
      <text class="han" y="-13" text-anchor="middle" font-size="7" fill="var(--gold-l)">{glyph}</text>
    </g>
  {/if}
</g>

<style>
  .win {
    fill: var(--win);
  }
  .glow {
    opacity: var(--glow-o);
  }
  .han {
    font-family: var(--seal);
  }
  .smoke {
    fill: #eef1ee;
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation: smoke 3.6s ease-out infinite;
  }
  @keyframes smoke {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.6);
    }
    20% {
      opacity: 0.75;
    }
    100% {
      opacity: 0;
      transform: translate(4px, -26px) scale(2.2);
    }
  }
  .flag {
    transform-box: fill-box;
    transform-origin: left center;
    animation: flag 2.4s ease-in-out infinite alternate;
  }
  @keyframes flag {
    from {
      transform: skewY(-6deg) scaleX(0.94);
    }
    to {
      transform: skewY(5deg) scaleX(1.04);
    }
  }
  .drill {
    animation: drill 1.8s ease-in-out infinite;
  }
  @keyframes drill {
    50% {
      transform: translateY(-1.2px);
    }
  }
  .sword {
    transform-box: fill-box;
    transform-origin: left bottom;
    animation: sword 1.8s ease-in-out infinite;
  }
  @keyframes sword {
    50% {
      transform: rotate(-40deg);
    }
  }
  .beam,
  .orb,
  .fire {
    animation: breathe 3s ease-in-out infinite;
  }
  @keyframes breathe {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }
  .rune {
    animation: rune 4s ease-in-out infinite;
  }
  @keyframes rune {
    0%,
    100% {
      stroke-opacity: 0.4;
    }
    50% {
      stroke-opacity: 1;
    }
  }
  .herb {
    animation: twinkle 2.4s ease-in-out infinite;
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
  }
</style>
