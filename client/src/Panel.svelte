<script lang="ts">
  // Bảng công trình: mở khi chạm vào công trình trên núi. Công trình có chức năng thì thêm thẻ (tuyển, luyện đan, công pháp).
  // Chủ điện ở tầng 5, 10: thay nâng cấp bằng độ kiếp. Tầng 15: luân hồi.
  import {
    BUILDINGS, MAX_LEVEL, TECH_ROWS, TRIBS, batch, buildTime, capAt, cost, hospital, marchSlots, might, mob, rate, tribError,
    upgradeError,
    type Action, type Army, type BuildingId, type ElderId, type State,
  } from '@rok/rules'
  import { Art, Defs, Icon } from '@rok/art'
  import Alchemy from './Alchemy.svelte'
  import ArmyPick from './Army.svelte'
  import Cost from './Cost.svelte'
  import JobRow from './JobRow.svelte'
  import Library from './Library.svelte'
  import Sheet from './Sheet.svelte'
  import Train from './Train.svelte'
  import Unit from './Unit.svelte'
  import { GLYPH, L, SEAL, clock, num } from './lib'

  let {
    game,
    now,
    id,
    view,
    act,
    onupgrade,
    onclose,
    onselect,
    ontrib,
    onrebirth,
  }: {
    game: State
    now: number
    id: BuildingId | null
    view: string | null
    act: (a: Action) => State | null
    onupgrade: (id: BuildingId) => void
    onclose: () => void
    onselect: (id: BuildingId, view?: string | null) => void
    ontrib: (elder: ElderId, army: Army, pill: boolean) => void
    onrebirth: () => void
  } = $props()

  const FN: Partial<Record<BuildingId, [string, string]>> = {
    dienVoTruong: ['train', L.train.tab],
    danPhong: ['alchemy', L.b.danPhong.name],
    tangKinhCac: ['library', L.library.tab],
  }
  // Thẻ người chơi đã chọn, nhớ theo công trình: mở công trình khác thì về thẻ mặc định
  let picked = $state<{ id: BuildingId | null; tab: string } | null>(null)
  const fn = $derived(id && game.levels[id] > 0 ? FN[id] : undefined)
  const tab = $derived(picked?.id === id ? picked.tab : fn ? (view ?? fn[0]) : 'upgrade')
  let pill = $state(true)
  let sure = $state(false)
  const waveMight = (str: number, tier: 1 | 2 | 3, type: 'kiem' | 'phap' | 'the') => might(mob(str, tier, [[type, 1]]))
</script>

<Sheet open={!!id} {onclose} label={id ? L.b[id].name : ''}>
  {#if id}
    {@const d = BUILDINGS[id]}
    {@const lv = game.levels[id]}
    {@const next = lv + 1}
    {@const hall = game.levels.chuDien}
    {@const need = id === 'chuDien' ? 0 : Math.max(next, d.unlock)}
    {@const locked = lv === 0 && hall < d.unlock}
    {@const job = game.queue.find(j => j.building === id)}
    {@const err = upgradeError(game, id)}
    {@const c = cost(id, Math.min(next, MAX_LEVEL))}
    {@const tr = TRIBS[game.trib]}
    <div class="head">
      <div class="art">
        <svg viewBox="-68 -116 136 128" aria-hidden="true">
          <Defs />
          <ellipse cy="2" rx="62" ry="9" fill="rgb(0 0 0 / .12)" />
          <Art {id} level={Math.max(lv, 1)} glyph={SEAL[id]} />
        </svg>
      </div>
      <div class="title">
        <h2 id="panel-title">{L.b[id].name}</h2>
        <p class="lvl">{lv ? L.level(lv) : L.panel.notBuilt}</p>
        <p class="lore">{L.b[id].lore}</p>
      </div>
      <button class="sheet-x" onclick={onclose} aria-label={L.panel.close}><Icon name="close" size={18} /></button>
    </div>

    {#if fn}
      <div class="tabs" role="tablist">
        <button role="tab" aria-selected={tab === fn[0]} class:on={tab === fn[0]} onclick={() => (picked = { id, tab: fn[0] })}>{fn[1]}</button>
        <button role="tab" aria-selected={tab === 'upgrade'} class:on={tab === 'upgrade'} onclick={() => (picked = { id, tab: 'upgrade' })}>{L.panel.upgrade}</button>
      </div>
    {/if}

    {#if tab === 'train'}
      <Train {game} {now} {act} />
    {:else if tab === 'alchemy'}
      <Alchemy {game} {now} {act} />
    {:else if tab === 'library'}
      <Library {game} {now} {act} />
    {:else if locked}
      <div class="rows">
        <p class="row bad"><Icon name="lock" size={16} />{L.panel.locked(d.unlock)}</p>
      </div>
      <button class="btn gold wide go" onclick={() => onselect('chuDien')}>{L.panel.goTo}: {L.b.chuDien.name}</button>
    {:else}
      <dl class="rows">
        {#if d.makes}
          <div class="row">
            <dt>{L.panel.output}</dt>
            <dd>
              <Icon name={d.makes} size={16} />{num(rate(game, d.makes))}
              {#if lv < MAX_LEVEL}<span class="to"><Icon name="arrow" size={14} />{num(rate({ ...game, levels: { ...game.levels, [id]: next } }, d.makes))}</span>{/if}
              <small>{L.panel.perHour}</small>
            </dd>
          </div>
        {:else if id === 'tangBaoCac'}
          <div class="row">
            <dt>{L.panel.capacity}</dt>
            <dd>{num(capAt(lv))}{#if lv < MAX_LEVEL}<span class="to"><Icon name="arrow" size={14} />{num(capAt(next))}</span>{/if}</dd>
          </div>
        {:else if id === 'dienVoTruong'}
          <div class="row">
            <dt>{L.panel.batch}</dt>
            <dd>{num(batch(game))}{#if lv < MAX_LEVEL}<span class="to"><Icon name="arrow" size={14} />{num(batch({ ...game, levels: { ...game.levels, [id]: next } }))}</span>{/if}</dd>
          </div>
        {:else if id === 'danPhong'}
          <div class="row">
            <dt>{L.panel.hospital}</dt>
            <dd>{num(hospital(game))}{#if lv < MAX_LEVEL}<span class="to"><Icon name="arrow" size={14} />{num(hospital({ ...game, levels: { ...game.levels, [id]: next } }))}</span>{/if}</dd>
          </div>
        {:else if id === 'tangKinhCac'}
          <div class="row">
            <dt>{L.panel.rows}</dt>
            <dd>{TECH_ROWS.filter(r => r <= lv).length}/{TECH_ROWS.length}</dd>
          </div>
        {:else if id === 'chuDien'}
          <div class="row">
            <dt>{L.panel.slots}</dt>
            <dd>{marchSlots(game)}</dd>
          </div>
        {/if}
        {#if lv < MAX_LEVEL}
          <div class="row">
            <dt>{L.power}</dt>
            <dd class="up"><Icon name="power" size={14} />+{num(d.power * next)}</dd>
          </div>
        {/if}
      </dl>

      {#if job}
        <div class="go"><JobRow {game} {now} kind="build" label={L.panel.upgrading(job.level)} {act} /></div>
      {:else if err === 'trib' && tr}
        <!-- Độ kiếp -->
        {@const terr = tribError(game)}
        <h3>{L.trib.title}</h3>
        <p class="lore2">{L.trib.lore(L.realmName(tr.hall + 1))}</p>
        <ul class="waves">
          {#each tr.waves as w, i (i)}
            <li>
              <Unit type={w.type} tier={tr.tier} size={34} glyph={GLYPH.thunder} />
              <span><b>{L.report.wave(i + 1)}</b><small>{L.units[w.type]} · {L.army.might} {num(waveMight(w.str, tr.tier, w.type))}</small></span>
            </li>
          {/each}
        </ul>
        <h3>{L.trib.need}</h3>
        <Cost have={game.res} cost={cost('chuDien', tr.hall + 1)} />
        {#if terr === 'cooldown'}
          <p class="warn note">{L.trib.wait(clock(game.tribCool - now))}</p>
        {/if}
        {#if game.items.doKiep}
          <label class="pill">
            <input type="checkbox" bind:checked={pill} />
            <Icon name="doKiep" size={22} />{L.trib.pill} · {game.items.doKiep}
          </label>
        {/if}
        <ArmyPick
          {game}
          foe={tr.waves.reduce((s, w) => s + waveMight(w.str, tr.tier, w.type), 0)}
          cta={L.trib.go}
          disabled={!!terr}
          onsubmit={(e, a) => ontrib(e, a, pill && !!game.items.doKiep)}
          onrecruit={() => onselect('dienVoTruong', 'train')}
        />
      {:else if err === 'max_level'}
        {#if id === 'chuDien'}
          <!-- Luân hồi -->
          <h3>{L.rebirth.title}</h3>
          <p class="lore2">{L.rebirth.lore}</p>
          <div class="cols">
            <div><h4>{L.rebirth.keep}</h4><ul>{#each L.rebirth.keepList as x (x)}<li class="ok">{x}</li>{/each}</ul></div>
            <div><h4>{L.rebirth.lose}</h4><ul>{#each L.rebirth.loseList as x (x)}<li>{x}</li>{/each}</ul></div>
          </div>
          <p class="gain"><Icon name="star" size={16} />{L.rebirth.gain(game.rebirths)}</p>
          {#if game.marches.length}<p class="warn note">{L.rebirth.marching}</p>{/if}
          {#if sure}
            <p class="warn note">{L.rebirth.confirm}</p>
            <div class="two">
              <button class="btn ghost" onclick={() => (sure = false)}>{L.panel.close}</button>
              <button class="btn red" onclick={() => ((sure = false), onrebirth())}>{L.rebirth.go}</button>
            </div>
          {:else}
            <button class="btn gold wide go" disabled={!!game.marches.length} onclick={() => (sure = true)}>{L.rebirth.go}</button>
          {/if}
        {:else}
          <p class="maxed">{L.panel.maxed}</p>
        {/if}
      {:else}
        <h3>{L.panel.requires}</h3>
        <ul class="req">
          {#if need}
            <li class:ok={hall >= need}>
              <Icon name={hall >= need ? 'check' : 'cross'} size={14} />{L.panel.hall(need)}
              {#if hall < need}<button class="link" onclick={() => onselect('chuDien')}>{L.panel.goTo}</button>{/if}
            </li>
          {/if}
          {#if err === 'queue_full'}
            <li><Icon name="cross" size={14} />{L.panel.busy}</li>
          {/if}
        </ul>
        <Cost have={game.res} cost={c} />
        <button class="btn wide go" disabled={!!err} onclick={() => onupgrade(id)}>
          <span>{lv ? L.panel.upgrade : L.panel.build}</span>
          <span class="t"><Icon name="clock" size={15} />{clock(buildTime(game, id, next))}</span>
        </button>
      {/if}
    {/if}
  {/if}
</Sheet>

<style>
  .head {
    position: relative;
    display: grid;
    grid-template-columns: 132px 1fr;
    gap: 14px;
    align-items: center;
    margin: 0 -16px;
    padding: 16px 44px 14px 16px;
    background: linear-gradient(135deg, #cfe0e2, #eef3ee 60%, #d8e6dc);
    border-radius: 18px 18px 0 0;
    color: var(--ink);
  }
  .art svg {
    display: block;
    width: 132px;
    height: 124px;
  }
  h2 {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
  }
  .lvl {
    margin-top: 2px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--azurite);
  }
  .lore {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.45;
    color: #3d4c52;
  }
  .lore2 {
    font-size: 13px;
    line-height: 1.5;
    color: #c9d4d7;
  }
  .tabs {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: 4px;
    margin-top: 12px;
    padding: 4px;
    background: rgb(0 0 0 / 0.25);
    border-radius: 12px;
  }
  .tabs button {
    min-height: 36px;
    font-size: 14px;
    font-weight: 600;
    color: #b9c6ca;
    background: none;
    border: 0;
    border-radius: 9px;
    cursor: pointer;
  }
  .tabs .on {
    color: #2b2210;
    background: linear-gradient(#f8e3a0, #c9a14a);
  }

  .rows {
    display: grid;
    gap: 1px;
    margin: 14px 0 0;
    overflow: hidden;
    border: 1px solid rgb(201 161 74 / 0.35);
    border-radius: 12px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    font-size: 14px;
    background: rgb(255 255 255 / 0.05);
  }
  .row.bad {
    justify-content: flex-start;
    color: var(--gold-l);
  }
  dt {
    color: #b9c6ca;
  }
  dd {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin: 0;
    font-weight: 600;
  }
  dd small {
    font-weight: 400;
    color: #b9c6ca;
  }
  .to {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #9be3a5;
  }
  .to :global(svg) {
    color: var(--gold-l);
  }
  .up {
    color: #9be3a5;
  }
  .req {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
    padding: 0;
    list-style: none;
  }
  .req:empty {
    display: none;
  }
  .req li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    font-size: 13px;
    color: #ffb4a4;
    background: rgb(194 59 34 / 0.18);
    border: 1px solid rgb(194 59 34 / 0.6);
    border-radius: 10px;
  }
  .req li.ok {
    color: #f6f1e4;
    background: rgb(255 255 255 / 0.06);
    border-color: rgb(201 161 74 / 0.35);
  }
  .req li.ok > :global(svg:first-child) {
    color: #9be3a5;
  }
  .link {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    background: var(--gold-l);
    border: 0;
    border-radius: 6px;
    cursor: pointer;
  }
  .go {
    margin-top: 16px;
  }
  .maxed {
    margin-top: 16px;
    color: var(--gold-l);
  }
  .note {
    margin-top: 10px;
    font-size: 13px;
  }
  .waves {
    display: grid;
    gap: 8px;
    margin-top: 10px;
    padding: 0;
    list-style: none;
  }
  .waves li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: linear-gradient(90deg, rgb(92 64 160 / 0.3), rgb(255 255 255 / 0.03));
    border-radius: 12px;
  }
  .waves span {
    display: grid;
  }
  .waves small {
    font-size: 12px;
    color: #b9c6ca;
  }
  .pill {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 12px;
    font-size: 13.5px;
    background: rgb(155 120 230 / 0.15);
    border: 1px solid rgb(155 120 230 / 0.5);
    border-radius: 12px;
    cursor: pointer;
  }
  .pill input {
    accent-color: var(--gold);
  }
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 12px;
  }
  .cols h4 {
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--gold-l);
  }
  .cols ul {
    display: grid;
    gap: 4px;
    padding-left: 16px;
    font-size: 12.5px;
    color: #ffb4a4;
  }
  .cols li.ok {
    color: #9be3a5;
  }
  .gain {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--gold-l);
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
  }
</style>
