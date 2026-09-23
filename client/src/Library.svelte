<script lang="ts">
  // Tàng Kinh Các: 20 công pháp chia 5 hàng, hàng sau mở theo tầng Tàng Kinh Các. Mỗi lúc lĩnh ngộ một môn.
  import { TECHS, TECH_IDS, TECH_ROWS, techCost, techError, techTime, type Action, type State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import Cost from './Cost.svelte'
  import JobRow from './JobRow.svelte'
  import { L, clock, sfx } from './lib'

  let { game, now, act }: { game: State; now: number; act: (a: Action) => State | null } = $props()
</script>

{#if game.study}
  <JobRow {game} {now} kind="study" label={L.library.doing(L.techs[game.study.tech], game.study.level)} {act} />
{/if}

{#each TECH_ROWS as need, row (row)}
  {@const open = game.levels.tangKinhCac >= need}
  <h3 class:off={!open}>
    {#if !open}<Icon name="lock" size={11} />{/if}
    {L.library.row(need)}
  </h3>
  <ul class="techs">
    {#each TECH_IDS.filter(t => TECHS[t].row === row) as t (t)}
      {@const d = TECHS[t]}
      {@const lv = game.tech[t] ?? 0}
      {@const err = techError(game, t)}
      {@const doing = game.study?.tech === t}
      <li class:off={!open}>
        <div class="top">
          <Icon name="scroll" size={26} />
          <div class="name">
            <b>{L.techs[t]}</b>
            <small>
              {#if lv === 0}
                {L.bonus(d.key, d.v)}
              {:else}
                {L.bonus(d.key, d.v * lv)}
                {#if lv < d.max}<span class="to"><Icon name="arrow" size={11} />{L.bonus(d.key, d.v * (lv + 1)).split(' ').at(-1)}</span>{/if}
              {/if}
            </small>
          </div>
          <span class="lv">{lv}/{d.max}</span>
        </div>
        {#if lv >= d.max}
          <p class="done">{L.library.maxed}</p>
        {:else if open && !doing}
          <div class="act">
            <Cost have={game.res} cost={techCost(t, lv + 1)} small />
            <button class="btn small" disabled={!!err} onclick={() => act({ type: 'study', tech: t }) && sfx('build')}>
              {L.library.go}<span class="tm"><Icon name="clock" size={12} />{clock(techTime(t, lv + 1))}</span>
            </button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/each}

<style>
  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  h3.off {
    color: #93a1a6 !important;
  }
  .techs {
    display: grid;
    gap: 8px;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    gap: 8px;
    padding: 10px;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(201 161 74 / 0.3);
    border-radius: 12px;
  }
  li.off {
    opacity: 0.5;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .name {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .name b {
    font-size: 14px;
  }
  .name small {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #b9c6ca;
  }
  .to {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: #9be3a5;
  }
  .lv {
    font-size: 13px;
    font-weight: 700;
    color: var(--gold-l);
  }
  .act {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .act .btn {
    flex: none;
    white-space: nowrap;
  }
  .tm {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-left: 6px;
    font-size: 11px;
    opacity: 0.85;
  }
  .done {
    font-size: 12px;
    color: var(--gold-l);
  }
</style>
