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
  import { Icon, Portrait, artOf } from '@rok/art'
  import { Button, Card, Meter } from './ui'
  import { L, LOOK, clock, num } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act
  const gate = artOf('ui:fx-shield')?.src

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
<Card tone={fire ? 'glow' : 'paper'}
  ><div class="gate">
    {#if gate}<img class="art" src={gate} alt="" draggable="false" />{:else}<span class="art"
        ><Icon name="shield" size={64} /></span
      >{/if}
    <b class="name">{L.wall.title}</b>
    <small class="band" class:off={game.shield <= now}
      >{game.shield > now ? L.pvp.shield(clock(game.shield - now)) : L.pvp.noShield}</small
    >
    <p class="t-tiny t-soft hint">{L.pvp.shieldHint}</p>
    <div class="hp">
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
    </div>
  </div></Card
>

<!-- quân giữ nhà: bốn tấm biển số -->
<h3 class="cap">{L.pvp.defense}</h3>
<dl class="plaques">
  <div>
    <dt>{L.army.might}</dt>
    <dd class="t-num">{num(might(defense(game)))}</dd>
  </div>
  <div>
    <dt>{L.monHa.home}</dt>
    <dd class="t-num">{num(count(game.troops))}</dd>
  </div>
  <div>
    <dt>{L.pvp.wall(game.levels.hoSonDaiTran)}</dt>
    <dd class="t-good">{L.pvp.wallBonus(`${Math.round(GUARD_STEP * game.levels.hoSonDaiTran * 100)}%`)}</dd>
  </div>
  <div>
    <dt>{L.pvp.pts(game.pvp.pts)}</dt>
    <dd>{L.pvp.record(game.pvp.win, game.pvp.loss)}</dd>
  </div>
</dl>

<!-- trưởng lão trấn thủ: lưới chân dung, người đang giữ viền son -->
<h3 class="cap">{L.pvp.guard}</h3>
{#if game.guard && !on}<p class="t-small t-bad">{L.pvp.guardAway}</p>{/if}
<ul class="grid who" style:--cols="3">
  <li>
    <Card selected={!game.guard} onclick={() => pick(null)} label={L.pvp.noGuard}>
      <span class="stack center" style:--gap="2px"
        ><span class="face"><Icon name="shield" size={34} /></span><b class="t-tiny">{L.pvp.noGuard}</b></span
      >
    </Card>
  </li>
  {#each elders as e (e)}
    <li>
      <Card selected={game.guard === e} onclick={() => pick(e)} label={L.elders[e].name}>
        <span class="stack center" style:--gap="2px">
          <span class="face"><Portrait look={LOOK[e]} size={48} dim={isMarching(game, e)} /></span>
          <b class="t-tiny t-ellipsis">{L.elders[e].name}</b>
          <small class="t-tiny t-soft"
            >{L.lv(elderLevel(game.elders[e]))}{isMarching(game, e) ? ` · ${L.monHa.out}` : ''}</small
          >
        </span>
      </Card>
    </li>
  {/each}
</ul>

<style>
  /* cổng núi: tên to + dải khiên bên trái, tranh cổng bên phải, trận lực dưới vạch đứt */
  .gate {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 92px;
    gap: 4px 10px;
    align-items: start;
  }
  .art {
    display: grid;
    grid-area: 1 / 2 / 4 / 3;
    width: 92px;
    rotate: 3deg;
  }
  .name {
    font-size: var(--fs-6);
    line-height: 1.1;
  }
  .band {
    justify-self: start;
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--text-inv);
    background: var(--malachite);
  }
  .band.off {
    background: var(--cinnabar);
  }
  .hint {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .hp {
    display: grid;
    grid-column: 1 / -1;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px dashed var(--paper3);
  }
  .cap {
    margin: var(--sp-4) 0 var(--sp-2);
    font-size: var(--fs-3);
  }
  /* sổ số liệu: hai cột, vạch đứt ngăn */
  .plaques {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    text-align: center;
  }
  .plaques div {
    padding: 6px 4px;
    border-bottom: 1px dashed var(--paper3);
  }
  .plaques div:nth-child(odd) {
    border-right: 1px dashed var(--paper3);
  }
  dt {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  dd {
    font-size: var(--fs-3);
    font-weight: 900;
  }
  .who {
    padding: 0;
    list-style: none;
  }
  .face {
    display: grid;
    place-items: center;
    height: 48px;
  }
</style>
