<script lang="ts">
  // Hương Hỏa (như VIP của RoK, không bán): cấp, điểm tới cấp sau, chuỗi ngày vào game (mai được bao nhiêu), rương hôm nay,
  // tăng ích cấp này và cấp sau, số phút xong miễn phí; Hương Hỏa Các (VIP Store): món mở theo cấp, mua bằng tài nguyên.
  // Bố cục như miếu trên núi: lư hương là tâm điểm, cấp là bậc thềm, lễ vật là hộp quà, cửa hàng là kệ gỗ.
  import {
    VIP_CHEST,
    VIP_FREE,
    VIP_LEVELS,
    VIP_PERKS,
    VIP_SHOP,
    dayOf,
    nextWeek,
    vipGot,
    vipLevel,
    vipToday,
    type Bonus,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Art, Bag, Button, Cabinet, Card, Meter, Pill, Seal, Section, Sheet, Stairs } from './ui'
  import VipGifts from './VipGifts.svelte'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'
  import { L, clock, num } from './lib'
  import { useGame } from './game'

  let { open, onclose }: { open: boolean; onclose: () => void } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const lv = $derived(vipLevel(game))
  const next = $derived(VIP_LEVELS[lv + 1])
  const got = $derived(game.vip.chest === dayOf(now))
  const bought = $derived(vipGot(game, now))
  const perks = (i: number) => Object.entries(VIP_PERKS[i] ?? {}) as [Bonus, number][]
</script>

<Sheet {open} {onclose} title={L.vip.title} sub={L.vip.level(lv)}>
  <!-- miếu: lư hương trước miếu, cấp viết trong ấn son đè góc tranh; điểm tới cấp sau, chuỗi ngày về núi -->
  <header class="vista split" style:--gap="4px 14px">
    <span class="rel stack">
      <Art art="ev-vip" icon="cauldron" size={104} tilt={-3} lift />
      <span class="at-br" aria-label={L.vip.level(lv)}><Seal size={42}><span class="t-head">{lv}</span></Seal></span>
    </span>
    <div class="stack" style:--gap="6px">
      <b class="t-head t-num">{next ? `${num(game.vip.pts)} / ${num(next)}` : num(game.vip.pts)}</b>
      {#if next}<Meter value={(game.vip.pts - VIP_LEVELS[lv]) / (next - VIP_LEVELS[lv])} size="md" tone="gold" />{/if}
      <p class="t-small">{L.vip.streak(game.vip.streak, vipToday(game.vip.streak + 1))}</p>
    </div>
    <p class="span-all clamp t-tiny t-lore">{L.vip.lore}</p>
  </header>

  <!-- bậc thềm lên miếu: mỗi cấp một bậc, bậc đã lên tô son, bậc đang đứng có hạt son -->
  <div class="mt-3"><Stairs n={VIP_LEVELS.length} at={lv} /></div>
  <!-- tăng ích: hai bài vị — cấp đang hưởng, cấp sau mở thêm -->
  <div class="fill mt-3" style:--min="140px">
    {#each [lv, lv + 1] as i (i)}
      {#if i < VIP_LEVELS.length}
        <section class="placard" class:nx={i > lv}>
          <b class="t-small">{i === lv ? L.vip.now(i) : L.vip.nextLv(i)}</b>
          <ul class="t-small">
            {#each perks(i) as [k, v] (k)}<li>
                {L.vip.perk[k as keyof typeof L.vip.perk] ?? k} <b class="t-num">+{Math.round(v * 100)}%</b>
              </li>{/each}
            {#if VIP_FREE[i]}<li>{L.vip.free(VIP_FREE[i])}</li>{/if}
            {#if !perks(i).length && !VIP_FREE[i]}<li class="t-soft">—</li>{/if}
          </ul>
        </section>
      {/if}
    {/each}
  </div>

  <!-- lễ vật hôm nay: hộp quà sơn son, nhận rồi đóng dấu son lên hộp -->
  <section class="mt-3">
    <Card>
      <div class="split" style:--gap="12px">
        <span class="rel stack justify-center">
          <Art art="ally-gift" icon="star" size={84} lift glow={!got} />
          {#if got}<span class="stamp backed at-foot" title={L.vip.chestGot}>{L.fest.claimed}</span>{/if}
        </span>
        <div class="stack" style:--gap="6px">
          <b>{L.vip.chest}</b>
          <Bag res={VIP_CHEST[lv].res} items={VIP_CHEST[lv].items} size="sm" />
          {#if !got}<Button variant="gold" onclick={() => act({ type: 'vipChest' }, 'reward')}>{L.vip.open}</Button
            >{/if}
        </div>
      </div>
    </Card>
  </section>

  <Section title={L.vip.shop}>
    {#snippet aside()}<small class="t-tiny t-soft">{L.merchant.next(clock(nextWeek(now) - now))}</small>{/snippet}
    <p class="t-tiny t-soft clamp">{L.vip.shopLore}</p>
    <!-- kệ gỗ Hương Hỏa Các: món đứng trên ván, tên, lượt còn và nút giá (bấm là mua) -->
    <Cabinet min={96}>
      {#each VIP_SHOP as x (x.item)}
        {@const left = x.week - (bought[x.item] ?? 0)}
        {@const cost = x.price * game.levels.chuDien}
        {@const locked = lv < x.lv}
        {@const dim = locked || left <= 0}
        <!-- hết lượt / chưa mở: cả món mờ, hình và tên mờ thêm một lần -->
        <li class:dim>
          <span class="cab-pic">
            <span class:dim><ItemCell id={x.item} n={x.n} /></span>
            {#if !locked && left <= 0}<span class="stamp backed at-center">{L.fest.soldOut}</span>{/if}
          </span>
          <b class="t-tiny clamp two-line" class:dim>{itemName(x.item)}</b>
          {#if locked}
            <Pill icon="lock">{L.vip.shopNeed(x.lv)}</Pill>
          {:else}
            <small class="t-tiny t-soft">{L.vip.shopLeft(left, x.week)}</small>
            <Button
              size="sm"
              variant="ink"
              wide
              label={L.vip.buy}
              disabled={left <= 0 || game.res[x.res] < cost}
              onclick={() => act({ type: 'vipBuy', item: x.item }, 'reward')}
              ><Icon name={x.res} size={16} /><span class="t-num">{num(cost)}</span></Button
            >
          {/if}
        </li>
      {/each}
    </Cabinet>
  </Section>
  <VipGifts />
</Sheet>
