<script lang="ts">
  // Túi đồ (như RoK): tab loại, lưới ô đồ (hình, mệnh giá, số lượng); chạm một ô → chi tiết, chọn số lượng, dùng.
  // Phù tăng tốc chọn việc đang chờ; kinh thư chọn trưởng lão; còn lại dùng ngay.
  import {
    BAG,
    ELDER_IDS,
    ELDER_MAX,
    bagFamily,
    elderLevel,
    jobOf,
    useError,
    type BagId,
    type JobKind,
  } from '@rok/rules'
  import { Portrait } from '@rok/art'
  import { Button, Card, Stepper, Tabs } from './ui'
  import ItemCell from './ItemCell.svelte'
  import { BAG_TABS, itemName, owned, tabOf, type BagTab } from './bag'
  import { L, LOOK, clock } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  let tab = $state<BagTab>('speed')
  let pick = $state<BagId | null>(null)
  let n = $state(1)
  const list = $derived(owned(game).filter(id => tabOf(id) === tab))
  const have = $derived(pick ? (game.items[pick] ?? 0) : 0)
  const def = $derived(pick ? BAG[pick] : null)
  // chọn ô khác (hoặc dùng hết) thì về 1 cái
  $effect(() => {
    if (!pick || have < 1) {
      pick = null
      n = 1
    } else if (n > have) n = have
  })
  const JOBS: JobKind[] = ['build', 'train', 'study', 'heal', 'forge']
  const jobs = $derived(
    pick && def?.use === 'speed' ? JOBS.filter(k => !useError(game, { type: 'use', item: pick!, n, job: k })) : [],
  )
  const elders = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined && elderLevel(game.elders[e]) < ELDER_MAX))
  const choose = (id: BagId) => {
    pick = id
    n = 1
  }
  const switchTab = (t: BagTab) => {
    tab = t
    pick = null
  }
  // phút tăng tốc đang giữ: tổng, và phần chỉ dùng được cho một loại việc (Lỗ Ban, Luyện Binh…)
  const sped = $derived.by(() => {
    const by: Partial<Record<JobKind | 'any', number>> = {}
    for (const id of owned(game)) {
      const d = BAG[id]
      if (d.use === 'speed') by[d.job ?? 'any'] = (by[d.job ?? 'any'] ?? 0) + d.min * 60_000 * (game.items[id] ?? 0)
    }
    const each = JOBS.filter(k => by[k]).map(k => [k, by[k]!] as [JobKind, number])
    return { all: (by.any ?? 0) + each.reduce((a, [, ms]) => a + ms, 0), jobs: each }
  })
  function use(extra: { job?: JobKind; elder?: (typeof ELDER_IDS)[number] } = {}) {
    if (pick) act({ type: 'use', item: pick, n, ...extra }, 'reward')
  }
</script>

<Tabs items={BAG_TABS.map(id => ({ id, label: L.bag.tabs[id] }))} value={tab} onchange={switchTab} />

<!-- tổng thời gian tăng tốc đang giữ (như RoK): phù chung và từng loại việc -->
{#if tab === 'speed' && sped.all}
  <p class="t-small sped">
    <b>{L.bag.speedTotal(L.ago(sped.all))}</b>{#each sped.jobs as [k, ms] (k)}<span class="t-soft"
        >{` · ${L.bag.speedJob[k]} ${L.ago(ms)}`}</span
      >{/each}
  </p>
{/if}

{#if list.length}
  <ul class="grid-items">
    {#each list as id (id)}
      <li><ItemCell {id} n={game.items[id] ?? 0} selected={pick === id} onclick={() => choose(id)} /></li>
    {/each}
  </ul>
{:else}
  <p class="t-small t-soft empty">{L.bag.empty}</p>
{/if}

{#if pick && def}
  <Card tone="glow">
    <div class="stack">
      <p class="row between">
        <b>{itemName(pick)}</b><span class="t-small t-soft">{L.bag.owned(have)}</span>
      </p>
      <p class="t-small t-soft">{L.bag.family[bagFamily(pick)].desc}</p>
      {#if have > 1}<div class="row"><Stepper value={n} max={have} onchange={v => (n = v)} /></div>{/if}
      {#if def.use === 'speed'}
        <p class="t-small t-strong t-gold">{L.bag.pickJob}</p>
        {#if !jobs.length}<p class="t-small t-soft">{L.bag.noJob}</p>{/if}
        {#each jobs as k (k)}
          {@const j = jobOf(game, k)!}
          <Button variant="ghost" wide trail={clock(j.finishAt - now)} onclick={() => use({ job: k })}
            >{L.jobs[k]}</Button
          >
        {/each}
      {:else if def.use === 'exp'}
        <p class="t-small t-strong t-gold">{L.bag.pickElder}</p>
        {#each elders as e (e)}
          <Card onclick={() => use({ elder: e })}>
            <span class="row"
              ><Portrait look={LOOK[e]} size={28} /><span class="grow t-strong">{L.elders[e].name}</span><b
                class="t-gold">{L.lv(elderLevel(game.elders[e]))}</b
              ></span
            >
          </Card>
        {/each}
      {:else if def.use !== 'key' && def.use !== 'ticket' && def.use !== 'frag'}
        <!-- thiếp Chiêu Hiền Đài: mở ở Chiêu Hiền Đài (tab Môn hạ); tàn phiến Tàng Bảo Đồ: ghép ở bản đồ giới — mô tả đã nói -->
        <Button wide onclick={() => use()}>{n > 1 ? L.bag.useAll(n) : L.bag.use}</Button>
      {/if}
    </div>
  </Card>
{/if}

<style>
  .sped {
    margin: var(--sp-2) 0 0;
  }
  /* tủ kệ gỗ: mỗi hàng 86px (ô 64 + ván), ván nâu vân gỗ dưới mỗi hàng, vách tủ hai bên */
  .grid-items {
    --row: 86px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    grid-auto-rows: var(--row);
    align-items: end;
    justify-items: center;
    gap: 0 var(--sp-2);
    margin: var(--sp-3) 0;
    padding: 6px 14px 0;
    list-style: none;
    background:
      linear-gradient(
          transparent calc(var(--row) - 14px),
          #8a5c38 calc(var(--row) - 14px),
          #5c3a1f calc(var(--row) - 5px),
          rgb(0 0 0 / 0.14) calc(var(--row) - 5px),
          transparent var(--row)
        )
        0 6px / 100% var(--row) repeat-y,
      linear-gradient(90deg, #6b4526, #4a2e17) left top / 8px 100% no-repeat,
      linear-gradient(90deg, #4a2e17, #6b4526) right top / 8px 100% no-repeat,
      linear-gradient(#efe9df, #e6dfd2);
    border-top: 8px solid #6b4526;
    border-radius: 4px 4px 0 0;
    box-shadow: 0 4px 10px rgb(var(--shade) / 0.18);
  }
  .grid-items li {
    padding-bottom: 14px;
  }
  .empty {
    margin: var(--sp-3) 0;
  }
</style>
