<script lang="ts">
  // Đan phòng: chữa thương binh (cả lô) và luyện đan (1–5 viên mỗi mẻ).
  // Bố cục: vạc đan là tâm điểm (tranh vạc khói lục, tên đan đang chọn, số viên, chi phí, nút luyện), dưới vạc là kệ
  // đan dược — mỗi loại một lọ. Thương binh là hàng huy hiệu + số, chữa cả lô một nút.
  import {
    BREW_MAX,
    PILLS,
    PILL_IDS,
    UNITS,
    brewCost,
    brewError,
    brewNeed,
    brewTime,
    count,
    fallenOf,
    reviveCost,
    healCost,
    healError,
    healTime,
    hospital,
    unitOf,
    type PillId,
    type UnitId,
    type Army,
  } from '@rok/rules'
  import { Icon, artOf } from '@rok/art'
  import { Bag, Button, Card, Medal, Meter, Section, Stepper, Tag } from './ui'
  import JobRow from './JobRow.svelte'
  import { EMBLEM, L, clock, num, sfx } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act
  const pot = artOf('ui:fx-cauldron')?.src

  let pill: PillId = $state('tuKhi')
  let n = $state(1)
  const hurt = $derived(count(game.wounded))
  const beds = $derived(hospital(game))
  const healErr = $derived(healError(game))
  const brewErr = $derived(brewError(game, pill, n))
  // Anh Linh Điện: đệ tử tử trận còn hồi sinh được
  const fallen = $derived(fallenOf(game, g.now))
  const reviveBag = $derived(reviveCost(fallen))
</script>

<!-- hàng huy hiệu đệ tử (thương binh / anh linh) -->
{#snippet mat(army: Partial<Army>)}
  <ul class="mat">
    {#each UNITS as u (u)}
      {#if army[u as UnitId]}
        {@const t = unitOf(u)}
        <li>
          <Medal emblem={EMBLEM.unit[t.type]} tone={t.type} size={30} pips={t.tier} /><b class="t-num"
            >{num(army[u as UnitId] ?? 0)}</b
          >
        </li>
      {/if}
    {/each}
  </ul>
{/snippet}

<!-- vạc đan -->
<Card>
  <div class="pot">
    {#if game.brew}<JobRow kind="brew" label={L.alchemy.brewing(game.brew.n, L.pills[game.brew.pill].name)} />{/if}
    <div class="head">
      {#if pot}<img class="art" src={pot} alt="" draggable="false" />{:else}<span class="art"
          ><Icon name="cauldron" size={72} /></span
        >{/if}
      <span class="stack" style:--gap="4px">
        <b class="name row" style:--gap="6px"><Icon name={pill} size={30} />{L.pills[pill].name}</b>
        <small class="have">{L.alchemy.have(game.items[pill] ?? 0)}</small>
        <p class="t-small t-lore desc">{L.pills[pill].desc}</p>
      </span>
    </div>
    {#if PILLS[pill].need}
      <!-- đan theo công thức: đan nguyên liệu trừ lúc bắt đầu luyện -->
      <div class="row wrap">
        <span class="t-small t-soft">{L.panel.requires}</span>
        {#each Object.entries(brewNeed(pill, n)) as [q, k] (q)}
          {@const have = game.items[q as PillId] ?? 0}
          <Tag icon={q as PillId} tone={have >= k! ? 'good' : 'bad'}>{L.pills[q as PillId].name} {have}/{k}</Tag>
        {/each}
      </div>
    {/if}
    <div class="row between wrap">
      <Stepper value={n} max={BREW_MAX} onchange={v => (n = v)} />
      <Bag res={brewCost(game, pill, n)} have={game.res} />
    </div>
    <Button
      wide
      variant="gold"
      icon="cauldron"
      trail={clock(brewTime(game, pill, n))}
      disabled={!!brewErr}
      onclick={() => act({ type: 'brew', pill, n }, 'build')}>{L.alchemy.go} {n}</Button
    >
  </div>
</Card>

<!-- kệ đan: mỗi loại một lọ -->
<ul class="shelf" aria-label={L.alchemy.brew}>
  {#each PILL_IDS as p (p)}
    {@const open = game.levels.danPhong >= PILLS[p].unlock}
    <li>
      <button
        type="button"
        class="jar"
        class:on={pill === p}
        disabled={!open}
        aria-label={L.pills[p].name}
        aria-pressed={pill === p}
        onclick={() => {
          sfx('tap')
          pill = p
        }}
      >
        <Icon name={p} size={40} />
        {#if open}<i class="coin rank-no">{game.items[p] ?? 0}</i>{/if}
        <span class="nm">{L.pills[p].name}</span>
        {#if !open}<small class="row lock" style:--gap="2px"
            ><Icon name="lock" size={10} />{L.level(PILLS[p].unlock)}</small
          >{/if}
      </button>
    </li>
  {/each}
</ul>

<Section title={L.alchemy.heal}>
  {#snippet aside()}{L.alchemy.bed(hurt, beds)}{/snippet}
  {#if game.heal}<JobRow kind="heal" label={L.alchemy.healing(count(game.heal.troops))} />{/if}
  <Meter value={beds ? hurt / beds : 0} size="sm" tone={hurt >= beds ? 'bad' : 'good'} label={L.alchemy.wounded} />
  {#if hurt}
    {@render mat(game.wounded)}
    {#if hurt >= beds}<p class="t-small t-bad">{L.alchemy.overflow}</p>{/if}
    {#if !game.heal}
      <Bag res={healCost(game, game.wounded)} have={game.res} />
      <Button
        wide
        icon="heal"
        trail={clock(healTime(game, game.wounded))}
        disabled={!!healErr}
        onclick={() => act({ type: 'heal' }, 'reward')}>{L.alchemy.healAll}</Button
      >
    {/if}
  {:else if !game.heal}
    <p class="t-small t-soft t-lore">{L.alchemy.noWounded}</p>
  {/if}
</Section>

{#if count(fallen)}
  <Section title={L.alchemy.heroes}>
    {#snippet aside()}{L.alchemy.heroesLeft(clock((game.fallen?.until ?? g.now) - g.now))}{/snippet}
    <p class="t-small t-soft">{L.alchemy.heroesHint}</p>
    {@render mat(fallen)}
    <Bag res={reviveBag} have={game.res} />
    <Button
      wide
      variant="gold"
      icon="heal"
      disabled={(['linhThach', 'linhThao', 'linhKhoang'] as const).some(r => game.res[r] < reviveBag[r])}
      onclick={() => act({ type: 'revive' }, 'reward')}>{L.alchemy.revive(num(count(fallen)))}</Button
    >
  </Section>
{/if}

<style>
  .pot {
    display: grid;
    gap: var(--sp-2);
  }
  /* tranh vạc bên trái, tên đan + số đang có + mô tả (rút gọn) bên phải */
  .head {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
  }
  .art {
    display: grid;
    width: 104px;
    rotate: -3deg;
  }
  .name {
    font-size: var(--fs-5);
    line-height: 1.15;
  }
  .have {
    justify-self: start;
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--text-inv);
    background: var(--malachite);
  }
  .desc {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .shelf {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px 0;
    margin-top: var(--sp-3);
    padding: 0;
    list-style: none;
  }
  .shelf li {
    border-bottom: 6px solid var(--ochre);
  }
  .jar {
    position: relative;
    display: grid;
    justify-items: center;
    width: 100%;
    padding: 4px 2px;
    color: var(--text-soft);
  }
  .jar:disabled {
    opacity: 0.55;
  }
  .jar.on {
    color: var(--text);
  }
  .jar.on .nm {
    background: var(--stroke-red) no-repeat center bottom / 100% 5px;
  }
  .nm {
    max-width: 100%;
    padding: 0 2px 4px;
    overflow: hidden;
    font-size: var(--fs-1);
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .lock {
    font-size: var(--fs-1);
  }
  .coin {
    position: absolute;
    top: 0;
    right: calc(50% - 32px);
    font-style: normal;
  }
  .mat {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    padding: 0;
    list-style: none;
  }
  .mat li {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
