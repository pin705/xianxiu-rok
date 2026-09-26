<script lang="ts">
  // Thế lực (Power details của RoK): chạm chip thế lực trên HUD → thế lực chia theo nguồn, mỗi dòng một vạch tỉ lệ và nút
  // "Tăng" tới đúng chỗ nâng (công trình · Diễn võ trường · Tàng Kinh Các · Luyện Khí Phòng · Môn hạ).
  // Bố cục: kiếm cắm đá (ui:power) là tâm điểm cạnh tổng thế lực, một dải màu chia phần các nguồn, rồi từng nguồn một dòng.
  import { powerParts, type BuildingId, type State } from '@rok/rules'
  import { Icon, artOf, type IconName } from '@rok/art'
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
  // mỗi nguồn một màu khoáng: dải chia phần, vạch và chấm màu của dòng cùng một màu
  const TONE: Record<Part, ['gold' | 'bad' | 'azure' | 'good' | 'spirit', string, IconName]> = {
    build: ['gold', 'var(--gold)', 'hammer'],
    troops: ['bad', 'var(--cinnabar)', 'people'],
    tech: ['azure', 'var(--azurite)', 'scroll'],
    gear: ['good', 'var(--malachite)', 'swords'],
    elders: ['spirit', 'var(--spirit)', 'star'],
  }
  const power = artOf('ui:power')?.src
  function go(k: Part, e: MouseEvent) {
    const to = GO[k]
    onclose()
    if (typeof to === 'string') ontab(to, e)
    else onfocus(to[0], to[1])
  }
</script>

<Sheet {open} {onclose} title="{L.power} · {num(Math.round(total))}" sub={L.powerSheet.sub}>
  <!-- kiếm cắm đá + tổng thế lực; dải màu chia phần năm nguồn -->
  <header class="hero">
    <span class="pic"
      >{#if power}<img src={power} alt="" draggable="false" />{:else}<Icon name="power" size={56} />{/if}</span
    >
    <div class="stack" style:--gap="8px">
      <b class="total t-num">{num(Math.round(total))}</b>
      <span class="bar" aria-hidden="true">
        {#each Object.keys(parts) as Part[] as k (k)}
          {#if parts[k] > 0}<i style:flex={parts[k]} style:background={TONE[k][1]}></i>{/if}
        {/each}
      </span>
    </div>
  </header>
  <ul class="parts">
    {#each Object.keys(parts) as Part[] as k (k)}
      <li>
        <span class="ic" style:color={TONE[k][1]}><Icon name={TONE[k][2]} size={22} /></span>
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

<style>
  .hero {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    padding: 8px 16px 12px 8px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .pic {
    display: grid;
    place-items: center;
    width: 104px;
    height: 104px;
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 6px rgb(var(--shade) / 0.25));
  }
  .total {
    font-size: var(--fs-7);
    line-height: 1;
  }
  /* dải chia phần: mỗi nguồn một đoạn màu khoáng, viền mực mảnh */
  .bar {
    display: flex;
    gap: 2px;
    height: 12px;
    padding: 2px;
    background: var(--silk);
    border: 1px solid var(--ink3);
    border-radius: 3px;
  }
  .bar i {
    min-width: 3px;
    border-radius: 1px;
  }
  .parts {
    display: grid;
    margin: var(--sp-2) 0 0;
    padding: 0;
    list-style: none;
  }
  .parts li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px dashed var(--paper3);
  }
  .ic {
    display: grid;
    place-items: center;
    flex: none;
    width: 34px;
    height: 34px;
    background: var(--silk);
    border: 1.5px solid currentColor;
    border-radius: 50%;
  }
</style>
