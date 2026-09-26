<script lang="ts">
  // Chạm ô tài nguyên trên HUD (như RoK): đang có / sức chứa, sản lượng mỗi giờ, bao lâu nữa đầy, công trình làm ra nó,
  // phần trăm tăng sản lượng, phần kho không bị cướp — rồi lối thêm: mở nang trong túi đồ, đổi ở Thương hội, nâng kho.
  // Bố cục: vật chứa vẽ tay (bát linh thạch, giỏ linh thảo, xe quặng) là tâm điểm, số liệu là các thẻ giấy ghim trên bảng gỗ.
  import {
    BAG,
    BAG_IDS,
    BUILDINGS,
    IDS,
    PROTECT,
    bonus,
    rate,
    storage,
    type BagId,
    type BuildingId,
    type Res,
  } from '@rok/rules'
  import { Icon, artOf } from '@rok/art'
  import { Button, Meter, Sheet } from './ui'
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
  const vessel = $derived(res && artOf(`ui:res-${res}`)?.src)
  const go = (id: BuildingId, view: PanelTab) => {
    onclose()
    onfocus(id, view)
  }
  const use = (id: BagId, n: number) => act({ type: 'use', item: id, n }, 'reward')
</script>

<Sheet open={!!res} {onclose} center title={res ? L.res[res] : ''}>
  {#if res}
    <!-- vật chứa là tâm điểm: số đang có to, sức chứa, vạch kho; đầy thì dấu son "Đầy" -->
    <header class="vessel">
      <span class="pic"
        >{#if vessel}<img src={vessel} alt="" draggable="false" />{:else}<Icon name={res} size={56} />{/if}</span
      >
      <div class="stack" style:--gap="4px">
        <p class="row" style:--gap="6px">
          <b class="t-num big">{num(have)}</b><span class="t-soft t-num">/ {num(cap)}</span>
          {#if full}<span class="stamp">{L.full}</span>{/if}
        </p>
        <Meter value={have / cap} tone={full ? 'bad' : 'spirit'} size="md" />
      </div>
    </header>

    <!-- bảng gỗ số liệu: mỗi chỉ số một thẻ giấy ghim son -->
    <dl class="board">
      <div>
        <dt>{L.panel.output}</dt>
        <dd>+{num(perHour)}{L.panel.perHour}</dd>
      </div>
      {#if toFull || full}
        <div>
          <dt>{L.resInfo.toFull}</dt>
          <dd class:t-bad={full}>{full ? L.full : clock(toFull)}</dd>
        </div>
      {/if}
      {#if maker}
        <div>
          <dt>{L.resInfo.maker}</dt>
          <dd>{L.b[maker].name} · {L.level(game.levels[maker])}</dd>
        </div>
      {/if}
      {#if boost}
        <div>
          <dt>{L.resInfo.boost}</dt>
          <dd>+{Math.round(boost * 100)}%</dd>
        </div>
      {/if}
      <div>
        <dt>{L.resInfo.safe}</dt>
        <dd>{num(Math.floor(cap * PROTECT))}</dd>
      </div>
    </dl>

    {#if packs.length}
      <p class="t-small t-strong mt-3">{L.resInfo.packs}</p>
      <ul class="packs">
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

<style>
  .vessel {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    padding: 4px 0 10px;
  }
  .pic {
    display: grid;
    place-items: center;
    width: 96px;
    height: 96px;
  }
  .pic img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 5px rgb(0 0 0 / 0.25));
  }
  .big {
    font-size: var(--fs-6);
    line-height: 1.1;
  }
  .vessel .stamp {
    margin-left: auto;
  }
  /* bảng gỗ (như bảng bùa Nhật Khóa): thẻ giấy ghim, hai cột */
  .board {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 8px;
    margin: 0;
    padding: 14px 10px 10px;
    background:
      repeating-linear-gradient(90deg, rgb(0 0 0 / 0.05) 0 2px, transparent 2px 38px), linear-gradient(#9a6a42, #7a5030);
    border: 5px solid #5c3a1f;
    border-radius: 6px;
    box-shadow: inset 0 2px 6px rgb(0 0 0 / 0.3);
  }
  .board > div {
    position: relative;
    display: grid;
    align-content: start;
    gap: 1px;
    padding: 8px 8px 7px;
    background: #fbf9f3;
    border-radius: 2px;
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.3);
  }
  .board > div:nth-child(odd) {
    rotate: -0.6deg;
  }
  .board > div:nth-child(even) {
    rotate: 0.5deg;
  }
  .board > div::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    width: 9px;
    height: 9px;
    translate: -50% 0;
    background: radial-gradient(circle at 35% 35%, #f5a08c, #b3372a 55%, #6a1a12);
    border-radius: 50%;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
  }
  dt {
    font-size: var(--fs-1);
    line-height: 1.2;
    color: var(--text-soft);
  }
  dd {
    margin: 0;
    font-size: var(--fs-3);
    font-weight: 800;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }
  /* nang trong túi: ô đồ + tên + nút, dòng kẻ mực đứt */
  .packs {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .packs li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    border-bottom: 1px dashed var(--paper3);
  }
</style>
