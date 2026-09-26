<script lang="ts">
  // Sơ đồ chiến trường: các ô tròn (phe giữ: free · ours · theirs) nối đường đứt, số trong ô, tên ô trên/dưới, vòng vàng
  // (ô được nối), hạt châu góc ô; chạm ô để chọn. Toạ độ theo khung w × h (svg co theo bề ngang, tối đa 420px).
  type Spot = {
    x: number
    y: number
    r: number
    tone: 'free' | 'ours' | 'theirs'
    label: string
    text: string
    ring?: boolean
    orb?: boolean
  }
  let {
    nodes,
    edges,
    picked = null,
    label,
    w = 340,
    h = 220,
    onpick,
  }: {
    nodes: Spot[]
    edges: [number, number][]
    picked?: number | null
    label: string
    w?: number
    h?: number
    onpick: (i: number) => void
  } = $props()
</script>

<svg viewBox="0 0 {w} {h}" class="map" role="img" aria-label={label}>
  {#each edges as [a, b] (`${a}-${b}`)}
    <line x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} class="road" />
  {/each}
  {#each nodes as n, i (i)}
    <g
      class="node {n.tone}"
      class:picked={picked === i}
      role="button"
      tabindex="0"
      aria-label={n.label}
      onclick={() => onpick(i)}
      onkeydown={e => e.key === 'Enter' && onpick(i)}
    >
      <circle cx={n.x} cy={n.y} r={n.r} class="disc" />
      {#if n.ring}<circle cx={n.x} cy={n.y} r={n.r + 4} class="ring" />{/if}
      <text x={n.x} y={n.y + 4} class="n">{n.text}</text>
      <text x={n.x} y={n.y < h / 2 ? n.y - 25 : n.y + n.r + 12} class="lbl">{n.label}</text>
      {#if n.orb}<circle cx={n.x + 16} cy={n.y - 16} r="7" class="orb" />{/if}
    </g>
  {/each}
</svg>

<style>
  .map {
    display: block;
    width: 100%;
    max-width: 420px;
    margin: 4px auto;
  }
  .road {
    stroke: rgb(var(--shade) / 0.35);
    stroke-width: 3;
    stroke-dasharray: 5 4;
  }
  .ring {
    fill: none;
    stroke: var(--gilt);
    stroke-width: 2;
    stroke-dasharray: 3 3;
  }
  .node {
    cursor: pointer;
  }
  .disc {
    fill: color-mix(in srgb, var(--gilt) 28%, var(--paper));
    stroke: var(--wood);
    stroke-width: 2;
  }
  .ours .disc {
    fill: color-mix(in srgb, var(--malachite) 22%, var(--paper));
    stroke: var(--malachite);
  }
  .theirs .disc {
    fill: color-mix(in srgb, var(--cinnabar) 22%, var(--paper));
    stroke: var(--cinnabar);
  }
  .picked .disc {
    stroke-width: 4;
  }
  .n {
    font-size: 12px;
    font-weight: 800;
    text-anchor: middle;
    fill: var(--text);
  }
  .lbl {
    font-size: 9px;
    text-anchor: middle;
    fill: var(--text-soft);
    /* viền màu giấy: chữ đọc được cả khi nằm trên đường */
    paint-order: stroke;
    stroke: var(--paper);
    stroke-width: 3px;
    stroke-linejoin: round;
  }
  .orb {
    fill: var(--gold-l);
    stroke: var(--gold-d);
    stroke-width: 1.5;
  }
</style>
