<script lang="ts">
  // Vận Linh Trận trong hồ sơ đồng minh (Resource Assistance của RoK — luật ở rules/world/supply.ts): kéo từng loại tài
  // nguyên, thấy hao tổn, số họ nhận và hạn mức hôm nay của hai bên; gửi xong họ nhận qua thư.
  import { RESOURCES, SUPPLY_HALL, type Bag } from '@rok/rules'
  import { afterTax, bagSum, type SupplyRoom, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Icon, artOf } from '@rok/art'
  import { Button, Section, Slider } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  let {
    to,
    name,
    room,
    send,
    onsent,
  }: {
    to: number
    name: string
    room: SupplyRoom
    send: (a: WorldAction) => Promise<Ack>
    onsent: () => void // tải lại hồ sơ (hạn mức mới)
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const none: Bag = { linhThach: 0, linhThao: 0, linhKhoang: 0 }
  let pick = $state<Bag>({ ...none })
  let sent = $state(false)
  const have = (r: keyof Bag) => Math.floor(game.res[r])
  const amount = $derived({
    linhThach: Math.min(pick.linhThach, have('linhThach')),
    linhThao: Math.min(pick.linhThao, have('linhThao')),
    linhKhoang: Math.min(pick.linhKhoang, have('linhKhoang')),
  })
  const got = $derived(afterTax(amount, room.tax))
  const over = $derived(bagSum(amount) > room.send || bagSum(got) > room.get)
  async function go() {
    if (!(await send({ type: 'supply', to, res: amount })).ok) return
    sfx('reward')
    pick = { ...none }
    sent = true
    onsent()
  }
</script>

<Section title={L.supply.title}>
  {#snippet aside()}<small class="t-tiny t-soft">{L.supply.tax(`${Math.round(room.tax * 100)}%`)}</small>{/snippet}
  {#if game.levels.chuDien < SUPPLY_HALL}
    <p class="t-small t-soft">{L.supply.locked(SUPPLY_HALL)}</p>
  {:else}
    <p class="t-tiny t-soft">{L.supply.lore}</p>
    {#each RESOURCES as r (r)}
      <div class="row">
        {#if artOf(`ui:res-${r}`)}<img
            class="res"
            src={artOf(`ui:res-${r}`)!.src}
            alt=""
            draggable="false"
          />{:else}<Icon name={r} size={20} />{/if}
        <span class="grow">
          <Slider
            value={amount[r]}
            max={Math.min(have(r), room.send)}
            label={L.res[r]}
            onchange={v => {
              pick = { ...pick, [r]: v }
              sent = false
            }}
          />
        </span>
        <b class="t-small t-num n">{num(amount[r])}</b>
      </div>
    {/each}
    <p class="row between t-tiny">
      <span class="t-soft">{L.supply.left(num(room.send), num(room.get))}</span>
      <span class="t-good">{L.supply.net(num(bagSum(got)))}</span>
    </p>
    {#if over}<p class="t-tiny t-bad">{L.supply.over}</p>{/if}
    {#if sent}<p class="t-tiny t-good">{L.supply.done(name)}</p>{/if}
    <Button wide variant="gold" icon="arrow" disabled={!bagSum(amount) || over} onclick={go}>{L.supply.open}</Button>
  {/if}
</Section>

<style>
  /* vật chứa vẽ tay của từng tài nguyên đứng đầu dòng kéo */
  .res {
    width: 40px;
    height: 40px;
  }
  .n {
    min-width: 5ch;
    text-align: right;
  }
</style>
