<script lang="ts">
  // Trang Bảo khố: đan dược (dùng ngay tại đây), sản lượng mỗi giờ, thành tích.
  // Bố cục kho: ba vật chứa tài nguyên (bát linh thạch, giỏ linh thảo, xe quặng) mang sản lượng/giờ làm tâm điểm, túi đồ, tủ đan
  // (lọ đan trên kệ gỗ — chạm một lọ mở tờ chỉ dẫn bên dưới), thành tựu, biển số thành tích.
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
  import { Art, Button, Card, Goods, Page, Pill, Plaque, Section, Shelf } from './ui'
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

  let pick = $state<PillId | null>(null) // lọ đan đang xem trên tủ
  let using = $state<PillId | null>(null)
  // dùng nhiều viên một lần (Tụ Khí Đan, Bồi Nguyên Đan): chọn số rồi chọn việc / trưởng lão
  let qty = $state(1)
  $effect(() => {
    if (using) qty = 1
  })
  const qtys = (have: number) => [...new Set([1, 5, 10, have])].filter(k => k >= 1 && k <= have)
  const JOBS: JobKind[] = ['build', 'train', 'train2', 'heal', 'study', 'forge'] // luyện đan không rút ngắn bằng đan được
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
  <!-- ba vật chứa tài nguyên trên kệ: sản lượng mỗi giờ viên mực, sức chứa trên biển gỗ -->
  <Section title={L.baoKho.rates}>
    <div class="grid ledge" style:--cols="3" style:--ledge="38px">
      {#each RESOURCES as r (r)}
        <span
          class="stack justify-center t-center"
          style:--gap="3px"
          aria-label="{L.res[r]}: {num(rate(game, r))}{L.panel.perHour}"
        >
          <Art art="res-{r}" icon={r} size={76} />
          <span class="mt-2"><Pill>+{num(rate(game, r))}{L.panel.perHour}</Pill></span>
          <small class="t-tiny">{L.res[r]}</small>
        </span>
      {/each}
    </div>
    <p class="t-small t-center">
      <span class="t-soft">{L.panel.capacity}</span> <b class="t-num">{num(storage(game))}</b>
    </p>
  </Section>
  <Section title={L.bag.title}>
    <Items />
  </Section>
  <Section title={L.baoKho.pills}>
    <Shelf row={84} min={62}>
      {#each PILL_IDS as p (p)}
        {@const n = game.items[p] ?? 0}
        <Goods
          look="jar"
          icon={p}
          size={44}
          n="×{n}"
          on={pick === p}
          faded={!n}
          dot={p === 'ngungThan' && !!focus}
          label={L.pills[p].name}
          onclick={() => {
            pick = pick === p ? null : p
            using = null
          }}
        />
      {/each}
    </Shelf>
    {#if pick}
      {@const p = pick}
      {@const n = game.items[p] ?? 0}
      {@const mode = MODE[p]}
      <Card tone="glow">
        <div class="stack">
          <div class="row">
            <Icon name={p} size={42} />
            <span class="grow stack" style:--gap="2px"
              ><b>{L.pills[p].name}</b><small class="t-small t-soft">{L.pills[p].desc}</small></span
            >
            <b class="t-num t-head">×{n}</b>
          </div>
          {#if n && mode === 'auto'}
            <p class="t-small t-soft t-lore">{L.baoKho.auto}</p>
          {:else if n && mode === 'cure'}
            <div class="row">
              <Button
                size="sm"
                variant="gold"
                icon="heal"
                disabled={!curable}
                onclick={() => act({ type: 'cure' }, 'reward')}>{L.baoKho.cure}</Button
              >
            </div>
          {:else if mode === 'focus' && (n || focus)}
            {#if focus}<p class="t-small t-good">{L.baoKho.focusLeft(clock(focus.until - now))}</p>{/if}
            {#if n}<div class="row">
                <Button size="sm" variant="gold" onclick={() => act({ type: 'focus' }, 'reward')}
                  >{L.baoKho.focus}</Button
                >
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
                    act({ type: 'speed', job: k, n: Math.min(qty, n), ...(p === 'daiTuKhi' && { pill: p }) }, 'reward')}
                  >{L.jobs[k]}</Button
                >
              {/each}
            {:else}
              {#each pickFrom[mode as 'feed' | 'wash'] as e (e)}
                <Card
                  onclick={() =>
                    act(
                      mode === 'wash' ? { type: 'wash', elder: e } : { type: 'feed', elder: e, n: Math.min(qty, n) },
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
            <div class="row"><Button size="sm" variant="gold" onclick={() => (using = p)}>{L.baoKho.use}</Button></div>
          {:else}
            <p class="t-small t-soft">{L.baoKho.empty}</p>
          {/if}
        </div>
      </Card>
    {/if}
    <Button wide variant="ghost" icon="cauldron" onclick={() => onfocus('danPhong', 'alchemy')}
      >{L.baoKho.brewMore}</Button
    >
  </Section>
  <Section title={L.ach.title}>
    <Achievements />
  </Section>

  <!-- thành tích: biển số — số to, nhãn nhỏ -->
  <Section title={L.baoKho.stats}>
    <div class="grid" style:--cols="3">
      {#each stats as [k, v] (k)}<Plaque value={num(v)} sub={L.baoKho.stat[k]} />{/each}
    </div>
  </Section>
</Page>
