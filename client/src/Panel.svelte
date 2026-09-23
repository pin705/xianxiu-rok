<script lang="ts">
  // Bảng công trình: mở khi chạm vào công trình trên núi.
  import {
    BUILDINGS, MAX_LEVEL, RESOURCES, buildTime, capAt, cost, upgradeError, type BuildingId, type State,
  } from '@rok/rules'
  import { Art, Defs, Icon } from '@rok/art'
  import { L, SEAL, clock, num } from './lib'

  let {
    game,
    now,
    id,
    onupgrade,
    onclose,
    onselect,
  }: {
    game: State
    now: number
    id: BuildingId | null
    onupgrade: (id: BuildingId) => void
    onclose: () => void
    onselect: (id: BuildingId) => void
  } = $props()

  let dlg = $state<HTMLDialogElement>()
  $effect(() => {
    if (!dlg) return
    if (id && !dlg.open) dlg.showModal()
    if (!id && dlg.open) dlg.close()
  })
</script>

<dialog bind:this={dlg} class="panel" onclose={onclose} onclick={e => e.target === dlg && dlg?.close()} aria-labelledby="panel-title">
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
      <button class="x" onclick={() => dlg?.close()} aria-label={L.panel.close}><Icon name="close" size={18} /></button>
    </div>

    {#if locked}
      <div class="rows">
        <p class="row bad"><Icon name="lock" size={16} />{L.panel.locked(d.unlock)}</p>
      </div>
      <button class="go alt" onclick={() => onselect('chuDien')}>{L.panel.goTo}: {L.b.chuDien.name}</button>
    {:else}
      <dl class="rows">
        {#if d.makes}
          <div class="row">
            <dt>{L.panel.output}</dt>
            <dd>
              <Icon name={d.makes} size={16} />{num((d.rate ?? 0) * lv)}
              {#if lv < MAX_LEVEL}<span class="to"><Icon name="arrow" size={14} />{num((d.rate ?? 0) * next)}</span>{/if}
              <small>{L.panel.perHour}</small>
            </dd>
          </div>
        {:else if id === 'tangBaoCac'}
          <div class="row">
            <dt>{L.panel.capacity}</dt>
            <dd>{num(capAt(lv))}{#if lv < MAX_LEVEL}<span class="to"><Icon name="arrow" size={14} />{num(capAt(next))}</span>{/if}</dd>
          </div>
        {:else if L.soon[id]}
          <div class="row">
            <dt>{L.soon[id]}</dt>
            <dd class="soon">{L.soonTag}</dd>
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
        {@const p = Math.min(1, 1 - (job.finishAt - now) / buildTime(id, job.level))}
        <div class="progress">
          <p>{L.panel.upgrading(job.level)} <b>{clock(job.finishAt - now)}</b></p>
          <span class="bar"><i style:width="{p * 100}%"></i></span>
        </div>
      {:else if err === 'max_level'}
        <p class="maxed">{L.panel.maxed}</p>
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
          {#each RESOURCES as r (r)}
            {#if c[r]}
              <li class:ok={game.res[r] >= c[r]}>
                <Icon name={r} size={18} />
                <b>{num(c[r])}</b>
                {#if game.res[r] < c[r]}<small>{L.panel.have(num(game.res[r]))}</small>{/if}
                <span class="sr">{L.res[r]}</span>
              </li>
            {/if}
          {/each}
        </ul>
        <button class="go" disabled={!!err} onclick={() => onupgrade(id)}>
          <span>{lv ? L.panel.upgrade : L.panel.build}</span>
          <span class="t"><Icon name="clock" size={15} />{clock(buildTime(id, next))}</span>
        </button>
      {/if}
    {/if}
  {/if}
</dialog>

<style>
  .panel {
    width: min(100%, 480px);
    max-width: 100%;
    max-height: 86dvh;
    margin: auto auto 0;
    padding: 0 16px calc(16px + env(safe-area-inset-bottom));
    color: #f6f1e4;
    background: linear-gradient(#1a2c36, #0f1d25);
    border: 0;
    border-top: 1px solid var(--gold);
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -10px 30px rgb(0 0 0 / 0.35);
  }
  .panel[open] {
    animation: up 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  @keyframes up {
    from {
      transform: translateY(40%);
      opacity: 0;
    }
  }
  .panel::backdrop {
    background: rgb(8 16 22 / 0.45);
  }

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
  .x {
    position: absolute;
    top: 10px;
    right: 10px;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--ink);
    background: rgb(255 255 255 / 0.6);
    border: 0;
    border-radius: 50%;
    cursor: pointer;
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
  .soon {
    font-weight: 400;
    color: #b9c6ca;
  }

  h3 {
    margin: 16px 0 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold-l);
  }
  .req {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0;
    list-style: none;
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
  .req b {
    font-size: 14px;
  }
  .req small {
    font-size: 11px;
    color: #ffb4a4;
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    width: 100%;
    min-height: 52px;
    margin-top: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(#2f6f9a, #1d4e73);
    border: 0;
    border-radius: 14px;
    box-shadow: inset 0 0 0 1.5px var(--gold-l), 0 4px 0 #0f2d44;
    cursor: pointer;
  }
  .go:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: inset 0 0 0 1.5px var(--gold-l), 0 1px 0 #0f2d44;
  }
  .go:disabled {
    color: #8c9aa0;
    background: #2a3a43;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
    cursor: default;
  }
  .go.alt {
    background: linear-gradient(#f8e3a0, #c9a14a);
    color: #2b2210;
    box-shadow: 0 4px 0 #7c5f22;
  }
  .t {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    font-size: 14px;
    font-weight: 600;
    background: rgb(0 0 0 / 0.25);
    border-radius: 8px;
  }
  .progress {
    margin-top: 16px;
  }
  .progress p {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
  .bar {
    display: block;
    height: 6px;
    margin-top: 8px;
    overflow: hidden;
    background: rgb(255 255 255 / 0.12);
    border-radius: 3px;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--spirit-ui);
    transition: width 0.25s linear;
  }
  .maxed {
    margin-top: 16px;
    color: var(--gold-l);
  }

  @media (prefers-reduced-motion: reduce) {
    .panel[open] {
      animation: none;
    }
  }
</style>
