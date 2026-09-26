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
  import { Icon, building, tierOf, type IconName, type Kind } from '@rok/art'
  import {
    Altar,
    Ascend,
    Bag,
    Button,
    Card,
    Confirm,
    Medal,
    Painting,
    Seal,
    Section,
    Sheet,
    Stat,
    Tabs,
    Tag,
    Timer,
    Toggle,
  } from './ui'
  import FirstLook from './FirstLook.svelte'
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
      <Painting key="panel:{id}:{tierOf(lv)}" make={() => building(id as Kind, lv).art} w={118} h={104} />
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
            <Icon name={d.makes} size={16} />{num(rate(game, d.makes))}{#if lv < MAX_LEVEL}<span class="t-good"
                >→ {num(rate(withLevel(id, next), d.makes))}</span
              >{/if}<small class="t-soft">{L.panel.perHour}</small>
          </Stat>
        {:else if id === 'tangBaoCac'}
          <Stat label={L.panel.capacity}
            >{num(capAt(lv))}{#if lv < MAX_LEVEL}<span class="t-good">→ {num(capAt(next))}</span>{/if}</Stat
          >
        {:else if id === 'dienVoTruong'}
          <Stat label={L.panel.batch}
            >{num(batch(game))}{#if lv < MAX_LEVEL}<span class="t-good">→ {num(batch(withLevel(id, next)))}</span
              >{/if}</Stat
          >
        {:else if id === 'danPhong'}
          <Stat label={L.panel.hospital}
            >{num(hospital(game))}{#if lv < MAX_LEVEL}<span class="t-good">→ {num(hospital(withLevel(id, next)))}</span
              >{/if}</Stat
          >
        {:else if id === 'tangKinhCac'}
          <Stat label={L.panel.rows}>{TECH_ROWS.filter(r => r <= lv).length}/{TECH_ROWS.length}</Stat>
        {:else if id === 'chuDien'}
          <Stat label={L.panel.slots}>{marchSlots(game)}</Stat>
        {:else if id === 'hoSonDaiTran'}
          <Stat label={L.pvp.wall(lv)}
            >+{Math.round(GUARD_STEP * lv * 100)}%{#if lv < MAX_LEVEL}<span class="t-good"
                >→ +{Math.round(GUARD_STEP * next * 100)}%</span
              >{/if}</Stat
          >
        {:else if id === 'luyenKhiPhong'}
          <Stat label={L.panel.gearCap}
            >{gearCap(game)}{#if lv < MAX_LEVEL}<span class="t-good">→ {gearCap(withLevel(id, next))}</span>{/if}</Stat
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
          <FirstLook id="trib" />
          {#snippet aside()}<Help k={4} />{/snippet}
          <p class="t-small t-lore">{L.trib.lore(L.realmName(tr.hall + 1))}</p>
          {#if game.seat}<p class="t-small t-soft">
              {L.trib.public(clock(TRIB_CLOUD[game.trib]), HO_PHAP, PHA_KIEP)}
            </p>{/if}
          <ul class="stack">
            {#each tr.waves as w, i (i)}
              <li class="wash row">
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
        <div class="stack middle mt-3" style:--gap="var(--sp-3)">
          <Ascend glow fromLabel={lv ? L.level(lv) : L.panel.notBuilt} toLabel={L.level(next)}>
            {#snippet from()}
              <Painting
                key="panel:{id}:{tierOf(Math.max(1, lv))}"
                make={() => building(id as Kind, Math.max(1, lv)).art}
                w={120}
                h={96}
              />
            {/snippet}
            {#snippet to()}
              <Painting key="panel:{id}:{tierOf(next)}" make={() => building(id as Kind, next).art} w={132} h={106} />
            {/snippet}
          </Ascend>
          <div class="row wrap justify-center" style:--gap="6px 18px">{@render gains()}</div>
          {#if need || err === 'queue_full'}
            <div class="row wrap justify-center">
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
          <Altar
            items={Object.entries(c).map(([r, v]) => {
              const have = game.res[r as keyof typeof game.res] ?? 0
              return {
                key: r,
                art: `res-${r}`,
                icon: r as IconName,
                n: num(v ?? 0),
                sub: L.panel.have(num(have)),
                short: have < (v ?? 0),
              }
            })}
          />
          {@render store(c)}
          <Refill cost={c} />
          <div class="row justify-center mt-2" style:--gap="var(--sp-3)">
            <Seal disabled={!!err} onclick={() => onupgrade(id)}>{lv ? L.panel.upgrade : L.panel.build}</Seal>
            <Timer
              time={clock(buildTime(game, id, next))}
              sub={L.panel.doneAt(
                new Date(now + buildTime(game, id, next)).toLocaleTimeString(LANG, {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              )}
            />
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
