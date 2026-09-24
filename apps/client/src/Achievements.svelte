<script lang="ts">
  // Thành tựu (như Achievements của RoK): mỗi dòng một thành tựu — tên, bậc, thanh tiến độ tới bậc kế, quà bậc kế, nút Nhận.
  // Thành tựu đang chờ nhận lên đầu, rồi tới cái gần xong nhất.
  import { ACH_IDS, ACH_REWARDS, ACHS, achGot, achNext, achReady, achValue, type AchId } from '@rok/rules'
  import { Bag, Button, Card, Meter } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  const part = (id: AchId) => {
    const next = achNext(game, id)
    return next === undefined ? 1 : Math.min(1, achValue(game, id) / next)
  }
  const list = $derived(
    [...ACH_IDS].sort((a, b) => Number(achReady(game, b)) - Number(achReady(game, a)) || part(b) - part(a)),
  )
</script>

<ul class="stack rows">
  {#each list as id (id)}
    {@const next = achNext(game, id)}
    {@const got = achGot(game, id)}
    <li>
      <Card tone={achReady(game, id) ? 'glow' : undefined}>
        <div class="stack" style:--gap="4px">
          <p class="row between">
            <b class="t-small">{L.ach.names[id]}</b>
            <small class="t-soft">{L.ach.tier(got, ACHS[id].tiers.length)}</small>
          </p>
          {#if next === undefined}
            <small class="t-good">{L.ach.done}</small>
          {:else}
            <p class="row between t-small">
              <Meter value={part(id)} size="sm" /><span class="t-num t-soft"
                >{num(Math.min(achValue(game, id), next))}/{num(next)}</span
              >
            </p>
            <div class="row between">
              <Bag res={ACH_REWARDS[got].res} items={ACH_REWARDS[got].items} size="sm" />
              {#if achReady(game, id)}
                <Button size="sm" variant="gold" onclick={() => act({ type: 'ach', id }, 'reward')}>{L.ach.claim}</Button>
              {/if}
            </div>
          {/if}
        </div>
      </Card>
    </li>
  {/each}
</ul>

<style>
  .rows {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .rows :global(.meter) {
    flex: 1;
  }
</style>
