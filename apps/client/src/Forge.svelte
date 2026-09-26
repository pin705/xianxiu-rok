<script lang="ts">
  // Luyện Khí Phòng: 9 pháp bảo tất định, luyện từng cấp (cấp tối đa theo tầng), đeo cho một trưởng lão.
  // Bố cục lò rèn: đe luyện trên cùng đặt pháp bảo đang chọn (to, bonus, người đeo, chi phí, nút luyện),
  // dưới là giá binh khí ba hàng — mỗi pháp bảo một ô, cấp trên đồng tiền, người đeo là chân dung nhỏ.
  import {
    ELDER_IDS,
    GEAR,
    GEAR_IDS,
    GEAR_MAX,
    forgeError,
    gearCap,
    gearCost,
    gearTime,
    isMarching,
    type ElderId,
    type GearId,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Button, Card, Tag } from './ui'
  import JobRow from './JobRow.svelte'
  import { L, LOOK, clock, sfx } from './lib'
  import { useGame } from './game'

  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  let picking = $state(false)
  let pick = $state<GearId | null>(null)
  const cap = $derived(gearCap(game))
  const elders = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined))
  // mặc định: món luyện được ngay, không có thì món đầu
  const cur = $derived(pick ?? GEAR_IDS.find(x => !forgeError(game, x)) ?? GEAR_IDS[0])
  const d = $derived(GEAR[cur])
  const lv = $derived(game.gear[cur]?.lv ?? 0)
  const on = $derived(game.gear[cur]?.on)
  const err = $derived(forgeError(game, cur))
  const equip = (gear: GearId, elder: ElderId | null) => {
    if (act({ type: 'equip', gear, elder }, 'reward')) picking = false
  }
</script>

{#if game.forge}
  <div class="mt-3">
    <JobRow kind="forge" label={L.forge.doing(L.gear[game.forge.gear], game.forge.level)} />
  </div>
{/if}

<!-- đe luyện: pháp bảo đang chọn -->
<Card
  ><div class="hero">
    <span class="art"><Icon name={cur} size={76} /></span>
    <b class="name">{L.gear[cur]}</b>
    <span class="lvl t-num">{lv}/{GEAR_MAX}</span>
    <p class="t-small">
      {L.bonus(d.key, d.v * Math.max(1, lv))}
      {#if lv && lv < GEAR_MAX}<span class="t-good">
          → {L.bonus(d.key, d.v * (lv + 1))
            .split(' ')
            .at(-1)}</span
        >{/if}
    </p>
    {#if lv}
      <div class="foot">
        {#if on}
          <span class="row t-small" style:--gap="6px"
            ><Portrait look={LOOK[on]} size={28} />{L.forge.worn(L.elders[on].name)}</span
          >
          <Button variant="quiet" size="sm" disabled={isMarching(game, on)} onclick={() => equip(cur, null)}
            >{L.forge.unequip}</Button
          >
        {:else}
          <span class="t-small t-soft">{L.forge.free}</span>
          <Button variant="ghost" size="sm" onclick={() => (picking = !picking)}>{L.forge.equip}</Button>
        {/if}
      </div>
      {#if picking && !on}
        <ul class="grid who">
          {#each elders as e (e)}
            <li>
              <Card
                onclick={isMarching(game, e) ? undefined : () => equip(cur, e)}
                disabled={isMarching(game, e)}
                label={L.elders[e].name}
              >
                <span class="row" style:--gap="6px"
                  ><Portrait look={LOOK[e]} size={28} /><small class="t-small t-strong t-ellipsis"
                    >{L.elders[e].name}</small
                  ></span
                >
              </Card>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
    <div class="foot">
      {#if lv >= GEAR_MAX}
        <span class="stamp">{L.forge.maxed}</span>
      {:else if lv + 1 > cap}
        <Tag icon="lock" size="sm">{L.forge.cap(2 * (lv + 1) - 1)}</Tag>
      {:else if game.forge?.gear !== cur}
        <Bag res={gearCost(cur, lv + 1)} have={game.res} size="sm" />
        <Button
          size="sm"
          variant="gold"
          trail={clock(gearTime(game, cur, lv + 1))}
          disabled={!!err}
          onclick={() => act({ type: 'forge', gear: cur }, 'build')}>{L.forge.go}</Button
        >
      {/if}
    </div>
  </div></Card
>

<p class="t-tiny t-lore mt-3">{L.forge.hint} · {L.panel.gearCap} {cap}/{GEAR_MAX}</p>

<!-- giá binh khí -->
<ul class="rack">
  {#each GEAR_IDS as x (x)}
    {@const xl = game.gear[x]?.lv ?? 0}
    {@const wearer = game.gear[x]?.on}
    <li>
      <button
        type="button"
        class="slot"
        class:on={x === cur}
        class:none={!xl}
        aria-label={L.gear[x]}
        aria-pressed={x === cur}
        onclick={() => {
          sfx('tap')
          pick = x
          picking = false
        }}
      >
        <Icon name={x} size={44} />
        <i class="coin rank-no" class:r1={xl >= GEAR_MAX}>{xl}</i>
        {#if wearer}<span class="face"><Portrait look={LOOK[wearer]} size={20} /></span>{/if}
        {#if game.forge?.gear === x}<i class="busy"><Icon name="clock" size={12} /></i>{/if}
        <span class="nm">{L.gear[x]}</span>
      </button>
    </li>
  {/each}
</ul>

<style>
  /* đe luyện: tên to + dải son bên trái, pháp bảo trên quầng lửa bên phải, người đeo / chi phí dưới vạch đứt */
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 10px;
    align-items: center;
  }
  .art {
    display: grid;
    place-items: center;
    grid-area: 1 / 2 / 4 / 3;
    width: 96px;
    height: 96px;
    background: radial-gradient(circle, rgb(var(--gold-glow) / 0.7), transparent 68%);
  }
  .name {
    font-size: var(--fs-6);
    line-height: 1.1;
  }
  .lvl {
    justify-self: start;
    padding: 1px 10px 2px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: var(--text-inv);
    background: var(--cinnabar);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    grid-column: 1 / -1;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    padding-top: 6px;
    border-top: 1px dashed var(--paper3);
  }
  .foot:empty {
    display: none;
  }
  .who {
    grid-column: 1 / -1;
    padding: 0;
    list-style: none;
  }
  .rack {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px 0;
    margin-top: var(--sp-2);
    padding: 0;
    list-style: none;
  }
  .rack li {
    border-bottom: 6px solid var(--ochre);
  }
  .slot {
    position: relative;
    display: grid;
    justify-items: center;
    width: 100%;
    padding: 4px 2px;
    color: var(--text-soft);
  }
  .slot.none :global(.icon) {
    opacity: 0.5;
  }
  .slot.on {
    color: var(--text);
  }
  .slot.on .nm {
    background: var(--stroke-red) no-repeat center bottom / 100% 5px;
  }
  .nm {
    padding: 0 2px 4px;
    font-size: var(--fs-1);
    font-weight: 800;
  }
  .coin {
    position: absolute;
    top: 0;
    right: calc(50% - 34px);
    font-style: normal;
  }
  .face {
    position: absolute;
    top: 26px;
    left: calc(50% - 34px);
    display: grid;
  }
  .busy {
    position: absolute;
    top: 0;
    left: calc(50% - 32px);
    color: var(--cinnabar);
  }
</style>
