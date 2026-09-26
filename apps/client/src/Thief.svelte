<script lang="ts">
  // Dạ Hành Đạo Tặc (Thief in the Night của RoK — luật ở rules/sect/thief.ts): lượt còn hôm nay, sát thương cao nhất hôm nay, kỷ lục,
  // chọn đội ảo đánh đạo tặc (server giải bằng mầm, client chờ rồi cho xem lại), rương ngày theo sát thương hôm nay.
  import {
    FESTS,
    THIEF_TRIES,
    festCode,
    might,
    thiefFoe,
    thiefNow,
    type Army,
    type ElderId,
    type Report,
    type State,
  } from '@rok/rules'
  import ArmyPick from './Army.svelte'
  import { Bag, Button, Card } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let {
    s,
    onfight,
    onreplay,
  }: {
    s: State
    onfight?: (elder: ElderId, army: Army) => Promise<Report | null>
    onreplay?: (r: Report) => void
  } = $props()
  const g = useGame()
  const d = $derived.by(() => {
    const def = FESTS.daTac
    return def.kind === 'thief' ? def : null
  })
  const now = $derived(thiefNow(s))
  const f = $derived(s.fest.daTac)
  let last = $state<Report | null>(null)
  async function go(e: ElderId, a: Army) {
    const r = await onfight?.(e, a)
    if (r) last = r
  }
  // lực chiến đạo tặc ứng với trưởng lão mạnh nhất (người chơi đổi trưởng lão thì đạo tặc cũng đổi theo đội đầy của người đó)
  const top = $derived((Object.keys(s.elders) as ElderId[]).sort((a, b) => (s.elders[b] ?? 0) - (s.elders[a] ?? 0))[0])
</script>

{#if d}
  <Card tone="silk">
    <div class="row between">
      <b>{L.thief.left(now.left, THIEF_TRIES)}</b>
      <small class="t-small t-gold">{L.thief.record(L.thief.pm(now.record))}</small>
    </div>
    <p class="t-small">{L.thief.best(L.thief.pm(now.best))}</p>
    <small class="t-tiny t-soft">{L.thief.virtual}</small>
  </Card>
  {#if last}
    <div class="row">
      <span class="grow t-small t-gold">{L.thief.last(L.thief.pm(last.i))}</span>
      <Button size="sm" variant="ghost" icon="arrow" onclick={() => last && onreplay?.(last)}>{L.report.replay}</Button>
    </div>
  {/if}
  {#if now.left > 0}
    <ArmyPick
      foe={top ? might(thiefFoe(s, top)) : undefined}
      cta={L.thief.go}
      disabled={g.busy || !onfight}
      onsubmit={go}
    />
  {/if}
  <p class="t-small t-strong">{L.thief.chests}</p>
  <ul class="stack chests" style:--gap="6px">
    {#each d.goals as goal, i (i)}
      <li class="row">
        <b class="t-num n2">{L.thief.pm(goal)}</b>
        <span class="grow"><Bag items={d.rewards[i].items} size="sm" /></span>
        {#if f?.got.includes(festCode(s, 'daTac', i))}<small class="t-tiny t-soft">{L.fest.claimed}</small>
        {:else if now.best >= goal}<Button
            size="sm"
            variant="gold"
            onclick={() => g.act({ type: 'fest', id: 'daTac', i }, 'reward')}>{L.fest.claim}</Button
          >{/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .chests {
    margin: var(--sp-1) 0 var(--sp-2);
    padding: 0;
    list-style: none;
  }
  .n2 {
    min-width: 6ch;
  }
</style>
