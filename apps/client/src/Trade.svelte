<script lang="ts">
  // Thương hội (Tàng Bảo Các): đổi tài nguyên dư lấy tài nguyên thiếu, có phí. Mặc định: đổi loại nhiều nhất lấy loại ít nhất.
  // Bố cục quầy đổi: hai cột (đổi đi | nhận về), mỗi cột ba vật chứa vẽ tay xếp dọc, mũi tên mực ở giữa
  // chỉ số nhận về; thanh kéo số lượng và nút đổi dưới quầy.
  import { RESOURCES, tradeKeep, type Res } from '@rok/rules'
  import { Icon, artOf, type IconName } from '@rok/art'
  import { Button, Card, Slider } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  const byAmount = $derived([...RESOURCES].sort((a, b) => game.res[b] - game.res[a]))
  let from = $state<Res | null>(null)
  let to = $state<Res | null>(null)
  const give = $derived(from ?? byAmount[0])
  const take = $derived(to && to !== give ? to : byAmount.at(-1) === give ? byAmount[1] : byAmount.at(-1)!)
  const most = $derived(Math.floor(game.res[give]))
  let n = $state(0)
  const amount = $derived(Math.min(n || Math.floor(most / 2), most))
  const keep = $derived(tradeKeep(game))
  const got = $derived(Math.floor(amount * keep))

  function go() {
    if (amount < 1 || !act({ type: 'trade', from: give, to: take, n: amount })) return
    sfx('reward')
    n = 0
  }
</script>

{#snippet tray(title: string, value: Res, other: Res, onpick: (r: Res) => void)}
  <div class="tray" role="group" aria-label={title}>
    <b class="tt">{title}</b>
    {#each RESOURCES as r (r)}
      {@const src = artOf(`ui:res-${r}`)?.src}
      <button
        type="button"
        class="pot"
        class:on={value === r}
        disabled={r === other}
        aria-label={L.res[r]}
        aria-pressed={value === r}
        onclick={() => {
          sfx('tap')
          onpick(r)
        }}
      >
        {#if src}<img {src} alt="" draggable="false" />{:else}<Icon name={r as IconName} size={34} />{/if}
        <span class="stack" style:--gap="0"
          ><b class="t-small">{L.res[r]}</b><small class="t-tiny t-soft t-num">{num(game.res[r])}</small></span
        >
      </button>
    {/each}
  </div>
{/snippet}

<p class="t-tiny t-soft mt-3">{L.trade.hint}</p>
<Card>
  <div class="counter">
    {@render tray(L.trade.give, give, take, r => {
      from = r
      n = 0
      if (r === take) to = give
    })}
    <span class="mid">
      <svg class="arrow" viewBox="0 0 60 24" aria-hidden="true"
        ><path d="M4 14 C 18 4, 30 22, 46 11" /><path d="M40 5 L 52 10 L 42 18" /></svg
      >
      <small class="t-num">{Math.round(keep * 100)}%</small>
    </span>
    {@render tray(L.trade.get, take, give, r => (to = r))}
  </div>
</Card>

<div class="amt">
  <span class="row between"
    ><b>{L.trade.amount}</b><b class="t-num big">{num(amount)} → <span class="t-good">{num(got)}</span></b></span
  >
  <Slider value={amount} min={0} max={most} label={L.trade.amount} onchange={v => (n = v)} />
  <p class="t-tiny t-soft">{L.trade.rate(`${Math.round(keep * 100)}%`)}</p>
</div>

<Button wide size="lg" variant="gold" disabled={amount < 1 || got < 1} onclick={go}
  >{L.trade.go(num(got), L.res[take])}</Button
>

<style>
  .counter {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px minmax(0, 1fr);
    align-items: center;
  }
  .tray {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .tt {
    padding: 0 6px 5px;
    justify-self: center;
    font-size: var(--fs-3);
    background: var(--stroke-red) no-repeat center bottom / 100% 6px;
  }
  .pot {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    min-height: 50px;
    padding: 2px 6px;
    color: var(--text-soft);
    text-align: left;
    border: 1.5px solid transparent;
    border-radius: 8px;
  }
  .pot img {
    flex: none;
    width: 44px;
    height: 44px;
  }
  .pot.on {
    color: var(--text);
    border-color: var(--cinnabar);
  }
  .pot:disabled {
    opacity: 0.35;
  }
  .mid {
    display: grid;
    justify-items: center;
    gap: 2px;
  }
  .mid small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  .arrow {
    width: 40px;
    fill: none;
    stroke: var(--text);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .amt {
    display: grid;
    gap: 2px;
    margin: var(--sp-3) 0;
  }
  .big {
    font-size: var(--fs-4);
  }
</style>
