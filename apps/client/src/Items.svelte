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
  function use(extra: { job?: JobKind; elder?: (typeof ELDER_IDS)[number] } = {}) {
    if (pick) act({ type: 'use', item: pick, n, ...extra }, 'reward')
  }
</script>

<Tabs items={BAG_TABS.map(id => ({ id, label: L.bag.tabs[id] }))} value={tab} onchange={switchTab} />

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
      {:else if def.use !== 'key' && def.use !== 'ticket'}
        <!-- thiếp Chiêu Hiền Đài: mở ở Chiêu Hiền Đài (tab Môn hạ), mô tả đã nói -->
        <Button wide onclick={() => use()}>{n > 1 ? L.bag.useAll(n) : L.bag.use}</Button>
      {/if}
    </div>
  </Card>
{/if}

<style>
  .grid-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    justify-items: center;
    gap: var(--sp-2);
    margin: var(--sp-3) 0;
    padding: 0;
    list-style: none;
  }
  .empty {
    margin: var(--sp-3) 0;
  }
</style>
