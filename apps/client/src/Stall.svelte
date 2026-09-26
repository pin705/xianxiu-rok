<script lang="ts">
  // Cát Tường Hạ Giá (Lucky Stall — luật ở rules/sect/stall.ts, giảm giá ở rules/core/stall.ts): chọn việc được giảm (đổi được tới
  // lần ước đầu), ước mức giảm (lần đầu miễn phí, sau tốn Cát Tường Tệ — kết quả theo mầm server, tới cùng patch); dưới là phần đã bớt
  // trong lễ so với trần mỗi loại tài nguyên
  import { FESTS, RESOURCES, STALL_JOBS, festTokens, stallSp, type FestId } from '@rok/rules'
  import { Button, Card, Meter, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'

  let { id }: { id: FestId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const d = $derived.by(() => {
    const def = FESTS[id]
    return def.kind === 'stall' ? def : null
  })
  const sp = $derived(stallSp(game, id))
  const job = $derived(sp[0])
  const tier = $derived(sp[1])
  const tokens = $derived(festTokens(game, id))
  const pct = (cut: number) => Math.round(cut * 100)
</script>

{#if d}
  <div class="stack" style:--gap="8px">
    <p class="row between">
      <small class="t-small">{L.fest.tokens(num(tokens), L.fest.tokenName[id])}</small>
      {#if tier >= 0}<Tag tone="gold" icon="star">{L.stall.cut(pct(d.tiers[tier].cut))}</Tag>{/if}
    </p>
    <small class="t-tiny t-soft">{tier >= 0 ? L.stall.tiers : L.stall.none}</small>
    <Card>
      <div class="stack" style:--gap="6px">
        <small class="t-tiny t-soft">{L.stall.pick}</small>
        <div class="grid" style:--cols="3" style:--gap="6px">
          {#each STALL_JOBS as _, k (k)}
            <Button
              size="sm"
              wide
              variant={job === k ? 'gold' : 'ghost'}
              disabled={g.busy || (tier >= 0 && job !== k)}
              onclick={() => g.act({ type: 'stallJob', id, job: k })}>{L.stall.jobs[k]}</Button
            >
          {/each}
        </div>
        <Button
          variant="gold"
          wide
          icon="star"
          disabled={g.busy || job < 0 || (tier >= 0 && tokens < d.cost)}
          onclick={() => g.act({ type: 'stallWish', id }, 'reward')}
          >{tier >= 0 ? L.stall.rewish(d.cost) : L.stall.wish}</Button
        >
      </div>
    </Card>
    <small class="t-tiny t-soft">{L.stall.saved}</small>
    {#each RESOURCES as r, i (r)}
      <div class="stack" style:--gap="2px">
        <p class="row between t-tiny">
          <span>{L.res[r]}</span><span class="t-num">{num(sp[2 + i] ?? 0)} / {num(d.cap)}</span>
        </p>
        <Meter value={Math.min(1, (sp[2 + i] ?? 0) / d.cap)} size="sm" />
      </div>
    {/each}
  </div>
{/if}
