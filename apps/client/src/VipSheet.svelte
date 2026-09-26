<script lang="ts">
  // Hương Hỏa (như VIP của RoK, không bán): cấp, điểm tới cấp sau, chuỗi ngày vào game (mai được bao nhiêu), rương hôm nay,
  // tăng ích cấp này và cấp sau, số phút xong miễn phí; Hương Hỏa Các (VIP Store): món mở theo cấp, mua bằng tài nguyên.
  // Bố cục như miếu trên núi: lư hương là tâm điểm, cấp là bậc thềm, lễ vật là hộp quà, cửa hàng là kệ gỗ.
  import {
    VIP_CHEST,
    VIP_FREE,
    VIP_LEVELS,
    VIP_PERKS,
    VIP_SHOP,
    dayOf,
    nextWeek,
    vipGot,
    vipLevel,
    vipToday,
    type Bonus,
  } from '@rok/rules'
  import { Icon, artOf } from '@rok/art'
  import { Bag, Button, Meter, Section, Sheet } from './ui'
  import VipGifts from './VipGifts.svelte'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'
  import { L, clock, num } from './lib'
  import { useGame } from './game'

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act
  const ui = (n: string) => artOf(`ui:${n}`)?.src

  const lv = $derived(vipLevel(game))
  const next = $derived(VIP_LEVELS[lv + 1])
  const got = $derived(game.vip.chest === dayOf(now))
  const bought = $derived(vipGot(game, now))
  const perks = (i: number) => Object.entries(VIP_PERKS[i] ?? {}) as [Bonus, number][]
</script>

<Sheet {open} {onclose} title={L.vip.title} sub={L.vip.level(lv)}>
  <!-- miếu: lư hương trước miếu, cấp viết trong ấn son đè góc tranh; điểm tới cấp sau, chuỗi ngày về núi -->
  <header class="shrine">
    <span class="censer">
      {#if ui('ev-vip')}<img src={ui('ev-vip')} alt="" draggable="false" />{:else}<Icon
          name="cauldron"
          size={64}
        />{/if}
      <b class="lvseal" aria-label={L.vip.level(lv)}>{lv}</b>
    </span>
    <div class="stack" style:--gap="6px">
      <b class="pts t-num">{next ? `${num(game.vip.pts)} / ${num(next)}` : num(game.vip.pts)}</b>
      {#if next}<Meter value={(game.vip.pts - VIP_LEVELS[lv]) / (next - VIP_LEVELS[lv])} size="md" tone="gold" />{/if}
      <p class="t-small">{L.vip.streak(game.vip.streak, vipToday(game.vip.streak + 1))}</p>
    </div>
    <p class="lore t-tiny t-lore">{L.vip.lore}</p>
  </header>

  <!-- bậc thềm lên miếu: mỗi cấp một bậc, bậc đã lên tô son, bậc đang đứng có hạt son -->
  <ol class="steps" aria-hidden="true">
    {#each VIP_LEVELS as _, i (i)}
      <li class:hit={i <= lv} class:cur={i === lv} style:--h="{16 + i * 3.5}px"><b>{i}</b></li>
    {/each}
  </ol>
  <!-- tăng ích: hai bài vị — cấp đang hưởng, cấp sau mở thêm -->
  <div class="tablets">
    {#each [lv, lv + 1] as i (i)}
      {#if i < VIP_LEVELS.length}
        <section class="tablet" class:nx={i > lv}>
          <b class="t-small">{i === lv ? L.vip.now(i) : L.vip.nextLv(i)}</b>
          <ul class="t-small">
            {#each perks(i) as [k, v] (k)}<li>
                {L.vip.perk[k as keyof typeof L.vip.perk] ?? k} <b class="t-num">+{Math.round(v * 100)}%</b>
              </li>{/each}
            {#if VIP_FREE[i]}<li>{L.vip.free(VIP_FREE[i])}</li>{/if}
            {#if !perks(i).length && !VIP_FREE[i]}<li class="t-soft">—</li>{/if}
          </ul>
        </section>
      {/if}
    {/each}
  </div>

  <!-- lễ vật hôm nay: hộp quà sơn son, nhận rồi đóng dấu son lên hộp -->
  <section class="offer" class:ready={!got}>
    <span class="box">
      {#if ui('ally-gift')}<img src={ui('ally-gift')} alt="" draggable="false" />{:else}<Icon
          name="star"
          size={48}
        />{/if}
      {#if got}<span class="stamp" title={L.vip.chestGot}>{L.fest.claimed}</span>{/if}
    </span>
    <div class="stack" style:--gap="6px">
      <b>{L.vip.chest}</b>
      <Bag res={VIP_CHEST[lv].res} items={VIP_CHEST[lv].items} size="sm" />
      {#if !got}<Button variant="gold" onclick={() => act({ type: 'vipChest' }, 'reward')}>{L.vip.open}</Button>{/if}
    </div>
  </section>

  <Section title={L.vip.shop}>
    {#snippet aside()}<small class="t-tiny t-soft">{L.merchant.next(clock(nextWeek(now) - now))}</small>{/snippet}
    <p class="t-tiny t-soft lore">{L.vip.shopLore}</p>
    <!-- kệ gỗ Hương Hỏa Các: món đứng trên ván, dưới ván là tên, lượt còn và nút giá (bấm là mua) -->
    <ul class="shelf">
      {#each VIP_SHOP as x (x.item)}
        {@const left = x.week - (bought[x.item] ?? 0)}
        {@const cost = x.price * game.levels.chuDien}
        {@const locked = lv < x.lv}
        <li class:dim={locked || left <= 0}>
          <span class="pic">
            <ItemCell id={x.item} n={x.n} />
            {#if !locked && left <= 0}<span class="stamp">{L.fest.soldOut}</span>{/if}
          </span>
          <b class="nm t-tiny">{itemName(x.item)}</b>
          {#if locked}
            <small class="lock t-tiny row" style:--gap="3px"><Icon name="lock" size={12} />{L.vip.shopNeed(x.lv)}</small
            >
          {:else}
            <small class="t-tiny t-soft">{L.vip.shopLeft(left, x.week)}</small>
            <Button
              size="sm"
              variant="ink"
              wide
              label={L.vip.buy}
              disabled={left <= 0 || game.res[x.res] < cost}
              onclick={() => act({ type: 'vipBuy', item: x.item }, 'reward')}
              ><span class="price t-num"><Icon name={x.res} size={16} />{num(cost)}</span></Button
            >
          {/if}
        </li>
      {/each}
    </ul>
  </Section>
  <VipGifts />
</Sheet>

<style>
  /* ---------- miếu: lư hương + ấn cấp, số điểm bên phải, lời dẫn dưới nền núi ---------- */
  .shrine {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 4px 14px;
    align-items: center;
    padding: 10px 14px 10px 8px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .censer {
    position: relative;
    display: grid;
    place-items: center;
    width: 104px;
    height: 104px;
  }
  .censer img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    rotate: -3deg;
    filter: drop-shadow(0 4px 6px rgb(var(--shade) / 0.25));
  }
  /* ấn son tròn đè góc tranh, số cấp trắng */
  .lvseal {
    position: absolute;
    right: -6px;
    bottom: -4px;
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    font-size: var(--fs-5);
    font-weight: 900;
    color: var(--silk);
    text-shadow: 0 1px 2px rgb(var(--shade) / 0.45);
    background: var(
        --ui-seal-img,
        radial-gradient(circle at 40% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer))
      )
      center / 100% 100% no-repeat;
    border-radius: 50%;
    filter: drop-shadow(0 2px 3px color-mix(in srgb, var(--lacquer) 35%, transparent));
  }
  .pts {
    font-size: var(--fs-5);
  }
  .shrine .lore {
    grid-column: 1 / -1;
  }
  .lore {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  /* ---------- bậc thềm: bậc đá cao dần sang phải, đã lên thì mặt bậc son ---------- */
  .steps {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 70px;
    margin: var(--sp-3) 0 0;
    padding: 0 2px;
    border-bottom: 2px solid var(--ink3);
  }
  .steps li {
    position: relative;
    display: grid;
    flex: 1;
    align-content: start;
    justify-items: center;
    height: var(--h);
    padding-top: 2px;
    background: linear-gradient(
      color-mix(in srgb, var(--ink3) 18%, var(--silk)),
      color-mix(in srgb, var(--ink3) 35%, var(--silk))
    );
    border-top: 3px solid var(--ink3);
    border-radius: 2px 2px 0 0;
  }
  .steps b {
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    color: var(--text-soft);
  }
  .steps li.hit {
    background: linear-gradient(
      color-mix(in srgb, var(--cinnabar) 14%, var(--silk)),
      color-mix(in srgb, var(--cinnabar) 26%, var(--silk))
    );
    border-top-color: var(--cinnabar);
  }
  .steps li.hit b {
    color: var(--cinnabar);
  }
  /* bậc đang đứng: hạt son trên mặt bậc */
  .steps li.cur::before {
    content: '';
    position: absolute;
    top: -13px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--cinnabar) 22%, transparent);
  }
  /* ---------- bài vị tăng ích ---------- */
  .tablets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--sp-2);
    margin-top: var(--sp-3);
  }
  .tablet {
    display: grid;
    align-content: start;
    gap: 4px;
    padding: 8px 10px 10px;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-top: 3px solid var(--ink3);
    border-radius: 3px;
    box-shadow: 0 2px 5px rgb(var(--shade) / 0.1);
  }
  .tablet.nx {
    border-top-color: var(--cinnabar);
  }
  .tablet.nx > b {
    color: var(--cinnabar);
  }
  .tablet ul {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tablet li {
    padding-bottom: 2px;
    border-bottom: 1px dashed var(--paper3);
  }
  /* ---------- lễ vật: hộp quà bên trái, dấu son đóng lên khi đã nhận ---------- */
  .offer {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    margin-top: var(--sp-3);
    padding: 10px 14px 12px 8px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
  }
  .box {
    position: relative;
    display: grid;
    place-items: center;
    width: 84px;
    height: 84px;
  }
  .box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 3px 5px rgb(var(--shade) / 0.22));
  }
  .offer.ready .box img {
    filter: drop-shadow(0 0 8px rgb(var(--gold-glow) / 0.9)) drop-shadow(0 3px 5px rgb(var(--shade) / 0.22));
  }
  .box .stamp {
    position: absolute;
    bottom: 6px;
    background: color-mix(in srgb, var(--silk) 75%, transparent);
  }
  /* ---------- kệ gỗ Hương Hỏa Các (như tủ trong Túi đồ) ---------- */
  .shelf {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 14px 0;
    margin: 0;
    padding: 6px 8px 12px;
    list-style: none;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--ochre) 45%, var(--lacquer2)), var(--lacquer2)) left top / 8px 100%
        no-repeat,
      linear-gradient(90deg, var(--lacquer2), color-mix(in srgb, var(--ochre) 45%, var(--lacquer2))) right top / 8px
        100% no-repeat,
      linear-gradient(var(--silk), color-mix(in srgb, var(--paper2) 45%, var(--silk)));
    border-top: 8px solid color-mix(in srgb, var(--ochre) 45%, var(--lacquer2));
    border-radius: 4px 4px 0 0;
    box-shadow: 0 4px 10px rgb(var(--shade) / 0.18);
  }
  .shelf li {
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 3px;
    min-width: 0;
    padding: 0 5px;
    text-align: center;
  }
  /* ván kệ dưới món hàng: các ô cạnh nhau liền thành một tấm */
  .pic {
    position: relative;
    display: grid;
    justify-items: center;
    width: calc(100% + 10px);
    padding: 4px 0 12px;
    background: linear-gradient(
        transparent calc(100% - 12px),
        var(--ochre) calc(100% - 12px),
        var(--lacquer2) calc(100% - 3px),
        rgb(var(--shade) / 0.14) calc(100% - 3px)
      )
      no-repeat;
  }
  .pic .stamp {
    position: absolute;
    top: 26px;
    background: color-mix(in srgb, var(--silk) 80%, transparent);
  }
  .nm {
    display: -webkit-box;
    min-height: 2.4em;
    overflow: hidden;
    line-height: 1.2;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .dim .pic :global(.cell),
  .dim .nm {
    opacity: 0.55;
  }
  .lock {
    justify-content: center;
    padding: 2px 8px;
    color: var(--silk);
    background: color-mix(in srgb, var(--ink) 75%, transparent);
    border-radius: 999px;
  }
  .price {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
</style>
