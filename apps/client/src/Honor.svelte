<script lang="ts">
  // Công Huân mùa (Honor của KvK — luật ở rules: HONOR_* trong data.ts, sect/honor.ts, world/season.ts): điểm của mình, các
  // mốc Chinh Chiến Công Tích (nhận lần lượt), bảng Công Huân của giới (chạm tên: hồ sơ). Mở từ thẻ mùa trên bản đồ Giới.
  import { HONOR_TIERS } from '@rok/rules'
  import type { HonorView } from '@rok/protocol'
  import type { Net } from './net'
  import { Bag, Button, Card, Meter, Section, Sheet } from './ui'
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

<Sheet open={social.honor} onclose={() => (social.honor = false)} title={L.honor.title} lore={L.honor.lore}>
  <Card tone="silk">
    <div class="stack" style:--gap="4px">
      <b>{L.honor.mine(num(honor))}</b>
      {#if goal}<Meter value={honor / goal.n} tone="gold" label="{num(honor)} / {num(goal.n)}" />{/if}
    </div>
  </Card>
  <Section title={L.honor.tiers}>
    <ul class="stack rows">
      {#each HONOR_TIERS as t, i (i)}
        <li class="row">
          <b class="t-num n">{num(t.n)}</b>
          <span class="grow"><Bag items={t.reward.items} size="sm" /></span>
          {#if i < got}
            <small class="t-tiny t-good">{L.honor.got}</small>
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
        </li>
      {/each}
    </ul>
  </Section>
  <Section title={L.honor.board}>
    <p class="t-tiny t-soft">{L.honor.boardHint}</p>
    {#if view?.me}<p class="t-small t-gold t-strong">{L.rank.me}: #{view.me.rank} · {num(view.me.n)}</p>{/if}
    {#if view && !view.top.length}<p class="t-small t-soft">{L.honor.none}</p>{/if}
    <ol class="stack rows" style:--gap="4px">
      {#each view?.top ?? [] as r, k (r.pid)}
        <li>
          <Card
            tone={view?.me?.rank === k + 1 ? 'glow' : 'paper'}
            onclick={() => (social.profile = r.pid)}
            label={r.name}
          >
            <span class="row">
              <b class="t-num rank" class:top={k < 3}>{k + 1}</b>
              <span class="grow t-strong t-ellipsis">{r.name}</span>
              <b class="t-num t-gold">{num(r.n)}</b>
            </span>
          </Card>
        </li>
      {/each}
    </ol>
  </Section>
</Sheet>

<style>
  .rows {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .n {
    min-width: 4.5ch;
  }
  .rank {
    width: 2.2em;
    text-align: center;
    color: var(--text-soft);
  }
  .top {
    color: var(--gold);
  }
</style>
