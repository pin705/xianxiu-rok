<script lang="ts">
  // Hộ Sơn Đại Trận: khiên, trưởng lão trấn thủ, quân giữ nhà (mọi đệ tử đang ở tông môn), thành tích tranh đoạt.
  // Bố cục: cổng núi là tâm điểm (tranh cổng có lính gác, khiên trên dải son, trận lực là thanh dài dưới cổng, nút tu bổ),
  // sổ bốn số liệu giữ nhà, lưới chân dung trưởng lão — người trấn thủ viền son.
  import {
    ELDER_IDS,
    GUARD_STEP,
    MEND_COOL,
    count,
    elderLevel,
    might,
    isMarching,
    burning,
    mendReady,
    wallHp,
    wallMax,
  } from '@rok/rules'
  import { defense, guardOf } from '@rok/rules/world'
  import { Icon, Portrait } from '@rok/art'
  import { Art, Banner, Button, Card, Meter, Tally } from './ui'
  import { L, LOOK, clock, num } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  const elders = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined))
  const on = $derived(guardOf(game))
  // trận lực + linh hỏa thiêu sơn
  const max = $derived(wallMax(game))
  const hp = $derived(wallHp(game, now))
  const fire = $derived(burning(game, now))
  const ready = $derived(mendReady(game, now))
  const pick = (elder: (typeof ELDER_IDS)[number] | null) => act({ type: 'guard', elder }, 'tap')
</script>

<!-- cổng núi: khiên + trận lực -->
<Banner
  title={L.wall.title}
  picSize={92}
  glow={fire}
  band={game.shield > now ? L.pvp.shield(clock(game.shield - now)) : L.pvp.noShield}
  bandTone={game.shield > now ? 'jade' : 'red'}
>
  {#snippet pic()}<Art art="fx-shield" icon="shield" size={92} />{/snippet}
  {#snippet lead()}<p class="t-tiny t-soft clamp" style:--lines="3">{L.pvp.shieldHint}</p>{/snippet}
  {#snippet foot()}
    <span class="row between"
      ><b class="t-small">{L.wall.title}</b><b class="t-num" class:t-bad={fire}>{num(Math.round(hp))}/{num(max)}</b
      ></span
    >
    <Meter value={hp / max} size="md" tone={fire ? 'bad' : 'good'} label={L.wall.title} />
    {#if fire}
      <small class="t-small t-bad t-strong">{L.wall.burning(clock(game.wall!.fire - now))}</small>
      <small class="t-tiny t-soft">{L.wall.burningHint}</small>
    {:else}
      <small class="t-tiny t-soft">{L.wall.calm}</small>
    {/if}
    <div class="row wrap" style:--gap="8px">
      <Button size="sm" disabled={!ready || hp >= max} onclick={() => act({ type: 'mend' }, 'tap')}
        >{ready ? L.wall.mend : L.wall.mendIn(clock((game.wall?.mend ?? 0) + MEND_COOL - now))}</Button
      >
      {#if fire}
        <Button
          size="sm"
          variant="gold"
          disabled={!game.items.tucHoa}
          onclick={() => act({ type: 'use', item: 'tucHoa', n: 1 }, 'reward')}
          >{L.wall.douse(game.items.tucHoa ?? 0)}</Button
        >
      {/if}
    </div>
  {/snippet}
</Banner>

<!-- quân giữ nhà: sổ bốn số liệu -->
<section class="stack mt-4">
  <h3 class="t-strong t-body">{L.pvp.defense}</h3>
  <Tally
    cols={2}
    size="md"
    items={[
      { label: L.army.might, value: num(might(defense(game))) },
      { label: L.monHa.home, value: num(count(game.troops)) },
      {
        label: L.pvp.wall(game.levels.hoSonDaiTran),
        value: L.pvp.wallBonus(`${Math.round(GUARD_STEP * game.levels.hoSonDaiTran * 100)}%`),
        tone: 'good',
        num: false,
      },
      { label: L.pvp.pts(game.pvp.pts), value: L.pvp.record(game.pvp.win, game.pvp.loss), num: false },
    ]}
  />
</section>

<!-- trưởng lão trấn thủ: lưới chân dung, người đang giữ viền son -->
<section class="stack mt-4">
  <h3 class="t-strong t-body">{L.pvp.guard}</h3>
  {#if game.guard && !on}<p class="t-small t-bad">{L.pvp.guardAway}</p>{/if}
  <ul class="grid plain" style:--cols="3">
    <li>
      <Card selected={!game.guard} onclick={() => pick(null)} label={L.pvp.noGuard}>
        <span class="stack center" style:--gap="2px"
          ><span class="row justify-center"><Icon name="shield" size={34} /></span><b class="t-tiny">{L.pvp.noGuard}</b
          ></span
        >
      </Card>
    </li>
    {#each elders as e (e)}
      <li>
        <Card selected={game.guard === e} onclick={() => pick(e)} label={L.elders[e].name}>
          <span class="stack center" style:--gap="2px">
            <span class="row justify-center"><Portrait look={LOOK[e]} size={48} dim={isMarching(game, e)} /></span>
            <b class="t-tiny t-ellipsis">{L.elders[e].name}</b>
            <small class="t-tiny t-soft"
              >{L.lv(elderLevel(game.elders[e]))}{isMarching(game, e) ? ` · ${L.monHa.out}` : ''}</small
            >
          </span>
        </Card>
      </li>
    {/each}
  </ul>
</section>
