<script lang="ts">
  // Tàng Kinh Các: 20 công pháp chia 5 hàng, hàng sau mở theo tầng Tàng Kinh Các. Mỗi lúc lĩnh ngộ một môn.
  import { TECHS, TECH_IDS, TECH_ROWS, techCost, techError, techTime } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Section } from './ui'
  import JobRow from './JobRow.svelte'
  import { L, clock } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act
</script>

{#if game.study}
  <div class="mt-3">
    <JobRow kind="study" label={L.library.doing(L.techs[game.study.tech], game.study.level)} />
  </div>
{/if}

{#each TECH_ROWS as need, row (row)}
  {@const open = game.levels.tangKinhCac >= need}
  <Section title={L.library.row(need)}>
    {#snippet aside()}{#if !open}<Icon name="lock" size={13} />{/if}{/snippet}
    <ul class="stack" class:off={!open}>
      {#each TECH_IDS.filter(t => TECHS[t].row === row) as t (t)}
        {@const d = TECHS[t]}
        {@const lv = game.tech[t] ?? 0}
        {@const err = techError(game, t)}
        {@const doing = game.study?.tech === t}
        <li>
          <Card>
            <div class="stack">
              <div class="row">
                <Icon name="scroll" size={28} />
                <span class="grow stack" style:--gap="1px">
                  <b>{L.techs[t]}</b>
                  <small class="t-small t-soft">
                    {L.bonus(d.key, d.v * Math.max(1, lv))}
                    {#if lv && lv < d.max}<span class="t-good">
                        → {L.bonus(d.key, d.v * (lv + 1))
                          .split(' ')
                          .at(-1)}</span
                      >{/if}
                  </small>
                </span>
                <b class="t-num t-gold">{lv}/{d.max}</b>
              </div>
              {#if lv >= d.max}
                <p class="t-small t-gold t-strong">{L.library.maxed}</p>
              {:else if open && !doing}
                <div class="row between">
                  <Bag res={techCost(t, lv + 1)} have={game.res} size="sm" />
                  <Button
                    size="sm"
                    trail={clock(techTime(t, lv + 1))}
                    disabled={!!err}
                    onclick={() => act({ type: 'study', tech: t }, 'build')}>{L.library.go}</Button
                  >
                </div>
              {/if}
            </div>
          </Card>
        </li>
      {/each}
    </ul>
  </Section>
{/each}

<style>
  .off {
    opacity: 0.55;
  }
</style>
