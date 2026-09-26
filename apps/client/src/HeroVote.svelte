<script lang="ts">
  // Lưu Danh Sử Sách (Hall of Fame — luật ở rules/world/heroes.ts): ba ngày cuối mùa, mỗi hạng mục năm ứng viên (tên, chỉ số mùa, số
  // phiếu) — chạm để bầu, phiếu của mình tô vàng, chạm người khác là đổi phiếu; không bầu được chính mình
  import type { WorldAction } from '@rok/rules/world'
  import type { Ack, Season } from '@rok/protocol'
  import { Button, Card } from './ui'
  import { L, num } from './lib'

  let {
    view,
    send,
    onvoted,
  }: { view: NonNullable<Season['heroes']>; send?: (a: WorldAction) => Promise<Ack>; onvoted: () => void } = $props()
  async function pick(k: number, pid: number) {
    if (send && (await send({ type: 'heroVote', k, pid })).ok) onvoted()
  }
</script>

<Card>
  <div class="stack" style:--gap="6px">
    <b class="t-small">{L.hero.title}</b>
    <small class="t-tiny t-soft">{L.hero.hint}</small>
    {#each view.picks as list, k (k)}
      {#if list.length}
        <small class="t-tiny t-soft"><b class="t-gold">{L.hero.kinds[k]}</b> · {L.hero.what[k]}</small>
        {#each list as c (c.pid)}
          <Button
            size="sm"
            wide
            variant={view.mine[k] === c.pid ? 'gold' : 'ghost'}
            disabled={!send || c.me}
            onclick={() => pick(k, c.pid)}>{c.name} · {num(c.v)} · {L.hero.votes(c.n)}</Button
          >
        {/each}
      {/if}
    {/each}
  </div>
</Card>
