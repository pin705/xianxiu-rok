<script lang="ts">
  // Chiêu Hiền Đài (như Tavern của RoK, không bán): hai thẻ thiếp bạc / vàng — đồng hồ lượt miễn phí, số thiếp trong túi,
  // Mở ×1 / ×10, dòng bảo hiểm thiếp vàng; quà lần mở gần nhất hiện sau khi server trả (quà rút bằng mầm của server).
  // Bố cục cảnh chiêu hiền: tranh sảnh đèn đỏ đầu cảnh, hai tấm thiệp lớn đứng trên bệ gỗ, xâu hạt bảo hiểm, quà là tờ giấy ghim son.
  import { GOLD_PITY, TAVERN, drawError, tavernFree, type ElderId, type TavernKind } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Banner, Beads, Button, Note, Pill, Plinth } from './ui'
  import { L, LOOK, clock } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const KINDS: TavernKind[] = ['silver', 'gold']
  // chỉ hiện quà của lần mở do chính màn này bấm (không hiện lại quà cũ mỗi lần vào trang)
  let opened = $state(0)
  const last = $derived(game.tavern.last && game.tavern.last.at >= opened && opened ? game.tavern.last : null)
  const waiting = $derived(!!opened && !last)
  const keys = (k: TavernKind) => game.items[TAVERN[k].key] ?? 0
  const can = (k: TavernKind, n: number) => !drawError({ ...game, time: now }, k, n)
  function open(k: TavernKind, n: number) {
    opened = now
    act({ type: 'draw', kind: k, n }, 'reward')
  }
  const tokens = $derived(Object.entries(last?.tokens ?? {}) as [ElderId, number][])
</script>

<Banner art="ev-tavern" picSize={70}>
  {#snippet lead()}<p class="t-small t-lore clamp" style:--lines="3">{L.tavern.lore}</p>{/snippet}
  <div class="stack" style:--gap="10px">
    <div class="grid" style:--gap="10px">
      {#each KINDS as k (k)}
        {@const free = tavernFree({ ...game, time: now }, k)}
        {@const n = keys(k)}
        <!-- dải lụa đếm giờ: son khi được mở miễn phí (việc cần làm ngay), mực khi còn chờ -->
        <Plinth
          band={free ? L.tavern.free : L.tavern.next(clock(game.tavern[k] - now))}
          hot={free}
          name={k === 'silver' ? L.tavern.silver : L.tavern.gold}
          halo={k === 'silver' ? 'var(--glow-silver)' : 'var(--gold-glow)'}
          tilt={k === 'silver' ? -6 : 6}
        >
          {#snippet pic()}<Icon name={TAVERN[k].key} size={92} />{/snippet}
          <Pill>{L.tavern.keys(n)}</Pill>
          <div class="row wrap justify-center mt-1" style:--gap="6px">
            <Button size="sm" variant="gold" disabled={!can(k, 1)} onclick={() => open(k, 1)}>{L.tavern.open}</Button>
            {#if n + (free ? 1 : 0) >= 10}
              <Button size="sm" variant="ghost" onclick={() => open(k, 10)}>{L.tavern.open10(10)}</Button>
            {/if}
          </div>
        </Plinth>
      {/each}
    </div>

    <!-- bảo hiểm thiếp vàng: xâu GOLD_PITY hạt, mỗi lần mở thiếp vàng tô son một hạt -->
    <div class="stack justify-center t-center" style:--gap="4px">
      <Beads n={GOLD_PITY} on={game.tavern.pity} />
      <small class="t-small">{L.tavern.pity(GOLD_PITY - game.tavern.pity)}</small>
    </div>
  </div>
</Banner>

{#if waiting}
  <p class="t-small t-soft">{L.tavern.waiting}</p>
{:else if last}
  <div class="mt-3">
    <Note tilt={-0.6}>
      <div class="stack justify-center t-center" style:--gap="6px">
        <b class="t-head brush">{L.tavern.got}</b>
        <Bag res={last.got.res} items={last.got.items} size="sm" named />
        {#each tokens as [e, n] (e)}
          <span class="row t-small"
            ><Portrait look={LOOK[e]} size={30} /><b>{L.tavern.tokens(L.elders[e].name, n)}</b></span
          >
        {/each}
      </div>
    </Note>
  </div>
{/if}
