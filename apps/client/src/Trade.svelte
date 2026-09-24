<script lang="ts">
  // Thương hội (Tàng Bảo Các): đổi tài nguyên dư lấy tài nguyên thiếu, có phí. Mặc định: đổi loại nhiều nhất lấy loại ít nhất.
  import { RESOURCES, tradeKeep, type Res } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Button, Card, Section, Slider } from './ui'
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

{#snippet pick(title: string, value: Res, other: Res, onpick: (r: Res) => void)}
  <Section {title}>
    <div class="grid" style:--cols="3">
      {#each RESOURCES as r (r)}
        <Card selected={value === r} disabled={r === other} onclick={() => onpick(r)} label={L.res[r]}>
          <span class="stack center" style:--gap="3px">
            <Icon name={r} size={26} />
            <b class="t-small">{L.res[r]}</b>
            <small class="t-tiny t-soft t-num">{num(game.res[r])}</small>
          </span>
        </Card>
      {/each}
    </div>
  </Section>
{/snippet}

<p class="t-small t-soft mt-3">{L.trade.hint}</p>
{@render pick(L.trade.give, give, take, r => {
  from = r
  n = 0
  if (r === take) to = give
})}
{@render pick(L.trade.get, take, give, r => (to = r))}

<Section title="{L.trade.amount} · {num(amount)}">
  <Slider value={amount} min={0} max={most} label={L.trade.amount} onchange={v => (n = v)} />
  <p class="t-small t-soft mt-2">{L.trade.rate(`${Math.round(keep * 100)}%`)}</p>
</Section>

<div class="mt-3">
  <Button wide size="lg" disabled={amount < 1 || got < 1} onclick={go}>{L.trade.go(num(got), L.res[take])}</Button>
</div>
