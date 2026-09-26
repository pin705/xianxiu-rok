<script lang="ts">
  // Trang Bảo khố: đan dược (dùng ngay tại đây), sản lượng mỗi giờ, thành tích.
  import {
    ELDER_IDS,
    ELDER_MAX,
    PILL_IDS,
    RESOURCES,
    count,
    elderLevel,
    jobOf,
    rate,
    storage,
    talentUsed,
    type BuildingId,
    type JobKind,
    type PillId,
    isMarching,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Button, Card, Page, Section, Stat } from './ui'
  import Items from './Items.svelte'
  import Achievements from './Achievements.svelte'
  import { L, LOOK, clock, num, sfx, type PanelTab } from './lib'
  import { useGame } from './game'

  let {
    onfocus,
  }: {
    onfocus: (id: BuildingId, view?: PanelTab | null) => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  let using = $state<PillId | null>(null)
  // dùng nhiều viên một lần (Tụ Khí Đan, Bồi Nguyên Đan): chọn số rồi chọn việc / trưởng lão
  let qty = $state(1)
  $effect(() => {
    if (using) qty = 1
  })
  const qtys = (have: number) => [...new Set([1, 5, 10, have])].filter(k => k >= 1 && k <= have)
  const JOBS: JobKind[] = ['build', 'train', 'heal', 'study', 'forge'] // luyện đan không rút ngắn bằng đan được
  const jobs = $derived(JOBS.filter(k => jobOf(game, k)))
  const has = (e: (typeof ELDER_IDS)[number]) => game.elders[e] !== undefined
  // mỗi loại đan một cách dùng: chọn việc, chọn trưởng lão, dùng ngay, hay tự dùng khi độ kiếp
  const MODE = {
    tuKhi: 'job',
    daiTuKhi: 'job',
    boiNguyen: 'feed',
    taiTuy: 'wash',
    hoiXuan: 'cure',
    ngungThan: 'focus',
    doKiep: 'auto',
    phaCanh: 'auto',
  } as const satisfies Record<PillId, string>
  const pickFrom = $derived({
    feed: ELDER_IDS.filter(e => has(e) && elderLevel(game.elders[e]) < ELDER_MAX),
    wash: ELDER_IDS.filter(e => has(e) && talentUsed(game, e) && !isMarching(game, e)),
  })
  const focus = $derived(game.buffs.find(b => b.src === 'ngungThan'))
  // Hồi Xuân chỉ chữa thương binh chưa nằm trong đợt đang chữa
  const curable = $derived(count(game.wounded) - (game.heal ? count(game.heal.troops) : 0) > 0)
  const stats = $derived([
    ['won', game.stats.won],
    ['lost', game.stats.lost],
    ['trained', game.stats.trained],
    ['healed', game.stats.healed],
    ['brewed', game.stats.brewed],
    ['rebirths', game.rebirths],
  ] as const)
</script>

<Page title={L.baoKho.title} icon="baoKho">
  <Section title={L.bag.title}>
    <Items />
  </Section>
  <Section title={L.ach.title}>
    <Achievements />
  </Section>
  <Section title={L.baoKho.pills}>
    <ul class="stack">
      {#each PILL_IDS as p (p)}
        {@const n = game.items[p] ?? 0}
        {@const mode = MODE[p]}
        <li>
          <Card>
            <div class="stack">
              <div class="row">
                <Icon name={p} size={42} />
                <span class="grow stack" style:--gap="2px"
                  ><b>{L.pills[p].name}</b><small class="t-small t-soft">{L.pills[p].desc}</small></span
                >
                <b class="t-num t-gold qty">×{n}</b>
              </div>
              {#if n && mode === 'auto'}
                <p class="t-small t-soft t-lore">{L.baoKho.auto}</p>
              {:else if n && mode === 'cure'}
                <div class="row">
                  <Button size="sm" icon="heal" disabled={!curable} onclick={() => act({ type: 'cure' }, 'reward')}
                    >{L.baoKho.cure}</Button
                  >
                </div>
              {:else if mode === 'focus' && (n || focus)}
                {#if focus}<p class="t-small t-good">{L.baoKho.focusLeft(clock(focus.until - now))}</p>{/if}
                {#if n}<div class="row">
                    <Button size="sm" onclick={() => act({ type: 'focus' }, 'reward')}>{L.baoKho.focus}</Button>
                  </div>{/if}
              {:else if n && using === p}
                <p class="t-small t-strong t-gold">
                  {mode === 'job' ? L.baoKho.pickJob : mode === 'wash' ? L.baoKho.pickWash : L.baoKho.pickElder}
                </p>
                {#if mode !== 'wash' && n > 1}
                  <div class="row wrap" style:--gap="4px">
                    {#each qtys(n) as k (k)}<Button
                        size="sm"
                        variant={qty === k ? 'gold' : 'ghost'}
                        onclick={() => (qty = k)}>{k === n && k > 10 ? L.baoKho.all(k) : `×${k}`}</Button
                      >{/each}
                  </div>
                {/if}
                {#if mode === 'job'}
                  {#if !jobs.length}<p class="t-small t-soft">{L.baoKho.noJob}</p>{/if}
                  {#each jobs as k (k)}
                    {@const j = jobOf(game, k)!}
                    <Button
                      variant="ghost"
                      wide
                      trail={clock(j.finishAt - now)}
                      onclick={() =>
                        act(
                          { type: 'speed', job: k, n: Math.min(qty, n), ...(p === 'daiTuKhi' && { pill: p }) },
                          'reward',
                        )}>{L.jobs[k]}</Button
                    >
                  {/each}
                {:else}
                  {#each pickFrom[mode as 'feed' | 'wash'] as e (e)}
                    <Card
                      onclick={() =>
                        act(
                          mode === 'wash'
                            ? { type: 'wash', elder: e }
                            : { type: 'feed', elder: e, n: Math.min(qty, n) },
                        ) && sfx('reward')}
                    >
                      <span class="row"
                        ><Portrait look={LOOK[e]} size={28} /><span class="grow t-strong">{L.elders[e].name}</span><b
                          class="t-gold">{L.lv(elderLevel(game.elders[e]))}</b
                        ></span
                      >
                    </Card>
                  {/each}
                {/if}
              {:else if n}
                <div class="row"><Button size="sm" onclick={() => (using = p)}>{L.baoKho.use}</Button></div>
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
        <Stat label={L.res[r]}
          ><Icon name={r} size={18} />{num(rate(game, r))}<small class="t-soft">{L.panel.perHour}</small></Stat
        >
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
