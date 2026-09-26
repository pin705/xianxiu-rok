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
  import { Bag, Banner, Button, Card, Shelf, Tag, Ware } from './ui'
  import JobRow from './JobRow.svelte'
  import { L, LOOK, clock } from './lib'
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
  // chi phí + nút luyện (ẩn khi đang luyện chính món này)
  const costRow = $derived(lv >= GEAR_MAX || lv + 1 > cap || game.forge?.gear !== cur)
  const equip = (gear: GearId, elder: ElderId | null) => {
    if (act({ type: 'equip', gear, elder }, 'reward')) picking = false
  }
</script>

{#if game.forge}
  <div class="mt-3">
    <JobRow kind="forge" label={L.forge.doing(L.gear[game.forge.gear], game.forge.level)} />
  </div>
{/if}

<!-- phần dưới đe: người đeo (chọn trưởng lão đeo), chi phí + nút luyện -->
{#snippet anvilFoot()}
  {#if lv}
    <div class="row wrap between">
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
      <ul class="grid plain">
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
  {#if costRow}
    <div class="row wrap between">
      {#if lv >= GEAR_MAX}
        <span class="stamp">{L.forge.maxed}</span>
      {:else if lv + 1 > cap}
        <Tag icon="lock" size="sm">{L.forge.cap(2 * (lv + 1) - 1)}</Tag>
      {:else}
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
  {/if}
{/snippet}

<!-- đe luyện: pháp bảo đang chọn trên quầng lửa -->
<Banner title={L.gear[cur]} band="{lv}/{GEAR_MAX}" picSize={96} halo foot={lv || costRow ? anvilFoot : undefined}>
  {#snippet pic()}<Icon name={cur} size={76} />{/snippet}
  {#snippet lead()}
    <p class="t-small">
      {L.bonus(d.key, d.v * Math.max(1, lv))}
      {#if lv && lv < GEAR_MAX}<span class="t-good">
          → {L.bonus(d.key, d.v * (lv + 1))
            .split(' ')
            .at(-1)}</span
        >{/if}
    </p>
  {/snippet}
</Banner>

<p class="t-tiny t-lore mt-3">{L.forge.hint} · {L.panel.gearCap} {cap}/{GEAR_MAX}</p>

<!-- giá binh khí: mỗi pháp bảo một món trên kệ, cấp trên đồng tiền, người đeo là chân dung nhỏ -->
<div class="mt-2">
  <Shelf cols={3} row={92}>
    {#each GEAR_IDS as x (x)}
      {@const xl = game.gear[x]?.lv ?? 0}
      {@const wearer = game.gear[x]?.on}
      <Ware
        icon={x}
        size={44}
        label={L.gear[x]}
        n={xl}
        full={xl >= GEAR_MAX}
        on={x === cur}
        faded={!xl}
        busy={game.forge?.gear === x}
        onclick={() => {
          pick = x
          picking = false
        }}
      >
        {#snippet side()}{#if wearer}<Portrait look={LOOK[wearer]} size={20} />{/if}{/snippet}
      </Ware>
    {/each}
  </Shelf>
</div>
