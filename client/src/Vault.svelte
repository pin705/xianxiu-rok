<script lang="ts">
  // Trang Bảo khố: đan dược (dùng ngay tại đây), sản lượng mỗi giờ, thành tích.
  import {
    ELDER_IDS, ELDER_MAX, PILL_IDS, RESOURCES, elderLevel, jobOf, rate, storage,
    type Action, type BuildingId, type JobKind, type PillId, type State,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Button, Card, Page, Section, Stat } from './ui'
  import { L, LOOK, clock, num, sfx } from './lib'

  let { game, now, act, onfocus }: { game: State; now: number; act: (a: Action) => State | null; onfocus: (id: BuildingId, view?: string | null) => void } =
    $props()

  let using = $state<PillId | null>(null)
  const JOBS: JobKind[] = ['build', 'train', 'heal', 'study'] // luyện đan không rút ngắn bằng đan được
  const jobs = $derived(JOBS.filter(k => jobOf(game, k)))
  const elders = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined && elderLevel(game.elders[e]) < ELDER_MAX))
  const stats = $derived([
    ['won', game.stats.won], ['lost', game.stats.lost], ['trained', game.stats.trained],
    ['healed', game.stats.healed], ['brewed', game.stats.brewed], ['rebirths', game.rebirths],
  ] as const)
</script>

<Page title={L.baoKho.title} glyph="宝">
  <Section title={L.baoKho.pills}>
    <ul class="stack">
      {#each PILL_IDS as p (p)}
        {@const n = game.items[p] ?? 0}
        <li>
          <Card>
            <div class="stack">
              <div class="row">
                <Icon name={p} size={42} />
                <span class="grow stack" style:--gap="2px"><b>{L.pills[p].name}</b><small class="t-small t-soft">{L.pills[p].desc}</small></span>
                <b class="t-num t-gold qty">×{n}</b>
              </div>
              {#if n && p !== 'doKiep'}
                {#if using === p}
                  <p class="t-small t-strong t-gold">{p === 'tuKhi' ? L.baoKho.pickJob : L.baoKho.pickElder}</p>
                  {#if p === 'tuKhi'}
                    {#if !jobs.length}<p class="t-small t-soft">{L.baoKho.noJob}</p>{/if}
                    {#each jobs as k (k)}
                      {@const j = jobOf(game, k)!}
                      <Button variant="ghost" wide trail={clock(j.finishAt - now)} onclick={() => act({ type: 'speed', job: k, n: 1 }) && sfx('reward')}>{L.jobs[k]}</Button>
                    {/each}
                  {:else}
                    {#each elders as e (e)}
                      <Card onclick={() => act({ type: 'feed', elder: e, n: 1 }) && sfx('reward')}>
                        <span class="row"><Portrait look={LOOK[e]} size={28} /><span class="grow t-strong">{L.elders[e].name}</span><b class="t-gold">{L.lv(elderLevel(game.elders[e]))}</b></span>
                      </Card>
                    {/each}
                  {/if}
                {:else}
                  <div class="row"><Button size="sm" onclick={() => (using = p)}>{L.baoKho.use}</Button></div>
                {/if}
              {:else if n}
                <p class="t-small t-soft t-lore">{L.baoKho.auto}</p>
              {/if}
            </div>
          </Card>
        </li>
      {/each}
    </ul>
    <Button wide icon="cauldron" onclick={() => onfocus('danPhong', 'alchemy')}>{L.baoKho.brewMore}</Button>
  </Section>

  <Section title={L.baoKho.rates}>
    <Card>
      {#each RESOURCES as r (r)}
        <Stat label={L.res[r]}><Icon name={r} size={18} />{num(rate(game, r))}<small class="t-soft">{L.panel.perHour}</small></Stat>
      {/each}
      <Stat label={L.panel.capacity}>{num(storage(game))}</Stat>
    </Card>
  </Section>

  <Section title={L.baoKho.stats}>
    <Card>
      <div class="grid" style:--gap="0 16px">
        {#each stats as [k, v] (k)}<Stat label={L.baoKho.stat[k]}>{num(v)}</Stat>{/each}
      </div>
    </Card>
  </Section>
</Page>

<style>
  .qty {
    font-size: var(--fs-5);
  }
</style>
