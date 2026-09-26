<script lang="ts">
  // Thế lực (Power details của RoK): chạm chip thế lực trên HUD → thế lực chia theo nguồn, mỗi dòng một vạch tỉ lệ và nút
  // "Tăng" tới đúng chỗ nâng (công trình · Diễn võ trường · Tàng Kinh Các · Luyện Khí Phòng · Môn hạ).
  // Bố cục: kiếm cắm đá (ui:power) là tâm điểm cạnh tổng thế lực, một dải màu chia phần các nguồn, rồi từng nguồn một dòng.
  import { powerParts, type BuildingId, type State } from '@rok/rules'
  import { Icon, type IconName } from '@rok/art'
  import { Art, Button, Meter, ShareBar, Sheet } from './ui'
  import { L, num, type PanelTab, type Tab } from './lib'

  let {
    open,
    game,
    onclose,
    onfocus,
    ontab,
  }: {
    open: boolean
    game: State
    onclose: () => void
    onfocus: (id: BuildingId, view?: PanelTab) => void
    ontab: (t: Tab, e: MouseEvent) => void
  } = $props()
  const parts = $derived(powerParts(game))
  const total = $derived(Object.values(parts).reduce((a, b) => a + b, 0) || 1)
  type Part = keyof ReturnType<typeof powerParts>
  const GO: Record<Part, [BuildingId, PanelTab?] | Tab> = {
    build: ['chuDien'],
    troops: ['dienVoTruong', 'train'],
    tech: ['tangKinhCac', 'library'],
    gear: ['luyenKhiPhong', 'forge'],
    elders: 'monHa',
  }
  // mỗi nguồn một màu khoáng: dải chia phần, vạch và chấm màu của dòng cùng một màu
  const TONE: Record<Part, ['gold' | 'bad' | 'azure' | 'good' | 'spirit', string, IconName]> = {
    build: ['gold', 'var(--gold)', 'hammer'],
    troops: ['bad', 'var(--cinnabar)', 'people'],
    tech: ['azure', 'var(--azurite)', 'scroll'],
    gear: ['good', 'var(--malachite)', 'swords'],
    elders: ['spirit', 'var(--spirit)', 'star'],
  }
  function go(k: Part, e: MouseEvent) {
    const to = GO[k]
    onclose()
    if (typeof to === 'string') ontab(to, e)
    else onfocus(to[0], to[1])
  }
</script>

<Sheet {open} {onclose} title="{L.power} · {num(Math.round(total))}" sub={L.powerSheet.sub}>
  <!-- kiếm cắm đá + tổng thế lực; dải màu chia phần năm nguồn -->
  <header class="vista split" style:--gap="14px">
    <Art art="power" icon="power" size={104} lift />
    <div class="stack" style:--gap="8px">
      <b class="t-giant t-num">{num(Math.round(total))}</b>
      <ShareBar parts={(Object.keys(parts) as Part[]).map(k => ({ key: k, n: parts[k], color: TONE[k][1] }))} />
    </div>
  </header>
  <ul class="ledger mt-2" style:--gap="10px">
    {#each Object.keys(parts) as Part[] as k (k)}
      <li>
        <span class="ring-ic" style:--c={TONE[k][1]}><Icon name={TONE[k][2]} size={22} /></span>
        <span class="grow stack" style:--gap="3px">
          <span class="row between t-small"
            ><b>{L.powerSheet.parts[k]}</b><span class="t-num"
              >{num(Math.round(parts[k]))} <small class="t-soft">{Math.round((parts[k] / total) * 100)}%</small></span
            ></span
          >
          <Meter value={parts[k] / total} tone={TONE[k][0]} size="sm" />
        </span>
        <Button size="sm" variant="ghost" onclick={e => go(k, e)}>{L.powerSheet.go}</Button>
      </li>
    {/each}
  </ul>
</Sheet>
