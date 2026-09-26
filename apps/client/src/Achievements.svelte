<script lang="ts">
  // Thành tựu (như Achievements của RoK): mỗi dòng một thành tựu — tên, bậc, thanh tiến độ tới bậc kế, quà bậc kế, nút Nhận.
  // Thành tựu đang chờ nhận lên đầu, rồi tới cái gần xong nhất.
  // Bố cục bảng vinh danh: cúp vàng + tổng bậc đầu bảng, mỗi thành tựu một dòng kẻ mực đứt với đồng tiền bậc bên trái.
  import { ACH_IDS, ACH_REWARDS, ACHS, achCount, achGot, achNext, achReady, achValue, type AchId } from '@rok/rules'
  import { Icon, artOf } from '@rok/art'
  import { Bag, Button, Meter } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act
  const cup = artOf('ui:rank-cup')?.src

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

<div class="honor">
  <header class="top">
    {#if cup}<img src={cup} alt="" draggable="false" />{:else}<Icon name="rank" size={48} />{/if}
    <b class="t-num sum">{L.ach.tier(have, tiers)}</b>
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
  </header>
  <ul class="rows">
    {#each list as id (id)}
      {@const next = achNext(game, id)}
      {@const got = achGot(game, id)}
      {@const [title, what] = split(L.ach.names[id])}
      <li class:ready={achReady(game, id)}>
        <i class="coin" class:full={next === undefined} title={L.ach.tier(got, ACHS[id].tiers.length)}>{got}</i>
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
        {#if next === undefined}<span class="stamp">{L.ach.done}</span>{/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  /* bảng vinh danh: khung gỗ sẫm, lòng giấy trắng sương */
  .honor {
    padding: 8px 12px 10px;
    background: var(--silk);
    border: 6px solid var(--lacquer2);
    border-radius: 4px;
    box-shadow:
      inset 0 0 0 2px var(--ochre),
      0 4px 10px rgb(var(--shade) / 0.18);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 8px;
    border-bottom: 3px double var(--ink3);
  }
  .top img {
    width: 56px;
    height: 56px;
    object-fit: contain;
    filter: drop-shadow(0 3px 4px rgb(var(--shade) / 0.25));
  }
  .sum {
    flex: 1;
    font-size: var(--fs-5);
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rows li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 9px 4px;
    border-bottom: 1px dashed var(--paper3);
  }
  .rows li:last-child {
    border-bottom: 0;
  }
  .rows li.ready {
    background: linear-gradient(90deg, rgb(var(--gold-glow) / 0.35), transparent);
  }
  /* đồng tiền bậc: mực khi đang lên, vàng khi đạt hết bậc */
  .coin {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    font-size: var(--fs-2);
    font-style: normal;
    font-weight: 900;
    color: var(--text-soft);
    background: var(--silk);
    border: 2px solid var(--ink3);
    border-radius: 50%;
  }
  .ready .coin {
    color: var(--silk);
    background: var(--cinnabar);
    border-color: var(--cinnabar);
  }
  .coin.full {
    color: var(--silk);
    text-shadow: 0 1px 1px rgb(var(--shade) / 0.4);
    background: radial-gradient(circle at 35% 30%, var(--gold-l), var(--gold) 70%);
    border-color: var(--gold-d);
  }
  .rows .stamp {
    align-self: center;
  }
</style>
