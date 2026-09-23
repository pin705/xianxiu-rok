<script lang="ts">
  // Danh sách chiến báo, mới nhất trên cùng. Chạm để xem lại trận.
  import { RESOURCES, count, type Report, type State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import Sheet from './Sheet.svelte'
  import { L, num, reportName } from './lib'

  let { game, open, onclose, onopen }: { game: State; open: boolean; onclose: () => void; onopen: (r: Report) => void } = $props()

  const list = $derived([...game.reports].reverse())
</script>

<Sheet {open} {onclose} label={L.report.title}>
  <div class="head">
    <h2><Icon name="scroll" size={22} />{L.report.title}</h2>
    <button class="sheet-x" onclick={onclose} aria-label={L.panel.close}><Icon name="close" size={18} /></button>
  </div>
  {#if !list.length}
    <p class="muted empty">{L.report.none}</p>
  {/if}
  <ul>
    {#each list as r (r.id)}
      {@const loot = RESOURCES.reduce((s, x) => s + (r.gain.res[x] ?? 0), 0)}
      <li>
        <button class:win={r.win} onclick={() => onopen(r)}>
          <span class="mark">{r.win ? '✓' : '✗'}</span>
          <span class="body">
            <b>{reportName(r)}{r.f !== undefined ? ` · ${L.level(r.f + 1)}` : ''}</b>
            <small>
              {r.win ? L.report.win : L.report.lose} · {L.ago(Math.max(60_000, game.time - r.at))}
              {#if count(r.hurt)} · {L.report.hurt} {num(count(r.hurt))}{/if}
              {#if loot} · +{num(loot)}{/if}
            </small>
          </span>
          <Icon name="arrow" size={16} />
        </button>
      </li>
    {/each}
  </ul>
</Sheet>

<style>
  .head {
    position: relative;
    padding: 18px 0 6px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 19px;
    color: var(--gold-l);
  }
  .head .sheet-x {
    top: 14px;
    right: 0;
  }
  .empty {
    padding: 24px 0;
    text-align: center;
  }
  ul {
    display: grid;
    gap: 8px;
    margin-top: 8px;
    padding: 0;
    list-style: none;
  }
  li button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    color: inherit;
    text-align: left;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(194 59 34 / 0.5);
    border-radius: 12px;
    cursor: pointer;
  }
  li button.win {
    border-color: rgb(201 161 74 / 0.45);
  }
  .mark {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    font-weight: 700;
    color: #fff;
    background: var(--cinnabar);
    border-radius: 50%;
  }
  .win .mark {
    color: #2b2210;
    background: var(--gold-l);
  }
  .body {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .body b {
    font-size: 14px;
  }
  .body small {
    font-size: 12px;
    color: #b9c6ca;
  }
</style>
