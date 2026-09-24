<script lang="ts">
  // Chọn đội: trưởng lão dẫn đội + số đệ tử mỗi loại. Trước khi đánh: lực chiến hai bên + tỉ lệ thắng ước lượng.
  import { ELDER_IDS, UNITS, count, elderLevel, might, sideOf, unitOf, type Army, type ElderId, type State, type UnitId } from '@rok/rules'
  import { Portrait } from '@rok/art'
  import { Button, Card, Medal, Meter, Section, Slider } from './ui'
  import { EMBLEM, L, LOOK, num } from './lib'

  let {
    game,
    foe,
    chance,
    cta,
    time,
    disabled = false,
    onsubmit,
    onrecruit,
  }: {
    game: State
    foe?: number // lực chiến địch (không biết thì bỏ: chỉ hiện lực chiến của mình)
    chance?: (elder: ElderId, army: Army) => number // tỉ lệ thắng ước lượng (rules.winChance); không có: không đoán
    cta: string
    time?: string
    disabled?: boolean
    onsubmit: (elder: ElderId, army: Army) => void
    onrecruit?: () => void
  } = $props()

  const idle = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined).sort((a, b) => (game.elders[b] ?? 0) - (game.elders[a] ?? 0)))
  const busy = (e: ElderId) => game.marches.some(m => m.elder === e)
  let elder = $state<ElderId | null>(null)
  const lead = $derived(elder && !busy(elder) ? elder : (idle.find(e => !busy(e)) ?? null))
  const home = $derived(UNITS.filter(u => game.troops[u] > 0))
  let picks = $state<Partial<Record<UnitId, number>>>({})
  let touched = $state(false)
  // Mặc định mang tất cả; chỉnh tay thì giữ theo người chơi (nhưng không quá số đang có)
  const army = $derived(Object.fromEntries(home.map(u => [u, Math.min(game.troops[u], touched ? (picks[u] ?? 0) : game.troops[u])])) as Army)
  const ours = $derived(lead ? might(sideOf(game, lead, army)) : 0)
  // Nhận định dựa trên đánh thử (tính hệ khắc, công pháp), không dựa lực chiến thô
  const p = $derived(lead && chance ? chance(lead, army) : 0)
  const verdict = $derived(p >= 0.8 ? 'strong' : p >= 0.35 ? 'even' : 'weak')

  function set(u: UnitId, n: number) {
    if (!touched) picks = { ...army }
    touched = true
    picks = { ...picks, [u]: n }
  }
  function all(on: boolean) {
    touched = true
    picks = Object.fromEntries(home.map(u => [u, on ? game.troops[u] : 0]))
  }
</script>

<Section title={L.army.elder}>
  {#if idle.length}
    <div class="row scroll">
      {#each idle as e (e)}
        {@const out = busy(e)}
        <span class="pick">
          <Card selected={lead === e} disabled={out} onclick={() => (elder = e)} label={L.elders[e].name}>
            <span class="row">
              <Portrait look={LOOK[e]} size={38} dim={out} />
              <span class="stack" style:--gap="0">
                <b class="t-small">{L.elders[e].name}</b>
                <small class="t-tiny t-soft">{out ? L.army.busy : L.lv(elderLevel(game.elders[e]))}</small>
              </span>
            </span>
          </Card>
        </span>
      {/each}
    </div>
  {/if}
  {#if !lead}<p class="t-small t-bad">{L.army.noElder}</p>{/if}
</Section>

<Section title="{L.army.troops} · {num(count(army))}">
  {#snippet aside()}
    {#if home.length}
      <Button variant="ghost" size="sm" onclick={() => all(true)}>{L.army.all}</Button>
      <Button variant="ghost" size="sm" onclick={() => all(false)}>{L.army.none}</Button>
    {/if}
  {/snippet}
  {#if home.length}
    <ul class="stack">
      {#each home as u (u)}
        {@const t = unitOf(u)}
        <li class="row">
          <Medal emblem={EMBLEM.unit[t.type]} tone={t.type} size={32} pips={t.tier} />
          <span class="grow">
            <span class="row between t-small"><span>{L.unit(u)}</span><b class="t-num">{num(army[u] ?? 0)}/{num(game.troops[u])}</b></span>
            <Slider value={army[u] ?? 0} max={game.troops[u]} label={L.unit(u)} onchange={n => set(u, n)} />
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="t-small t-bad">{L.army.noTroops}</p>
    {#if onrecruit}<Button variant="ghost" size="sm" icon="people" onclick={onrecruit}>{L.army.recruit}</Button>{/if}
  {/if}
</Section>

{#if chance && foe !== undefined}
  <div class="row mt-4">
    <span class="stack" style:--gap="0"><small class="t-tiny t-soft">{L.army.ours}</small><b class="t-num">{num(ours)}</b></span>
    <span class="grow"><Meter value={p} tone={verdict === 'weak' ? 'bad' : verdict === 'even' ? 'gold' : 'good'} size="lg" /></span>
    <span class="stack center" style:--gap="0"><small class="t-tiny t-soft">{L.army.theirs}</small><b class="t-num">{num(foe)}</b></span>
  </div>
  <p class="center t-small t-strong mt-2" class:t-good={verdict === 'strong'} class:t-gold={verdict === 'even'} class:t-bad={verdict === 'weak'}>
    {L.army.verdict[verdict]} · {L.army.chance(Math.round(p * 100))}
  </p>
{:else}
  <p class="center t-small mt-4"><span class="t-soft">{L.army.might}:</span> <b class="t-num">{num(ours)}</b></p>
{/if}
<!-- yếu thế mà vẫn còn quân: chỉ đường đi tuyển thêm (không quân thì nút đã có ở trên) -->
{#if chance && verdict === 'weak' && home.length && onrecruit}
  <div class="row center mt-2"><Button variant="ghost" size="sm" icon="people" onclick={onrecruit}>{L.army.recruit}</Button></div>
{/if}

<div class="mt-3">
  <Button wide size="lg" icon="flag" trail={time} trailIcon="clock" disabled={disabled || !lead || !count(army)} onclick={() => lead && onsubmit(lead, army)}>{cta}</Button>
</div>

<style>
  .scroll {
    overflow-x: auto;
    padding: 2px 1px 4px;
  }
  .pick {
    flex: none;
  }
</style>
