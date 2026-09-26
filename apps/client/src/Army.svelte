<script lang="ts">
  // Chọn đội: trưởng lão dẫn đội + số đệ tử mỗi loại. Trước khi đánh: lực chiến hai bên + tỉ lệ thắng ước lượng.
  // Trận đồ (march presets của RoK): 3 ô lưu trưởng lão + đệ tử, chạm để dùng lại, "Lưu" ghi đội đang chọn vào ô đang chọn.
  // Phó trưởng lão (từ DEPUTY_HALL, như tướng phụ của RoK): chọn ngay dưới chủ tướng, mỗi chủ tướng nhớ phó của mình.
  // Bố cục doanh trại: thẻ tre trận đồ, hàng chân dung vòng ngọc chọn tướng, hàng lính vẽ tay đứng trên nền đất (mỗi bậc một
  // hình) kèm thanh kéo và số viên mực, cán cân Ta — Địch, nút Xuất quân sơn son.
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
    hospital,
  } from '@rok/rules'
  import { Portrait, paintedUrl, soldier } from '@rok/art'
  import { Button, FirstTap, Meter, Section, Slider } from './ui'
  import { L, LOOK, num } from './lib'
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
  const beds = $derived(hospital(game) - count(game.wounded)) // chỗ trống Đan phòng
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
  // lính vẽ tay theo hệ + bậc (bậc chưa có tranh: vẽ bằng code)
  const fig = (u: UnitId) => {
    const t = unitOf(u)
    return paintedUrl(`sold:${t.type}:0:${t.tier}`, () => soldier(t.type, false, t.tier), 48)
  }
  function all(on: boolean) {
    touched = true
    const every = Object.fromEntries(home.map(u => [u, on ? game.troops[u] : 0])) as Army
    picks = on && field && lead ? capArmy(game, lead, every) : every
  }
</script>

<!-- một chân dung vòng ngọc (chọn chủ tướng / phó): viền son khi đang chọn, mờ + dấu son khi đang xuất chinh -->
{#snippet face(e: ElderId, on: boolean, out: boolean, sub: string, label: string, pick: () => void)}
  <button type="button" class="face" class:on disabled={out} aria-pressed={on} aria-label={label} onclick={pick}>
    <span class="ring"><Portrait look={LOOK[e]} size={50} dim={out} /></span>
    <b class="fn">{L.elders[e].name}</b>
    <small class="t-tiny" class:t-soft={!out} class:t-bad={out}>{sub}</small>
  </button>
{/snippet}

<!-- trận đồ: ba thẻ tre + nút lưu -->
<div class="presets">
  <small class="t-tiny t-soft">{L.army.presets}</small>
  {#each Array.from({ length: PRESETS }, (_, k) => k) as k (k)}
    <button type="button" class="chip" class:on={slot === k} aria-pressed={slot === k} onclick={() => load(k)}
      >{L.army.preset(k + 1)}</button
    >
  {/each}
  <Button
    size="sm"
    variant="quiet"
    icon="download"
    disabled={!lead || !count(army)}
    onclick={() => lead && g.act({ type: 'preset', i: slot, elder: lead, army }, 'tap')}>{L.army.save}</Button
  >
</div>

<Section title={L.army.elder}>
  {#snippet aside()}<Help k={1} />{/snippet}
  {#if idle.length}
    <div class="faces">
      {#each idle as e (e)}
        {@const out = isMarching(game, e)}
        {@render face(
          e,
          lead === e,
          out,
          out ? L.army.busy : L.lv(elderLevel(game.elders[e])),
          L.elders[e].name,
          () => (elder = e),
        )}
      {/each}
    </div>
  {/if}
  {#if !lead}<p class="t-small t-bad">{L.army.noElder}</p>{/if}
</Section>

{#if lead && game.levels.chuDien >= DEPUTY_HALL && idle.length > 1}
  {@const cur = game.pairs?.[lead]}
  <Section title={L.army.deputy}>
    <div class="faces">
      <button
        type="button"
        class="face"
        class:on={!cur}
        aria-pressed={!cur}
        aria-label={L.army.noDeputy}
        onclick={() => pair(null)}
      >
        <span class="ring empty"></span>
        <small class="t-tiny t-soft">{L.army.noDeputy}</small>
      </button>
      {#each idle.filter(e => e !== lead) as e (e)}
        {@const out = isMarching(game, e)}
        {@render face(
          e,
          cur === e,
          out,
          out ? L.army.deputyOut : L.elders[e].skill,
          `${L.army.deputy}: ${L.elders[e].name}`,
          () => pair(e),
        )}
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
    <ul class="camp">
      {#each home as u (u)}
        {@const n = army[u] ?? 0}
        <li class:zero={!n}>
          <span class="sold"><img src={fig(u)} alt="" draggable="false" /></span>
          <span class="grow">
            <span class="row between"
              ><small class="t-small">{L.unit(u)}</small><b class="pill t-num">{num(n)}/{num(game.troops[u])}</b></span
            >
            <Slider value={n} max={game.troops[u]} label={L.unit(u)} onchange={v => set(u, v)} />
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="t-small t-bad">{L.army.noTroops}</p>
    {#if onrecruit}<Button variant="ghost" size="sm" icon="people" onclick={onrecruit}>{L.army.recruit}</Button>{/if}
  {/if}
</Section>

<!-- cán cân: Ta (chân dung chủ tướng) — thanh thắng thua — Địch -->
{#if chance && foe !== undefined}
  <div class="scale mt-4">
    <span class="side">
      {#if lead}<Portrait look={LOOK[lead]} size={34} />{/if}
      <span class="stack" style:--gap="0"
        ><small class="t-tiny t-soft">{L.army.ours}</small><b class="t-num">{num(ours)}</b></span
      >
    </span>
    <span class="mid">
      <Meter value={p} tone={verdict === 'weak' ? 'bad' : verdict === 'even' ? 'gold' : 'good'} size="lg" />
      <b
        class="t-small verdict"
        class:t-good={verdict === 'strong'}
        class:t-gold={verdict === 'even'}
        class:t-bad={verdict === 'weak'}>{L.army.verdict[verdict]} · {L.army.chance(Math.round(p * 100))}</b
      >
    </span>
    <span class="side end">
      <span class="stack" style:--gap="0"
        ><small class="t-tiny t-soft">{L.army.theirs}</small><b class="t-num">{num(foe)}</b></span
      >
    </span>
  </div>
{:else}
  <p class="center t-small mt-4">
    <span class="t-soft">{L.army.might}:</span> <b class="t-num">{num(ours)}</b>
    <!-- chỉ biết lực chiến bên kia (không dò được đội hình): hiện cạnh nhau, không đoán tỉ lệ thắng -->
    {#if foe !== undefined}· <span class="t-soft">{L.army.theirs}:</span> <b class="t-num">{num(foe)}</b>{/if}
  </p>
{/if}
{#if over}<p class="center t-small t-bad mt-2">{L.army.over(num(cap))}</p>{/if}
<!-- Đan phòng không đủ chỗ cho nửa đội bị thương: thương binh vượt quá sẽ tử trận (Anh Linh Điện giữ lại vài ngày) -->
{#if count(army) && beds < count(army) / 2}<p class="center t-small t-bad mt-2">
    {L.army.beds(num(Math.max(0, beds)))}
  </p>{/if}
{#if field}<p class="t-tiny t-soft mt-2">{L.army.traits}</p>{/if}
<!-- yếu thế mà vẫn còn quân: chỉ đường đi tuyển thêm (không quân thì nút đã có ở trên) -->
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
      variant="gold"
      icon="flag"
      trail={timeOf && count(army) ? timeOf(army) : time}
      trailIcon="clock"
      disabled={disabled || !lead || !count(army) || over}
      onclick={() => lead && onsubmit(lead, army)}>{cta}</Button
    >
  </FirstTap>
</div>

<style>
  /* ---------- trận đồ: thẻ tre ---------- */
  .presets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: var(--sp-2);
  }
  .chip {
    position: relative;
    min-width: 58px;
    min-height: 34px;
    padding: 4px 10px;
    font-size: var(--fs-2);
    font-weight: 800;
    color: var(--text-soft);
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 4px;
  }
  .chip.on {
    color: var(--text);
    background: var(--paper);
    border-color: var(--cinnabar);
    box-shadow: 0 2px 5px rgb(var(--shade) / 0.12);
  }
  .chip.on::before {
    content: '';
    position: absolute;
    inset: 2px 6px auto;
    height: 3px;
    border-radius: 2px;
    background: var(--cinnabar);
  }
  /* ---------- hàng chân dung ---------- */
  .faces {
    display: flex;
    gap: 6px;
    padding: 2px 1px 4px;
    overflow-x: auto;
  }
  .face {
    display: grid;
    flex: none;
    justify-items: center;
    align-content: start;
    gap: 2px;
    width: 84px;
    padding: 4px 2px;
    text-align: center;
    color: var(--text);
  }
  .ring {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border: 3px solid var(--paper3);
    border-radius: 50%;
    background: var(--paper);
    transition: transform var(--dur-2) var(--spring);
  }
  .ring.empty {
    border-style: dashed;
  }
  .face.on .ring {
    border-color: var(--cinnabar);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--cinnabar) 22%, transparent);
    transform: scale(1.06);
  }
  .face:disabled {
    cursor: default;
  }
  .fn {
    max-width: 100%;
    overflow: hidden;
    font-size: var(--fs-1);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .face small {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.15;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  /* ---------- doanh trại: mỗi hàng một lính đứng trên nền đất, kẻ mực đứt ---------- */
  .camp {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .camp li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
    border-bottom: 1px dashed var(--paper3);
  }
  .sold {
    display: grid;
    flex: none;
    place-items: end center;
    width: 50px;
    height: 54px;
    background: radial-gradient(closest-side, color-mix(in srgb, var(--ochre) 35%, transparent), transparent) center
      bottom / 46px 10px no-repeat;
  }
  .sold img {
    width: 46px;
    height: 50px;
    object-fit: contain;
    filter: drop-shadow(0 2px 2px rgb(var(--shade) / 0.2));
  }
  .zero .sold img {
    filter: grayscale(1);
    opacity: 0.55;
  }
  .pill {
    padding: 0 9px 1px;
    font-size: var(--fs-2);
    color: var(--silk);
    background: color-mix(in srgb, var(--ink) 80%, transparent);
    border-radius: 999px;
  }
  /* ---------- cán cân ---------- */
  .scale {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
  }
  .side {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .side.end {
    text-align: right;
  }
  .mid {
    display: grid;
    justify-items: center;
    gap: 4px;
    text-align: center;
  }
  .verdict {
    line-height: 1.2;
  }
</style>
