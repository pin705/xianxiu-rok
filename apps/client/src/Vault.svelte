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
  import { Icon, Portrait, artOf } from '@rok/art'
  import { Button, Card, Page, Section } from './ui'
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
  const vessel = (r: string) => artOf(`ui:res-${r}`)?.src
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
  <!-- ba vật chứa tài nguyên trên kệ: sản lượng mỗi giờ viên mực, sức chứa trên biển gỗ -->
  <Section title={L.baoKho.rates}>
    <div class="vessels">
      {#each RESOURCES as r (r)}
        <span class="vessel" aria-label="{L.res[r]}: {num(rate(game, r))}{L.panel.perHour}">
          <span class="vp"
            >{#if vessel(r)}<img src={vessel(r)} alt="" draggable="false" />{:else}<Icon
                name={r}
                size={44}
              />{/if}</span
          >
          <b class="pill t-num">+{num(rate(game, r))}<small>{L.panel.perHour}</small></b>
          <small class="t-tiny">{L.res[r]}</small>
        </span>
      {/each}
    </div>
    <p class="cap t-small"><span class="t-soft">{L.panel.capacity}</span> <b class="t-num">{num(storage(game))}</b></p>
  </Section>
  <Section title={L.bag.title}>
    <Items />
  </Section>
  <Section title={L.baoKho.pills}>
    <ul class="shelf">
      {#each PILL_IDS as p (p)}
        {@const n = game.items[p] ?? 0}
        <li>
          <button
            type="button"
            class="jar"
            class:on={pick === p}
            class:none={!n}
            aria-pressed={pick === p}
            aria-label={L.pills[p].name}
            onclick={() => {
              pick = pick === p ? null : p
              using = null
            }}
          >
            <Icon name={p} size={44} />
            <b class="qty t-num">×{n}</b>
            {#if p === 'ngungThan' && focus}<i class="lit"></i>{/if}
          </button>
        </li>
      {/each}
    </ul>
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
            <b class="t-num big">×{n}</b>
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
    <ul class="plaques">
      {#each stats as [k, v] (k)}<li>
          <b class="t-num">{num(v)}</b><small class="t-tiny">{L.baoKho.stat[k]}</small>
        </li>{/each}
    </ul>
  </Section>
</Page>

<style>
  .vessels {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 6px 8px 0;
    /* kệ gỗ dưới ba vật chứa */
    background: linear-gradient(var(--ochre), var(--lacquer2)) left bottom 38px / 100% 7px no-repeat;
  }
  .vessel {
    display: grid;
    justify-items: center;
    gap: 3px;
    text-align: center;
  }
  .vp {
    display: grid;
    place-items: end center;
    width: 76px;
    height: 70px;
    margin-bottom: 8px;
  }
  .vp img {
    width: 76px;
    height: 70px;
    object-fit: contain;
    filter: drop-shadow(0 3px 4px rgb(var(--shade) / 0.22));
  }
  .pill {
    padding: 0 9px 1px;
    font-size: var(--fs-2);
    white-space: nowrap;
    color: var(--silk);
    background: color-mix(in srgb, var(--ink) 80%, transparent);
    border-radius: 999px;
  }
  .pill small {
    font-size: var(--fs-1);
    opacity: 0.8;
  }
  .cap {
    margin: 0;
    text-align: center;
  }
  /* tủ đan: kệ gỗ nhiều tầng như túi đồ, mỗi lọ một ô */
  .shelf {
    --row: 84px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(62px, 1fr));
    grid-auto-rows: var(--row);
    align-items: end;
    justify-items: center;
    gap: 0 var(--sp-2);
    margin: 0;
    padding: 6px 14px 0;
    list-style: none;
    background:
      linear-gradient(
          transparent calc(var(--row) - 14px),
          var(--ochre) calc(var(--row) - 14px),
          var(--lacquer2) calc(var(--row) - 5px),
          rgb(var(--shade) / 0.14) calc(var(--row) - 5px),
          transparent var(--row)
        )
        0 6px / 100% var(--row) repeat-y,
      linear-gradient(90deg, var(--lacquer2), var(--lacquer)) left top / 8px 100% no-repeat,
      linear-gradient(90deg, var(--lacquer), var(--lacquer2)) right top / 8px 100% no-repeat,
      linear-gradient(var(--silk), var(--paper));
    border-top: 8px solid var(--lacquer2);
    border-radius: 4px 4px 0 0;
    box-shadow: 0 4px 10px rgb(var(--shade) / 0.18);
  }
  .shelf li {
    padding-bottom: 14px;
  }
  .jar {
    position: relative;
    display: grid;
    place-items: center;
    width: 56px;
    height: 58px;
    border-radius: 8px;
    transition: transform var(--dur-1) var(--ease);
  }
  .jar :global(.icon) {
    filter: drop-shadow(0 3px 3px rgb(var(--shade) / 0.25));
  }
  .jar:active {
    transform: scale(0.94);
  }
  .jar.on {
    background: radial-gradient(closest-side, rgb(var(--gold-glow) / 0.8), transparent);
    transform: translateY(-3px);
  }
  .jar.none :global(.icon) {
    filter: grayscale(1);
    opacity: 0.5;
  }
  .qty {
    position: absolute;
    right: -4px;
    bottom: 0;
    padding: 0 6px 1px;
    font-size: var(--fs-1);
    color: var(--silk);
    background: color-mix(in srgb, var(--ink) 80%, transparent);
    border-radius: 999px;
  }
  /* Ngưng Thần đang hiệu lực: chấm lục */
  .lit {
    position: absolute;
    top: 0;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--malachite);
    box-shadow: 0 0 0 2px var(--paper);
  }
  .big {
    font-size: var(--fs-5);
  }
  .plaques {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .plaques li {
    display: grid;
    justify-items: center;
    gap: 1px;
    padding: 8px 4px 7px;
    text-align: center;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px;
  }
  .plaques b {
    font-size: var(--fs-5);
    line-height: 1.1;
  }
  .plaques small {
    line-height: 1.15;
  }
</style>
