<script lang="ts">
  // Sơn Hà Xã Tắc Đồ (Kingdom Overview của RoK): mọi linh mạch / trận nhãn / Thiên Môn của giới và phe đang giữ, lọc được
  // "chỉ minh mình" — bấm Tới để bay khung nhìn tới đó (và mở bảng của điểm).
  import { cellOf, clear, type Fog } from '@rok/rules'
  import { veinBuffs, type Atlas, type MapSnap } from '@rok/rules/world'
  import { Button, Medal, Sheet, Tabs, Toggle } from '../ui'
  import { EMBLEM, L, pointName, spotName } from '../lib'

  let {
    open,
    atlas,
    snap,
    side,
    phase,
    fog = null,
    now = 0,
    onclose,
    onfly,
  }: {
    open: boolean
    atlas: Atlas
    snap: MapSnap | null
    side: number // phe của mình (tiên minh > 0, một mình: −mã người chơi)
    phase: number
    fog?: Fog | null // mê vụ của mình: điểm chưa khai ghi "trong mê vụ" (bay tới thì thả linh điểu)
    now?: number
    onclose: () => void
    onfly: (x: number, y: number) => void
  } = $props()

  const KINDS = ['vein', 'gate', 'heaven'] as const
  let kind = $state<(typeof KINDS)[number]>('vein')
  let only = $state(false)
  const spots = $derived(new Map((snap?.spots ?? []).map(s => [s.i, s])))
  const held = (k: string) => atlas.points.filter(p => p.kind === k && spots.get(p.i)?.side === side).length
  const rows = $derived(
    atlas.points
      .filter(p => p.kind === kind && (!only || spots.get(p.i)?.side === side))
      .sort((a, b) => b.lv - a.lv || a.i - b.i),
  )
  // cổng / Thiên Môn mở theo pha mùa (linh mạch luôn mở)
  const shut = (p: { kind: string; lv: number }) =>
    (p.kind === 'gate' && p.lv > phase) || (p.kind === 'heaven' && phase < 3)
</script>

<Sheet {open} {onclose} title={L.world.overview}>
  <p class="t-small t-soft">{L.world.overviewHint}</p>
  <!-- thẻ kẹp sách theo loại điểm (số đang giữ trong ngoặc), công tắc chỉ minh mình -->
  <Tabs
    items={KINDS.map(k => ({ id: k, label: held(k) ? `${spotName(k)} (${held(k)})` : spotName(k) }))}
    value={kind}
    onchange={k => (kind = k)}
  />
  <Toggle checked={only} onchange={v => (only = v)}>{L.world.mineOnly}</Toggle>
  <!-- sổ địa bạ: mỗi điểm một dòng kẻ mực đứt — huy hiệu loại, tên + cấp + toạ độ, phe giữ, tăng ích; điểm minh mình tô son -->
  <ul class="ledger mt-2">
    {#each rows as p (p.i)}
      {@const sp = spots.get(p.i)}
      <li class:on={sp?.side === side}>
        <Medal emblem={EMBLEM.spot[p.kind]} tone="spot" size={36} pips={p.lv} dim={shut(p)} />
        <span class="grow stack" style:--gap="1px">
          <b class="t-small"
            >{pointName(p)} · {L.lv(p.lv)}
            <span class="t-soft t-num">({p.x},{p.y})</span>{#if fog && !clear(fog, cellOf(p).cx, cellOf(p).cy, now)}
              <span class="t-tiny t-soft">· {L.world.inFog}</span>{/if}</b
          >
          <small class="t-tiny" class:t-gold={sp?.side === side} class:t-soft={!sp?.own}
            >{shut(p) ? L.world.shut : (sp?.own ?? L.world.nobody)}{#if sp?.n}
              · {L.world.troopsAt(sp.n)}{/if}{#if sp?.ctl && sp.ctlSide !== sp.side}
              · {L.world.ctlBy} {sp.ctl}{/if}</small
          >
          {#if p.kind === 'vein'}<small class="t-tiny t-good"
              >{veinBuffs(p)
                .map(b => L.bonus(b.key, b.v))
                .join(' · ')}</small
            >{/if}
        </span>
        <Button size="sm" variant="ghost" icon="arrow" onclick={() => onfly(p.x, p.y)}>{L.world.flyTo}</Button>
      </li>
    {/each}
  </ul>
</Sheet>
