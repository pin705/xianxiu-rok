<script lang="ts">
  // Xuất quan: những gì đã xong trong lúc vắng (away.ts), vào game thì tài nguyên bay về túi.
  // Bố cục lá thư: hạc ngậm thư đầu thư, từng phần là một đoạn thư kẻ mực đứt, kho đầy là dòng son.
  import { Icon } from '@rok/art'
  import { Art, Bag, Button, Letter, Sheet, fly } from './ui'
  import { L } from './lib'
  import type { Away } from './away'

  let { away, open, onclose }: { away: Away | null; open: boolean; onclose: () => void } = $props()
</script>

<Sheet open={open && !!away} {onclose} center title={L.away.title} sub={away ? L.away.for(L.ago(away.ms)) : ''}>
  {#snippet art()}<Art art="ev-mail" icon="mail" size={72} tilt={-4} lift />{/snippet}
  {#if away}
    <Letter warn={away.full ? L.away.full : undefined}>
      {#if away.gains.length}
        <section>
          <b class="t-small">{L.away.got}</b>
          <Bag res={Object.fromEntries(away.gains.map(g => [g.r, g.n]))} />
        </section>
      {/if}
      {#if away.yard.length}
        <section>
          <b class="t-small">{L.away.yard}</b>
          <Bag res={Object.fromEntries(away.yard.map(g => [g.r, g.n]))} />
        </section>
      {/if}
      {#if away.done.length || away.techs.length || away.misc.length}
        <section>
          <b class="t-small">{L.away.done}</b>
          <ul class="stack" style:--gap="3px">
            {#each away.done as d (d.id)}<li class="row">
                <span class="tick-dot"><Icon name="check" size={14} /></span><span class="t-small t-strong"
                  >{L.b[d.id].name} · {L.level(d.level)}</span
                >
              </li>{/each}
            {#each [...away.techs, ...away.misc] as m (m)}<li class="row">
                <span class="tick-dot"><Icon name="check" size={14} /></span><span class="t-small t-strong">{m}</span>
              </li>{/each}
          </ul>
        </section>
      {/if}
    </Letter>
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
