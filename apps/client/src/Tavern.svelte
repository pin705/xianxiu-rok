<script lang="ts">
  // Chiêu Hiền Đài (như Tavern của RoK, không bán): hai thẻ thiếp bạc / vàng — đồng hồ lượt miễn phí, số thiếp trong túi,
  // Mở ×1 / ×10, dòng bảo hiểm thiếp vàng; quà lần mở gần nhất hiện sau khi server trả (quà rút bằng mầm của server).
  // Bố cục cảnh chiêu hiền: tranh sảnh đèn đỏ đầu cảnh, hai tấm thiệp lớn đứng trên bệ gỗ, xâu hạt bảo hiểm, quà là tờ giấy ghim son.
  import { GOLD_PITY, TAVERN, drawError, tavernFree, type ElderId, type TavernKind } from '@rok/rules'
  import { Icon, Portrait, artOf } from '@rok/art'
  import { Bag, Button } from './ui'
  import { L, LOOK, clock } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act
  const hall = artOf('ui:ev-tavern')?.src // tranh sảnh chiêu hiền (tắt art: bỏ tranh, chữ chiếm cả dòng)

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

<div class="hall">
  <header class="head">
    <p class="t-small t-lore lore">{L.tavern.lore}</p>
    {#if hall}<img class="pic" src={hall} alt="" draggable="false" />{/if}
  </header>

  <div class="two">
    {#each KINDS as k (k)}
      {@const free = tavernFree({ ...game, time: now }, k)}
      {@const n = keys(k)}
      <div class="invite {k}" class:free>
        <!-- dải lụa đếm giờ: son khi được mở miễn phí (việc cần làm ngay), mực khi còn chờ -->
        <small class="ribbon">{free ? L.tavern.free : L.tavern.next(clock(game.tavern[k] - now))}</small>
        <span class="stand"><Icon name={TAVERN[k].key} size={92} /></span>
        <b class="nm">{k === 'silver' ? L.tavern.silver : L.tavern.gold}</b>
        <small class="keys">{L.tavern.keys(n)}</small>
        <div class="acts">
          <Button size="sm" variant="gold" disabled={!can(k, 1)} onclick={() => open(k, 1)}>{L.tavern.open}</Button>
          {#if n + (free ? 1 : 0) >= 10}
            <Button size="sm" variant="ghost" onclick={() => open(k, 10)}>{L.tavern.open10(10)}</Button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- bảo hiểm thiếp vàng: xâu GOLD_PITY hạt, mỗi lần mở thiếp vàng tô son một hạt -->
  <div class="pity">
    <span class="beads" aria-hidden="true">
      {#each Array.from({ length: GOLD_PITY }, (_, i) => i) as i (i)}<i class:on={i < game.tavern.pity}></i>{/each}
    </span>
    <small class="t-small">{L.tavern.pity(GOLD_PITY - game.tavern.pity)}</small>
  </div>
</div>

{#if waiting}
  <p class="t-small t-soft">{L.tavern.waiting}</p>
{:else if last}
  <div class="got">
    <b class="got-h">{L.tavern.got}</b>
    <Bag res={last.got.res} items={last.got.items} size="sm" named />
    {#each tokens as [e, n] (e)}
      <span class="row t-small"><Portrait look={LOOK[e]} size={30} /><b>{L.tavern.tokens(L.elders[e].name, n)}</b></span
      >
    {/each}
  </div>
{/if}

<style>
  /* ---------- cảnh sảnh: khung đôi, dải núi mờ dưới đáy ---------- */
  .hall {
    display: grid;
    gap: 10px;
    padding: 12px 12px 14px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) center bottom / 260% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: start;
  }
  .lore {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .pic {
    width: 70px;
    margin: -6px -4px 0 0;
    rotate: 4deg;
    filter: drop-shadow(0 3px 5px rgb(var(--shade) / 0.25));
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  /* ---------- một tấm thiệp: dải lụa đầu, thiệp lớn nghiêng trên bệ gỗ, tên gạch son, số thiệp viên mực ---------- */
  .invite {
    --halo: 190 200 210;
    position: relative;
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 30px 4px 0;
    text-align: center;
  }
  .gold {
    --halo: 236 208 138;
  }
  .ribbon {
    position: absolute;
    top: 0;
    left: 50%;
    translate: -50% 0;
    max-width: 100%;
    padding: 2px 12px 3px;
    overflow: hidden;
    font-size: var(--fs-1);
    font-weight: 800;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--silk);
    background: color-mix(in srgb, var(--ink) 80%, transparent);
    clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 50%, 100% 100%, 0 100%, 6px 50%);
  }
  .free .ribbon {
    background: var(--cinnabar);
  }
  .stand {
    position: relative;
    display: grid;
    place-items: center;
    width: 118px;
    height: 104px;
    /* quầng sau thiệp (bạc: lam xám, vàng: ánh kim) + án gỗ thấp: mặt án, hai chân, bóng dưới đất */
    background:
      radial-gradient(closest-side, rgb(var(--halo) / 0.6), transparent) center 38% / 100% 86% no-repeat,
      linear-gradient(var(--ochre), var(--lacquer2)) center bottom 12px / 80% 7px no-repeat,
      linear-gradient(90deg, var(--lacquer2), var(--lacquer)) 22% bottom 3px / 5px 10px no-repeat,
      linear-gradient(90deg, var(--lacquer2), var(--lacquer)) 78% bottom 3px / 5px 10px no-repeat,
      radial-gradient(closest-side, rgb(var(--shade) / 0.2), transparent) center bottom / 90% 8px no-repeat;
  }
  .stand::before {
    /* viền son chạy dọc mép án (án sơn mài) */
    content: '';
    position: absolute;
    bottom: 17px;
    left: 10%;
    width: 80%;
    height: 2px;
    background: var(--cinnabar);
    opacity: 0.8;
  }
  .stand :global(.icon) {
    margin-bottom: 16px;
    rotate: -6deg;
    filter: drop-shadow(0 4px 5px rgb(var(--shade) / 0.25));
    transition: transform var(--dur-2) var(--spring);
  }
  .gold .stand :global(.icon) {
    rotate: 6deg;
  }
  .free .stand :global(.icon) {
    animation: bob 2.6s var(--ease) infinite;
  }
  .nm {
    padding: 0 10px 6px;
    font-size: var(--fs-4);
    line-height: 1.15;
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }
  .keys {
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--silk);
    background: color-mix(in srgb, var(--ink) 80%, transparent);
    border-radius: 999px;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-top: 4px;
  }
  /* ---------- xâu hạt bảo hiểm ---------- */
  .pity {
    display: grid;
    justify-items: center;
    gap: 4px;
    text-align: center;
  }
  .beads {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 6px;
    /* sợi chỉ xâu hạt */
    background: linear-gradient(var(--paper3), var(--paper3)) center / 100% 2px no-repeat;
  }
  .beads i {
    width: 12px;
    height: 12px;
    border: 2px solid var(--rim, var(--ink3));
    border-radius: 50%;
    background: var(--paper);
  }
  .beads i.on {
    border-color: var(--cinnabar);
    background: radial-gradient(circle at 35% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer));
  }
  /* ---------- quà vừa mở: tờ giấy ghim son ---------- */
  .got {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 6px;
    margin-top: var(--sp-3);
    padding: 16px 12px 12px;
    text-align: center;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px;
    box-shadow: 0 3px 8px rgb(var(--shade) / 0.14);
    rotate: -0.6deg;
    animation: drop 0.4s var(--spring) both;
  }
  .got::before {
    content: '';
    position: absolute;
    top: -6px;
    left: calc(50% - 6px);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer));
    box-shadow: 0 2px 2px rgb(var(--shade) / 0.3);
  }
  .got-h {
    padding: 0 12px 6px;
    font-size: var(--fs-4);
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }
  @keyframes bob {
    50% {
      transform: translateY(-4px);
    }
  }
  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .free .stand :global(.icon),
    .got {
      animation: none;
    }
  }
</style>
