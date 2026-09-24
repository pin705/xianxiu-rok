<script lang="ts">
  // Hộ Minh Đại Trận (như Alliance Technology của RoK): lưới các trận (tầng, thanh điểm, sao của minh chủ); chọn một trận
  // thì thấy tăng ích bây giờ / tầng sau và cung phụng bằng một loại tài nguyên (giá theo tầng). Lượt hồi mỗi 30 phút.
  import { ALLY_TECH_IDS, ALLY_TECH_PTS, DONATE_PTS, DONATE_STAR, RESOURCES, type AllyTechId } from '@rok/rules'
  import { donateCost, donateLeft, donateWait, techLevel, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Icon, type IconName } from '@rok/art'
  import { Button, Card, Meter, Sheet, Tag } from './ui'
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
  const lv = (id: AllyTechId) => techLevel(ally, id)
  const pts = (id: AllyTechId) => ally.tech?.[id] ?? 0
  // phần đã góp trong tầng đang lên (0..1)
  const part = (id: AllyTechId) => {
    const l = lv(id)
    if (l >= TOP) return 1
    const lo = l ? ALLY_TECH_PTS[l - 1] : 0
    return (pts(id) - lo) / (ALLY_TECH_PTS[l] - lo)
  }
  const gain = $derived(DONATE_PTS * (ally.star === sel ? DONATE_STAR : 1))
  const give = async (res: (typeof RESOURCES)[number]) => {
    if ((await send({ type: 'allyDonate', tech: sel, res })).ok) sfx('reward')
  }
</script>

<Sheet {open} {onclose} title={L.guild.tech} lore={L.guild.techLore}>
  <div class="stack">
    <Card tone="glow">
      <p class="row between">
        <b>{L.guild.left(left)}</b>
        <small class="t-soft t-num">{L.guild.credit} {num(game.contrib?.credit ?? 0)}</small>
      </p>
      {#if donateWait(game, now)}<small class="t-small t-soft">{L.guild.next(clock(donateWait(game, now)))}</small>{/if}
    </Card>

    <div class="grid">
      {#each ALLY_TECH_IDS as id (id)}
        <button type="button" class="tile" class:on={id === sel} aria-pressed={id === sel} onclick={() => (pick = id)}>
          {#if ally.star === id}<span class="star" title={L.guild.star}><Icon name="star" size={16} /></span>{/if}
          <Icon name={ICON[id]} size={34} />
          <b class="t-tiny name">{L.guild.names[id]}</b>
          <small class="t-tiny t-soft">{lv(id) >= TOP ? L.guild.maxed : L.guild.tier(lv(id), TOP)}</small>
          <Meter value={part(id)} size="xs" tone={lv(id) >= TOP ? 'gold' : 'spirit'} />
        </button>
      {/each}
    </div>

    <Card>
      <div class="stack" style:--gap="6px">
        <p class="row between">
          <b class="t-head">{L.guild.names[sel]}</b>
          {#if ally.star === sel}<Tag size="sm" tone="gold" icon="star">{L.guild.star}</Tag>{/if}
        </p>
        <p class="t-small">
          {L.guild.now}: {lv(sel) ? L.guild.effect(sel, lv(sel)) : '—'}{#if lv(sel) < TOP}
            · {L.guild.next1}: <b>{L.guild.effect(sel, lv(sel) + 1)}</b>{/if}
        </p>
        {#if lv(sel) < TOP}
          <Meter value={part(sel)} size="sm" label="{num(pts(sel))} / {num(ALLY_TECH_PTS[lv(sel)])}" />
          <small class="t-tiny t-soft t-num"
            >{num(pts(sel))} / {num(ALLY_TECH_PTS[lv(sel)])} · {L.guild.gain(gain)}</small
          >
          <div class="give">
            {#each RESOURCES as r (r)}
              <Button
                size="sm"
                variant="gold"
                disabled={left < 1 || game.res[r] < donateCost(ally, sel)}
                onclick={() => give(r)}
                label="{L.guild.donate} {L.res[r]} {num(donateCost(ally, sel))}"
                ><Icon name={r} size={18} />{num(donateCost(ally, sel))}</Button
              >
            {/each}
          </div>
        {/if}
        {#if officer && ally.star !== sel}
          <Button size="sm" variant="ghost" icon="star" onclick={() => send({ type: 'allyStar', tech: sel })}
            >{L.guild.setStar}</Button
          >
        {/if}
      </div>
    </Card>
  </div>
</Sheet>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-2);
  }
  .tile {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 8px 6px;
    font: inherit;
    color: inherit;
    text-align: center;
    background: var(--silk);
    border: 1.5px solid var(--paper3);
    border-radius: 10px;
    cursor: pointer;
  }
  .tile.on {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--gold) 40%, transparent);
  }
  .tile :global(.meter),
  .tile :global([role='progressbar']) {
    width: 100%;
  }
  .name {
    line-height: 1.2;
  }
  .star {
    position: absolute;
    top: 4px;
    right: 4px;
  }
  .give {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-2);
  }
</style>
