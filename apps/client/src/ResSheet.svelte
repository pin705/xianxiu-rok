<script lang="ts">
  // Chạm ô tài nguyên trên HUD (như RoK): đang có / sức chứa, sản lượng mỗi giờ, bao lâu nữa đầy, công trình làm ra nó,
  // phần trăm tăng sản lượng, phần kho không bị cướp — rồi lối thêm: mở nang trong túi đồ, đổi ở Thương hội, nâng kho.
  import {
    BAG,
    BAG_IDS,
    BUILDINGS,
    IDS,
    PROTECT,
    bagFamily,
    bonus,
    rate,
    storage,
    type BuildingId,
    type Res,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Button, Meter, Sheet, Stat } from './ui'
  import { denom } from './bag'
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
  const go = (id: BuildingId, view: PanelTab) => {
    onclose()
    onfocus(id, view)
  }
</script>

<Sheet open={!!res} {onclose} center title={res ? L.res[res] : ''}>
  {#if res}
    <div class="stack">
      <p class="row between">
        <span class="row"><Icon name={res} size={30} /><b class="t-num big">{num(have)}</b></span>
        <span class="t-soft t-num">/ {num(cap)}</span>
      </p>
      <Meter value={have / cap} tone={full ? 'bad' : 'spirit'} size="md" />
      <div>
        <Stat label={L.panel.output}>+{num(perHour)}{L.panel.perHour}</Stat>
        {#if toFull}<Stat label={L.resInfo.toFull}>{clock(toFull)}</Stat>{/if}
        {#if full}<Stat label={L.resInfo.toFull}><b class="t-bad">{L.full}</b></Stat>{/if}
        {#if maker}<Stat label={L.resInfo.maker}>{L.b[maker].name} · {L.level(game.levels[maker])}</Stat>{/if}
        {#if boost}<Stat label={L.resInfo.boost}>+{Math.round(boost * 100)}%</Stat>{/if}
        <Stat label={L.resInfo.safe}>{num(Math.floor(cap * PROTECT))}</Stat>
      </div>
      {#if packs.length}
        <p class="t-small t-strong">{L.resInfo.packs}</p>
        <ul class="stack rows">
          {#each packs as id (id)}
            {@const n = game.items[id] ?? 0}
            <li class="row">
              <Icon name={bagFamily(id)} size={32} />
              <span class="grow"><b>{L.bag.family[bagFamily(id)].name} · {denom(id)}</b> <small>×{n}</small></span>
              {#if n > 1}<Button size="sm" variant="ghost" onclick={() => act({ type: 'use', item: id, n }, 'reward')}
                  >{L.bag.useAll(n)}</Button
                >{/if}
              <Button size="sm" onclick={() => act({ type: 'use', item: id, n: 1 }, 'reward')}>{L.bag.use}</Button>
            </li>
          {/each}
        </ul>
      {/if}
      <div class="row wrap">
        {#if game.levels.tangBaoCac > 0}
          <Button variant="ghost" size="sm" onclick={() => go('tangBaoCac', 'trade')}>{L.resInfo.trade}</Button>
        {/if}
        {#if maker}
          <Button variant="ghost" size="sm" onclick={() => go(maker!, 'upgrade')}
            >{L.resInfo.upgrade(L.b[maker].name)}</Button
          >
        {/if}
        {#if full}
          <Button size="sm" onclick={() => go('tangBaoCac', 'upgrade')}>{L.resInfo.upgrade(L.b.tangBaoCac.name)}</Button
          >
        {/if}
      </div>
    </div>
  {/if}
</Sheet>

<style>
  .big {
    font-size: var(--fs-6);
  }
  .rows {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .wrap {
    flex-wrap: wrap;
  }
</style>
