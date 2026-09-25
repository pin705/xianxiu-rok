<script lang="ts">
  // Chọn đội: trưởng lão dẫn đội + số đệ tử mỗi loại. Trước khi đánh: lực chiến hai bên + tỉ lệ thắng ước lượng.
  // Trận đồ (march presets của RoK): 3 ô lưu trưởng lão + đệ tử, chạm để dùng lại, "Lưu" ghi đội đang chọn vào ô đang chọn.
  // Phó trưởng lão (từ DEPUTY_HALL, như tướng phụ của RoK): chọn ngay dưới chủ tướng, mỗi chủ tướng nhớ phó của mình.
  import {
    DEPUTY_HALL,
    ELDER_IDS,
    UNITS,
    deputyOf,
    count,
    elderLevel,
    might,
    sideOf,
    unitOf,
    type Army,
    type ElderId,
    type UnitId,
    type UnitType,
    isMarching,
    PRESETS,
    capArmy,
    capOf,
  } from '@rok/rules'
  import { Portrait } from '@rok/art'
  import { Button, Card, FirstTap, Medal, Meter, Section, Slider } from './ui'
  import { EMBLEM, L, LOOK, num } from './lib'
  import Help from './Help.svelte'
  import { useGame } from './game'

  let {
    foe,
    chance,
    cta,
    time,
    timeOf,
    disabled = false,
    onsubmit,
    onrecruit,
    counter,
    field = false,
  }: {
    foe?: number // lực chiến địch (không biết thì bỏ: chỉ hiện lực chiến của mình)
    chance?: (elder: ElderId, army: Army) => number // tỉ lệ thắng ước lượng (rules.winChance); không có: không đoán
    cta: string
    time?: string
    timeOf?: (a: Army) => string // thời gian đi theo đội đang chọn (bản đồ Giới: tốc hệ chậm nhất)
    disabled?: boolean
    onsubmit: (elder: ElderId, army: Army) => void
    onrecruit?: () => void
    counter?: UnitType // hệ khắc được hệ chính của địch: nút "Theo hệ khắc" chỉ mang hệ này
    field?: boolean // ra bản đồ giới: giới hạn trận dung của trưởng lão dẫn đội
  } = $props()
  const g = useGame()
  const game = $derived(g.game)

  const idle = $derived(
    ELDER_IDS.filter(e => game.elders[e] !== undefined).sort((a, b) => (game.elders[b] ?? 0) - (game.elders[a] ?? 0)),
  )
  let elder = $state<ElderId | null>(null)
  const lead = $derived(elder && !isMarching(game, elder) ? elder : (idle.find(e => !isMarching(game, e)) ?? null))
  const home = $derived(UNITS.filter(u => game.troops[u] > 0))
  let picks = $state<Partial<Record<UnitId, number>>>({})
  let touched = $state(false)
  // Mặc định mang tất cả (ra bản đồ giới: vừa trận dung, bậc cao trước); chỉnh tay thì giữ theo người chơi
  const cap = $derived(field && lead ? capOf(game, lead) : Infinity)
  const picked = $derived(
    Object.fromEntries(
      home.map(u => [u, Math.min(game.troops[u], touched ? (picks[u] ?? 0) : game.troops[u])]),
    ) as Army,
  )
  const army = $derived(!touched && field && lead ? capArmy(game, lead, picked) : picked)
  const over = $derived(count(army) > cap)
  const deputy = $derived(lead ? deputyOf(game, lead) : undefined)
  const ours = $derived(lead ? might(sideOf(game, lead, army, deputy)) : 0)
  const pair = (d: ElderId | null) => lead && g.act({ type: 'pair', elder: lead, deputy: d }, 'tap')
  // Nhận định dựa trên đánh thử (tính hệ khắc, công pháp), không dựa lực chiến thô
  const p = $derived(lead && chance ? chance(lead, army) : 0)
  const verdict = $derived(p >= 0.8 ? 'strong' : p >= 0.35 ? 'even' : 'weak')

  function set(u: UnitId, n: number) {
    if (!touched) picks = { ...army }
    touched = true
    picks = { ...picks, [u]: n }
  }
  let slot = $state(0)
  function load(k: number) {
    slot = k
    const saved = game.presets?.[k]
    if (!saved) return
    elder = saved.elder
    touched = true
    picks = { ...saved.army }
  }
  function only(type: UnitType) {
    touched = true
    picks = Object.fromEntries(home.map(u => [u, unitOf(u).type === type ? game.troops[u] : 0]))
  }
  function all(on: boolean) {
    touched = true
    const every = Object.fromEntries(home.map(u => [u, on ? game.troops[u] : 0])) as Army
    picks = on && field && lead ? capArmy(game, lead, every) : every
  }
</script>

<div class="row wrap presets" style:--gap="4px">
  <small class="t-tiny t-soft">{L.army.presets}</small>
  {#each Array.from({ length: PRESETS }, (_, k) => k) as k (k)}
    <!-- ghost cả ô đang chọn (đánh dấu bằng ✓): nút vàng / chính trong bảng chỉ dành cho Xuất quân -->
    <Button size="sm" variant="ghost" icon={slot === k ? 'check' : undefined} onclick={() => load(k)}
      >{L.army.preset(k + 1)}</Button
    >
  {/each}
  <Button
    size="sm"
    variant="ghost"
    icon="download"
    disabled={!lead || !count(army)}
    onclick={() => lead && g.act({ type: 'preset', i: slot, elder: lead, army }, 'tap')}>{L.army.save}</Button
  >
</div>

<Section title={L.army.elder}>
  {#snippet aside()}<Help k={1} />{/snippet}
  {#if idle.length}
    <div class="row scroll">
      {#each idle as e (e)}
        {@const out = isMarching(game, e)}
        <span class="pick">
          <Card selected={lead === e} disabled={out} onclick={() => (elder = e)} label={L.elders[e].name}>
            <span class="row">
              <Portrait look={LOOK[e]} size={38} dim={out} />
              <span class="stack" style:--gap="0">
                <b class="t-small">{L.elders[e].name}</b>
                <small class="t-tiny t-soft">{out ? L.army.busy : L.lv(elderLevel(game.elders[e]))}</small>
              </span>
            </span>
          </Card>
        </span>
      {/each}
    </div>
  {/if}
  {#if !lead}<p class="t-small t-bad">{L.army.noElder}</p>{/if}
</Section>

{#if lead && game.levels.chuDien >= DEPUTY_HALL && idle.length > 1}
  {@const cur = game.pairs?.[lead]}
  <Section title={L.army.deputy}>
    <div class="row scroll">
      <span class="pick">
        <Card selected={!cur} onclick={() => pair(null)} label={L.army.noDeputy}
          ><small class="t-tiny t-soft">{L.army.noDeputy}</small></Card
        >
      </span>
      {#each idle.filter(e => e !== lead) as e (e)}
        {@const out = isMarching(game, e)}
        <span class="pick">
          <Card selected={cur === e} disabled={out} onclick={() => pair(e)} label="{L.army.deputy}: {L.elders[e].name}">
            <span class="row">
              <Portrait look={LOOK[e]} size={30} dim={out} />
              <span class="stack" style:--gap="0">
                <b class="t-small">{L.elders[e].name}</b>
                <small class="t-tiny t-soft">{out ? L.army.deputyOut : L.elders[e].skill}</small>
              </span>
            </span>
          </Card>
        </span>
      {/each}
    </div>
    <p class="t-tiny t-soft">{L.army.deputyHint}</p>
  </Section>
{/if}

<Section title="{L.army.troops} · {num(count(army))}{Number.isFinite(cap) ? ` / ${num(cap)}` : ''}">
  {#snippet aside()}
    {#if home.length}
      {#if counter && home.some(u => unitOf(u).type === counter)}<Button
          variant="ghost"
          size="sm"
          label="{L.army.counter}: {L.units[counter]}"
          onclick={() => only(counter)}>{L.army.counter}</Button
        >{/if}
      <Button variant="ghost" size="sm" onclick={() => all(true)}>{L.army.all}</Button>
      <Button variant="ghost" size="sm" onclick={() => all(false)}>{L.army.none}</Button>
    {/if}
  {/snippet}
  {#if home.length}
    <ul class="stack">
      {#each home as u (u)}
        {@const t = unitOf(u)}
        <li class="row">
          <Medal emblem={EMBLEM.unit[t.type]} tone={t.type} size={32} pips={t.tier} />
          <span class="grow">
            <span class="row between t-small"
              ><span>{L.unit(u)}</span><b class="t-num">{num(army[u] ?? 0)}/{num(game.troops[u])}</b></span
            >
            <Slider value={army[u] ?? 0} max={game.troops[u]} label={L.unit(u)} onchange={n => set(u, n)} />
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="t-small t-bad">{L.army.noTroops}</p>
    {#if onrecruit}<Button variant="ghost" size="sm" icon="people" onclick={onrecruit}>{L.army.recruit}</Button>{/if}
  {/if}
</Section>

{#if chance && foe !== undefined}
  <div class="row mt-4">
    <span class="stack" style:--gap="0"
      ><small class="t-tiny t-soft">{L.army.ours}</small><b class="t-num">{num(ours)}</b></span
    >
    <span class="grow"
      ><Meter value={p} tone={verdict === 'weak' ? 'bad' : verdict === 'even' ? 'gold' : 'good'} size="lg" /></span
    >
    <span class="stack center" style:--gap="0"
      ><small class="t-tiny t-soft">{L.army.theirs}</small><b class="t-num">{num(foe)}</b></span
    >
  </div>
  <p
    class="center t-small t-strong mt-2"
    class:t-good={verdict === 'strong'}
    class:t-gold={verdict === 'even'}
    class:t-bad={verdict === 'weak'}
  >
    {L.army.verdict[verdict]} · {L.army.chance(Math.round(p * 100))}
  </p>
{:else}
  <p class="center t-small mt-4">
    <span class="t-soft">{L.army.might}:</span> <b class="t-num">{num(ours)}</b>
    <!-- chỉ biết lực chiến bên kia (không dò được đội hình): hiện cạnh nhau, không đoán tỉ lệ thắng -->
    {#if foe !== undefined}· <span class="t-soft">{L.army.theirs}:</span> <b class="t-num">{num(foe)}</b>{/if}
  </p>
{/if}
<!-- yếu thế mà vẫn còn quân: chỉ đường đi tuyển thêm (không quân thì nút đã có ở trên) -->
{#if over}<p class="center t-small t-bad mt-2">{L.army.over(num(cap))}</p>{/if}
{#if field}<p class="t-tiny t-soft mt-2">{L.army.traits}</p>{/if}
{#if chance && verdict === 'weak' && home.length && onrecruit}
  <div class="row center mt-2">
    <Button variant="ghost" size="sm" icon="people" onclick={onrecruit}>{L.army.recruit}</Button>
  </div>
{/if}

<div class="mt-3">
  <FirstTap key="march">
    <Button
      wide
      size="lg"
      icon="flag"
      trail={timeOf && count(army) ? timeOf(army) : time}
      trailIcon="clock"
      disabled={disabled || !lead || !count(army) || over}
      onclick={() => lead && onsubmit(lead, army)}>{cta}</Button
    >
  </FirstTap>
</div>

<style>
  .scroll {
    overflow-x: auto;
    padding: 2px 1px 4px;
  }
  .pick {
    flex: none;
  }
  .presets {
    align-items: center;
    margin-top: var(--sp-2);
  }
</style>
