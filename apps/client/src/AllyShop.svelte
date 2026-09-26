<script lang="ts">
  // Cống Hiến Các (như Alliance Shop của RoK): quầy bảo vật — món hàng đứng trên kệ gỗ (số còn, giá cống hiến), chạm một món
  // để đổi; trưởng lão và minh chủ nhập thêm bằng Minh khố (mỗi lần tối đa 5 món).
  import { ALLY_SHOP, ALLY_SHOP_MAX, type BagId } from '@rok/rules'
  import { SHOP_IDS, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Art, Button, Card, Plaque, Sheet, Shelf, Tag } from './ui'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  let {
    open,
    onclose,
    ally,
    officer,
    send,
  }: {
    open: boolean
    onclose: () => void
    ally: AllyInfo
    officer: boolean
    send: (a: WorldAction) => Promise<Ack>
  } = $props()
  const g = useGame()
  const credit = $derived(g.game.contrib?.credit ?? 0)
  const fund = $derived(ally.fund ?? 0)
  const ids = SHOP_IDS as BagId[]
  const have = (id: BagId) => ally.stock?.[id] ?? 0
  // món đang xem: chạm trên kệ; chưa chạm thì món còn hàng đầu tiên
  let pick = $state<BagId | null>(null)
  const sel = $derived(pick ?? ids.find(id => have(id) > 0) ?? ids[0])
  const price = $derived(ALLY_SHOP[sel]!.price)
  // số món nhập được một lần: tối đa 5, không quá tồn tối đa, đủ Minh khố
  const batch = (id: BagId) => Math.min(5, ALLY_SHOP_MAX - have(id), Math.floor(fund / ALLY_SHOP[id]!.stock))
  const go = async (a: WorldAction) => {
    if ((await send(a)).ok) sfx('reward')
  }
</script>

<Sheet {open} {onclose} title={L.guild.shop} lore={L.guild.shopLore}>
  <!-- quầy bảo vật: tranh quầy + hai tấm biển cống hiến / Minh khố -->
  <div class="stack mt-2" style:--gap="4px">
    <div class="split">
      <Art art="ally-shop" icon="hoSon" size={84} tilt={-3} />
      <div class="grid" style:--gap="6px">
        <Plaque label={L.guild.credit} value={num(credit)} />
        <Plaque label={L.guild.fund} value={num(fund)} />
      </div>
    </div>
    <p class="t-tiny t-soft clamp">{L.guild.creditHint}</p>
  </div>

  <!-- kệ gỗ: món hàng đứng trên ván, giá cống hiến trên thẻ giấy dưới ván; hết hàng thì mờ -->
  <div class="mt-3">
    <Shelf row={104}>
      {#each ids as id (id)}
        <span class="stack justify-center" style:--gap="4px">
          <span class:dim={!have(id)}>
            <ItemCell
              {id}
              n={have(id)}
              selected={id === sel}
              onclick={() => {
                sfx('tap')
                pick = id
              }}
            />
          </span>
          <Tag size="sm">{num(ALLY_SHOP[id]!.price)}</Tag>
        </span>
      {/each}
    </Shelf>
  </div>

  <!-- món đang chọn: tên, giá, số còn; đổi (sơn son) · nhập hàng (trưởng lão) -->
  <div class="mt-3">
    <Card tone="glow"
      ><div class="stack" style:--gap="6px">
        <p class="row between">
          <b>{itemName(sel)}</b>
          <small class="t-small" class:t-soft={have(sel) > 0} class:t-bad={!have(sel)}
            >{have(sel) ? L.guild.stock(have(sel)) : L.guild.empty}</small
          >
        </p>
        <p class="t-small t-num" class:t-bad={credit < price}>{L.guild.price(num(price))}</p>
        <div class="row wrap" style:--gap="6px">
          <Button
            size="sm"
            variant="gold"
            disabled={!have(sel) || credit < price}
            onclick={() => go({ type: 'allyBuy', item: sel, n: 1 })}>{L.guild.buy}</Button
          >
          {#if officer}
            <Button
              size="sm"
              variant="ghost"
              disabled={batch(sel) < 1}
              label={L.guild.cost(num(ALLY_SHOP[sel]!.stock * Math.max(1, batch(sel))))}
              onclick={() => go({ type: 'allyStock', item: sel, n: batch(sel) })}
              >{L.guild.restock} ×{Math.max(1, batch(sel))}</Button
            >
            <small class="t-tiny t-soft">{L.guild.cost(num(ALLY_SHOP[sel]!.stock))}</small>
          {/if}
        </div>
      </div></Card
    >
  </div>
</Sheet>
