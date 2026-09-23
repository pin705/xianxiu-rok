<script lang="ts">
  // Trang Môn hạ: trưởng lão (trụ cột "truyền thừa của riêng mình"), đệ tử theo hệ × bậc, thương binh.
  import {
    ELDERS, ELDER_IDS, ELDER_MAX, TIERS, TYPES, away, count, elderLevel, expAt, hospital,
    type Action, type BuildingId, type ElderId, type State, type UnitId,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import Sheet from './Sheet.svelte'
  import Unit from './Unit.svelte'
  import { L, LOOK, clock, num, sfx } from './lib'

  let { game, now, act, onfocus }: { game: State; now: number; act: (a: Action) => State | null; onfocus: (id: BuildingId, view?: string | null) => void } =
    $props()

  let open = $state<ElderId | null>(null)
  const out = $derived(away(game))
  const hurt = $derived(count(game.wounded))
  const marchOf = (e: ElderId) => game.marches.find(m => m.elder === e)
</script>

<div class="page">
  <h2>{L.monHa.title}</h2>

  <p class="h3">{L.monHa.elders}</p>
  <ul class="elders">
    {#each ELDER_IDS as e (e)}
      {@const has = game.elders[e] !== undefined}
      {@const lv = elderLevel(game.elders[e])}
      {@const m = marchOf(e)}
      <li>
        <button class="card elder" class:locked={!has} onclick={() => has && ((open = e), sfx('tap'))} disabled={!has}>
          <Portrait look={LOOK[e]} size={52} dim={!has} />
          <span class="info">
            <b>{has ? L.elders[e].name : '???'}</b>
            {#if has}
              <small>{L.elders[e].title} · {L.units[ELDERS[e].type]}</small>
              <span class="lvrow">
                <span class="lv">{L.lv(lv)}</span>
                <span class="bar exp"><i style:width="{lv >= ELDER_MAX ? 100 : (((game.elders[e] ?? 0) - expAt(lv)) / (expAt(lv + 1) - expAt(lv))) * 100}%"></i></span>
              </span>
              <span class="st" class:away={!!m}>{m ? `${L.monHa.out} · ${clock(m.returnAt - now)}` : L.monHa.home}</span>
            {:else}
              <small class="hint"><Icon name="lock" size={11} /> {L.unlockHint[e]}</small>
            {/if}
          </span>
        </button>
      </li>
    {/each}
  </ul>

  <p class="h3">{L.monHa.disciples} · {num(count(game.troops) + count(out))}</p>
  <div class="card grid">
    <span></span>
    {#each TIERS as t (t)}<span class="th">{L.tiers[t]}</span>{/each}
    {#each TYPES as type (type)}
      <span class="rowh"><Unit {type} size={30} /><span><b>{L.units[type]}</b><small>{L.beats(type)}</small></span></span>
      {#each TIERS as t (t)}
        {@const u = `${type}${t}` as UnitId}
        <span class="cell" class:zero={!game.troops[u] && !out[u]}>
          <b>{num(game.troops[u])}</b>
          {#if out[u]}<small><Icon name="flag" size={10} />{num(out[u])}</small>{/if}
        </span>
      {/each}
    {/each}
  </div>
  <button class="btn wide recruit" onclick={() => onfocus('dienVoTruong', 'train')}><Icon name="people" size={18} />{L.army.recruit}</button>

  <p class="h3">{L.monHa.wounded} · {num(hurt)}/{num(hospital(game))}</p>
  <div class="card wounded">
    {#if game.heal}
      <p><Icon name="heal" size={18} />{L.alchemy.healing(count(game.heal.troops))} · <b>{clock(game.heal.finishAt - now)}</b></p>
    {:else if hurt}
      <p><Icon name="heal" size={18} />{L.alchemy.wounded}: <b>{num(hurt)}</b></p>
      <button class="btn small" onclick={() => onfocus('danPhong', 'alchemy')}>{L.monHa.heal}</button>
    {:else}
      <p class="muted">{L.alchemy.noWounded}</p>
    {/if}
  </div>
</div>

<Sheet open={!!open} onclose={() => (open = null)} label={open ? L.elders[open].name : ''}>
  {#if open}
    {@const e = open}
    {@const d = ELDERS[e]}
    {@const lv = elderLevel(game.elders[e])}
    {@const exp = game.elders[e] ?? 0}
    <div class="ehead">
      <Portrait look={LOOK[e]} size={84} />
      <div>
        <h2>{L.elders[e].name}</h2>
        <p class="sub">{L.elders[e].title} · {L.units[d.type]}</p>
        <p class="lore">{L.elders[e].lore}</p>
      </div>
      <button class="sheet-x" onclick={() => (open = null)} aria-label={L.panel.close}><Icon name="close" size={18} /></button>
    </div>
    <h3>{L.lv(lv)} · {L.monHa.exp}</h3>
    {#if lv < ELDER_MAX}
      <span class="bar"><i style:width="{((exp - expAt(lv)) / (expAt(lv + 1) - expAt(lv))) * 100}%"></i></span>
      <p class="muted small">{num(exp - expAt(lv))}/{num(expAt(lv + 1) - expAt(lv))}</p>
    {:else}
      <p class="muted small">{L.monHa.maxLevel}</p>
    {/if}
    <p class="lead"><Icon name="power" size={14} />{L.monHa.leads} +{Math.round((lv - 1) * 4)}% {L.stat.atk.toLowerCase()}, {L.stat.hp.toLowerCase()}</p>
    <h3>{L.monHa.skill}</h3>
    <div class="skill">
      <Icon name="bolt" size={20} />
      <span><b>{L.elders[e].skill}</b><small>{L.skillText(d.skill)}</small></span>
    </div>
    <h3>{L.monHa.passive}</h3>
    {#each d.passives as p, i (i)}
      <div class="skill" class:off={lv < p.at}>
        {#if lv < p.at}<Icon name="lock" size={18} />{:else}<Icon name="check" size={18} />{/if}
        <span><b>{L.elders[e].passives[i]} · {L.monHa.passiveAt(p.at)}</b><small>{L.bonus(p.key, p.v)}</small></span>
      </div>
    {/each}
    {#if game.items.boiNguyen && lv < ELDER_MAX}
      <button class="btn gold wide feed" onclick={() => act({ type: 'feed', elder: e, n: 1 }) && sfx('reward')}>
        <Icon name="boiNguyen" size={22} />{L.monHa.feed(game.items.boiNguyen)}
      </button>
    {/if}
  {/if}
</Sheet>

<style>
  .elders {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 0;
    list-style: none;
  }
  .elder {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    padding: 10px;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .elder.locked {
    cursor: default;
    opacity: 0.8;
  }
  .info {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .info b {
    font-size: 13.5px;
    line-height: 1.2; /* tên dài (Mộc Thanh Phong) xuống dòng, không cắt */
  }
  .info small {
    font-size: 11px;
    color: var(--wash);
  }
  .hint {
    display: flex;
    gap: 4px;
  }
  .lvrow {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lv {
    font-size: 12px;
    font-weight: 700;
    color: var(--gold-d);
  }
  .exp {
    flex: 1;
    height: 4px;
    background: #e6dcc3;
  }
  .st {
    font-size: 11px;
    color: #3f7a4f;
  }
  .st.away {
    color: var(--cinnabar);
  }
  .grid {
    display: grid;
    grid-template-columns: 1.6fr repeat(3, 1fr);
    gap: 8px 6px;
    align-items: center;
  }
  .th {
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    color: var(--wash);
  }
  .rowh {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rowh span {
    display: grid;
  }
  .rowh b {
    font-size: 13px;
  }
  .rowh small {
    font-size: 10.5px;
    color: var(--wash);
  }
  .cell {
    display: grid;
    justify-items: center;
    padding: 6px 0;
    background: #f4eddb;
    border-radius: 8px;
  }
  .cell b {
    font-size: 15px;
  }
  .cell small {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 10.5px;
    color: var(--cinnabar);
  }
  .cell.zero b {
    color: #b3a88f;
  }
  .recruit {
    margin-top: 10px;
  }
  .wounded {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .wounded p {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
  }
  .ehead {
    position: relative;
    display: flex;
    gap: 14px;
    align-items: center;
    margin: 0 -16px;
    padding: 18px 48px 14px 16px;
    color: var(--ink);
    background: linear-gradient(135deg, #cfe0e2, #eef3ee 60%, #d8e6dc);
    border-radius: 18px 18px 0 0;
  }
  .ehead h2 {
    font-size: 20px;
  }
  .sub {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--azurite);
  }
  .lore {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.45;
    color: #3d4c52;
  }
  .small {
    margin-top: 4px;
    font-size: 12px;
  }
  .lead {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    font-size: 13px;
    color: #9be3a5;
  }
  .skill {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
    padding: 10px 12px;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(201 161 74 / 0.35);
    border-radius: 12px;
  }
  .skill span {
    display: grid;
    gap: 2px;
  }
  .skill b {
    font-size: 14px;
  }
  .skill small {
    font-size: 12.5px;
    color: #c9d4d7;
  }
  .skill.off {
    opacity: 0.55;
  }
  .skill :global(svg) {
    flex: none;
    color: var(--gold-l);
  }
  .feed {
    margin-top: 8px;
  }
</style>
