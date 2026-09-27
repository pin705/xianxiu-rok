<script module lang="ts">
  import type { ArkFight } from '@rok/rules/world'
  import { L } from './lib'
  // một dòng nhật ký hiệp của trận f
  export function arkLogText(f: ArkFight, e: ArkFight['log'][number]) {
    const [, k, sd, node, pts] = e
    const who = `[${sd === 0 ? f.an : f.bn}]`
    const where = L.ark.nodes[node]
    if (k === 'take') return L.ark.log.take(who, where, pts ?? 0)
    if (k === 'win') return L.ark.log.win(who, where)
    if (k === 'charge') return L.ark.log.charge(who, where, pts ?? 0)
    return k === 'drop' ? L.ark.log.drop(who, where) : L.ark.log.orb()
  }
</script>

<script lang="ts">
  // Sơ đồ chiến trường Tranh Đoạt Linh Châu (dùng chung: thẻ minh mình và bảng khán giả): 3 cột giữa hai Linh Đài — Tụ Linh Nhãn ở
  // bốn góc, Linh Tháp hai bên, Tiểu Trận trên / dưới, Trung Điện giữa. `side` đứng bên trái (bên B xem thì lật qua tâm: ô x ở chỗ
  // ô 10 − x); mỗi ô ghi số đội hai bên, vòng vàng quanh Tụ Linh Nhãn bên `side` đã nối, Linh Châu đang nằm.
  import { ARK_ADJ, ARK_CENTER, ARK_HOME, ARK_OBELISKS } from '@rok/rules'
  import { NodeMap } from './ui'

  let {
    f,
    side,
    picked = null,
    onpick,
  }: { f: ArkFight; side: 0 | 1; picked?: number | null; onpick?: (node: number) => void } = $props()
  const POS = [
    [24, 110],
    [97, 45],
    [97, 110],
    [97, 175],
    [170, 45],
    [170, 110],
    [170, 175],
    [243, 45],
    [243, 110],
    [243, 175],
    [316, 110],
  ]
  const at = (node: number) => (side === 1 ? POS[POS.length - 1 - node] : POS[node])
  const EDGES = ARK_ADJ.flatMap((ys, x) => ys.filter(y => y > x).map(y => [x, y]))
  const radius = (node: number) => (node === ARK_CENTER ? 24 : node === ARK_HOME[0] || node === ARK_HOME[1] ? 21 : 18)
  const linked = (node: number) =>
    ARK_OBELISKS.includes(node) && f.own[node] === side && ARK_OBELISKS.filter(x => f.own[x] === side).length > 1
  const count = (node: number, sd: 0 | 1) => f.units.filter(u => u.at === node && u.side === sd).length
  const tone = (node: number) => (f.own[node] === null ? 'free' : f.own[node] === side ? 'ours' : 'theirs')
  const other = $derived<0 | 1>(side ? 0 : 1)
</script>

<NodeMap
  label={L.ark.title}
  nodes={POS.map((_, node) => ({
    x: at(node)[0],
    y: at(node)[1],
    r: radius(node),
    tone: tone(node),
    label: L.ark.nodes[node],
    text: `${count(node, side)}·${count(node, other)}`,
    ring: linked(node),
    orb: f.orb?.at === node,
  }))}
  edges={EDGES as [number, number][]}
  {picked}
  onpick={node => onpick?.(node)}
/>
