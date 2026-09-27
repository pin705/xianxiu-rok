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
  import { Icon } from '@rok/art'
  import { Art, Bag, Banner, Button, Medal, Meter, Section, Shelf, Stepper, Tag, Toggle, Ware } from './ui'
  import JobRow from './JobRow.svelte'
  import { EMBLEM, L, clock, num } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

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
  <ul class="row wrap plain" style:--gap="8px 14px">
    {#each UNITS as u (u)}
      {#if army[u as UnitId]}
        {@const t = unitOf(u)}
        <li class="row" style:--gap="4px">
          <Medal emblem={EMBLEM.unit[t.type]} tone={t.type} size={30} pips={t.tier} /><b class="t-num"
            >{num(army[u as UnitId] ?? 0)}</b
          >
        </li>
      {/if}
    {/each}
  </ul>
{/snippet}

{#if game.brew}
  <div class="mt-3">
    <JobRow kind="brew" label={L.alchemy.brewing(game.brew.n, L.pills[game.brew.pill].name)} />
  </div>
{/if}

<!-- vạc đan: tranh vạc bên trái, tên đan + số đang có + mô tả bên phải; công thức, số viên, chi phí, nút luyện bên dưới -->
<Banner
  title={L.pills[pill].name}
  icon={pill}
  picLeft
  picSize={104}
  band={L.alchemy.have(game.items[pill] ?? 0)}
  bandTone="jade"
>
  {#snippet pic()}<Art art="fx-cauldron" icon="cauldron" size={104} />{/snippet}
  {#snippet lead()}<p class="t-small t-lore clamp" style:--lines="3">{L.pills[pill].desc}</p>{/snippet}
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
</Banner>

<!-- kệ đan: mỗi loại một lọ -->
<div class="mt-3">
  <Shelf cols={4} row={104} label={L.alchemy.brew}>
    {#each PILL_IDS as p (p)}
      {@const open = game.levels.danPhong >= PILLS[p].unlock}
      <Ware
        icon={p}
        label={L.pills[p].name}
        n={open ? (game.items[p] ?? 0) : undefined}
        on={pill === p}
        disabled={!open}
        onclick={() => (pill = p)}
      >
        {#if !open}<small class="row t-tiny" style:--gap="2px"
            ><Icon name="lock" size={10} />{L.level(PILLS[p].unlock)}</small
          >{/if}
      </Ware>
    {/each}
  </Shelf>
</div>

<Section title={L.alchemy.heal}>
  {#snippet aside()}{L.alchemy.bed(hurt, beds)}{/snippet}
  {#if game.heal}<JobRow kind="heal" label={L.alchemy.healing(count(game.heal.troops))} />{/if}
  <Meter value={beds ? hurt / beds : 0} size="sm" tone={hurt >= beds ? 'bad' : 'good'} label={L.alchemy.wounded} />
  <!-- tự vận hành: tự chữa thương binh vừa về -->
  <Toggle checked={!!game.auto?.heal} onchange={on => act({ type: 'autoHeal', on }, 'tap')}
    ><small class="t-small">{L.alchemy.auto}</small></Toggle
  >
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
