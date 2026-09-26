<script lang="ts">
  // Thiên Cơ Luân (Wheel of Fortune của RoK) trong trung tâm sự kiện: trưởng lão chủ lễ (tín vật, thu nhận), bánh xe 12 ô quay
  // tới ô vừa trúng (server rút bằng mầm — bấm quay thì chờ patch rồi mới quay), lệnh còn lại, việc ra lệnh, lượt miễn phí,
  // bảo hiểm ô lớn, quà của lần quay vừa rồi.
  import {
    FESTS,
    RARITY,
    TOKEN_SUMMON,
    bagFamily,
    festTokens,
    spinError,
    wheelElder,
    wheelFree,
    type BagId,
    type FestId,
    type Items,
    type Metric,
  } from '@rok/rules'
  import { Icon, Portrait, artOf } from '@rok/art'
  import { Bag, Button, Card, Meter } from './ui'
  import { L, LOOK, num, sfx } from './lib'
  import { useGame } from './game'

  let { id }: { id: FestId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const d = $derived(
    FESTS[id].kind === 'wheel' ? (FESTS[id] as Extract<(typeof FESTS)[FestId], { kind: 'wheel' }>) : null,
  )
  const f = $derived(game.fest[id])
  const got = $derived(f?.got ?? [])
  const elder = $derived(wheelElder(game, id))
  const tokens = $derived(festTokens(game, id))
  const free = $derived(wheelFree(game, id, now))
  const stage = $derived(d ? d.stages[Math.min(f?.stage ?? 0, d.stages.length - 1)] : {})
  const hub = artOf('ui:fx-calendar')?.src // trục đĩa: đĩa lịch đồng
  const STEP = 30 // độ mỗi ô (12 ô)

  // quay: bấm thì chờ server trả các ô trúng (got dài thêm), rồi bánh xe quay tới ô cuối
  let rot = $state(0)
  let pending = $state<number | null>(null) // độ dài got lúc bấm
  let lastN = $state(0)
  let shown = $state(true) // hiện quà khi bánh xe dừng
  let timer: ReturnType<typeof setTimeout> | undefined
  function spin(n: 1 | 10) {
    if (!g.act({ type: 'spin', id, n })) return
    pending = got.length
    lastN = n
    shown = false
    clearTimeout(timer)
    timer = setTimeout(() => (pending = null), 8000) // server im lặng: thôi chờ
  }
  $effect(() => {
    if (pending === null || got.length <= pending) return
    const k = got[got.length - 1]
    const at = (((rot % 360) + 360) % 360) as number
    rot += 4 * 360 + ((((-k * STEP - at) % 360) + 360) % 360)
    pending = null
    clearTimeout(timer)
    timer = setTimeout(() => {
      shown = true
      sfx('reward')
    }, 3300)
  })
  $effect(() => () => clearTimeout(timer))

  // quà của lần quay vừa rồi: tín vật gộp, vật phẩm gộp
  const won = $derived.by(() => {
    if (!d || !lastN || got.length < lastN) return null
    const items: Items = {}
    let tok = 0
    for (const i of got.slice(-lastN)) {
      const slot = d.slots[i]
      tok += slot.token ?? 0
      for (const [k, v] of Object.entries(slot.r?.items ?? {})) items[k as BagId] = (items[k as BagId] ?? 0) + (v ?? 0)
    }
    return { items, tok }
  })
  const firstItem = (r?: { items?: Items }) => Object.entries(r?.items ?? {})[0] as [BagId, number] | undefined
</script>

{#if d && elder}
  <Card tone="silk">
    <div class="row host">
      <Portrait look={LOOK[elder]} size={56} />
      <span class="grow stack" style:--gap="2px">
        <small class="t-tiny t-soft">{L.wheel.host}</small>
        <b class="rar{RARITY[elder]}">{L.elders[elder].name}</b>
        {#if game.elders[elder] === undefined}
          <span class="row" style:--gap="6px"
            ><span class="grow"><Meter value={Math.min(1, (game.tokens[elder] ?? 0) / TOKEN_SUMMON)} size="sm" /></span
            ><small class="t-tiny t-num">{L.wheel.tokens(game.tokens[elder] ?? 0, TOKEN_SUMMON)}</small></span
          >
        {:else}<small class="t-tiny t-soft">{L.wheel.owned}</small>{/if}
      </span>
      {#if game.elders[elder] === undefined && (game.tokens[elder] ?? 0) >= TOKEN_SUMMON}<Button
          size="sm"
          variant="gold"
          onclick={() => g.act({ type: 'recruit', elder }, 'reward')}>{L.wheel.recruit}</Button
        >{/if}
    </div>
  </Card>

  <div class="wheel-box">
    <span class="pointer" aria-hidden="true"></span>
    <div class="wheel" style:rotate="{rot}deg" aria-hidden="true">
      <span class="top"></span>
      <span class="hub"
        >{#if hub}<img src={hub} alt="" draggable="false" />{/if}</span
      >
      {#each d.slots as slot, k (k)}
        {@const it = firstItem(slot.r)}
        <span class="slot" style:--a="{k * STEP}deg">
          {#if slot.token}<Portrait look={LOOK[elder]} size={30} /><b class="n">×{slot.token}</b>
          {:else if it}<Icon name={bagFamily(it[0])} size={30} /><b class="n">×{it[1]}</b>{/if}
        </span>
      {/each}
    </div>
  </div>

  <p class="row between">
    <b class="t-num t-gold">{L.fest.tokens(num(tokens), L.fest.tokenName[id])}</b>
    <small class="t-tiny t-soft">{L.wheel.pity(d.pity - (got.length % d.pity))}</small>
  </p>
  <div class="acts">
    <Button
      variant="gold"
      disabled={pending !== null || !!spinError({ ...game, time: now }, id, 1)}
      onclick={() => spin(1)}>{free ? L.wheel.free : L.wheel.spin(d.cost)}</Button
    >
    <Button disabled={pending !== null || !!spinError({ ...game, time: now }, id, 10)} onclick={() => spin(10)}
      >{L.wheel.spin10(d.cost * (free ? 9 : 10))}</Button
    >
  </div>
  {#if pending !== null}<small class="t-small t-soft">{L.wheel.spinning}</small>{/if}
  {#if won && shown && (won.tok || Object.keys(won.items).length)}
    <Card tone="glow">
      <div class="stack" style:--gap="6px">
        <b class="t-small">{L.wheel.got}</b>
        {#if won.tok}<span class="row" style:--gap="6px"
            ><Portrait look={LOOK[elder]} size={28} /><small class="t-small t-strong"
              >{L.tavern.tokens(L.elders[elder].name, won.tok)}</small
            ></span
          >{/if}
        {#if Object.keys(won.items).length}<Bag items={won.items} size="sm" named />{/if}
      </div>
    </Card>
  {/if}
  <!-- việc ra lệnh hôm nay: dòng kẻ mực đứt -->
  <ul class="today">
    {#each Object.entries(stage) as [m, v] (m)}
      <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
    {/each}
  </ul>
{/if}

<style>
  .host {
    --gap: var(--sp-2);
  }
  .rar2 {
    color: var(--azurite);
  }
  .rar3 {
    color: #7a47a6;
  }
  .rar4 {
    color: var(--gold-d);
  }
  /* bánh xe như đĩa lịch đồng: mặt giấy chia 12 ô bằng nét mực, vành đồng mảnh, trục đĩa lịch ở giữa.
     Cỡ theo bề ngang chỗ đặt (cột sự kiện trên điện thoại chỉ ~250px): container query */
  .wheel-box {
    position: relative;
    width: min(100%, 280px);
    aspect-ratio: 1;
    margin: var(--sp-2) auto;
    container-type: inline-size;
  }
  .pointer {
    position: absolute;
    top: -6px;
    left: 50%;
    z-index: 2;
    width: 0;
    height: 0;
    translate: -50% 0;
    border: 11px solid transparent;
    border-top: 20px solid var(--cinnabar);
    filter: drop-shadow(0 2px 2px rgb(var(--shade) / 0.35));
  }
  .wheel {
    position: absolute;
    inset: 0;
    border: 4px solid var(--ochre);
    border-radius: 50%;
    background:
      repeating-conic-gradient(
        from -15deg,
        color-mix(in srgb, var(--ink) 55%, transparent) 0deg 0.6deg,
        transparent 0.6deg 30deg
      ),
      radial-gradient(circle, var(--silk) 55%, color-mix(in srgb, var(--paper2) 35%, var(--silk)));
    box-shadow:
      0 4px 14px rgb(var(--shade) / 0.3),
      inset 0 0 0 3px var(--silk),
      inset 0 0 0 4px var(--ink3);
    transition: rotate 3.2s cubic-bezier(0.15, 0.85, 0.2, 1);
  }
  /* ô lớn nhất (ô 0): nền son nhạt */
  .top {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      from -15deg,
      color-mix(in srgb, var(--cinnabar) 28%, transparent) 0deg 30deg,
      transparent 30deg
    );
  }
  .hub {
    position: absolute;
    inset: 36%;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: var(--silk);
    border: 1.5px solid var(--ink3);
    border-radius: 50%;
  }
  /* tranh đĩa lịch có khung vuông: phóng to, cắt tròn chỉ còn mặt đĩa */
  .hub img {
    width: 150%;
    height: 150%;
    object-fit: contain;
  }
  .slot {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    justify-items: center;
    transform: translate(-50%, -50%) rotate(var(--a)) translateY(-37cqw);
  }
  .n {
    font-size: 11px;
    line-height: 1;
    color: var(--ink);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--sp-2);
  }
  .today {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .today li {
    padding: 3px 0;
    border-bottom: 1px dashed var(--paper3);
  }
  @media (prefers-reduced-motion: reduce) {
    .wheel {
      transition: none;
    }
  }
</style>
