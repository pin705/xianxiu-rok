<script lang="ts">
  // Vạn Đăng Hội (khuôn lễ hội "nộp lên cấp" của RoK — luật ở rules/sect/fest.ts offer): thả Hoa Đăng lên hội, kinh nghiệm × hệ số
  // chí mạng (mầm server — số tới cùng patch); hội đèn lên cấp theo mốc kinh nghiệm, mỗi cấp một quà nhận ở danh sách dưới.
  import { FESTS, festDone, festGot, festTokens, type FestId, type Metric } from '@rok/rules'
  import { Bag, Button, Card, Meter, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  let { id }: { id: FestId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const d = $derived.by(() => {
    const def = FESTS[id]
    return def.kind === 'offer' ? def : null
  })
  const sp = $derived(game.fest[id]?.sp ?? [])
  const exp = $derived(sp[1] ?? 0)
  const tokens = $derived(festTokens(game, id))
  const lv = $derived(d ? d.goals.filter(x => exp >= x).length : 0)
  const need = $derived(d?.goals[lv])
  const prev = $derived(d && lv > 0 ? d.goals[lv - 1] : 0)
  // chí mạng của lần thả vừa rồi: hiện khi kinh nghiệm vừa tăng mà hệ số > 1
  let seen = -1 // không phản ứng: kinh nghiệm lần trước (−1: chưa xem)
  let crit = $state(0)
  $effect(() => {
    if (seen >= 0 && exp > seen) crit = (sp[2] ?? 1) > 1 ? sp[2] : 0
    seen = exp
  })
  const give = (n: number) => g.act({ type: 'offer', id, n }, 'reward')
</script>

{#if d}
  <Card tone="glow">
    <div class="stack" style:--gap="6px">
      <p class="row between">
        <b class="t-gold">{L.offer.level(lv, d.goals.length)}</b>
        <b class="t-num">{L.fest.tokens(num(tokens), L.fest.tokenName[id])}</b>
      </p>
      {#if need !== undefined}
        <Meter value={(exp - prev) / (need - prev)} tone="gold" size="sm" />
        <small class="t-tiny t-soft">{L.offer.exp(num(exp), num(need))}</small>
      {:else}<Tag icon="check" tone="good">{L.offer.max}</Tag>{/if}
      {#if crit}<Tag icon="star" tone="gold">{L.offer.crit(crit)}</Tag>{/if}
      <div class="grid" style:--cols="3" style:--gap="6px">
        {#each [1, 10] as n (n)}
          <Button
            size="sm"
            variant="ghost"
            disabled={tokens < n || g.busy || need === undefined}
            onclick={() => give(n)}>{L.offer.give(n)}</Button
          >
        {/each}
        <Button
          size="sm"
          variant="gold"
          disabled={tokens < 1 || g.busy || need === undefined}
          onclick={() => give(tokens)}>{L.offer.all(tokens)}</Button
        >
      </div>
    </div>
  </Card>
  <Card>
    <ul class="stack plain" style:--gap="2px">
      {#each Object.entries(d.stages[0]) as [m, v] (m)}
        <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
      {/each}
    </ul>
  </Card>
  <ol class="path">
    {#each d.goals as goal, i (i)}
      <li class:hit={exp >= goal}>
        <Card tone={festDone(game, id, i) && !festGot(game, id, i) ? 'glow' : undefined}>
          <div class="row between">
            <b class="t-small nowrap">{L.offer.goal(i + 1)}</b>
            <span class="grow"><Bag items={d.rewards[i].items} size="sm" /></span>
            {#if festGot(game, id, i)}<span class="stamp">{L.fest.claimed}</span>
            {:else if festDone(game, id, i)}<Button
                size="sm"
                variant="gold"
                onclick={() => g.act({ type: 'fest', id, i }, 'reward')}>{L.fest.claim}</Button
              >{:else}<small class="t-tiny t-soft t-num">{num(goal)}</small>{/if}
          </div>
        </Card>
      </li>
    {/each}
  </ol>
{/if}
