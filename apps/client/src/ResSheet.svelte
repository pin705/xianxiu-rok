<script lang="ts">
  // Chạm ô tài nguyên trên HUD (như RoK): đang có / sức chứa, sản lượng mỗi giờ, bao lâu nữa đầy, công trình làm ra nó,
  // phần trăm tăng sản lượng, phần kho không bị cướp — rồi lối thêm: mở nang trong túi đồ, đổi ở Thương hội, nâng kho.
  // Bố cục: vật chứa vẽ tay (bát linh thạch, giỏ linh thảo, xe quặng) là tâm điểm, số liệu là các thẻ giấy ghim trên bảng gỗ.
  import {
    BAG,
    BAG_IDS,
    BUILDINGS,
    IDS,
    bonus,
    protectOf,
    rate,
    storage,
    type BagId,
    type BuildingId,
    type Res,
  } from '@rok/rules'
  import { Art, Board, Button, Meter, Note, Sheet } from './ui'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'
  import { L, clock, num, type PanelTab } from './lib'
  import { useGame } from './game'

  let {
    res,
    onclose,
    onfocus,
  }: { res: Res | null; onclose: () => void; onfocus: (id: BuildingId, view?: PanelTab) => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  const cap = $derived(storage(game))
  const have = $derived(res ? game.res[res] : 0)
  const perHour = $derived(res ? rate(game, res) : 0)
  const full = $derived(have >= cap)
  const toFull = $derived(perHour > 0 && !full ? ((cap - have) / perHour) * 3_600_000 : 0)
  const maker = $derived(res ? IDS.find(id => BUILDINGS[id].makes === res) : undefined)
  const boost = $derived(res ? bonus(game, 'prod') + bonus(game, `prod.${res}`) : 0)
  const packs = $derived(
    res ? BAG_IDS.filter(id => BAG[id].use === 'res' && (BAG[id] as { res: Res }).res === res && game.items[id]) : [],
  )
  // thẻ số liệu trên bảng gỗ (thẻ nào không có thì bỏ)
  const facts = $derived(
    [
      { label: L.panel.output, value: `+${num(perHour)}${L.panel.perHour}` },
      (toFull || full) && { label: L.resInfo.toFull, value: full ? L.full : clock(toFull), bad: full },
      maker && { label: L.resInfo.maker, value: `${L.b[maker].name} · ${L.level(game.levels[maker])}` },
      boost && { label: L.resInfo.boost, value: `+${Math.round(boost * 100)}%` },
      { label: L.resInfo.safe, value: num(protectOf(game)) },
    ].filter(f => !!f) as { label: string; value: string; bad?: boolean }[],
  )
  const go = (id: BuildingId, view: PanelTab) => {
    onclose()
    onfocus(id, view)
  }
  const use = (id: BagId, n: number) => act({ type: 'use', item: id, n }, 'reward')
</script>

<Sheet open={!!res} {onclose} center title={res ? L.res[res] : ''}>
  {#if res}
    <!-- vật chứa là tâm điểm: số đang có to, sức chứa, vạch kho; đầy thì dấu son "Đầy" -->
    <header class="split mb-3" style:--gap="12px">
      <Art art="res-{res}" icon={res} size={96} lift />
      <div class="stack" style:--gap="4px">
        <p class="row between" style:--gap="6px">
          <span class="row" style:--gap="6px"
            ><b class="t-num t-title">{num(have)}</b><span class="t-soft t-num">/ {num(cap)}</span></span
          >
          {#if full}<span class="stamp">{L.full}</span>{/if}
        </p>
        <Meter value={have / cap} tone={full ? 'bad' : 'spirit'} size="md" />
      </div>
    </header>

    <!-- bảng gỗ số liệu: mỗi chỉ số một thẻ giấy ghim son -->
    <Board min={120}>
      {#each facts as f, i (f.label)}
        <Note tilt={i % 2 ? 0.5 : -0.6}>
          <small class="t-tiny t-soft">{f.label}</small>
          <b class="t-body t-num" class:t-bad={f.bad}>{f.value}</b>
        </Note>
      {/each}
    </Board>

    {#if packs.length}
      <p class="t-small t-strong mt-3">{L.resInfo.packs}</p>
      <ul class="ledger" style:--gap="6px">
        {#each packs as id (id)}
          {@const n = game.items[id] ?? 0}
          <li>
            <ItemCell {id} {n} />
            <b class="grow t-small">{itemName(id)}</b>
            {#if n > 1}<Button size="sm" variant="ghost" onclick={() => use(id, n)}>{L.bag.useAll(n)}</Button>{/if}
            <Button size="sm" variant="gold" onclick={() => use(id, 1)}>{L.bag.use}</Button>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="row wrap mt-3" style:--gap="6px">
      {#if game.levels.tangBaoCac > 0}
        <Button variant="ghost" size="sm" onclick={() => go('tangBaoCac', 'trade')}>{L.resInfo.trade}</Button>
      {/if}
      {#if maker}
        <Button variant="ghost" size="sm" onclick={() => go(maker!, 'upgrade')}
          >{L.resInfo.upgrade(L.b[maker].name)}</Button
        >
      {/if}
      {#if full}
        <Button variant="gold" size="sm" onclick={() => go('tangBaoCac', 'upgrade')}
          >{L.resInfo.upgrade(L.b.tangBaoCac.name)}</Button
        >
      {/if}
    </div>
  {/if}
</Sheet>
