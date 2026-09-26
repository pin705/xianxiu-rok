<script lang="ts">
  // Hộ Minh Đại Trận (như Alliance Technology của RoK): trận đồ 9 trận nhãn (tầng, vòng điểm, sao của minh chủ); chọn một nhãn
  // thì bia dưới cho thấy tăng ích bây giờ → tầng sau và cung phụng bằng một loại tài nguyên (giá theo tầng). Lượt hồi mỗi 30 phút.
  import { ALLY_TECH_IDS, ALLY_TECH_PTS, DONATE_PTS, DONATE_STAR, RESOURCES, type AllyTechId } from '@rok/rules'
  import { donateCost, donateLeft, donateWait, techLevel, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import type { IconName } from '@rok/art'
  import { Altar, Art, Banner, Button, InkArrow, Lattice, Meter, Plaque, RingNode, Sheet, Tag } from './ui'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'

  let {
    open,
    onclose,
    ally,
    officer,
    send,
  }: {
    open: boolean
    onclose: () => void
    ally: AllyInfo
    officer: boolean // trưởng lão / minh chủ: điểm trận được
    send: (a: WorldAction) => Promise<Ack>
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  const ICON: Record<AllyTechId, IconName> = {
    tuLinh: 'tuLinh',
    loBan: 'loBan',
    luyenBinh: 'luyenBinh',
    hoiXuan: 'heal',
    thanHanh: 'thanHanh',
    satPhat: 'chienY',
    kimCuong: 'kimCuong',
    dongTam: 'people',
    quangNap: 'flag',
  }
  const TOP = ALLY_TECH_PTS.length
  let pick = $state<AllyTechId | null>(null)
  const sel = $derived(pick ?? ally.star ?? 'tuLinh')
  const left = $derived(donateLeft(game, now))
  const wait = $derived(donateWait(game, now))
  const lv = (id: AllyTechId) => techLevel(ally, id)
  const pts = (id: AllyTechId) => ally.tech?.[id] ?? 0
  const tier = (id: AllyTechId) => (lv(id) >= TOP ? L.guild.maxed : L.guild.tier(lv(id), TOP))
  // phần đã góp trong tầng đang lên (0..1)
  const part = (id: AllyTechId) => {
    const l = lv(id)
    if (l >= TOP) return 1
    const lo = l ? ALLY_TECH_PTS[l - 1] : 0
    return (pts(id) - lo) / (ALLY_TECH_PTS[l] - lo)
  }
  const gain = $derived(DONATE_PTS * (ally.star === sel ? DONATE_STAR : 1))
  const cost = $derived(donateCost(ally, sel))
  const give = async (res: (typeof RESOURCES)[number]) => {
    sfx('tap')
    if ((await send({ type: 'allyDonate', tech: sel, res })).ok) sfx('reward')
  }
</script>

<Sheet {open} {onclose} title={L.guild.tech} lore={L.guild.techLore}>
  <!-- hai tấm biển: lượt cung phụng (nhật quỹ + giờ hồi lượt kế) · cống hiến của mình -->
  <div class="split end-side mt-2" style:--gap="8px" style:--align="stretch">
    <Plaque>
      {#snippet pic()}<Art art="sundial" icon="clock" size={38} />{/snippet}
      <b class="t-small">{L.guild.left(left)}</b>{#if wait}<small class="t-tiny t-soft"
          >{L.guild.next(clock(wait))}</small
        >{/if}
    </Plaque>
    <Plaque label={L.guild.credit} value={num(game.contrib?.credit ?? 0)} />
  </div>

  <!-- trận đồ: 9 trận nhãn nối nét mực; vòng quanh nhãn = điểm của tầng đang lên, ấn son = tầng -->
  <Lattice>
    {#each ALLY_TECH_IDS as id (id)}
      <RingNode
        icon={ICON[id]}
        level={lv(id)}
        value={part(id)}
        label={L.guild.names[id]}
        sub={tier(id)}
        on={id === sel}
        full={lv(id) >= TOP}
        star={ally.star === id ? L.guild.star : undefined}
        onclick={() => (pick = id)}
      />
    {/each}
  </Lattice>

  <!-- bia trận đang chọn: tên, tầng trên dải son; bây giờ → tầng sau; ba lễ vật cung phụng trên án son -->
  <Banner title={L.guild.names[sel]} band={tier(sel)}>
    {#snippet lead()}{#if ally.star === sel}<span class="self-start"
          ><Tag size="sm" tone="gold" icon="star">{L.guild.star}</Tag></span
        >{/if}{/snippet}
    <div class="row center" style:--gap="16px">
      <span class="stack" style:--gap="1px"
        ><small class="t-tiny t-soft">{L.guild.now}</small><b class="t-small"
          >{lv(sel) ? L.guild.effect(sel, lv(sel)) : '—'}</b
        ></span
      >
      {#if lv(sel) < TOP}
        <InkArrow width={40} />
        <span class="stack" style:--gap="1px"
          ><small class="t-tiny t-soft">{L.guild.next1}</small><b class="t-small t-bad"
            >{L.guild.effect(sel, lv(sel) + 1)}</b
          ></span
        >
      {/if}
    </div>
    {#if lv(sel) < TOP}
      <Meter value={part(sel)} size="sm" label="{num(pts(sel))} / {num(ALLY_TECH_PTS[lv(sel)])}" />
      <small class="t-tiny t-soft t-num">{num(pts(sel))} / {num(ALLY_TECH_PTS[lv(sel)])} · {L.guild.gain(gain)}</small>
      <Altar
        items={RESOURCES.map(r => ({
          key: r,
          art: `res-${r}`,
          icon: r,
          n: num(cost),
          short: game.res[r] < cost,
          disabled: left < 1 || game.res[r] < cost,
          label: `${L.guild.donate} ${L.res[r]} ${num(cost)}`,
        }))}
        onpick={r => give(r as (typeof RESOURCES)[number])}
      />
    {/if}
    {#if officer && ally.star !== sel}
      <span class="self-start"
        ><Button size="sm" variant="ghost" icon="star" onclick={() => send({ type: 'allyStar', tech: sel })}
          >{L.guild.setStar}</Button
        ></span
      >
    {/if}
  </Banner>
</Sheet>
