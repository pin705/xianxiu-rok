<script lang="ts">
  // Công Huân mùa (Honor của KvK — luật ở rules: HONOR_* trong data.ts, sect/honor.ts, world/season.ts): điểm của mình, các
  // mốc Chinh Chiến Công Tích (nhận lần lượt), bảng Công Huân của giới (chạm tên: hồ sơ). Mở từ thẻ mùa trên bản đồ Giới.
  // Bố cục: băng rôn điểm (cờ trên đỉnh núi, số to, thanh tới mốc kế), đường mốc `.path`, bảng hạng đồng tiền, quầy đổi hai cột.
  import { COIN_PER, COIN_SHOP, HONOR_TIERS, coins } from '@rok/rules'
  import type { HonorView } from '@rok/protocol'
  import type { Net } from './net'
  import { Icon, artOf } from '@rok/art'
  import { Bag, Button, Meter, Section, Sheet } from './ui'
  import { L, num } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let { api }: { api: Pick<Net, 'ask'> | null } = $props()
  const g = useGame()
  const game = $derived(g.game)
  let view = $state.raw<HonorView | null>(null)
  $effect(() => {
    if (social.honor) void api?.ask({ k: 'honor' }).then(v => (view = v))
  })
  const art = artOf('ui:fx-flag')?.src
  const honor = $derived(game.honor ?? 0)
  const got = $derived(game.honorGot ?? 0)
  const goal = $derived(HONOR_TIERS.find(t => t.n > honor)) // mốc chưa đạt kế tiếp (thanh tiến độ)
</script>

<Sheet open={social.honor} onclose={() => (social.honor = false)} title={L.honor.title}>
  <header class="banner">
    {#if art}<img class="art" src={art} alt="" draggable="false" />{:else}<Icon name="star" size={40} />{/if}
    <span class="stack" style:--gap="4px">
      <b class="pts">{L.honor.mine(num(honor))}</b>
      {#if goal}<Meter value={honor / goal.n} tone="gold" label="{num(honor)} / {num(goal.n)}" />
        <small class="t-tiny t-soft t-num">{num(honor)} / {num(goal.n)}</small>{/if}
    </span>
    <p class="t-small t-lore lore">{L.honor.lore}</p>
  </header>
  <Section title={L.honor.tiers}>
    <ol class="path">
      {#each HONOR_TIERS as t, i (i)}
        <li class:hit={honor >= t.n}>
          <div class="row mile">
            <b class="t-num n">{num(t.n)}</b>
            <span class="grow"><Bag items={t.reward.items} size="sm" /></span>
            {#if i < got}
              <span class="stamp">{L.honor.got}</span>
            {:else if honor >= t.n}
              <!-- nhận lần lượt: mốc sau đủ điểm thì chờ mốc trước -->
              <Button
                size="sm"
                variant="gold"
                disabled={i !== got}
                onclick={() => g.act({ type: 'honorClaim' }, 'reward')}>{L.honor.claim}</Button
              >
            {:else}
              <small class="t-tiny t-soft">{L.honor.need(num(t.n))}</small>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  </Section>
  <Section title={L.honor.board}>
    <p class="t-tiny t-soft">{L.honor.boardHint}</p>
    {#if view?.me}<p class="t-small t-gold t-strong">{L.rank.me}: #{view.me.rank} · {num(view.me.n)}</p>{/if}
    {#if view && !view.top.length}<p class="t-small t-soft">{L.honor.none}</p>{/if}
    <ol class="board">
      {#each view?.top ?? [] as r, k (r.pid)}
        <li>
          <button
            type="button"
            class="rowb t-small"
            class:me={view?.me?.rank === k + 1}
            aria-label={r.name}
            onclick={() => (social.profile = r.pid)}
          >
            <i class="rank-no r{k + 1}">{k + 1}</i>
            <span class="grow t-strong t-ellipsis">{r.name}</span>
            <b class="t-num">{num(r.n)}</b>
          </button>
        </li>
      {/each}
    </ol>
  </Section>
  <!-- Thiên Môn Thương Điếm: Phi Thăng Tệ từ Công Huân cả đời, chưa tiêu thì mang sang mùa sau -->
  <Section title={L.honor.shop}>
    {#snippet aside()}<b class="t-num coins">{L.honor.coins(num(coins(game)))}</b>{/snippet}
    <p class="t-tiny t-soft">{L.honor.shopHint(COIN_PER)}</p>
    <ul class="shop">
      {#each COIN_SHOP as it, i (i)}
        <li class="good">
          <Bag items={it.reward.items} size="sm" named />
          <Button
            size="sm"
            variant="gold"
            disabled={coins(game) < it.price}
            onclick={() => g.act({ type: 'coinBuy', i }, 'reward')}>{L.honor.buy(num(it.price))}</Button
          >
        </li>
      {/each}
    </ul>
  </Section>
</Sheet>

<style>
  .banner {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 6px 12px;
    align-items: center;
    margin-top: var(--sp-2);
    padding: 12px 12px 12px 10px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 320% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .art {
    width: 72px;
    rotate: -4deg;
    filter: drop-shadow(0 3px 5px rgb(var(--shade) / 0.25));
  }
  .pts {
    font-size: var(--fs-5);
    line-height: 1.15;
  }
  .lore {
    grid-column: 1 / -1;
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .mile {
    min-height: 44px;
    padding: 4px 0;
    border-bottom: 1px dashed var(--paper3);
  }
  .path > li::before {
    top: 16px;
  }
  .n {
    min-width: 4.5ch;
  }
  .board,
  .shop {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rowb {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 38px;
    padding: 3px 6px;
    text-align: left;
    color: var(--text);
    border-bottom: 1px dashed var(--paper3);
  }
  .rowb.me {
    font-weight: 800;
    background: color-mix(in srgb, var(--cinnabar) 10%, transparent);
    border-radius: 6px;
  }
  .coins {
    color: var(--cinnabar);
  }
  /* quầy đổi: mỗi món một lá bùa giấy trên kệ, hai cột */
  .shop {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  .good {
    display: grid;
    justify-items: center;
    align-content: space-between;
    gap: 8px;
    padding: 12px 6px 10px;
    text-align: center;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px;
    box-shadow: 0 3px 6px rgb(var(--shade) / 0.12);
  }
</style>
