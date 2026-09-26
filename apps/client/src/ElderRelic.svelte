<script lang="ts">
  // Anh Linh Điện (Museum của RoK — luật ở rules/sect/honor.ts relic): trong mùa giới, cung phụng di vật cho trưởng lão bằng Phi Thăng
  // Tệ, mỗi bậc thêm công / thủ / sinh lực cho đội người đó dẫn; tối đa RELIC_MAX trưởng lão mỗi mùa, hết mùa di vật tan
  import {
    RELIC_BONUS,
    RELIC_COST,
    RELIC_HALL,
    RELIC_MAX,
    coins,
    relicError,
    type Bonus,
    type ElderId,
  } from '@rok/rules'
  import { Button, Card, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  let { elder }: { elder: ElderId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const lv = $derived(game.relics?.[elder] ?? 0)
  const why = $derived(relicError(game, elder))
  const fx = (n: number) =>
    Object.entries(RELIC_BONUS)
      .map(([k, v]) => L.bonus(k as Bonus, (v ?? 0) * n))
      .join(' · ')
</script>

{#if game.seat && game.levels.chuDien >= RELIC_HALL}
  <Card>
    <div class="stack" style:--gap="6px">
      <p class="row between">
        <b class="t-small">{L.relic.title}</b><small class="t-tiny t-soft"
          >{L.relic.used(Object.keys(game.relics ?? {}).length, RELIC_MAX)}</small
        >
      </p>
      <small class="t-tiny t-soft">{L.relic.hint}</small>
      {#if lv}<Tag icon="star" tone="gold">{L.relic.lv(lv, RELIC_COST.length)} · {fx(lv)}</Tag>{/if}
      {#if lv < RELIC_COST.length}
        <Button
          size="sm"
          variant="gold"
          disabled={!!why || g.busy}
          onclick={() => g.act({ type: 'relic', elder }, 'reward')}
          >{L.relic.go(RELIC_COST[lv], num(coins(game)))}</Button
        >
        {#if why === 'limit'}<small class="t-tiny t-bad">{L.relic.full}</small>{/if}
        <small class="t-tiny t-soft">{L.relic.next(fx(lv + 1))}</small>
      {/if}
    </div>
  </Card>
{/if}
