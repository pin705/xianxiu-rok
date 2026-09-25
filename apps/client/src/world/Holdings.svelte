<script lang="ts">
  // Sơn Hà Xã Tắc Đồ (Kingdom Overview của RoK): mọi linh mạch / trận nhãn / Thiên Môn của giới và phe đang giữ, lọc được
  // "chỉ minh mình" — bấm Tới để bay khung nhìn tới đó (và mở bảng của điểm).
  import { cellOf, clear, type Fog } from '@rok/rules'
  import { veinBuffs, type Atlas, type MapSnap } from '@rok/rules/world'
  import { Badge, Button, Card, Sheet } from '../ui'
  import { L, spotName } from '../lib'

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
  <div class="row wrap" style:--gap="6px">
    {#each KINDS as k (k)}
      <span class="tab"
        ><Button size="sm" variant={kind === k ? 'gold' : 'ghost'} onclick={() => (kind = k)}>{spotName(k)}</Button
        ><Badge n={held(k)} /></span
      >
    {/each}
    <Button size="sm" variant={only ? 'gold' : 'quiet'} onclick={() => (only = !only)}>{L.world.mineOnly}</Button>
  </div>
  <ul class="stack rows">
    {#each rows as p (p.i)}
      {@const sp = spots.get(p.i)}
      <li>
        <Card tone={sp?.side === side ? 'glow' : undefined}>
          <div class="row">
            <span class="grow stack" style:--gap="1px">
              <b class="t-small"
                >{spotName(p.kind)} · {L.lv(p.lv)}
                <span class="t-soft t-num">({p.x},{p.y})</span>{#if fog && !clear(fog, cellOf(p).cx, cellOf(p).cy, now)}
                  <span class="t-tiny t-soft">· {L.world.inFog}</span>{/if}</b
              >
              <small class="t-tiny" class:t-gold={sp?.side === side} class:t-soft={!sp?.own}
                >{shut(p) ? L.world.shut : (sp?.own ?? L.world.nobody)}{#if sp?.n}
                  · {L.world.troopsAt(sp.n)}{/if}</small
              >
              {#if p.kind === 'vein'}<small class="t-tiny t-good"
                  >{veinBuffs(p)
                    .map(b => L.bonus(b.key, b.v))
                    .join(' · ')}</small
                >{/if}
            </span>
            <Button size="sm" variant="ghost" icon="arrow" onclick={() => onfly(p.x, p.y)}>{L.world.flyTo}</Button>
          </div>
        </Card>
      </li>
    {/each}
  </ul>
</Sheet>

<style>
  .tab {
    position: relative;
  }
  .rows {
    --gap: var(--sp-2);
    margin-top: var(--sp-2);
  }
</style>
