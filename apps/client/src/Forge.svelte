<script lang="ts">
  // Luyện Khí Phòng: 9 pháp bảo tất định, luyện từng cấp (cấp tối đa theo tầng), đeo cho một trưởng lão.
  import {
    ELDER_IDS, GEAR, GEAR_IDS, GEAR_MAX, forgeError, gearCap, gearCost, gearTime,
    type Action, type ElderId, type GearId, type State,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Button, Card, Section, Tag } from './ui'
  import JobRow from './JobRow.svelte'
  import { L, LOOK, clock, sfx } from './lib'

  let { game, now, act }: { game: State; now: number; act: (a: Action) => State | null } = $props()

  let picking = $state<GearId | null>(null)
  const cap = $derived(gearCap(game))
  const elders = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined))
  const away = (e: ElderId) => game.marches.some(m => m.elder === e)
  const equip = (gear: GearId, elder: ElderId | null) => act({ type: 'equip', gear, elder }) && (sfx('reward'), (picking = null))
</script>

{#if game.forge}
  <div class="mt-3"><JobRow {game} {now} kind="forge" label={L.forge.doing(L.gear[game.forge.gear], game.forge.level)} {act} /></div>
{/if}
<p class="t-small t-lore mt-3">{L.forge.hint}</p>

<Section title={L.panel.gearCap}>
  {#snippet aside()}{cap}/{GEAR_MAX}{/snippet}
  <ul class="stack">
    {#each GEAR_IDS as g (g)}
      {@const d = GEAR[g]}
      {@const lv = game.gear[g]?.lv ?? 0}
      {@const on = game.gear[g]?.on}
      {@const err = forgeError(game, g)}
      {@const doing = game.forge?.gear === g}
      <li>
        <Card>
          <div class="stack">
            <div class="row">
              <Icon name={g} size={34} />
              <span class="grow stack" style:--gap="1px">
                <b>{L.gear[g]}</b>
                <small class="t-small t-soft">
                  {L.bonus(d.key, d.v * Math.max(1, lv))}
                  {#if lv && lv < GEAR_MAX}<span class="t-good"> → {L.bonus(d.key, d.v * (lv + 1)).split(' ').at(-1)}</span>{/if}
                </small>
              </span>
              <b class="t-num t-gold">{lv}/{GEAR_MAX}</b>
            </div>
            {#if lv}
              <div class="row between">
                {#if on}
                  <span class="row t-small" style:--gap="6px"><Portrait look={LOOK[on]} size={24} />{L.forge.worn(L.elders[on].name)}</span>
                  <Button variant="quiet" size="sm" disabled={away(on)} onclick={() => equip(g, null)}>{L.forge.unequip}</Button>
                {:else}
                  <span class="t-small t-soft">{L.forge.free}</span>
                  <Button variant="ghost" size="sm" onclick={() => (picking = picking === g ? null : g)}>{L.forge.equip}</Button>
                {/if}
              </div>
              {#if picking === g}
                <ul class="grid" style:--cols="2">
                  {#each elders as e (e)}
                    <li>
                      <Card onclick={away(e) ? undefined : () => equip(g, e)} disabled={away(e)} label={L.elders[e].name}>
                        <span class="row" style:--gap="6px"><Portrait look={LOOK[e]} size={28} /><small class="t-small t-strong t-ellipsis">{L.elders[e].name}</small></span>
                      </Card>
                    </li>
                  {/each}
                </ul>
              {/if}
            {/if}
            {#if lv >= GEAR_MAX}
              <p class="t-small t-gold t-strong">{L.forge.maxed}</p>
            {:else if lv + 1 > cap}
              <Tag icon="lock" size="sm">{L.forge.cap(2 * (lv + 1) - 1)}</Tag>
            {:else if !doing}
              <div class="row between">
                <Bag res={gearCost(g, lv + 1)} have={game.res} size="sm" />
                <Button size="sm" trail={clock(gearTime(game, g, lv + 1))} disabled={!!err} onclick={() => act({ type: 'forge', gear: g }) && sfx('build')}>{L.forge.go}</Button>
              </div>
            {/if}
          </div>
        </Card>
      </li>
    {/each}
  </ul>
</Section>
