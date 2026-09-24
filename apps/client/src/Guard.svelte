<script lang="ts">
  // Hộ Sơn Đại Trận: khiên, trưởng lão trấn thủ, quân giữ nhà (mọi đệ tử đang ở tông môn), thành tích tranh đoạt.
  import { ELDER_IDS, GUARD_STEP, count, elderLevel, might, isMarching } from '@rok/rules'
  import { defense, guardOf } from '@rok/rules/world'
  import { Icon, Portrait } from '@rok/art'
  import { Card, Section, Stat } from './ui'
  import { L, LOOK, clock, num } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const elders = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined))
  const on = $derived(guardOf(game))
</script>

<Card>
  <div class="row mt-2">
    <Icon name="shield" size={28} />
    <span class="grow stack" style:--gap="1px">
      <b class="t-small">{game.shield > now ? L.pvp.shield(clock(game.shield - now)) : L.pvp.noShield}</b>
      <small class="t-tiny t-soft">{L.pvp.shieldHint}</small>
    </span>
  </div>
</Card>

<Section title={L.pvp.defense}>
  <Card>
    <Stat label={L.army.might}>{num(might(defense(game)))}</Stat>
    <Stat label={L.monHa.home}>{num(count(game.troops))}</Stat>
    <Stat label={L.pvp.wall(game.levels.hoSonDaiTran)} tone="good"
      >{L.pvp.wallBonus(`${Math.round(GUARD_STEP * game.levels.hoSonDaiTran * 100)}%`)}</Stat
    >
    <Stat label={L.pvp.pts(game.pvp.pts)}>{L.pvp.record(game.pvp.win, game.pvp.loss)}</Stat>
  </Card>
</Section>

<Section title={L.pvp.guard}>
  {#if game.guard && !on}<p class="t-small t-bad">{L.pvp.guardAway}</p>{/if}
  <ul class="grid">
    <li>
      <Card selected={!game.guard} onclick={() => act({ type: 'guard', elder: null })} label={L.pvp.noGuard}>
        <span class="row"><Icon name="shield" size={28} /><small class="t-small t-strong">{L.pvp.noGuard}</small></span>
      </Card>
    </li>
    {#each elders as e (e)}
      <li>
        <Card
          selected={game.guard === e}
          onclick={() => act({ type: 'guard', elder: e }, 'tap')}
          label={L.elders[e].name}
        >
          <span class="row" style:--gap="6px">
            <Portrait look={LOOK[e]} size={30} dim={isMarching(game, e)} />
            <span class="stack" style:--gap="0"
              ><small class="t-small t-strong t-ellipsis">{L.elders[e].name}</small><small class="t-tiny t-soft"
                >{L.lv(elderLevel(game.elders[e]))}{isMarching(game, e) ? ` · ${L.monHa.out}` : ''}</small
              ></span
            >
          </span>
        </Card>
      </li>
    {/each}
  </ul>
</Section>
