<script lang="ts">
  // Cống Hiến Các (như Alliance Shop của RoK): quầy bảo vật — món hàng đứng trên kệ gỗ (số còn, giá cống hiến), chạm một món
  // để đổi; trưởng lão và minh chủ nhập thêm bằng Minh khố (mỗi lần tối đa 5 món).
  import { ALLY_SHOP, ALLY_SHOP_MAX, type BagId } from '@rok/rules'
  import { SHOP_IDS, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Icon, artOf } from '@rok/art'
  import { Button, Sheet } from './ui'
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
  const shop = artOf('ui:ally-shop')?.src
  const go = async (a: WorldAction) => {
    if ((await send(a)).ok) sfx('reward')
  }
</script>

<Sheet {open} {onclose} title={L.guild.shop} lore={L.guild.shopLore}>
  <!-- quầy bảo vật: tranh quầy + hai tấm biển cống hiến / Minh khố -->
  <header class="counter">
    <span class="pic"
      >{#if shop}<img src={shop} alt="" draggable="false" />{:else}<Icon name="hoSon" size={40} />{/if}</span
    >
    <div class="plaques">
      <span class="plaque"><small>{L.guild.credit}</small><b class="t-num">{num(credit)}</b></span>
      <span class="plaque"><small>{L.guild.fund}</small><b class="t-num">{num(fund)}</b></span>
    </div>
    <p class="hint t-tiny t-soft">{L.guild.creditHint}</p>
  </header>

  <!-- kệ gỗ: món hàng đứng trên ván, giá cống hiến trên thẻ giấy dưới ván; hết hàng thì mờ -->
  <ul class="shelf">
    {#each ids as id (id)}
      <li class:out={!have(id)}>
        <ItemCell
          {id}
          n={have(id)}
          selected={id === sel}
          onclick={() => {
            sfx('tap')
            pick = id
          }}
        />
        <small class="price t-num">{num(ALLY_SHOP[id]!.price)}</small>
      </li>
    {/each}
  </ul>

  <!-- món đang chọn: tên, giá, số còn; đổi (sơn son) · nhập hàng (trưởng lão) -->
  <section class="deal">
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
  </section>
</Sheet>

<style>
  /* ---------- quầy ---------- */
  .counter {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 4px 12px;
    align-items: center;
    margin-top: var(--sp-2);
  }
  .pic img {
    display: block;
    width: 84px;
    height: 84px;
    rotate: -3deg;
    filter: drop-shadow(0 3px 5px rgb(0 0 0 / 0.22));
  }
  .plaques {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
  .plaque {
    display: grid;
    gap: 1px;
    padding: 5px 6px 6px;
    text-align: center;
    background: rgb(255 255 255 / 0.7);
    border: 1px solid var(--paper3);
    border-top: 2px solid var(--rim, var(--ink3));
    border-radius: 3px;
  }
  .plaque small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  .plaque b {
    font-size: var(--fs-4);
  }
  .hint {
    grid-column: 1 / -1;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  /* ---------- kệ gỗ: mỗi hàng 96px — ô 64 đứng trên ván, thẻ giá ghim trước mặt ván; vách tủ hai bên ---------- */
  .shelf {
    --row: 96px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
    grid-auto-rows: var(--row);
    justify-items: center;
    gap: 0 var(--sp-2);
    margin: var(--sp-3) 0;
    padding: 6px 14px 0;
    list-style: none;
    background:
      linear-gradient(transparent 66px, #8a5c38 66px, #5c3a1f 75px, rgb(0 0 0 / 0.14) 75px, transparent 80px) 0 6px /
        100% var(--row) repeat-y,
      linear-gradient(90deg, #6b4526, #4a2e17) left top / 8px 100% no-repeat,
      linear-gradient(90deg, #4a2e17, #6b4526) right top / 8px 100% no-repeat,
      linear-gradient(#efe9df, #e6dfd2);
    border-top: 8px solid #6b4526;
    border-bottom: 8px solid #6b4526;
    border-radius: 4px;
    box-shadow: 0 4px 10px rgb(var(--shade) / 0.18);
  }
  .shelf li {
    display: grid;
    grid-template-rows: 64px auto;
    justify-items: center;
    row-gap: 4px;
  }
  .shelf li.out :global(.cell) {
    opacity: 0.45;
    filter: grayscale(0.6);
  }
  /* thẻ giá: mẩu giấy nhỏ ghim trước mặt ván */
  .price {
    position: relative;
    z-index: 1;
    padding: 0 6px 1px;
    font-size: var(--fs-1);
    line-height: 1.3;
    background: #fbf7ec;
    border: 1px solid #d8cdb4;
    border-radius: 2px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
  }
  /* ---------- món đang chọn ---------- */
  .deal {
    display: grid;
    gap: 6px;
    padding: 12px 14px 14px;
    border: 0 solid transparent;
    border-image: var(--sk-card-glow);
  }
</style>
