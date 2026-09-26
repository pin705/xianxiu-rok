<script lang="ts">
  // Luận Võ Liên Hoàn (Arms Training của RoK — luật ở rules/sect/drill.ts): mỗi ngày một phiên. Chọn đội (ảo, không mất quân
  // thật), đánh liên tiếp giáo đầu mạnh dần, quân không hồi; cứ vài trận thắng chọn 1 trong 3 công pháp cho giáo đầu. Mốc thắng có
  // quà. Trận có mầm bí mật: client chờ server (onfight) rồi cho xem lại.
  // Bố cục: băng rôn sân luận võ (tranh ba đệ tử luyện côn), đồng tiền số trận thắng, ba bí kíp chọn cho giáo đầu, đường mốc thắng.
  import { DRILL_EVERY, DRILL_GIFTS, DRILL_HALL, count, drillFoe, drillToday, might, type Report } from '@rok/rules'
  import ArmyPick from './Army.svelte'
  import { artOf } from '@rok/art'
  import { Bag, Button, Section, Sheet, Tag } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let { onfight, onreplay }: { onfight: () => Promise<Report | null>; onreplay: (r: Report) => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const busy = $derived(g.busy)
  const d = $derived(drillToday(game))
  const foe = $derived(d && !d.over ? Math.round(might(drillFoe(game, d))) : 0)
  const art = artOf('ui:fx-train')?.src
  let last = $state<Report | null>(null)
  async function next() {
    const r = await onfight()
    if (r) last = r
  }
</script>

<Sheet open={social.drill} onclose={() => (social.drill = false)} title={L.drill.title}>
  <header class="banner">
    {#if art}<img class="art" src={art} alt="" draggable="false" />{/if}
    <p class="t-small t-lore lore">{L.drill.lore}</p>
    <small class="ends">{L.drill.every(DRILL_EVERY)}</small>
  </header>
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
    <div class="board">
      <i class="rank-no r3 coin" aria-hidden="true">{d.wins}</i>
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
        <div class="offer">
          {#each d.offer as m, i (m)}
            <button
              type="button"
              class="book"
              aria-label={L.drill.mods[m][0]}
              onclick={() => g.act({ type: 'drillPick', i })}
            >
              <b>{L.drill.mods[m][0]}</b><small class="t-tiny">{L.drill.mods[m][1]}</small>
            </button>
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
    <ol class="path">
      {#each DRILL_GIFTS as x, i (i)}
        <li class:hit={!!d && d.wins >= x.n}>
          <div class="row mile">
            <b class="t-num n">{L.drill.at(x.n)}</b>
            <span class="grow"><Bag items={x.reward.items} size="sm" /></span>
            {#if d && i < d.got}<span class="stamp">{L.honor.got}</span>{/if}
          </div>
        </li>
      {/each}
    </ol>
  </Section>
</Sheet>

<style>
  /* băng rôn sân luận võ: chữ trái, tranh nghiêng phải, nền núi mờ, dải son luật chọn công pháp */
  .banner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 72px;
    gap: 6px 8px;
    align-items: start;
    margin-top: var(--sp-2);
    padding: 10px 10px 12px 14px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 320% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .art {
    grid-area: 1 / 2 / 3 / 3;
    width: 72px;
    rotate: 4deg;
    filter: drop-shadow(0 3px 5px rgb(var(--shade) / 0.25));
  }
  .lore {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .ends {
    justify-self: start;
    padding: 1px 12px 2px 8px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--silk);
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%);
  }
  .board {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 0 solid transparent;
    border-image: var(--sk-card-silk);
  }
  /* đồng tiền đồng (lớp .rank-no.r3 dùng chung): số trận thắng hôm nay, cỡ lớn */
  .coin {
    width: 54px;
    height: 54px;
    font-size: var(--fs-6);
  }
  .offer {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    gap: 8px;
  }
  /* bí kíp: cuốn sách giấy, gáy chỉ son bên trái */
  .book {
    display: grid;
    align-content: start;
    gap: 4px;
    min-height: 92px;
    padding: 10px 8px 10px 14px;
    text-align: left;
    color: var(--text);
    background: linear-gradient(90deg, var(--cinnabar) 0 4px, var(--silk) 4px);
    border: 1px solid var(--paper3);
    border-radius: 2px 6px 6px 2px;
    box-shadow: 0 3px 6px rgb(var(--shade) / 0.14);
  }
  .book:active {
    transform: translateY(1px);
  }
  .book b {
    font-size: var(--fs-3);
    line-height: 1.15;
  }
  .mile {
    min-height: 40px;
    padding: 4px 0;
    border-bottom: 1px dashed var(--paper3);
  }
  .path > li::before {
    top: 14px;
  }
  .n {
    min-width: 6ch;
  }
</style>
