<script lang="ts">
  // Xuất quan: những gì đã xong trong lúc vắng (away.ts), vào game thì tài nguyên bay về túi.
  // Bố cục lá thư: hạc ngậm thư đầu thư, từng phần là một đoạn thư kẻ mực đứt, kho đầy là dòng son.
  import { Icon, artOf } from '@rok/art'
  import { Bag, Button, Sheet, fly } from './ui'
  import { L } from './lib'
  import type { Away } from './away'

  let { away, open, onclose }: { away: Away | null; open: boolean; onclose: () => void } = $props()
  const crane = artOf('ui:ev-mail')?.src
</script>

<Sheet open={open && !!away} {onclose} center title={L.away.title} sub={away ? L.away.for(L.ago(away.ms)) : ''}>
  {#snippet art()}{#if crane}<img class="crane" src={crane} alt="" draggable="false" />{/if}{/snippet}
  {#if away}
    <div class="letter">
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
                <span class="tick"><Icon name="check" size={14} /></span><span class="t-small t-strong"
                  >{L.b[d.id].name} · {L.level(d.level)}</span
                >
              </li>{/each}
            {#each [...away.techs, ...away.misc] as m (m)}<li class="row">
                <span class="tick"><Icon name="check" size={14} /></span><span class="t-small t-strong">{m}</span>
              </li>{/each}
          </ul>
        </section>
      {/if}
      {#if away.full}<p class="full t-small">{L.away.full}</p>{/if}
    </div>
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

<style>
  .crane {
    width: 72px;
    height: 72px;
    object-fit: contain;
    rotate: -4deg;
    filter: drop-shadow(0 3px 4px rgb(var(--shade) / 0.25));
  }
  /* tờ thư: giấy trắng sương kẻ dòng mực nhạt, mỗi đoạn một mục */
  .letter {
    display: grid;
    margin-top: var(--sp-2);
    padding: 4px 14px;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px;
    box-shadow: 0 3px 8px rgb(var(--shade) / 0.1);
  }
  .letter section {
    display: grid;
    gap: 6px;
    padding: 10px 0;
    border-bottom: 1px dashed var(--paper3);
  }
  .letter section:last-child {
    border-bottom: 0;
  }
  .letter section > b {
    color: var(--text-soft);
  }
  .tick {
    display: grid;
    flex: none;
    place-items: center;
    width: 20px;
    height: 20px;
    color: var(--silk);
    background: var(--malachite);
    border-radius: 50%;
  }
  .full {
    margin: 0 -14px;
    padding: 6px 14px;
    font-weight: 800;
    color: var(--silk);
    background: var(--cinnabar);
  }
</style>
