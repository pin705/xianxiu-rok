<script lang="ts">
  // Trang Bảo khố: đan dược (dùng ngay tại đây), sản lượng mỗi giờ, thành tích.
  import {
    ELDER_IDS, ELDER_MAX, PILL_IDS, RESOURCES, elderLevel, jobOf, rate, storage,
    type Action, type BuildingId, type JobKind, type PillId, type State,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { L, LOOK, clock, num, sfx } from './lib'

  let { game, now, act, onfocus }: { game: State; now: number; act: (a: Action) => State | null; onfocus: (id: BuildingId, view?: string | null) => void } =
    $props()

  let using = $state<PillId | null>(null)
  const JOBS: JobKind[] = ['build', 'train', 'heal', 'study', 'brew']
  const jobs = $derived(JOBS.filter(k => jobOf(game, k)))
  const elders = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined && elderLevel(game.elders[e]) < ELDER_MAX))
  const stats = $derived([
    ['won', game.stats.won], ['lost', game.stats.lost], ['trained', game.stats.trained],
    ['healed', game.stats.healed], ['brewed', game.stats.brewed], ['rebirths', game.rebirths],
  ] as const)
</script>

<div class="page">
  <h2>{L.baoKho.title}</h2>

  <p class="h3">{L.baoKho.pills}</p>
  <ul class="pills">
    {#each PILL_IDS as p (p)}
      {@const n = game.items[p] ?? 0}
      <li class="card">
        <div class="row">
          <Icon name={p} size={40} />
          <span class="name"><b>{L.pills[p].name}</b><small>{L.pills[p].desc}</small></span>
          <b class="n">×{n}</b>
        </div>
        {#if n && p !== 'doKiep'}
          {#if using === p}
            <p class="pick">{p === 'tuKhi' ? L.baoKho.pickJob : L.baoKho.pickElder}</p>
            {#if p === 'tuKhi'}
              {#if !jobs.length}<p class="muted small">{L.baoKho.noJob}</p>{/if}
              {#each jobs as k (k)}
                {@const j = jobOf(game, k)!}
                <button class="opt" onclick={() => act({ type: 'speed', job: k, n: 1 }) && sfx('reward')}>
                  <span>{L.jobs[k]}</span><b>{clock(j.finishAt - now)}</b><Icon name="arrow" size={14} />
                </button>
              {/each}
            {:else}
              {#each elders as e (e)}
                <button class="opt" onclick={() => act({ type: 'feed', elder: e, n: 1 }) && sfx('reward')}>
                  <Portrait look={LOOK[e]} size={26} /><span>{L.elders[e].name}</span><b>{L.lv(elderLevel(game.elders[e]))}</b>
                </button>
              {/each}
            {/if}
          {:else}
            <button class="btn small use" onclick={() => (using = p)}>{L.baoKho.use}</button>
          {/if}
        {:else if n}
          <p class="muted small">{L.baoKho.auto}</p>
        {/if}
      </li>
    {/each}
  </ul>
  <button class="btn wide more" onclick={() => onfocus('danPhong', 'alchemy')}><Icon name="cauldron" size={20} />{L.baoKho.brewMore}</button>

  <p class="h3">{L.baoKho.rates}</p>
  <div class="card rates">
    {#each RESOURCES as r (r)}
      <span><Icon name={r} size={22} /><b>{num(rate(game, r))}</b><small>{L.panel.perHour}</small></span>
    {/each}
    <p class="muted small cap">{L.panel.capacity}: {num(storage(game))}</p>
  </div>

  <p class="h3">{L.baoKho.stats}</p>
  <dl class="card stats">
    {#each stats as [k, v] (k)}
      <div><dt>{L.baoKho.stat[k]}</dt><dd>{num(v)}</dd></div>
    {/each}
  </dl>
</div>

<style>
  .pills {
    display: grid;
    gap: 8px;
    padding: 0;
    list-style: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .name {
    display: grid;
    flex: 1;
    gap: 2px;
  }
  .name b {
    font-size: 15px;
  }
  .name small {
    font-size: 12px;
    color: var(--wash);
  }
  .n {
    font-size: 18px;
    color: var(--gold-d);
  }
  .use {
    margin-top: 8px;
  }
  .pick {
    margin: 10px 0 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--gold-d);
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin-top: 6px;
    padding: 8px 10px;
    font-size: 14px;
    color: var(--ink);
    text-align: left;
    background: #f4eddb;
    border: 1px solid #decfa9;
    border-radius: 10px;
    cursor: pointer;
  }
  .opt span {
    flex: 1;
  }
  .small {
    margin-top: 6px;
    font-size: 12.5px;
  }
  .more {
    margin-top: 10px;
  }
  .rates {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .rates span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .rates b {
    font-size: 15px;
  }
  .rates small {
    font-size: 11px;
    color: var(--wash);
  }
  .cap {
    grid-column: 1 / -1;
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    margin: 0;
  }
  .stats div {
    display: flex;
    justify-content: space-between;
    font-size: 13.5px;
  }
  dt {
    color: var(--wash);
  }
  dd {
    margin: 0;
    font-weight: 700;
  }
</style>
