<script lang="ts">
  // Công Huân mùa (Honor của KvK — luật ở rules: HONOR_* trong data.ts, sect/honor.ts, world/season.ts): điểm của mình, các
  // mốc Chinh Chiến Công Tích (nhận lần lượt), bảng Công Huân của giới (chạm tên: hồ sơ). Mở từ thẻ mùa trên bản đồ Giới.
  // Bố cục: băng rôn điểm (cờ trên đỉnh núi, số to, thanh tới mốc kế), đường mốc `.path`, bảng hạng đồng tiền, quầy đổi hai cột.
  import { COIN_PER, COIN_SHOP, HONOR_TIERS, coins } from '@rok/rules'
  import type { HonorView } from '@rok/protocol'
  import type { Net } from './net'
  import { Art, Banner, Bag, Button, Meter, Note, Section, Sheet } from './ui'
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
  const honor = $derived(game.honor ?? 0)
  const got = $derived(game.honorGot ?? 0)
  const goal = $derived(HONOR_TIERS.find(t => t.n > honor)) // mốc chưa đạt kế tiếp (thanh tiến độ)
</script>

<Sheet open={social.honor} onclose={() => (social.honor = false)} title={L.honor.title}>
  <div class="mt-2">
    <Banner title={L.honor.mine(num(honor))} picLeft picSize={72}>
      {#snippet pic()}<Art art="fx-flag" icon="star" size={72} />{/snippet}
      {#snippet lead()}
        {#if goal}<Meter value={honor / goal.n} tone="gold" label="{num(honor)} / {num(goal.n)}" />
          <small class="t-tiny t-soft t-num">{num(honor)} / {num(goal.n)}</small>{/if}
      {/snippet}
      <p class="t-small t-lore clamp">{L.honor.lore}</p>
    </Banner>
  </div>
  <Section title={L.honor.tiers}>
    <ol class="path">
      {#each HONOR_TIERS as t, i (i)}
        <li class:hit={honor >= t.n}>
          <div class="mile">
            <b class="t-num">{num(t.n)}</b>
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
    <ol class="ledger">
      {#each view?.top ?? [] as r, k (r.pid)}
        <li class:on={view?.me?.rank === k + 1}>
          <button type="button" class="t-small" aria-label={r.name} onclick={() => (social.profile = r.pid)}>
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
    {#snippet aside()}<b class="t-num t-bad">{L.honor.coins(num(coins(game)))}</b>{/snippet}
    <p class="t-tiny t-soft">{L.honor.shopHint(COIN_PER)}</p>
    <div class="fill" style:--min="150px" style:--gap="10px">
      {#each COIN_SHOP as it, i (i)}
        <Note pin={false}>
          <div class="stack justify-center t-center">
            <Bag items={it.reward.items} size="sm" named />
            <Button
              size="sm"
              variant="gold"
              disabled={coins(game) < it.price}
              onclick={() => g.act({ type: 'coinBuy', i }, 'reward')}>{L.honor.buy(num(it.price))}</Button
            >
          </div>
        </Note>
      {/each}
    </div>
  </Section>
</Sheet>
