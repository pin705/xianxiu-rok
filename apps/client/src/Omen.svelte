<script lang="ts">
  // Bói Quẻ Thiên Cơ (Esmeralda's House của RoK — luật ở rules/sect/fest.ts omen): lắc ống xăm rút quẻ (mầm server — quẻ tới cùng
  // patch), quẻ vừa xin hiện thành thẻ quẻ có bậc và quà; mỗi ngày một quẻ miễn phí; rương mốc theo tổng số quẻ đã xin.
  import { FESTS, festDone, festGot, festTokens, spins, wheelFree, type FestId, type Metric } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card, Meter } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  let { id }: { id: FestId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const d = $derived.by(() => {
    const def = FESTS[id]
    return def.kind === 'omen' ? def : null
  })
  const tokens = $derived(festTokens(game, id))
  const free = $derived(wheelFree(game, id, now))
  const n = $derived(spins(game, id))
  // quẻ vừa xin: tối đa 10 quẻ cuối (bậc = −mã − 1)
  const last = $derived(
    (game.fest[id]?.got ?? [])
      .filter(x => x < 0)
      .slice(-10)
      .map(x => -x - 1),
  )
  const can = (k: number) => !!d && tokens >= d.cost * (k - (free ? 1 : 0))
  const draw = (k: number) => g.act({ type: 'spin', id, n: k as 1 | 10 }, 'reward')
</script>

{#if d}
  <Card tone="glow">
    <div class="stack" style:--gap="6px">
      <p class="row between">
        <b class="t-num t-gold">{L.fest.tokens(num(tokens), L.fest.tokenName[id])}</b>
        <small class="t-tiny t-soft">{free ? L.omen.free : L.omen.cost(d.cost)}</small>
      </p>
      <div class="grid" style:--cols="2" style:--gap="6px">
        <Button variant="gold" disabled={!can(1) || g.busy} onclick={() => draw(1)}>{L.omen.draw(1)}</Button>
        <Button variant="ghost" disabled={!can(10) || g.busy} onclick={() => draw(10)}>{L.omen.draw(10)}</Button>
      </div>
      <small class="t-tiny t-soft">{L.omen.count(n)}</small>
    </div>
  </Card>
  {#if last.length}
    <Card>
      <b class="t-small">{L.omen.last}</b>
      <ul class="stack plain mt-1" style:--gap="4px">
        {#each last as tier, k (k)}
          <li class="row">
            <Icon name="scroll" size={16} />
            <b class="t-small nowrap" class:t-gold={tier === 0} class:t-soft={tier === 3}>{L.omen.tiers[tier]}</b>
            <span class="grow"><Bag items={d.tiers[tier].r.items} size="sm" /></span>
          </li>
        {/each}
      </ul>
    </Card>
  {/if}
  <Card>
    <ul class="stack plain" style:--gap="2px">
      {#each Object.entries(d.stages[0]) as [m, v] (m)}
        <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
      {/each}
    </ul>
  </Card>
  <ol class="path">
    {#each d.goals as goal, i (i)}
      <li class:hit={n >= goal}>
        <Card tone={festDone(game, id, i) && !festGot(game, id, i) ? 'glow' : undefined}>
          <div class="stack" style:--gap="4px">
            <p class="row between">
              <b class="t-small">{L.omen.goal(goal)}</b><small class="t-num t-soft">{Math.min(n, goal)}/{goal}</small>
            </p>
            <Meter value={Math.min(1, n / goal)} size="sm" />
            <div class="row between">
              <Bag items={d.rewards[i].items} size="sm" />
              {#if festGot(game, id, i)}<span class="stamp">{L.fest.claimed}</span>
              {:else if festDone(game, id, i)}<Button
                  size="sm"
                  variant="gold"
                  onclick={() => g.act({ type: 'fest', id, i }, 'reward')}>{L.fest.claim}</Button
                >{/if}
            </div>
          </div>
        </Card>
      </li>
    {/each}
  </ol>
{/if}
