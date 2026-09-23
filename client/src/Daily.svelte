<script lang="ts">
  // Nhiệm vụ ngày: 4 việc quen tay mỗi phiên, xong cả 4 thì mở rương. Làm mới lúc 0h giờ VN.
  import { DAILY, DAILY_BONUS, RESOURCES, dailyDone, dailyReward, nextDay, type Action, type State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Meter, Sheet, fly } from './ui'
  import { L, clock, num, sfx } from './lib'

  let { game, now, open, onclose, act }: { game: State; now: number; open: boolean; onclose: () => void; act: (a: Action) => State | null } =
    $props()

  const all = $derived(game.daily.got.every(Boolean))
  const each = $derived(Object.fromEntries(RESOURCES.map(r => [r, dailyReward(game)])))
</script>

<Sheet {open} {onclose} title={L.daily.title} sub={L.daily.reset(clock(nextDay(now) - now))}>
  <ul class="stack mt-2">
    {#each DAILY as d, i (d.id)}
      {@const n = Math.min(game.daily.n[d.id], d.n)}
      {@const got = game.daily.got[i]}
      <li>
        <Card tone={dailyDone(game, i) && !got ? 'glow' : 'paper'}>
          <div class="row">
            <span class="grow stack" style:--gap="4px">
              <b>{L.daily.task[d.id](d.n)}</b>
              <Meter value={n / d.n} tone="gold" size="sm" />
              <span class="row t-small"><b class="t-num">{num(n)}/{num(d.n)}</b><Bag res={each} size="sm" /></span>
            </span>
            {#if got}
              <span class="t-good"><Icon name="check" size={22} /></span>
            {:else}
              <Button variant="gold" size="sm" disabled={!dailyDone(game, i)} onclick={e => act({ type: 'daily', i }) && (sfx('reward'), fly(e.currentTarget as Element, each))}>{L.quest.claim}</Button>
            {/if}
          </div>
        </Card>
      </li>
    {/each}
  </ul>
  <div class="mt-3">
    <Card tone={all && !game.daily.bonus ? 'glow' : 'lacquer'}>
      <div class="row" class:on-dark={!(all && !game.daily.bonus)}>
        <Icon name="star" size={30} />
        <span class="grow stack" style:--gap="4px"><b>{L.daily.bonus}</b><Bag items={DAILY_BONUS} size="sm" named /></span>
        {#if game.daily.bonus}
          <span class="t-good"><Icon name="check" size={22} /></span>
        {:else}
          <Button variant="gold" size="sm" disabled={!all} onclick={e => act({ type: 'dailyBonus' }) && (sfx('win'), fly(e.currentTarget as Element, DAILY_BONUS))}>{L.daily.open}</Button>
        {/if}
      </div>
    </Card>
  </div>
</Sheet>
