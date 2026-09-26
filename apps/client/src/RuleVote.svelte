<script lang="ts">
  // Thiên Mệnh Chọn Luật (luật ở rules/world/vote.ts): luật của mùa này (tăng ích cả giới); ba ngày cuối mùa bỏ phiếu luật mùa sau —
  // mỗi luật một nút có số phiếu, phiếu của mình tô vàng, bấm luật khác là đổi phiếu
  import { RULES, type Bonus } from '@rok/rules'
  import type { WorldAction } from '@rok/rules/world'
  import type { Ack, Season } from '@rok/protocol'
  import { Button, Card, Tag } from './ui'
  import { L } from './lib'

  let {
    vote,
    send,
    onvoted,
  }: { vote: NonNullable<Season['vote']>; send?: (a: WorldAction) => Promise<Ack>; onvoted: () => void } = $props()
  const fx = (k: number) =>
    Object.entries(RULES[k])
      .map(([b, v]) => L.bonus(b as Bonus, v ?? 0))
      .join(' · ')
  async function pick(k: number) {
    if (send && (await send({ type: 'vote', k })).ok) onvoted()
  }
</script>

<Card>
  <div class="stack" style:--gap="6px">
    <b class="t-small">{L.rule.title}</b>
    {#if vote.rule !== undefined}
      <Tag icon="star" tone="gold">{L.rule.now(L.rule.names[vote.rule])} · {fx(vote.rule)}</Tag>
    {:else}<small class="t-tiny t-soft">{L.rule.none}</small>{/if}
    <small class="t-tiny t-soft">{vote.open ? L.rule.open : L.rule.hint}</small>
    {#if vote.open}
      {#each RULES as _, k (k)}
        <Button size="sm" variant={vote.mine === k ? 'gold' : 'ghost'} wide disabled={!send} onclick={() => pick(k)}
          >{L.rule.names[k]} · {fx(k)} · {L.rule.votes(vote.tally[k] ?? 0)}</Button
        >
      {/each}
    {/if}
  </div>
</Card>
