<script lang="ts">
  // Tranh Đoạt Linh Châu (Ark of Osiris giản lược): ghi danh; trong trận — sơ đồ 5 ô (phe giữ, số đội hai bên, Linh Châu), điểm hai
  // minh, đồng hồ hiệp, đội của mình và lệnh đứng (chạm ô rồi "Tới đây"), nhật ký hiệp; sau trận — kết quả
  import { ARK_ROUND, ARK_ROUNDS } from '@rok/rules'
  import { arkAt, type ArkRow, type WorldAction } from '@rok/rules/world'
  import { weekOf } from '@rok/rules'
  import { Button, Section, Tag } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'

  let {
    row,
    me,
    aid,
    officer,
    go,
  }: {
    row: ArkRow | undefined
    me: number
    aid: number // tiên minh của mình (bên nào trên chiến trường)
    officer: boolean
    go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean>
  } = $props()
  const g = useGame()
  const f = $derived(row?.live ?? null)
  const mine = $derived(f?.units.find(u => u.pid === me))
  const side = $derived(f?.b === aid ? 1 : 0)
  // sơ đồ: Linh Đài hai đầu, hai Tiểu Trận trên / dưới, Trung Điện giữa — minh mình luôn bên trái
  const POS = [
    [40, 100],
    [150, 40],
    [150, 100],
    [150, 160],
    [260, 100],
  ]
  const at = (node: number) => (side === 1 ? POS[4 - node] : POS[node])
  const EDGES = [
    [0, 1],
    [0, 3],
    [1, 2],
    [2, 3],
    [1, 4],
    [3, 4],
  ]
  let pick = $state<number | null>(null)
  const start = $derived(arkAt(weekOf(g.now)))
  const next = $derived(f ? start + (f.round + 1) * ARK_ROUND - g.now : 0)
  const count = (node: number, sd: 0 | 1) => f?.units.filter(u => u.at === node && u.side === sd).length ?? 0
  const tone = (node: number) => (f?.own[node] === null ? 'free' : f?.own[node] === side ? 'ours' : 'theirs')
  const tag = (sd: 0 | 1) => (f ? (sd === 0 ? f.an : f.bn) : '')
  // một dòng nhật ký hiệp
  const logText = (e: NonNullable<typeof f>['log'][number]) => {
    const [, k, sd, node, pts] = e
    const who = `[${tag(sd)}]`
    const where = L.ark.nodes[node]
    if (k === 'take') return L.ark.log.take(who, where, pts ?? 0)
    if (k === 'win') return L.ark.log.win(who, where)
    if (k === 'charge') return L.ark.log.charge(who, where, pts ?? 0)
    return k === 'drop' ? L.ark.log.drop(who, where) : L.ark.log.orb()
  }
</script>

<Section title={L.ark.title}>
  <p class="t-small t-soft">{L.ark.hint}</p>
  {#if f}
    <p class="row between t-small">
      <b class="t-num">[{tag(side as 0 | 1)}] {f.pts[side]} – {f.pts[side ? 0 : 1]} [{tag(side ? 0 : 1)}]</b>
      <span class="t-soft"
        >{f.round < ARK_ROUNDS ? L.ark.round(f.round + 1, ARK_ROUNDS, clock(Math.max(0, next))) : L.ark.ended}</span
      >
    </p>
    <svg viewBox="0 0 300 200" class="field" role="img" aria-label={L.ark.title}>
      {#each EDGES as [x, y] (`${x}-${y}`)}
        <line x1={at(x)[0]} y1={at(x)[1]} x2={at(y)[0]} y2={at(y)[1]} class="road" />
      {/each}
      {#each POS as _, node (node)}
        {@const [cx, cy] = at(node)}
        <g
          class="node {tone(node)}"
          class:picked={pick === node}
          role="button"
          tabindex="0"
          aria-label={L.ark.nodes[node]}
          onclick={() => (pick = node)}
          onkeydown={e => e.key === 'Enter' && (pick = node)}
        >
          <circle {cx} {cy} r={node === 2 ? 24 : 20} />
          <text x={cx} y={cy + 4} class="n">{count(node, side as 0 | 1)}·{count(node, side ? 0 : 1)}</text>
          <text x={cx} y={cy + (node === 1 ? -28 : 36)} class="lbl">{L.ark.nodes[node]}</text>
          {#if f.orb && f.orb.at === node}<circle cx={cx + 16} cy={cy - 16} r="7" class="orb" />{/if}
        </g>
      {/each}
    </svg>
    {#if mine}
      <p class="t-small">
        {mine.rest && mine.rest > f.round ? L.ark.resting : L.ark.me(L.ark.nodes[mine.at], L.ark.nodes[mine.to])}
        {#if f.orb?.by === me}<Tag tone="gold">{L.ark.carrying}</Tag>{/if}
      </p>
    {/if}
    {#if pick !== null && mine && f.round < ARK_ROUNDS}
      <div class="row wrap" style:--gap="6px">
        <b class="t-small">{L.ark.nodes[pick]}</b>
        <Button size="sm" variant="gold" onclick={() => go({ type: 'arkOrder', to: pick! })}>{L.ark.go}</Button>
        {#if officer}<Button size="sm" variant="ghost" onclick={() => go({ type: 'arkOrder', to: pick!, all: true })}
            >{L.ark.goAll}</Button
          >{/if}
      </div>
    {/if}
    {#if f.log.length}
      <ol class="stack log" style:--gap="2px">
        {#each [...f.log].reverse().slice(0, 6) as e, i (i)}
          <li class="t-tiny"><span class="t-soft">{e[0]}·</span> {logText(e)}</li>
        {/each}
      </ol>
    {/if}
  {:else}
    <p class="row between t-small">
      <b>{row?.signed ? L.ark.signed : L.ark.when(clock(Math.max(0, start - g.now)))}</b>
    </p>
    {#if officer}
      <Button
        size="sm"
        variant={row?.signed ? 'quiet' : 'gold'}
        icon="flag"
        onclick={() => go({ type: row?.signed ? 'arkUnsign' : 'arkSign' }, 'reward')}
        >{row?.signed ? L.ark.unsign : L.ark.sign}</Button
      >
    {/if}
    {#each row?.last ?? [] as r (r.a)}
      <small class="t-small t-strong">{L.ark.last(r.an, r.bn, r.wa, r.wb)}</small>
    {/each}
  {/if}
  {#if row?.league?.length}
    <!-- Cửu Thiên Luận Đạo Hội: bảng giải cả mùa, minh mình tô vàng -->
    <small class="t-tiny t-soft mt-2">{L.ark.league}</small>
    <ol class="stack league" style:--gap="1px">
      {#each row.league as r, k (r.id)}
        <li class="row between t-small" class:t-gold={r.id === aid}>
          <span>{k + 1}. [{r.tag}]</span><span class="t-num">{L.ark.leagueRow(r.w, r.l, r.pts)}</span>
        </li>
      {/each}
    </ol>
  {/if}
</Section>

<style>
  .field {
    width: 100%;
    max-width: 420px;
    display: block;
    margin: 4px auto;
  }
  .road {
    stroke: rgb(var(--shade) / 0.35);
    stroke-width: 3;
    stroke-dasharray: 5 4;
  }
  .node {
    cursor: pointer;
  }
  .node circle:first-child {
    fill: #efe4c8;
    stroke: #6b5a3a;
    stroke-width: 2;
  }
  .node.ours circle:first-child {
    fill: #cfe3d4;
    stroke: #2f6f55;
  }
  .node.theirs circle:first-child {
    fill: #f0cfc6;
    stroke: #a8402e;
  }
  .node.picked circle:first-child {
    stroke-width: 4;
  }
  .n {
    font-size: 12px;
    font-weight: 800;
    text-anchor: middle;
    fill: #2a241a;
  }
  .lbl {
    font-size: 10px;
    text-anchor: middle;
    fill: #5a4a30;
  }
  .orb {
    fill: #e8c24a;
    stroke: #8a6a14;
    stroke-width: 1.5;
  }
  .league {
    list-style: none;
    padding: 0;
    margin: 2px 0 0;
  }
  .log {
    list-style: none;
    padding: 0;
    margin: 4px 0 0;
  }
</style>
