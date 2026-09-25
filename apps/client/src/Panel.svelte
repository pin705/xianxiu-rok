<script lang="ts">
  // Bảng công trình: mở khi chạm vào công trình trên núi. Công trình có chức năng thì thêm thẻ (tuyển, luyện đan, công pháp).
  // Chủ điện ở tầng 5, 10, 15, 20: thay nâng cấp bằng độ kiếp. Từ tầng 15: luân hồi.
  import {
    BUILDINGS,
    DO_KIEP,
    GUARD_STEP,
    HO_PHAP,
    MARKET_HALL,
    DRILL_HALL,
    QUIZ_DAY,
    QUIZ_HALL,
    quizToday,
    MAX_LEVEL,
    PHA_CANH,
    PHA_KIEP,
    TRIB_CLOUD,
    REBIRTH_HALL,
    TECH_ROWS,
    TRIBS,
    batch,
    buildTime,
    capAt,
    cost,
    gearCap,
    hospital,
    marchSlots,
    might,
    mob,
    rate,
    storage,
    storeNeed,
    tribError,
    tribPill,
    upgradeError,
    winChance,
    type Army,
    type BuildingId,
    type ElderId,
    type Tier,
    type UnitType,
  } from '@rok/rules'
  import { Icon, artOf, building, tierOf, type IconName, type Kind } from '@rok/art'
  import { Bag, Button, Card, Confirm, Medal, Painting, Section, Sheet, Stat, Tabs, Tag, Toggle } from './ui'
  import Alchemy from './Alchemy.svelte'
  import ArmyPick from './Army.svelte'
  import Forge from './Forge.svelte'
  import Guard from './Guard.svelte'
  import JobRow from './JobRow.svelte'
  import Refill from './Refill.svelte'
  import Library from './Library.svelte'
  import Train from './Train.svelte'
  import Trade from './Trade.svelte'
  import { unlocked } from './notices'
  import Merchant from './Merchant.svelte'
  import DaoPick from './DaoPick.svelte'
  import { L, LANG, clock, num, type PanelTab } from './lib'
  import Help from './Help.svelte'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let {
    id,
    view,
    onupgrade,
    onclose,
    onselect,
    ontrib,
    onrebirth,
  }: {
    id: BuildingId | null
    view: PanelTab | null
    onupgrade: (id: BuildingId) => void
    onclose: () => void
    onselect: (id: BuildingId, view?: PanelTab | null) => void
    ontrib: (elder: ElderId, army: Army, pill: boolean) => void
    onrebirth: () => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const busy = $derived(g.busy)

  const FN: Partial<Record<BuildingId, [PanelTab, string]>> = {
    dienVoTruong: ['train', L.train.tab],
    danPhong: ['alchemy', L.b.danPhong.name],
    tangKinhCac: ['library', L.library.tab],
    tangBaoCac: ['trade', L.trade.tab],
    luyenKhiPhong: ['forge', L.forge.tab],
    hoSonDaiTran: ['guard', L.pvp.defense],
  }
  // Thẻ người chơi đã chọn, nhớ theo công trình: mở công trình khác thì về thẻ mặc định
  let picked = $state<{ id: BuildingId | null; tab: PanelTab } | null>(null)
  const fn = $derived(id && game.levels[id] > 0 ? FN[id] : undefined)
  const tab = $derived(picked?.id === id ? picked.tab : fn ? (view ?? fn[0]) : 'upgrade')
  let pill = $state(true)
  const waveMight = (str: number, tier: Tier, type: UnitType) => might(mob(str, tier, [[type, 1]]))
  const withLevel = (b: BuildingId, lv: number) => ({ ...game, levels: { ...game.levels, [b]: lv } })
</script>

<!-- chi phí vượt sức chứa kho: nói thẳng và chỉ đường, không để người chơi chờ mãi -->
{#snippet store(c: Parameters<typeof storeNeed>[1])}
  {@const n = storeNeed(game, c)}
  {#if n && id !== 'tangBaoCac'}
    <p class="t-small t-bad mt-2">{L.panel.store(num(storage(game)), n)}</p>
    <Button variant="quiet" size="sm" onclick={() => onselect('tangBaoCac', 'upgrade')}
      >{L.panel.goTo}: {L.b.tangBaoCac.name}</Button
    >
  {/if}
{/snippet}

<Sheet
  open={!!id}
  {onclose}
  title={id ? L.b[id].name : ''}
  sub={id ? (game.levels[id] ? L.level(game.levels[id]) : L.panel.notBuilt) : ''}
  lore={id ? L.b[id].lore : ''}
>
  {#snippet art()}
    {#if id && tab !== 'upgrade'}
      {@const lv = Math.max(1, game.levels[id])}
      <span class="art"
        ><Painting key="panel:{id}:{tierOf(lv)}" make={() => building(id as Kind, lv).art} w={118} h={104} /></span
      >
    {/if}
  {/snippet}
  {#if id}
    {@const d = BUILDINGS[id]}
    {@const lv = game.levels[id]}
    {@const next = lv + 1}
    {@const hall = game.levels.chuDien}
    {@const need = id === 'chuDien' ? 0 : Math.max(next, d.unlock)}
    {@const locked = lv === 0 && hall < d.unlock}
    {@const job = game.queue.find(j => j.building === id)}
    {@const err = upgradeError(game, id)}
    {@const c = cost(id, Math.min(next, MAX_LEVEL))}
    {@const tr = TRIBS[game.trib]}
    <!-- nâng cấp thường (không đang xây, không độ kiếp, chưa tối đa): bố cục nghi lễ — hai tầng, lễ vật trên án, nút ấn son -->
    {@const rite = !job && !(err === 'trib' && tr) && err !== 'max_level'}

    {#if fn}
      <Tabs
        items={[
          { id: fn[0], label: fn[1] },
          { id: 'upgrade', label: L.panel.upgrade },
        ]}
        value={tab}
        onchange={t => (picked = { id, tab: t })}
      />
    {/if}

    {#if tab === 'train'}
      <Train />
      <!-- Luận Võ Liên Hoàn: mỗi ngày một phiên đấu liên tiếp giáo đầu (từ tầng DRILL_HALL) -->
      <Card tone="silk">
        <div class="row">
          <Icon name="swords" size={26} />
          <span class="grow stack" style:--gap="2px"
            ><b>{L.drill.title}</b><small class="t-tiny t-soft"
              >{game.levels.chuDien >= DRILL_HALL ? L.drill.short : L.drill.locked(DRILL_HALL)}</small
            ></span
          >
          <Button
            size="sm"
            variant="ghost"
            disabled={game.levels.chuDien < DRILL_HALL}
            onclick={() => {
              onclose()
              social.drill = true
            }}>{L.drill.open}</Button
          >
        </div>
      </Card>
    {:else if tab === 'alchemy'}
      <Alchemy />
    {:else if tab === 'library'}
      <!-- Vấn Đạo Đài: năm câu mỗi ngày (từ tầng QUIZ_HALL) -->
      <Card tone="silk">
        <div class="row">
          <Icon name="scroll" size={26} />
          <span class="grow stack" style:--gap="2px"
            ><b>{L.quiz.title}</b><small class="t-tiny t-soft"
              >{game.levels.chuDien >= QUIZ_HALL
                ? L.quiz.step(Math.min(QUIZ_DAY, quizToday(game).n + 1), QUIZ_DAY)
                : L.quiz.locked(QUIZ_HALL)}</small
            ></span
          >
          <Button
            size="sm"
            variant="ghost"
            disabled={game.levels.chuDien < QUIZ_HALL}
            onclick={() => {
              onclose()
              social.quiz = true
            }}>{L.quiz.open}</Button
          >
        </div>
      </Card>
      <Library />
    {:else if tab === 'trade'}
      <Trade />
      <Merchant />
      <!-- Phường thị: chợ ký gửi giữa các tông môn (từ tầng MARKET_HALL) -->
      <Card tone="silk">
        <div class="row">
          <Icon name="people" size={26} />
          <span class="grow stack" style:--gap="2px"
            ><b>{L.market.title}</b><small class="t-tiny t-soft"
              >{game.levels.chuDien >= MARKET_HALL ? L.market.lore : L.market.locked(MARKET_HALL)}</small
            ></span
          >
          <Button
            size="sm"
            variant="ghost"
            disabled={game.levels.chuDien < MARKET_HALL}
            onclick={() => {
              onclose() // desktop: hai ngăn kéo chồng nhau thì Phường thị nằm dưới bảng công trình
              social.market = true
            }}>{L.market.open}</Button
          >
        </div>
      </Card>
    {:else if tab === 'forge'}
      <Forge />
    {:else if tab === 'guard'}
      <Guard />
    {:else if locked}
      <div class="stack mt-3">
        <Tag icon="lock" tone="bad">{L.panel.locked(d.unlock)}</Tag>
        <Button variant="gold" wide onclick={() => onselect('chuDien')}>{L.panel.goTo}: {L.b.chuDien.name}</Button>
      </div>
    {:else}
      {#snippet gains()}
        {#if d.makes}
          <Stat label={L.panel.output} tone="good">
            <Icon name={d.makes} size={16} />{num(rate(game, d.makes))}{#if lv < MAX_LEVEL}<span class="to"
                >→ {num(rate(withLevel(id, next), d.makes))}</span
              >{/if}<small class="t-soft">{L.panel.perHour}</small>
          </Stat>
        {:else if id === 'tangBaoCac'}
          <Stat label={L.panel.capacity}
            >{num(capAt(lv))}{#if lv < MAX_LEVEL}<span class="to">→ {num(capAt(next))}</span>{/if}</Stat
          >
        {:else if id === 'dienVoTruong'}
          <Stat label={L.panel.batch}
            >{num(batch(game))}{#if lv < MAX_LEVEL}<span class="to">→ {num(batch(withLevel(id, next)))}</span
              >{/if}</Stat
          >
        {:else if id === 'danPhong'}
          <Stat label={L.panel.hospital}
            >{num(hospital(game))}{#if lv < MAX_LEVEL}<span class="to">→ {num(hospital(withLevel(id, next)))}</span
              >{/if}</Stat
          >
        {:else if id === 'tangKinhCac'}
          <Stat label={L.panel.rows}>{TECH_ROWS.filter(r => r <= lv).length}/{TECH_ROWS.length}</Stat>
        {:else if id === 'chuDien'}
          <Stat label={L.panel.slots}>{marchSlots(game)}</Stat>
        {:else if id === 'hoSonDaiTran'}
          <Stat label={L.pvp.wall(lv)}
            >+{Math.round(GUARD_STEP * lv * 100)}%{#if lv < MAX_LEVEL}<span class="to"
                >→ +{Math.round(GUARD_STEP * next * 100)}%</span
              >{/if}</Stat
          >
        {:else if id === 'luyenKhiPhong'}
          <Stat label={L.panel.gearCap}
            >{gearCap(game)}{#if lv < MAX_LEVEL}<span class="to">→ {gearCap(withLevel(id, next))}</span>{/if}</Stat
          >
        {/if}
        {#if lv < MAX_LEVEL}
          <Stat label={L.power} tone="good"><Icon name="power" size={14} />+{num(d.power * next)}</Stat>
        {/if}
      {/snippet}
      {#if !rite}<Card>{@render gains()}</Card>{/if}

      {#if job}
        <div class="mt-3"><JobRow kind="build" label={L.panel.upgrading(job.level)} /></div>
      {:else if err === 'trib' && tr}
        <!-- Độ kiếp -->
        {@const terr = tribError(game)}
        {@const tp = tribPill(game, true)}
        {@const cloud = game.marches.find(m => m.target.kind === 'trib')}
        <Section title={L.trib.title}>
          {#snippet aside()}<Help k={4} />{/snippet}
          <p class="t-small t-lore">{L.trib.lore(L.realmName(tr.hall + 1))}</p>
          {#if game.seat}<p class="t-small t-soft">
              {L.trib.public(clock(TRIB_CLOUD[game.trib]), HO_PHAP, PHA_KIEP)}
            </p>{/if}
          <ul class="stack">
            {#each tr.waves as w, i (i)}
              <li class="wave row">
                <Medal emblem="thunder" tone="thunder" size={34} pips={tr.tier} />
                <span class="stack" style:--gap="0">
                  <b>{L.report.wave(i + 1)}</b>
                  <small class="t-small t-soft"
                    >{L.units[w.type]}{#if w.el}
                      · {L.trib.element(L.el[w.el])}{/if} · {L.army.might}
                    {num(waveMight(w.str, tr.tier, w.type))}</small
                  >
                </span>
              </li>
            {/each}
          </ul>
        </Section>
        {#if cloud}
          <Card tone="silk">
            <p class="t-small t-strong">
              <Icon name="bolt" size={16} />
              {L.trib.gathering(clock(Math.max(0, cloud.arriveAt - now)))}
            </p>
            {#if cloud.foil}<p class="t-small t-bad">{L.trib.foiled(cloud.foil)}</p>{/if}
          </Card>
        {:else}
          <Section title={L.trib.need}>
            <Bag res={cost('chuDien', tr.hall + 1)} have={game.res} />
            {@render store(cost('chuDien', tr.hall + 1))}
            {#if terr === 'cooldown'}<p class="t-small t-bad">{L.trib.wait(clock(game.tribCool - now))}</p>{/if}
            {#if tp}
              <Toggle checked={pill} onchange={v => (pill = v)}
                ><Icon name={tp} size={22} />{L.trib.pill(L.pills[tp].name, tp === 'phaCanh' ? PHA_CANH : DO_KIEP)} · {game
                  .items[tp]}</Toggle
              >
            {/if}
          </Section>
          <ArmyPick
            foe={tr.waves.reduce((s, w) => s + waveMight(w.str, tr.tier, w.type), 0)}
            chance={(e, a) => winChance(game, e, a, 'trib', pill && !!tp)}
            cta={L.trib.go}
            disabled={!!terr || busy}
            onsubmit={(e, a) => ontrib(e, a, pill && !!tp)}
            onrecruit={() => onselect('dienVoTruong', 'train')}
          />
        {/if}
      {:else if err === 'max_level'}
        <p class="mt-3 center t-gold t-strong">{L.panel.maxed}</p>
      {:else}
        <div class="rite">
          <div class="tiers">
            <figure>
              <Painting
                key="panel:{id}:{tierOf(Math.max(1, lv))}"
                make={() => building(id as Kind, Math.max(1, lv)).art}
                w={120}
                h={96}
              />
              <figcaption>{lv ? L.level(lv) : L.panel.notBuilt}</figcaption>
            </figure>
            <svg class="arrow" viewBox="0 0 60 24" aria-hidden="true"
              ><path d="M4 14 C 18 4, 30 22, 46 11" /><path d="M40 5 L 52 10 L 42 18" /></svg
            >
            <figure class="nx">
              <Painting key="panel:{id}:{tierOf(next)}" make={() => building(id as Kind, next).art} w={132} h={106} />
              <figcaption>{L.level(next)}</figcaption>
            </figure>
          </div>
          <div class="gains">{@render gains()}</div>
          {#if need || err === 'queue_full'}
            <div class="row wrap center-row">
              {#if need}
                <Tag icon={hall >= need ? 'check' : 'cross'} tone={hall >= need ? 'good' : 'bad'}
                  >{L.panel.hall(need)}</Tag
                >
                {#if hall < need}<Button variant="quiet" size="sm" onclick={() => onselect('chuDien')}
                    >{L.panel.goTo}</Button
                  >{/if}
              {/if}
              {#if err === 'queue_full'}<Tag icon="cross" tone="bad">{L.panel.busy}</Tag>{/if}
            </div>
          {/if}
          <!-- lễ vật trên án son: mỗi tài nguyên một món, số đủ / thiếu -->
          <div class="altar">
            {#each Object.entries(c) as [r, v] (r)}
              {@const have = game.res[r as keyof typeof game.res] ?? 0}
              <span class="gift" class:short={have < (v ?? 0)}>
                {#if artOf(`ui:res-${r}`)}<img src={artOf(`ui:res-${r}`)!.src} alt="" draggable="false" />{:else}<Icon
                    name={r as IconName}
                    size={40}
                  />{/if}
                <b class="t-num">{num(v ?? 0)}</b>
                <small class="t-num">{L.panel.have(num(have))}</small>
              </span>
            {/each}
          </div>
          {@render store(c)}
          <Refill cost={c} />
          <div class="go">
            <button class="seal" disabled={!!err} onclick={() => onupgrade(id)}>
              <span>{lv ? L.panel.upgrade : L.panel.build}</span>
            </button>
            <span class="when">
              <b class="t-num"><Icon name="clock" size={14} />{clock(buildTime(game, id, next))}</b>
              <small
                >{L.panel.doneAt(
                  new Date(now + buildTime(game, id, next)).toLocaleTimeString(LANG, {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                )}</small
              >
            </span>
          </div>
          {#if id === 'chuDien' && unlocked(next).length}<p class="center t-tiny t-soft">
              {unlocked(next)[0].text}
            </p>{/if}
        </div>
      {/if}
      {#if id === 'chuDien'}<DaoPick />{/if}
      {#if id === 'chuDien' && hall >= REBIRTH_HALL}
        <!-- Luân hồi -->
        <Section title={L.rebirth.title}>
          <p class="t-small t-lore">{L.rebirth.lore}</p>
          <div class="grid">
            <Card>
              <b class="t-small t-good">{L.rebirth.keep}</b>
              <ul class="stack t-small" style:--gap="2px">
                {#each L.rebirth.keepList as x (x)}<li>· {x}</li>{/each}
              </ul>
            </Card>
            <Card>
              <b class="t-small t-bad">{L.rebirth.lose}</b>
              <ul class="stack t-small" style:--gap="2px">
                {#each L.rebirth.loseList as x (x)}<li>· {x}</li>{/each}
              </ul>
            </Card>
          </div>
          <Tag icon="star" tone="gold">{L.rebirth.gain(game.rebirths + 1)}</Tag>
          {#if game.seat}
            <p class="t-small t-soft">{L.rebirth.season}</p>
          {:else}
            {#if game.marches.length}<p class="t-small t-bad">{L.rebirth.marching}</p>{/if}
            <Confirm warn={L.rebirth.confirm} label={L.rebirth.go} disabled={busy} onconfirm={onrebirth}>
              {#snippet trigger(ask)}
                <Button variant="gold" wide disabled={!!game.marches.length} onclick={ask}>{L.rebirth.go}</Button>
              {/snippet}
            </Confirm>
          {/if}
        </Section>
      {/if}
    {/if}
  {/if}
</Sheet>

<style>
  .art {
    display: grid;
    place-items: end center;
    width: 118px;
    height: 104px;
  }
  .to {
    color: var(--good);
  }
  /* đợt lôi kiếp: dải mực tím loang nhạt */
  .wave {
    padding: var(--sp-2) 12px;
    border: 0 solid transparent;
    border-image: var(--sk-card-plain);
    background: linear-gradient(90deg, rgb(138 115 207 / 0.18), transparent) padding-box;
  }

  /* ---------- Nghi lễ nâng cấp: hai tầng, lễ vật trên án son, nút ấn son ---------- */
  .rite {
    display: grid;
    justify-items: center;
    gap: var(--sp-3);
    margin-top: var(--sp-3);
  }
  .tiers {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 2px;
    width: 100%;
  }
  figure {
    display: grid;
    justify-items: center;
    gap: 4px;
    margin: 0;
  }
  figcaption {
    font-size: var(--fs-2);
    font-weight: 800;
    color: var(--text-soft);
  }
  .nx :global(img) {
    filter: drop-shadow(0 0 10px rgb(236 208 138 / 0.9)) drop-shadow(0 0 3px rgb(255 255 255 / 0.9));
  }
  .nx figcaption {
    color: var(--cinnabar);
  }
  .arrow {
    flex: none;
    width: 52px;
    margin-bottom: 44px;
    fill: none;
    stroke: var(--text);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .gains {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 18px;
  }
  .center-row {
    justify-content: center;
  }
  /* án son: mặt bàn sơn đỏ viền vàng, hai chân; lễ vật đứng trên mặt bàn */
  .altar {
    position: relative;
    display: flex;
    justify-content: center;
    gap: 18px;
    width: 100%;
    padding: 4px 20px 26px;
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
    gap: 0;
    min-width: 64px;
  }
  .gift img {
    width: 52px;
    height: 52px;
    filter: drop-shadow(0 3px 3px rgb(0 0 0 / 0.25));
  }
  .gift b {
    font-size: var(--fs-4);
    font-weight: 900;
  }
  .gift small {
    font-size: var(--fs-1);
    color: var(--text-faint);
  }
  .gift.short b {
    color: var(--cinnabar);
  }
  /* nút ấn son: tròn to, chữ trắng; giờ xong đặt cạnh */
  .go {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-3);
    margin-top: var(--sp-2);
  }
  .seal {
    display: grid;
    place-items: center;
    width: 104px;
    height: 104px;
    padding: 12px;
    font-size: var(--fs-4);
    font-weight: 900;
    line-height: 1.1;
    color: #fff;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.45);
    background: var(--ui-seal-img, radial-gradient(circle at 40% 35%, #e0604c, #a8352a 60%, #6e1f18)) center / 100% 100%
      no-repeat;
    border: 0;
    border-radius: 50%;
    filter: drop-shadow(0 6px 10px rgb(110 31 24 / 0.35));
    transition: transform var(--dur-1) var(--ease);
    cursor: pointer;
  }
  .seal:active {
    transform: scale(0.94) rotate(-4deg);
  }
  .seal:disabled {
    filter: grayscale(0.85) opacity(0.7);
    cursor: default;
  }
  .when {
    display: grid;
    gap: 2px;
    padding: 6px 12px;
    background: var(--paper2);
    border: 1px solid var(--paper3);
    border-radius: 8px;
  }
  .when b {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--fs-4);
  }
  .when small {
    font-size: var(--fs-1);
    color: var(--text-faint);
  }
</style>
