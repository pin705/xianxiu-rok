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
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Button, Card, Dial, Meter } from './ui'
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
    <div class="row">
      <Portrait look={LOOK[elder]} size={56} />
      <span class="grow stack" style:--gap="2px">
        <small class="t-tiny t-soft">{L.wheel.host}</small>
        <b class="t-rar{RARITY[elder]}">{L.elders[elder].name}</b>
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

  <!-- trục đĩa: đĩa lịch đồng -->
  <Dial n={d.slots.length} {rot} hub="fx-calendar">
    {#snippet slot(k)}
      {@const sl = d.slots[k]}
      {@const it = firstItem(sl.r)}
      {#if sl.token}<Portrait look={LOOK[elder]} size={30} /><b>×{sl.token}</b>
      {:else if it}<Icon name={bagFamily(it[0])} size={30} /><b>×{it[1]}</b>{/if}
    {/snippet}
  </Dial>

  <p class="row between">
    <b class="t-num t-gold">{L.fest.tokens(num(tokens), L.fest.tokenName[id])}</b>
    <small class="t-tiny t-soft">{L.wheel.pity(d.pity - (got.length % d.pity))}</small>
  </p>
  <div class="row wrap justify-center">
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
  <ul class="ledger">
    {#each Object.entries(stage) as [m, v] (m)}
      <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
    {/each}
  </ul>
{/if}
