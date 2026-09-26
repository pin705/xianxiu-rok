<script lang="ts">
  // Luận Võ Liên Hoàn (Arms Training của RoK — luật ở rules/sect/drill.ts): mỗi ngày một phiên. Chọn đội (ảo, không mất quân
  // thật), đánh liên tiếp giáo đầu mạnh dần, quân không hồi; cứ vài trận thắng chọn 1 trong 3 công pháp cho giáo đầu. Mốc thắng có
  // quà. Trận có mầm bí mật: client chờ server (onfight) rồi cho xem lại.
  // Bố cục: băng rôn sân luận võ (tranh ba đệ tử luyện côn), đồng tiền số trận thắng, ba bí kíp chọn cho giáo đầu, đường mốc thắng.
  import { DRILL_EVERY, DRILL_GIFTS, DRILL_HALL, count, drillFoe, drillToday, might, type Report } from '@rok/rules'
  import ArmyPick from './Army.svelte'
  import { Bag, Band, Banner, Book, Button, Card, Section, Sheet, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let { onfight, onreplay }: { onfight: () => Promise<Report | null>; onreplay: (r: Report) => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const busy = $derived(g.busy)
  const d = $derived(drillToday(game))
  const foe = $derived(d && !d.over ? Math.round(might(drillFoe(game, d))) : 0)
  let last = $state<Report | null>(null)
  async function next() {
    const r = await onfight()
    if (r) last = r
  }
</script>

<Sheet open={social.drill} onclose={() => (social.drill = false)} title={L.drill.title}>
  <div class="mt-2">
    <Banner art="fx-train" picSize={72}>
      {#snippet lead()}
        <p class="t-small t-lore clamp" style:--lines="6">{L.drill.lore}</p>
        <Band>{L.drill.every(DRILL_EVERY)}</Band>
      {/snippet}
    </Banner>
  </div>
  {#if game.levels.chuDien < DRILL_HALL}
    <Tag icon="lock" tone="bad">{L.drill.locked(DRILL_HALL)}</Tag>
  {:else if !d}
    <p class="t-small t-soft">{L.drill.startHint}</p>
    <ArmyPick
      cta={L.drill.start}
      disabled={busy}
      onsubmit={(e, a) => g.act({ type: 'drillStart', elder: e, army: a })}
    />
  {:else}
    <!-- bảng phiên: đồng tiền số trận thắng, đội còn lại, bùa đỏ công pháp giáo đầu đã có -->
    <Card tone="silk">
      <div class="row" style:--gap="12px">
        <i class="rank-no r3 lg" aria-hidden="true">{d.wins}</i>
        <span class="stack grow" style:--gap="3px">
          <b>{L.drill.wins(d.wins)}</b>
          <small class="t-small">{L.drill.army(num(count(d.army)))}</small>
          {#if d.mods.length}
            <span class="row wrap" style:--gap="4px"
              ><small class="t-tiny t-soft">{L.drill.modsNow}</small>
              {#each d.mods as m, k (k)}<Tag tone="bad" size="sm">{L.drill.mods[m][0]}</Tag>{/each}</span
            >
          {/if}
        </span>
      </div>
    </Card>
    {#if last}
      <div class="row">
        <span class="grow t-small t-strong" class:t-good={last.win} class:t-bad={!last.win}
          >{last.win ? L.drill.won(last.i + 1) : L.drill.lost(last.i + 1)}</span
        >
        <Button size="sm" variant="ghost" icon="arrow" onclick={() => last && onreplay(last)}>{L.report.replay}</Button>
      </div>
    {/if}
    {#if d.over}
      <p class="t-small t-lore">{L.drill.over(d.wins)}</p>
    {:else if d.offer}
      <!-- roguelite ngược: ba bí kíp mở — chọn cái ít hại đội mình nhất cho giáo đầu -->
      <Section title={L.drill.pick}>
        <p class="t-tiny t-soft">{L.drill.pickHint}</p>
        <div class="fill" style:--min="96px">
          {#each d.offer as m, i (m)}
            <Book
              title={L.drill.mods[m][0]}
              text={L.drill.mods[m][1]}
              onclick={() => g.act({ type: 'drillPick', i })}
            />
          {/each}
        </div>
      </Section>
    {:else}
      <p class="t-small center">{L.drill.foe(num(foe))}</p>
      <Button wide variant="danger" icon="swords" disabled={busy || !count(d.army)} onclick={next}
        >{L.drill.fight}</Button
      >
    {/if}
  {/if}
  <Section title={L.drill.gifts}>
    <ol class="path" style:--at="6ch">
      {#each DRILL_GIFTS as x, i (i)}
        <li class:hit={!!d && d.wins >= x.n}>
          <div class="mile">
            <b class="t-num">{L.drill.at(x.n)}</b>
            <span class="grow"><Bag items={x.reward.items} size="sm" /></span>
            {#if d && i < d.got}<span class="stamp">{L.honor.got}</span>{/if}
          </div>
        </li>
      {/each}
    </ol>
  </Section>
</Sheet>
