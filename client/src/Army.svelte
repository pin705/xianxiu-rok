<script lang="ts">
  // Chọn đội: trưởng lão dẫn đội + số đệ tử mỗi loại. Trước khi đánh: lực chiến hai bên + tỉ lệ thắng ước lượng.
  import {
    ELDER_IDS, UNITS, count, elderLevel, might, sideOf, unitOf,
    type Army, type ElderId, type State, type UnitId,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import Unit from './Unit.svelte'
  import { L, LOOK, num } from './lib'

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
    foe: number // lực chiến địch
    chance: (elder: ElderId, army: Army) => number // tỉ lệ thắng ước lượng (rules.winChance)
    cta: string
    time?: string
    disabled?: boolean
    onsubmit: (elder: ElderId, army: Army) => void
    onrecruit?: () => void
  } = $props()

  const idle = $derived(
    ELDER_IDS.filter(e => game.elders[e] !== undefined).sort((a, b) => (game.elders[b] ?? 0) - (game.elders[a] ?? 0)),
  )
  const busy = (e: ElderId) => game.marches.some(m => m.elder === e)
  let elder = $state<ElderId | null>(null)
  const lead = $derived(elder && !busy(elder) ? elder : (idle.find(e => !busy(e)) ?? null))
  const home = $derived(UNITS.filter(u => game.troops[u] > 0))
  let picks = $state<Partial<Record<UnitId, number>>>({})
  let touched = $state(false)
  // Mặc định mang tất cả; chỉnh tay thì giữ theo người chơi (nhưng không quá số đang có)
  const army = $derived(
    Object.fromEntries(home.map(u => [u, Math.min(game.troops[u], touched ? (picks[u] ?? 0) : game.troops[u])])) as Army,
  )
  const ours = $derived(lead ? might(sideOf(game, lead, army)) : 0)
  // Nhận định dựa trên đánh thử (tính hệ khắc, công pháp), không dựa lực chiến thô
  const p = $derived(lead ? chance(lead, army) : 0)
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

<h3>{L.army.elder}</h3>
{#if idle.length}
  <div class="elders">
    {#each idle as e (e)}
      {@const out = busy(e)}
      <button class="elder" class:on={lead === e} disabled={out} onclick={() => (elder = e)} aria-pressed={lead === e}>
        <Portrait look={LOOK[e]} size={40} dim={out} />
        <span><b>{L.elders[e].name}</b><small>{out ? L.army.busy : L.lv(elderLevel(game.elders[e]))}</small></span>
      </button>
    {/each}
  </div>
{/if}
{#if !lead}<p class="warn note">{L.army.noElder}</p>{/if}

<h3 class="row">
  <span>{L.army.troops} · {num(count(army))}</span>
  {#if home.length}
    <span class="quick">
      <button onclick={() => all(true)}>{L.army.all}</button>
      <button onclick={() => all(false)}>{L.army.none}</button>
    </span>
  {/if}
</h3>
{#if home.length}
  <ul class="troops">
    {#each home as u (u)}
      {@const t = unitOf(u)}
      <li>
        <Unit type={t.type} tier={t.tier} size={32} />
        <div class="slide">
          <span class="lbl">{L.unit(u)}<b>{num(army[u] ?? 0)}/{num(game.troops[u])}</b></span>
          <input type="range" min="0" max={game.troops[u]} value={army[u] ?? 0} oninput={e => set(u, +e.currentTarget.value)} aria-label={L.unit(u)} />
        </div>
      </li>
    {/each}
  </ul>
{:else}
  <p class="warn note">{L.army.noTroops}</p>
  {#if onrecruit}<button class="btn ghost small" onclick={onrecruit}><Icon name="people" size={16} />{L.army.recruit}</button>{/if}
{/if}

<div class="vs">
  <span class="side"><small>{L.army.ours}</small><b>{num(ours)}</b></span>
  <span class="meter"><i style:width="{p * 100}%"></i></span>
  <span class="side r"><small>{L.army.theirs}</small><b>{num(foe)}</b></span>
</div>
<p class="verdict {verdict}"><Icon name="power" size={13} />{L.army.verdict[verdict]} · {L.army.chance(Math.round(p * 100))}</p>

<button class="btn wide go" disabled={disabled || !lead || !count(army)} onclick={() => lead && onsubmit(lead, army)}>
  <Icon name="flag" size={18} /><span>{cta}</span>
  {#if time}<span class="t"><Icon name="clock" size={15} />{time}</span>{/if}
</button>

<style>
  .elders {
    display: flex;
    gap: 8px;
    margin: 0 -16px;
    padding: 2px 16px 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .elder {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    padding: 5px 12px 5px 5px;
    color: inherit;
    text-align: left;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(201 161 74 / 0.3);
    border-radius: 999px;
    cursor: pointer;
  }
  .elder.on {
    background: rgb(201 161 74 / 0.2);
    border-color: var(--gold-l);
  }
  .elder:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .elder span {
    display: grid;
  }
  .elder b {
    font-size: 13px;
  }
  .elder small {
    font-size: 11px;
    color: #b9c6ca;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .quick {
    display: flex;
    gap: 6px;
  }
  .quick button {
    padding: 3px 9px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: none;
    color: var(--gold-l);
    background: none;
    border: 1px solid rgb(201 161 74 / 0.5);
    border-radius: 999px;
    cursor: pointer;
  }
  .troops {
    display: grid;
    gap: 10px;
    padding: 0;
    list-style: none;
  }
  .troops li {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .slide {
    display: grid;
    flex: 1;
    gap: 2px;
  }
  .lbl {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--gold);
  }
  .note {
    margin: 4px 0 8px;
    font-size: 13px;
  }
  .vs {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
  }
  .side {
    display: grid;
    min-width: 54px;
  }
  .side.r {
    text-align: right;
  }
  .side small {
    font-size: 10.5px;
    color: #b9c6ca;
  }
  .side b {
    font-size: 16px;
  }
  .meter {
    flex: 1;
    height: 8px;
    overflow: hidden;
    background: var(--cinnabar);
    border-radius: 4px;
  }
  .meter i {
    display: block;
    height: 100%;
    background: var(--spirit-ui);
    transition: width 0.25s;
  }
  .verdict {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    margin-top: 6px;
    font-size: 13px;
    font-weight: 600;
  }
  .verdict.strong {
    color: #9be3a5;
  }
  .verdict.even {
    color: var(--gold-l);
  }
  .verdict.weak {
    color: #ffb4a4;
  }
  .go {
    margin-top: 14px;
  }
</style>
