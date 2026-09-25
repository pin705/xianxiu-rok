<script lang="ts">
  // Luận Võ Liên Hoàn (Arms Training của RoK — luật ở rules/sect/drill.ts): mỗi ngày một phiên. Chọn đội (ảo, không mất quân
  // thật), đánh liên tiếp giáo đầu mạnh dần, quân không hồi; cứ vài trận thắng chọn 1 trong 3 công pháp cho giáo đầu. Mốc thắng có
  // quà. Trận có mầm bí mật: client chờ server (onfight) rồi cho xem lại.
  import { DRILL_EVERY, DRILL_GIFTS, DRILL_HALL, count, drillFoe, drillToday, might, type Report } from '@rok/rules'
  import ArmyPick from './Army.svelte'
  import { Bag, Button, Card, Section, Sheet, Tag } from './ui'
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

<Sheet open={social.drill} onclose={() => (social.drill = false)} title={L.drill.title} lore={L.drill.lore}>
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
    <Card tone="silk">
      <div class="stack" style:--gap="4px">
        <b>{L.drill.wins(d.wins)}</b>
        <small class="t-small">{L.drill.army(num(count(d.army)))}</small>
        {#if d.mods.length}
          <span class="row wrap" style:--gap="4px"
            ><small class="t-tiny t-soft">{L.drill.modsNow}</small>
            {#each d.mods as m, k (k)}<Tag tone="bad" size="sm">{L.drill.mods[m][0]}</Tag>{/each}</span
          >
        {/if}
      </div>
    </Card>
    {#if last}
      <div class="row mt-2">
        <span class="grow t-small" class:t-good={last.win} class:t-bad={!last.win}
          >{last.win ? L.drill.won(last.i + 1) : L.drill.lost(last.i + 1)}</span
        >
        <Button size="sm" variant="ghost" icon="arrow" onclick={() => last && onreplay(last)}>{L.report.replay}</Button>
      </div>
    {/if}
    {#if d.over}
      <p class="t-small t-lore mt-2">{L.drill.over(d.wins)}</p>
    {:else if d.offer}
      <!-- roguelite ngược: chọn công pháp cho giáo đầu — cái ít hại đội mình nhất -->
      <Section title={L.drill.pick}>
        <p class="t-tiny t-soft">{L.drill.pickHint}</p>
        <div class="stack" style:--gap="6px">
          {#each d.offer as m, i (m)}
            <Card onclick={() => g.act({ type: 'drillPick', i })} label={L.drill.mods[m][0]}>
              <span class="stack" style:--gap="1px"
                ><b>{L.drill.mods[m][0]}</b><small class="t-tiny t-soft">{L.drill.mods[m][1]}</small></span
              >
            </Card>
          {/each}
        </div>
      </Section>
    {:else}
      <p class="t-small mt-2">{L.drill.foe(num(foe))}</p>
      <Button wide variant="danger" icon="swords" disabled={busy || !count(d.army)} onclick={next}
        >{L.drill.fight}</Button
      >
      <small class="t-tiny t-soft">{L.drill.every(DRILL_EVERY)}</small>
    {/if}
  {/if}
  <Section title={L.drill.gifts}>
    <ul class="stack rows">
      {#each DRILL_GIFTS as x, i (i)}
        <li class="row">
          <b class="t-num n">{L.drill.at(x.n)}</b>
          <span class="grow"><Bag items={x.reward.items} size="sm" /></span>
          {#if d && i < d.got}<small class="t-tiny t-good">{L.honor.got}</small>{/if}
        </li>
      {/each}
    </ul>
  </Section>
</Sheet>

<style>
  .rows {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .n {
    min-width: 7ch;
  }
</style>
