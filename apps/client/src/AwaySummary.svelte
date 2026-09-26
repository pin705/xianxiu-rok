<script lang="ts">
  // Xuất quan: những gì đã xong trong lúc vắng (away.ts), vào game thì tài nguyên bay về túi
  import { Icon } from '@rok/art'
  import { Bag, Button, Sheet, fly } from './ui'
  import { L } from './lib'
  import type { Away } from './away'

  let { away, open, onclose }: { away: Away | null; open: boolean; onclose: () => void } = $props()
</script>

<Sheet open={open && !!away} {onclose} center title={L.away.title} sub={away ? L.away.for(L.ago(away.ms)) : ''}>
  {#if away}
    {#if away.gains.length}
      <p class="t-small t-strong t-soft mt-2">{L.away.got}</p>
      <Bag res={Object.fromEntries(away.gains.map(g => [g.r, g.n]))} />
    {/if}
    {#if away.yard.length}
      <p class="t-small t-strong t-soft mt-2">{L.away.yard}</p>
      <Bag res={Object.fromEntries(away.yard.map(g => [g.r, g.n]))} />
    {/if}
    {#if away.done.length || away.techs.length || away.misc.length}
      <p class="t-small t-strong t-soft mt-3">{L.away.done}</p>
      <ul class="stack mt-2" style:--gap="4px">
        {#each away.done as d (d.id)}<li class="row t-good">
            <Icon name="check" size={16} /><span class="t-strong">{L.b[d.id].name} · {L.level(d.level)}</span>
          </li>{/each}
        {#each [...away.techs, ...away.misc] as m (m)}<li class="row t-good">
            <Icon name="check" size={16} /><span class="t-strong">{m}</span>
          </li>{/each}
      </ul>
    {/if}
    {#if away.full}<p class="t-small t-bad mt-3">{L.away.full}</p>{/if}
    <div class="mt-4">
      <Button
        variant="gold"
        size="lg"
        wide
        onclick={e => {
          const from = e.currentTarget as Element
          const bag = Object.fromEntries((away?.gains ?? []).map(g => [g.r, g.n]))
          onclose()
          requestAnimationFrame(() => fly(from, bag, document.body)) // bay sau khi hộp thoại đóng
        }}>{L.away.enter}</Button
      >
    </div>
  {/if}
</Sheet>
