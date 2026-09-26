<script lang="ts">
  // Luận Đạo Vấn Đáp (Alliance Quiz của RoK — luật ở rules/world/aquiz.ts): đường chủ / minh chủ mở, đếm ngược rồi 10 câu mỗi câu
  // 15 giây cho cả minh; chọn đáp án câu đang hỏi (đổi được tới lúc hết câu). Chấm điểm minh và quà theo mốc tới qua thư.
  import { AQUIZ_N, AQUIZ_Q, AQUIZ_TIERS, dayOf } from '@rok/rules'
  import { aquizK, aquizQs, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import { Button, Section } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'

  let {
    ally,
    officer,
    go,
  }: {
    ally: AllyInfo
    officer: boolean
    go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean>
  } = $props()
  const g = useGame()
  const now = $derived(g.now)
  const q = $derived(ally.quiz && dayOf(ally.quiz.at) === dayOf(now) ? ally.quiz : null)
  const k = $derived(q ? aquizK(q, now) : -1)
  const qs = $derived(q ? aquizQs(ally.id, q.at) : [])
  // đáp án đã chọn: của server (lúc tải) cộng những lần chọn trong phiên này
  let picks = $state<Record<number, number>>({})
  const mine = (i: number) => picks[i] ?? q?.mine?.[i]
  async function answer(pick: number) {
    const at = k
    if (await go({ type: 'aquiz', pick }, 'tap')) picks = { ...picks, [at]: pick }
  }
</script>

<Section title={L.aquiz.title}>
  <p class="t-tiny t-soft">{L.aquiz.lore}</p>
  <p class="t-tiny t-soft">{L.aquiz.tiers(AQUIZ_TIERS.join(' / '))}</p>
  {#if !q}
    {#if officer}<Button size="sm" variant="gold" onclick={() => go({ type: 'aquizStart' }, 'tap')}
        >{L.aquiz.start}</Button
      >{:else}<small class="t-small t-soft">{L.aquiz.officer}</small>{/if}
  {:else if k < 0}
    <b class="t-gold">{L.aquiz.soon(clock(q.at - now))}</b>
  {:else if k < AQUIZ_N}
    {@const text = L.quiz.q[qs[k]]}
    <p class="t-small t-strong">{L.aquiz.step(k + 1, AQUIZ_N, clock(q.at + (k + 1) * AQUIZ_Q - now))}</p>
    <p class="t-small">{text[0]}</p>
    <div class="opts">
      {#each text[1] as opt, i (i)}
        <Button size="sm" variant={mine(k) === i ? 'gold' : 'ghost'} onclick={() => answer(i)}>{opt}</Button>
      {/each}
    </div>
    {#if mine(k) !== undefined}<small class="t-tiny t-soft">{L.aquiz.picked}</small>{/if}
  {:else}
    <small class="t-small t-soft">{q.done ? L.aquiz.done : L.aquiz.scoring}</small>
  {/if}
</Section>

<style>
  .opts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-2);
  }
</style>
