<script lang="ts">
  // Thành tựu (như Achievements của RoK): mỗi dòng một thành tựu — tên, bậc, thanh tiến độ tới bậc kế, quà bậc kế, nút Nhận.
  // Thành tựu đang chờ nhận lên đầu, rồi tới cái gần xong nhất.
  // Bố cục bảng vinh danh: cúp vàng + tổng bậc đầu bảng, mỗi thành tựu một dòng kẻ mực đứt với đồng tiền bậc bên trái.
  import { ACH_IDS, ACH_REWARDS, ACHS, achCount, achGot, achNext, achReady, achValue, type AchId } from '@rok/rules'
  import { Art, Bag, Button, Meter, Tablet } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  const part = (id: AchId) => {
    const next = achNext(game, id)
    return next === undefined ? 1 : Math.min(1, achValue(game, id) / next)
  }
  const list = $derived(
    [...ACH_IDS].sort((a, b) => Number(achReady(game, b)) - Number(achReady(game, a)) || part(b) - part(a)),
  )
  const tiers = ACH_IDS.reduce((n, id) => n + ACHS[id].tiers.length, 0)
  const have = $derived(ACH_IDS.reduce((n, id) => n + achGot(game, id), 0))
  // tên "Danh hiệu — thước đo": danh hiệu đậm, thước đo chữ nhỏ
  const split = (s: string) => s.split(' — ')
</script>

<Tablet>
  {#snippet head()}
    <Art art="rank-cup" icon="rank" size={56} lift />
    <b class="t-num t-head grow">{L.ach.tier(have, tiers)}</b>
    {#if achCount(game) > 1}
      <!-- Nhận tất cả: mọi bậc đã đạt của mọi thành tựu -->
      <Button
        variant="gold"
        size="sm"
        onclick={() => {
          let any = false
          for (const id of ACH_IDS) while (achReady(g.game, id) && act({ type: 'ach', id })) any = true
          if (any) sfx('reward')
        }}>{L.mail.claimAll(achCount(game))}</Button
      >
    {/if}
  {/snippet}
  <ul class="ledger top open-end" style:--gap="10px">
    {#each list as id (id)}
      {@const next = achNext(game, id)}
      {@const got = achGot(game, id)}
      {@const [title, what] = split(L.ach.names[id])}
      <li class:gold={achReady(game, id)}>
        <i
          class="tier-coin"
          class:on={achReady(game, id)}
          class:full={next === undefined}
          title={L.ach.tier(got, ACHS[id].tiers.length)}>{got}</i
        >
        <span class="grow stack" style:--gap="3px">
          <span class="row between" style:--gap="6px"
            ><b class="t-small">{title}</b><small class="t-tiny t-soft t-num"
              >{L.ach.tier(got, ACHS[id].tiers.length)}</small
            ></span
          >
          {#if what}<small class="t-tiny t-soft">{what}</small>{/if}
          {#if next !== undefined}
            <span class="row" style:--gap="6px"
              ><span class="grow"><Meter value={part(id)} size="sm" tone="gold" /></span><small class="t-tiny t-num"
                >{num(Math.min(achValue(game, id), next))}/{num(next)}</small
              ></span
            >
            <span class="row between" style:--gap="6px">
              <Bag res={ACH_REWARDS[got].res} items={ACH_REWARDS[got].items} size="sm" />
              {#if achReady(game, id)}
                <Button size="sm" variant="gold" onclick={() => act({ type: 'ach', id }, 'reward')}
                  >{L.ach.claim}</Button
                >
              {/if}
            </span>
          {/if}
        </span>
        {#if next === undefined}<span class="stamp self-center">{L.ach.done}</span>{/if}
      </li>
    {/each}
  </ul>
</Tablet>
