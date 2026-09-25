<script lang="ts">
  // Đạo thống (Civilization của RoK) trong bảng Chủ điện: đạo thống đang theo và hai tăng ích; chưa chọn thì bày năm đạo thống
  // để chọn (miễn phí); đã chọn thì "Đổi" mở danh sách, đổi lại được sau DAO_COOL.
  import {
    DAOS,
    DAO_COOL,
    DAO_HALL,
    DAO_IDS,
    STRATS,
    STRAT_HALL,
    STRAT_IDS,
    type Bonus,
    type DaoId,
    type StratId,
  } from '@rok/rules'
  import { Button, Card, Section } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'

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

{#if game.levels.chuDien >= DAO_HALL}
  <Section title={L.dao.title}>
    <p class="t-small t-lore">{L.dao.lore}</p>
    {#if game.dao && !open}
      <Card tone="silk">
        <div class="row between">
          <span class="stack" style:--gap="2px">
            <b>{L.dao.names[game.dao.id].name}</b>
            {#each fx(game.dao.id) as f (f)}<small class="t-small t-good">{f}</small>{/each}
          </span>
          <Button size="sm" variant="ghost" disabled={wait > 0} onclick={() => (open = true)}>{L.dao.change}</Button>
        </div>
        {#if wait > 0}<small class="t-tiny t-soft">{L.dao.wait(wait >= 3_600_000 ? L.ago(wait) : clock(wait))}</small
          >{/if}
      </Card>
    {:else}
      <ul class="stack rows">
        {#each DAO_IDS as id (id)}
          <li>
            <Card selected={game.dao?.id === id} onclick={() => pick(id)} label={L.dao.names[id].name}>
              <span class="stack" style:--gap="2px">
                <b>{L.dao.names[id].name}</b>
                <small class="t-tiny t-soft">{L.dao.names[id].desc}</small>
                <small class="t-small t-good">{fx(id).join(' · ')}</small>
              </span>
            </Card>
          </li>
        {/each}
      </ul>
      {#if game.dao}<Button size="sm" variant="quiet" onclick={() => (open = false)}>{L.dao.keep}</Button>{/if}
    {/if}
  </Section>
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
