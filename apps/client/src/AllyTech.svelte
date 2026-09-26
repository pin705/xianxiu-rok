<script lang="ts">
  // Hộ Minh Đại Trận (như Alliance Technology của RoK): trận đồ 9 trận nhãn (tầng, vòng điểm, sao của minh chủ); chọn một nhãn
  // thì bia dưới cho thấy tăng ích bây giờ → tầng sau và cung phụng bằng một loại tài nguyên (giá theo tầng). Lượt hồi mỗi 30 phút.
  import { ALLY_TECH_IDS, ALLY_TECH_PTS, DONATE_PTS, DONATE_STAR, RESOURCES, type AllyTechId } from '@rok/rules'
  import { donateCost, donateLeft, donateWait, techLevel, type AllyInfo, type WorldAction } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import { Icon, artOf, type IconName } from '@rok/art'
  import { Button, Meter, Sheet, Tag } from './ui'
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
  const ui = (n: string) => artOf(`ui:${n}`)?.src

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
  <div class="plaques">
    <span class="plaque turns">
      {#if ui('sundial')}<img src={ui('sundial')} alt="" draggable="false" />{:else}<Icon name="clock" size={24} />{/if}
      <span class="stack" style:--gap="0"
        ><b class="t-small">{L.guild.left(left)}</b>{#if wait}<small class="t-tiny t-soft"
            >{L.guild.next(clock(wait))}</small
          >{/if}</span
      >
    </span>
    <span class="plaque"><small>{L.guild.credit}</small><b class="t-num">{num(game.contrib?.credit ?? 0)}</b></span>
  </div>

  <!-- trận đồ: 9 trận nhãn nối nét mực, đỉnh đồng mờ ở tâm; vòng quanh nhãn = điểm của tầng đang lên, ấn son = tầng -->
  <div class="array" style:--ding={ui('ally-tech') ? `url(${ui('ally-tech')})` : undefined}>
    {#each ALLY_TECH_IDS as id (id)}
      <button
        type="button"
        class="node"
        class:on={id === sel}
        class:full={lv(id) >= TOP}
        aria-pressed={id === sel}
        style:--p={part(id)}
        onclick={() => {
          sfx('tap')
          pick = id
        }}
      >
        <span class="eye">
          <Icon name={ICON[id]} size={28} />
          <i class="lv t-num" aria-hidden="true">{lv(id)}</i>
          {#if ally.star === id}<span class="star" title={L.guild.star}><Icon name="star" size={16} /></span>{/if}
        </span>
        <b class="nm">{L.guild.names[id]}</b>
        <small class="t-tiny t-soft">{tier(id)}</small>
      </button>
    {/each}
  </div>

  <!-- bia trận đang chọn: tên, tầng trên dải son; bây giờ → tầng sau; ba lễ vật cung phụng trên án son -->
  <section class="stele">
    <p class="row between">
      <b class="t-head">{L.guild.names[sel]}</b>
      {#if ally.star === sel}<Tag size="sm" tone="gold" icon="star">{L.guild.star}</Tag>{/if}
    </p>
    <small class="ribbon">{tier(sel)}</small>
    <div class="fx">
      <span><small>{L.guild.now}</small><b>{lv(sel) ? L.guild.effect(sel, lv(sel)) : '—'}</b></span>
      {#if lv(sel) < TOP}
        <svg class="arrow" viewBox="0 0 60 24" aria-hidden="true"
          ><path d="M4 14 C 18 4, 30 22, 46 11" /><path d="M40 5 L 52 10 L 42 18" /></svg
        >
        <span class="nx"><small>{L.guild.next1}</small><b>{L.guild.effect(sel, lv(sel) + 1)}</b></span>
      {/if}
    </div>
    {#if lv(sel) < TOP}
      <Meter value={part(sel)} size="sm" label="{num(pts(sel))} / {num(ALLY_TECH_PTS[lv(sel)])}" />
      <small class="t-tiny t-soft t-num">{num(pts(sel))} / {num(ALLY_TECH_PTS[lv(sel)])} · {L.guild.gain(gain)}</small>
      <div class="altar">
        {#each RESOURCES as r (r)}
          <button
            type="button"
            class="gift"
            class:short={game.res[r] < cost}
            disabled={left < 1 || game.res[r] < cost}
            aria-label="{L.guild.donate} {L.res[r]} {num(cost)}"
            onclick={() => give(r)}
          >
            {#if ui(`res-${r}`)}<img src={ui(`res-${r}`)} alt="" draggable="false" />{:else}<Icon
                name={r}
                size={40}
              />{/if}
            <b class="t-num">{num(cost)}</b>
          </button>
        {/each}
      </div>
    {/if}
    {#if officer && ally.star !== sel}
      <Button size="sm" variant="ghost" icon="star" onclick={() => send({ type: 'allyStar', tech: sel })}
        >{L.guild.setStar}</Button
      >
    {/if}
  </section>
</Sheet>

<style>
  /* ---------- biển số liệu ---------- */
  .plaques {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }
  .plaque {
    display: grid;
    align-content: center;
    gap: 1px;
    padding: 5px 10px 6px;
    text-align: center;
    background: rgb(255 255 255 / 0.7);
    border: 1px solid var(--paper3);
    border-top: 2px solid var(--rim, var(--ink3));
    border-radius: 3px;
  }
  .plaque small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  .plaque b {
    font-size: var(--fs-3);
  }
  .turns {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    text-align: left;
  }
  .turns img {
    width: 38px;
    height: 38px;
  }
  /* ---------- trận đồ ---------- */
  .array {
    --gx: 6px;
    --gy: 14px;
    --ey: 36px; /* tâm trận nhãn tính từ đỉnh ô */
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--gy) var(--gx);
    margin: var(--sp-4) 0 var(--sp-3);
    padding: 6px 0;
  }
  /* đỉnh đồng mờ sau trận đồ */
  .array::before {
    content: '';
    position: absolute;
    inset: 12% 22%;
    background: var(--ding, none) center / contain no-repeat;
    opacity: 0.16;
    pointer-events: none;
  }
  .node {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 2px;
    min-width: 0;
    padding-top: 8px;
    color: var(--text);
  }
  /* nét mực đứt nối sang nhãn bên phải và nhãn bên dưới */
  .node::before,
  .node::after {
    content: '';
    position: absolute;
    z-index: 0;
    pointer-events: none;
  }
  .node::before {
    top: var(--ey);
    left: 50%;
    width: calc(100% + var(--gx));
    border-top: 2px dashed rgb(var(--shade) / 0.28);
  }
  .node::after {
    top: var(--ey);
    left: 50%;
    height: calc(100% + var(--gy));
    border-left: 2px dashed rgb(var(--shade) / 0.28);
  }
  .node:nth-child(3n)::before,
  .node:nth-child(n + 7)::after {
    display: none;
  }
  .eye {
    --ring: var(--malachite);
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    color: var(--text);
    border-radius: 50%;
    background:
      radial-gradient(circle closest-side, #eef4ee 0 83%, transparent 85%),
      conic-gradient(var(--ring) calc(var(--p) * 1turn), rgb(var(--shade) / 0.14) 0);
    box-shadow: 0 2px 5px rgb(0 0 0 / 0.18);
    transition: transform var(--dur-2) var(--spring);
  }
  .full .eye {
    --ring: #c9a13a;
  }
  .node.on .eye {
    transform: scale(1.1);
    box-shadow:
      0 0 0 3px var(--paper),
      0 0 0 5px var(--cinnabar),
      0 4px 10px rgb(0 0 0 / 0.2);
  }
  .node:active .eye {
    transform: scale(0.94);
  }
  /* ấn son nhỏ: tầng hiện tại */
  .lv {
    position: absolute;
    bottom: -6px;
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 4px;
    font-size: 11px;
    font-style: normal;
    font-weight: 900;
    color: #fff;
    background: radial-gradient(circle at 40% 35%, #e0604c, var(--cinnabar) 60%, #6e1f18);
    border-radius: 50%;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
  }
  .star {
    position: absolute;
    top: -6px;
    right: -8px;
    filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.3));
  }
  .nm {
    display: -webkit-box;
    max-width: 100%;
    margin-top: 6px;
    padding: 1px 5px 2px;
    overflow: hidden;
    font-size: var(--fs-1);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    background: var(--paper);
    border-radius: 4px;
  }
  .node.on .nm {
    color: #fff;
    background: var(--cinnabar);
    text-shadow: 0 1px 1px rgb(0 0 0 / 0.3);
  }
  /* ---------- bia trận đang chọn ---------- */
  .stele {
    display: grid;
    gap: 6px;
    padding: 12px 14px 14px;
    border: 0 solid transparent;
    border-image: var(--sk-card);
    background:
      var(--img-mountains, linear-gradient(transparent, transparent)) right bottom / 300% auto no-repeat,
      var(--paper2);
    background-clip: padding-box;
  }
  .ribbon {
    justify-self: start;
    padding: 1px 12px 2px 8px;
    font-size: var(--fs-1);
    font-weight: 800;
    color: #fff;
    background: var(--cinnabar);
    clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%);
  }
  .fx {
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 4px;
    padding: 4px 0;
    text-align: center;
  }
  .fx > span {
    display: grid;
    gap: 1px;
    min-width: 0;
  }
  .fx small {
    font-size: var(--fs-1);
    color: var(--text-soft);
  }
  .fx b {
    font-size: var(--fs-2);
  }
  .fx .nx b {
    color: var(--cinnabar);
  }
  .arrow {
    flex: none;
    width: 40px;
    fill: none;
    stroke: var(--text);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* án son: mặt bàn sơn đỏ viền vàng, hai chân; lễ vật đứng trên mặt bàn, chạm để cung phụng */
  .altar {
    position: relative;
    display: flex;
    justify-content: center;
    gap: 14px;
    margin-top: 4px;
    padding: 2px 20px 26px;
    background:
      linear-gradient(#c9a45a, #c9a45a) left 8px bottom 18px / calc(100% - 16px) 2px no-repeat,
      linear-gradient(#c0443a, #7d2218) left 0 bottom 10px / 100% 12px no-repeat;
  }
  .altar::before,
  .altar::after {
    content: '';
    position: absolute;
    bottom: 0;
    width: 12px;
    height: 12px;
    background: linear-gradient(#8a2a20, #5a1510);
    border-radius: 0 0 3px 3px;
  }
  .altar::before {
    left: 26px;
  }
  .altar::after {
    right: 26px;
  }
  .gift {
    display: grid;
    justify-items: center;
    min-width: 64px;
    padding: 2px 4px 0;
    border-radius: 8px;
    transition: transform var(--dur-1) var(--ease);
  }
  .gift img {
    width: 50px;
    height: 50px;
    filter: drop-shadow(0 3px 3px rgb(0 0 0 / 0.25));
  }
  .gift b {
    font-size: var(--fs-3);
    font-weight: 900;
  }
  .gift.short b {
    color: var(--cinnabar);
  }
  .gift:not(:disabled):active {
    transform: translateY(2px) scale(0.94);
  }
  .gift:not(:disabled):hover {
    background: rgb(255 255 255 / 0.5);
  }
  .gift:disabled {
    filter: grayscale(0.7);
    opacity: 0.6;
  }
</style>
