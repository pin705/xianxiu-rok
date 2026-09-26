<script lang="ts">
  // Thương hội (Tàng Bảo Các): đổi tài nguyên dư lấy tài nguyên thiếu, có phí. Mặc định: đổi loại nhiều nhất lấy loại ít nhất.
  // Bố cục quầy đổi: hai cột (đổi đi | nhận về), mỗi cột ba vật chứa vẽ tay xếp dọc, mũi tên mực ở giữa
  // chỉ số nhận về; thanh kéo số lượng và nút đổi dưới quầy.
  import { RESOURCES, tradeKeep, type Res } from '@rok/rules'
  import type { IconName } from '@rok/art'
  import { Button, Card, Choice, InkArrow, Slider } from './ui'
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
  <div class="stack grow" style:--gap="4px" role="group" aria-label={title}>
    <b class="brush self-center">{title}</b>
    {#each RESOURCES as r (r)}
      <Choice
        art="res-{r}"
        icon={r as IconName}
        label={L.res[r]}
        sub={num(game.res[r])}
        on={value === r}
        disabled={r === other}
        onclick={() => onpick(r)}
      />
    {/each}
  </div>
{/snippet}

<p class="t-tiny t-soft mt-3">{L.trade.hint}</p>
<Card>
  <div class="row" style:--gap="0">
    {@render tray(L.trade.give, give, take, r => {
      from = r
      n = 0
      if (r === take) to = give
    })}
    <span class="stack middle" style:--gap="2px">
      <InkArrow width={40} />
      <small class="t-tiny t-soft t-num">{Math.round(keep * 100)}%</small>
    </span>
    {@render tray(L.trade.get, take, give, r => (to = r))}
  </div>
</Card>

<div class="stack mt-3" style:--gap="2px">
  <span class="row between"
    ><b>{L.trade.amount}</b><b class="t-num t-big">{num(amount)} → <span class="t-good">{num(got)}</span></b></span
  >
  <Slider value={amount} min={0} max={most} label={L.trade.amount} onchange={v => (n = v)} />
  <p class="t-tiny t-soft">{L.trade.rate(`${Math.round(keep * 100)}%`)}</p>
</div>

<div class="mt-3">
  <Button wide size="lg" variant="gold" disabled={amount < 1 || got < 1} onclick={go}
    >{L.trade.go(num(got), L.res[take])}</Button
  >
</div>
