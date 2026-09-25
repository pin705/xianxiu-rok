<script lang="ts">
  // Thế lực (Power details của RoK): chạm chip thế lực trên HUD → thế lực chia theo nguồn, mỗi dòng một vạch tỉ lệ và nút
  // "Tăng" tới đúng chỗ nâng (công trình · Diễn võ trường · Tàng Kinh Các · Luyện Khí Phòng · Môn hạ)
  import { powerParts, type BuildingId, type State } from '@rok/rules'
  import { Button, Meter, Sheet } from './ui'
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
  function go(k: Part, e: MouseEvent) {
    const to = GO[k]
    onclose()
    if (typeof to === 'string') ontab(to, e)
    else onfocus(to[0], to[1])
  }
</script>

<Sheet {open} {onclose} title="{L.power} · {num(Math.round(total))}" sub={L.powerSheet.sub}>
  <ul class="stack">
    {#each Object.keys(parts) as Part[] as k (k)}
      <li class="row">
        <span class="grow stack" style:--gap="3px">
          <span class="row between t-small"
            ><b>{L.powerSheet.parts[k]}</b><span class="t-num">{num(Math.round(parts[k]))}</span></span
          >
          <Meter value={parts[k] / total} tone="gold" size="sm" />
        </span>
        <Button size="sm" variant="ghost" onclick={e => go(k, e)}>{L.powerSheet.go}</Button>
      </li>
    {/each}
  </ul>
</Sheet>
