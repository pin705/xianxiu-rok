<script lang="ts">
  // Phường thị (chợ ký gửi giữa các tông môn — luật ở rules/world/market.ts): thẻ Mua (lọc theo hàng, rẻ so với giá gốc
  // trước, chạm tên người bán xem hồ sơ), Treo bán (chọn hàng, số lượng, giá cả lô trong biên, thấy tiền về sau thuế),
  // Lệnh của tôi (hạn, gỡ). Mở từ Thương hội ở Tàng Bảo Các.
  import {
    MARKET_BAND,
    MARKET_BUYS,
    MARKET_HALL,
    MARKET_ORDERS,
    MARKET_TAX,
    MARKET_TTL,
    RESOURCES,
    type Res,
  } from '@rok/rules'
  import { GOODS, basePrice, goodOf, priceBand, sellCap, type Good, type WorldAction } from '@rok/rules/world'
  import type { Ack, Market } from '@rok/protocol'
  import type { Net } from './net'
  import { Icon } from '@rok/art'
  import { Art, Button, Cabinet, Card, Lot, Pill, Section, Sheet, Slider, Tabs } from './ui'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let { api, send }: { api: Pick<Net, 'ask'> | null; send: (a: WorldAction) => Promise<Ack> } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  type Tab = 'buy' | 'sell' | 'mine'
  let tab = $state<Tab>('buy')
  let filter = $state<Good | null>(null)
  let view = $state.raw<Market | null | undefined>(undefined) // undefined: đang tải · null: chợ đóng
  const load = () => api?.ask({ k: 'market', ...(filter && { good: filter }) }).then(v => (view = v))
  $effect(() => {
    if (social.market && game.levels.chuDien >= MARKET_HALL) void load()
  })
  const isRes = (x: Good): x is Good & Res => (RESOURCES as readonly string[]).includes(x)
  const nameOf = (x: Good) => (isRes(x) ? L.res[x] : L.pills[x].name)
  // giá cả lô so với giá gốc: âm là rẻ hơn
  const pct = (x: Good, n: number, price: number) => Math.round((price / (basePrice(x) * n) - 1) * 100)
  const buysLeft = $derived(view ? MARKET_BUYS - view.day.buys : 0)
  const capLeft = $derived(view ? Math.max(0, sellCap(game) - view.day.sold) : 0)

  // Treo bán: hàng đang có, số lượng, giá theo % giá gốc (mặc định 100 %, kẹp trong biên của cả lô)
  const owned = $derived(GOODS.filter(x => goodOf(game, x) >= 1))
  let good = $state<Good | null>(null)
  const sale = $derived(good && owned.includes(good) ? good : (owned[0] ?? null))
  const have = $derived(sale ? Math.floor(goodOf(game, sale)) : 0)
  let n = $state(0)
  const amount = $derived(Math.max(1, Math.min(n || Math.ceil(have / 2), have)))
  const band = $derived(sale ? priceBand(sale, amount) : ([0, 0] as const))
  let rate = $state(100)
  const lot = $derived(
    Math.min(band[1], Math.max(band[0], Math.round(((sale ? basePrice(sale) * amount : 0) * rate) / 100))),
  )
  const net = $derived(Math.floor(lot * (1 - MARKET_TAX)))

  // lỗi (hết lượt, người khác mua trước…) net đã báo; xong thì tải lại chợ
  async function act(a: WorldAction) {
    const r = await send(a)
    if (r.ok) sfx('reward')
    void load()
    return r.ok
  }
  async function list() {
    if (sale && (await act({ type: 'sell', good: sale, n: amount, price: lot }))) n = 0
  }
</script>

{#snippet goodIcon(x: Good, size: number)}<Icon name={x} {size} />{/snippet}

<Sheet open={social.market} onclose={() => (social.market = false)} title={L.market.title} lore={L.market.lore}>
  {#if game.levels.chuDien < MARKET_HALL}
    <p class="t-small t-soft">{L.market.locked(MARKET_HALL)}</p>
  {:else if view === undefined}
    <p class="t-small t-soft">…</p>
  {:else if view === null}
    <p class="t-small t-soft">{L.market.off}</p>
  {:else}
    <div class="stack">
      <!-- sạp chợ là tâm điểm: linh thạch đang có (viên mực), lượt mua và hạn mức treo bán hôm nay -->
      <header class="vista split" style:--gap="12px">
        <Art art="ev-market" icon="linhThach" size={84} tilt={-3} lift />
        <div class="stack" style:--gap="4px">
          <Pill icon="linhThach" big>{num(game.res.linhThach)}</Pill>
          <small class="t-tiny t-soft">{L.market.left(buysLeft, num(capLeft))}</small>
        </div>
      </header>
      <Tabs
        items={[
          { id: 'buy', label: L.market.buy },
          { id: 'sell', label: L.market.sell },
          { id: 'mine', label: `${L.market.mine} (${view.mine.length})` },
        ]}
        value={tab}
        onchange={t => (tab = t)}
      />

      {#if tab === 'buy'}
        <div class="row wrap" style:--gap="4px">
          <Button
            size="sm"
            variant={filter ? 'quiet' : 'gold'}
            onclick={() => {
              filter = null
              void load()
            }}>{L.market.all}</Button
          >
          {#each GOODS as x (x)}
            <Button
              size="sm"
              variant={filter === x ? 'gold' : 'quiet'}
              label={nameOf(x)}
              onclick={() => {
                filter = x
                void load()
              }}>{@render goodIcon(x, 20)}</Button
            >
          {/each}
        </div>
        <!-- kệ hàng: mỗi lô đứng trên ván gỗ, số lượng góc, giá là viên mực, người bán bấm xem hồ sơ -->
        <Cabinet min={100}>
          {#each view.orders as o (o.id)}
            <li>
              <span class="cab-pic">
                <Lot
                  icon={o.good}
                  n="×{num(o.n)}"
                  off={pct(o.good, o.n, o.price)}
                  offTitle={L.market.unit(pct(o.good, o.n, o.price))}
                />
              </span>
              <b class="t-tiny t-ellipsis w-full">{nameOf(o.good)}</b>
              <button class="t-tiny t-ellipsis t-ref w-full" onclick={() => (social.profile = o.pid)}
                >{L.market.by(o.name)}</button
              >
              <Button
                size="sm"
                variant="ink"
                wide
                label={L.market.buy}
                disabled={buysLeft < 1 || game.res.linhThach < o.price}
                onclick={() => act({ type: 'buy', id: o.id })}
                ><Icon name="linhThach" size={14} /><span class="t-num">{num(o.price)}</span></Button
              >
            </li>
          {:else}
            <li class="span-all t-small t-soft">{filter ? L.market.none : L.market.empty}</li>
          {/each}
        </Cabinet>
      {:else if tab === 'sell'}
        {#if sale}
          <Section title={L.market.good}>
            <div class="grid" style:--cols="4">
              {#each owned as x (x)}
                <Card
                  selected={sale === x}
                  label={nameOf(x)}
                  onclick={() => {
                    good = x
                    n = 0
                  }}
                  ><span class="stack center" style:--gap="2px"
                    >{@render goodIcon(x, 26)}<small class="t-tiny t-num">{num(goodOf(game, x))}</small></span
                  ></Card
                >
              {/each}
            </div>
          </Section>
          <Section title="{L.market.amount} · {num(amount)}">
            <Slider value={amount} min={1} max={have} label={L.market.amount} onchange={v => (n = v)} />
          </Section>
          <Section title="{L.market.price} · {rate}%">
            <Slider
              value={rate}
              min={MARKET_BAND[0] * 100}
              max={MARKET_BAND[1] * 100}
              label={L.market.price}
              onchange={v => (rate = v)}
            />
            <p class="row between t-tiny">
              <span class:t-good={pct(sale, amount, lot) < 0} class:t-soft={pct(sale, amount, lot) >= 0}
                >{L.market.unit(pct(sale, amount, lot))}</span
              ><span class="t-soft">{L.market.net(num(net))}</span>
            </p>
          </Section>
          <p class="t-tiny t-soft">{L.market.slots(view.mine.length, MARKET_ORDERS)}</p>
          {#if lot > capLeft}<p class="t-tiny t-bad">{L.market.over}</p>{/if}
          <Button wide disabled={view.mine.length >= MARKET_ORDERS || lot > capLeft} onclick={list}
            >{L.market.list(num(lot))}</Button
          >
        {:else}
          <p class="t-small t-soft">{L.market.nothing}</p>
        {/if}
      {:else}
        <Cabinet min={100}>
          {#each view.mine as o (o.id)}
            <li>
              <span class="cab-pic"><Lot icon={o.good} n="×{num(o.n)}" /></span>
              <b class="t-tiny t-ellipsis w-full">{nameOf(o.good)}</b>
              <b class="row justify-center t-small t-num" style:--gap="3px"
                ><Icon name="linhThach" size={14} />{num(o.price)}</b
              >
              <small class="t-tiny t-soft">{L.market.expires(clock(o.at + MARKET_TTL - now))}</small>
              <Button size="sm" variant="quiet" onclick={() => act({ type: 'cancel', id: o.id })}
                >{L.market.cancel}</Button
              >
            </li>
          {:else}
            <li class="span-all t-small t-soft">{L.market.mineNone}</li>
          {/each}
        </Cabinet>
      {/if}
    </div>
  {/if}
</Sheet>
