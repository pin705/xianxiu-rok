<script lang="ts">
  // Đạo thống (Civilization của RoK) trong bảng Chủ điện: đạo đang theo (huy hiệu, ba tiềm năng); "Cải tu" mở màn chọn lớn
  // (DaoChoose, như lúc lập tông môn), đổi lại được sau DAO_COOL. Save cũ chưa theo đạo nào: chọn miễn phí.
  import {
    DAOS,
    DAO_COOL,
    DAO_HALL,
    STRATS,
    STRAT_HALL,
    STRAT_IDS,
    type Bonus,
    type DaoId,
    type StratId,
  } from '@rok/rules'
  import { DAO_TONES } from '@rok/art'
  import { Button, Card, Medal, Section, Sheet } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'
  import DaoChoose from './DaoChoose.svelte'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  let open = $state(false)
  const fx = (id: DaoId) => Object.entries(DAOS[id]).map(([k, v]) => L.bonus(k as Bonus, v as number))
  const sfx2 = (id: StratId) => Object.entries(STRATS[id]).map(([k, v]) => L.bonus(k as Bonus, v as number))
  const wait = $derived(game.dao ? game.dao.at + DAO_COOL - now : 0)
  function pick(id: DaoId) {
    if (g.act({ type: 'dao', id }, 'reward')) open = false
  }
</script>

{#if game.levels.chuDien >= DAO_HALL || game.dao}
  <Section title={L.dao.title}>
    <p class="t-small t-lore">{L.dao.lore}</p>
    <Card tone="silk">
      <div class="row between">
        {#if game.dao}
          <span class="row" style:--gap="10px">
            <Medal emblem={game.dao.id} tone={DAO_TONES[game.dao.id]} size={48} />
            <span class="stack" style:--gap="2px">
              <b>{L.dao.names[game.dao.id].name}</b>
              {#each fx(game.dao.id) as f (f)}<small class="t-small t-good">{f}</small>{/each}
            </span>
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={wait > 0 || game.levels.chuDien < DAO_HALL}
            onclick={() => (open = true)}>{L.dao.change}</Button
          >
        {:else}
          <small class="t-small">{L.tips.dao.text}</small>
          <Button size="sm" variant="gold" onclick={() => (open = true)}>{L.dao.pick}</Button>
        {/if}
      </div>
      {#if wait > 0}<small class="t-tiny t-soft">{L.dao.wait(wait >= 3_600_000 ? L.ago(wait) : clock(wait))}</small
        >{/if}
    </Card>
  </Section>
  <Sheet {open} onclose={() => (open = false)} center title={L.dao.pick} lore={L.dao.pickHint}>
    {#if open}
      <DaoChoose
        value={game.dao?.id}
        current={game.dao?.id}
        go={game.dao ? L.dao.change : L.dao.go}
        compact
        onpick={pick}
      />
    {/if}
  </Sheet>
{/if}

<!-- Chiến lược mùa (Seasonal Strategies của RoK): mỗi mùa chọn một, miễn phí; luân hồi thì chọn lại -->
{#if game.levels.chuDien >= STRAT_HALL}
  <Section title={L.strat.title}>
    <p class="t-small t-lore">{L.strat.lore}</p>
    <ul class="stack rows">
      {#each STRAT_IDS as id (id)}
        <li>
          <Card
            selected={game.strat === id}
            onclick={game.strat ? undefined : () => g.act({ type: 'strat', id }, 'reward')}
            label={L.strat.names[id][0]}
          >
            <span class="stack" style:--gap="2px">
              <b
                >{L.strat.names[id][0]}{#if game.strat === id}
                  · {L.strat.chosen}{/if}</b
              >
              <small class="t-tiny t-soft">{L.strat.names[id][1]}</small>
              <small class="t-small t-good">{sfx2(id).join(' · ')}</small>
            </span>
          </Card>
        </li>
      {/each}
    </ul>
  </Section>
{/if}

<style>
  .rows {
    padding: 0;
    margin: 0;
    list-style: none;
  }
</style>
