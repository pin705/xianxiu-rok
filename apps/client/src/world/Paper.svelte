<script lang="ts">
  // Giới Báo (Kingdom Newspaper — luật ở rules/world/paper.ts): số báo đang xem (ngày ra số), bốn bài dẫn đầu từng mục hôm trước
  // (tên, phần tăng) kèm nút thích, dòng tổng cả giới; chip các số cũ; quà đọc số hôm nay (mỗi ngày một lần)
  import { DAY, PAPER_GIFT } from '@rok/rules'
  import type { WorldAction } from '@rok/rules/world'
  import type { Ack, Answer } from '@rok/protocol'
  import type { Net } from '../net'
  import { Bag, Button, Card, Sheet } from '../ui'
  import { L, num } from '../lib'

  let {
    open,
    onclose,
    ask,
    send,
  }: { open: boolean; onclose: () => void; ask?: Net['ask']; send?: (a: WorldAction) => Promise<Ack> } = $props()
  let view = $state<Answer['paper'] | null>(null)
  let k = $state(0) // số đang xem (0: số mới nhất)
  const load = () => ask?.({ k: 'paper' }).then(v => v && (view = v))
  $effect(() => {
    if (open) void load()
  })
  const issue = $derived(view?.issues[Math.min(k, (view?.issues.length ?? 1) - 1)])
  // ngày ra số: số của hôm day ra sáng hôm sau (ngày giờ VN — day × DAY là 0h UTC của ngày đó)
  const date = (day: number) => {
    const d = new Date((day + 1) * DAY)
    return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`
  }
  async function like(i: number) {
    if (issue && send && (await send({ type: 'paperLike', day: issue.day, i })).ok) void load()
  }
  async function read() {
    if (send && (await send({ type: 'paperRead' })).ok) void load()
  }
</script>

<Sheet {open} {onclose} title={L.paper.title}>
  <div class="stack" style:--gap="8px">
    <p class="t-small t-soft">{L.paper.hint}</p>
    {#if !issue}
      <p class="t-small t-soft">{L.paper.none}</p>
    {:else}
      {#if (view?.issues.length ?? 0) > 1}
        <div class="row wrap" style:--gap="4px">
          {#each view?.issues ?? [] as x, i (x.day)}
            <Button size="sm" variant={i === k ? 'gold' : 'ghost'} onclick={() => (k = i)}>{date(x.day)}</Button>
          {/each}
        </div>
      {/if}
      <b class="t-head">{L.paper.issue(date(issue.day))}</b>
      {#each issue.top as [kind, , name, n], i (kind)}
        <Card>
          <div class="stack" style:--gap="4px">
            <small class="t-tiny t-gold"><b>{L.paper.heads[kind]}</b></small>
            <p class="t-small">{L.paper.story[kind](name, num(n))}</p>
            <div class="row between">
              <small class="t-tiny t-soft">{L.paper.likes(issue.likes[i])}</small>
              <Button
                size="sm"
                variant={issue.mine.includes(i) ? 'gold' : 'ghost'}
                icon="star"
                disabled={!send || issue.mine.includes(i)}
                onclick={() => like(i)}>{L.paper.like}</Button
              >
            </div>
          </div>
        </Card>
      {/each}
      {#if !issue.top.length}<p class="t-small t-soft">{L.paper.quiet}</p>{/if}
      <small class="t-tiny t-soft">{L.paper.sum(issue.sum.map(v => num(v)))}</small>
      {#if k === 0 && view?.gift}
        <div class="row between">
          <Bag items={PAPER_GIFT.items} size="sm" />
          <Button size="sm" variant="gold" disabled={!send} onclick={read}>{L.paper.gift}</Button>
        </div>
      {/if}
    {/if}
  </div>
</Sheet>
