<script lang="ts">
  // Bảng công trình: mở khi chạm vào công trình trên núi. Công trình có chức năng thì thêm thẻ (tuyển, luyện đan, công pháp).
  // Chủ điện ở tầng 5, 10, 15, 20: thay nâng cấp bằng độ kiếp. Từ tầng 15: luân hồi.
  import {
    BUILDINGS, DO_KIEP, MAX_LEVEL, PHA_CANH, REBIRTH_HALL, TECH_ROWS, TRIBS, batch, buildTime, capAt, cost, gearCap, hospital, marchSlots, might, mob, rate,
    storage, storeNeed, tribError, tribPill, upgradeError, winChance,
    type Action, type Army, type BuildingId, type ElderId, type State, type Tier, type UnitType,
  } from '@rok/rules'
  import { Icon, building, tierOf, type Kind } from '@rok/art'
  import { Bag, Button, Card, Medal, Painting, Section, Sheet, Stat, Tabs, Tag, Toggle } from './ui'
  import Alchemy from './Alchemy.svelte'
  import ArmyPick from './Army.svelte'
  import Forge from './Forge.svelte'
  import JobRow from './JobRow.svelte'
  import Library from './Library.svelte'
  import Train from './Train.svelte'
  import Trade from './Trade.svelte'
  import { L, clock, num } from './lib'

  let {
    game,
    now,
    id,
    view,
    act,
    busy = false,
    onupgrade,
    onclose,
    onselect,
    ontrib,
    onrebirth,
  }: {
    game: State
    now: number
    id: BuildingId | null
    view: string | null
    act: (a: Action) => State | null
    busy?: boolean // đang chờ server (độ kiếp, luân hồi)
    onupgrade: (id: BuildingId) => void
    onclose: () => void
    onselect: (id: BuildingId, view?: string | null) => void
    ontrib: (elder: ElderId, army: Army, pill: boolean) => void
    onrebirth: () => void
  } = $props()

  const FN: Partial<Record<BuildingId, [string, string]>> = {
    dienVoTruong: ['train', L.train.tab],
    danPhong: ['alchemy', L.b.danPhong.name],
    tangKinhCac: ['library', L.library.tab],
    tangBaoCac: ['trade', L.trade.tab],
    luyenKhiPhong: ['forge', L.forge.tab],
  }
  // Thẻ người chơi đã chọn, nhớ theo công trình: mở công trình khác thì về thẻ mặc định
  let picked = $state<{ id: BuildingId | null; tab: string } | null>(null)
  const fn = $derived(id && game.levels[id] > 0 ? FN[id] : undefined)
  const tab = $derived(picked?.id === id ? picked.tab : fn ? (view ?? fn[0]) : 'upgrade')
  let pill = $state(true)
  let sure = $state(false)
  const waveMight = (str: number, tier: Tier, type: UnitType) => might(mob(str, tier, [[type, 1]]))
  const withLevel = (b: BuildingId, lv: number) => ({ ...game, levels: { ...game.levels, [b]: lv } })
</script>

<!-- chi phí vượt sức chứa kho: nói thẳng và chỉ đường, không để người chơi chờ mãi -->
{#snippet store(c: Parameters<typeof storeNeed>[1])}
  {@const n = storeNeed(game, c)}
  {#if n && id !== 'tangBaoCac'}
    <p class="t-small t-bad mt-2">{L.panel.store(num(storage(game)), n)}</p>
    <Button variant="quiet" size="sm" onclick={() => onselect('tangBaoCac', 'upgrade')}>{L.panel.goTo}: {L.b.tangBaoCac.name}</Button>
  {/if}
{/snippet}

<Sheet open={!!id} {onclose} title={id ? L.b[id].name : ''} sub={id ? (game.levels[id] ? L.level(game.levels[id]) : L.panel.notBuilt) : ''} lore={id ? L.b[id].lore : ''}>
  {#snippet art()}
    {#if id}
      {@const lv = Math.max(1, game.levels[id])}
      <span class="art"><Painting key="panel:{id}:{tierOf(lv)}" make={() => building(id as Kind, lv).art} w={118} h={104} /></span>
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

    {#if fn}
      <Tabs
        items={[{ id: fn[0], label: fn[1] }, { id: 'upgrade', label: L.panel.upgrade }]}
        value={tab}
        onchange={t => (picked = { id, tab: t })}
      />
    {/if}

    {#if tab === 'train'}
      <Train {game} {now} {act} />
    {:else if tab === 'alchemy'}
      <Alchemy {game} {now} {act} />
    {:else if tab === 'library'}
      <Library {game} {now} {act} />
    {:else if tab === 'trade'}
      <Trade {game} {act} />
    {:else if tab === 'forge'}
      <Forge {game} {now} {act} />
    {:else if locked}
      <div class="stack mt-3">
        <Tag icon="lock" tone="bad">{L.panel.locked(d.unlock)}</Tag>
        <Button variant="gold" wide onclick={() => onselect('chuDien')}>{L.panel.goTo}: {L.b.chuDien.name}</Button>
      </div>
    {:else}
      <Card>
        {#if d.makes}
          <Stat label={L.panel.output} tone="good">
            <Icon name={d.makes} size={16} />{num(rate(game, d.makes))}{#if lv < MAX_LEVEL}<span class="to">→ {num(rate(withLevel(id, next), d.makes))}</span>{/if}<small class="t-soft">{L.panel.perHour}</small>
          </Stat>
        {:else if id === 'tangBaoCac'}
          <Stat label={L.panel.capacity}>{num(capAt(lv))}{#if lv < MAX_LEVEL}<span class="to">→ {num(capAt(next))}</span>{/if}</Stat>
        {:else if id === 'dienVoTruong'}
          <Stat label={L.panel.batch}>{num(batch(game))}{#if lv < MAX_LEVEL}<span class="to">→ {num(batch(withLevel(id, next)))}</span>{/if}</Stat>
        {:else if id === 'danPhong'}
          <Stat label={L.panel.hospital}>{num(hospital(game))}{#if lv < MAX_LEVEL}<span class="to">→ {num(hospital(withLevel(id, next)))}</span>{/if}</Stat>
        {:else if id === 'tangKinhCac'}
          <Stat label={L.panel.rows}>{TECH_ROWS.filter(r => r <= lv).length}/{TECH_ROWS.length}</Stat>
        {:else if id === 'chuDien'}
          <Stat label={L.panel.slots}>{marchSlots(game)}</Stat>
        {:else if id === 'luyenKhiPhong'}
          <Stat label={L.panel.gearCap}>{gearCap(game)}{#if lv < MAX_LEVEL}<span class="to">→ {gearCap(withLevel(id, next))}</span>{/if}</Stat>
        {/if}
        {#if lv < MAX_LEVEL}
          <Stat label={L.power} tone="good"><Icon name="power" size={14} />+{num(d.power * next)}</Stat>
        {/if}
      </Card>

      {#if job}
        <div class="mt-3"><JobRow {game} {now} kind="build" label={L.panel.upgrading(job.level)} {act} /></div>
      {:else if err === 'trib' && tr}
        <!-- Độ kiếp -->
        {@const terr = tribError(game)}
        {@const tp = tribPill(game, true)}
        <Section title={L.trib.title}>
          <p class="t-small t-lore">{L.trib.lore(L.realmName(tr.hall + 1))}</p>
          <ul class="stack">
            {#each tr.waves as w, i (i)}
              <li class="wave row">
                <Medal emblem="thunder" tone="thunder" size={34} pips={tr.tier} />
                <span class="stack" style:--gap="0">
                  <b>{L.report.wave(i + 1)}</b>
                  <small class="t-small t-soft">{L.units[w.type]}{#if w.el} · {L.trib.element(L.el[w.el])}{/if} · {L.army.might} {num(waveMight(w.str, tr.tier, w.type))}</small>
                </span>
              </li>
            {/each}
          </ul>
        </Section>
        <Section title={L.trib.need}>
          <Bag res={cost('chuDien', tr.hall + 1)} have={game.res} />
          {@render store(cost('chuDien', tr.hall + 1))}
          {#if terr === 'cooldown'}<p class="t-small t-bad">{L.trib.wait(clock(game.tribCool - now))}</p>{/if}
          {#if tp}
            <Toggle checked={pill} onchange={v => (pill = v)}><Icon name={tp} size={22} />{L.trib.pill(L.pills[tp].name, tp === 'phaCanh' ? PHA_CANH : DO_KIEP)} · {game.items[tp]}</Toggle>
          {/if}
        </Section>
        <ArmyPick
          {game}
          foe={tr.waves.reduce((s, w) => s + waveMight(w.str, tr.tier, w.type), 0)}
          chance={(e, a) => winChance(game, e, a, 'trib', pill && !!tp)}
          cta={L.trib.go}
          disabled={!!terr || busy}
          onsubmit={(e, a) => ontrib(e, a, pill && !!tp)}
          onrecruit={() => onselect('dienVoTruong', 'train')}
        />
      {:else if err === 'max_level'}
        <p class="mt-3 center t-gold t-strong">{L.panel.maxed}</p>
      {:else}
        <Section title={L.panel.requires}>
          {#if need || err === 'queue_full'}
            <div class="row wrap">
              {#if need}
                <Tag icon={hall >= need ? 'check' : 'cross'} tone={hall >= need ? 'good' : 'bad'}>{L.panel.hall(need)}</Tag>
                {#if hall < need}<Button variant="quiet" size="sm" onclick={() => onselect('chuDien')}>{L.panel.goTo}</Button>{/if}
              {/if}
              {#if err === 'queue_full'}<Tag icon="cross" tone="bad">{L.panel.busy}</Tag>{/if}
            </div>
          {/if}
          <Bag res={c} have={game.res} />
          {@render store(c)}
        </Section>
        <div class="mt-4">
          <Button wide size="lg" icon="hammer" trail={clock(buildTime(game, id, next))} trailIcon="clock" disabled={!!err} onclick={() => onupgrade(id)}>
            {lv ? L.panel.upgrade : L.panel.build}
          </Button>
        </div>
      {/if}
      {#if id === 'chuDien' && hall >= REBIRTH_HALL}
        <!-- Luân hồi -->
        <Section title={L.rebirth.title}>
          <p class="t-small t-lore">{L.rebirth.lore}</p>
          <div class="grid">
            <Card>
              <b class="t-small t-good">{L.rebirth.keep}</b>
              <ul class="stack t-small" style:--gap="2px">{#each L.rebirth.keepList as x (x)}<li>· {x}</li>{/each}</ul>
            </Card>
            <Card>
              <b class="t-small t-bad">{L.rebirth.lose}</b>
              <ul class="stack t-small" style:--gap="2px">{#each L.rebirth.loseList as x (x)}<li>· {x}</li>{/each}</ul>
            </Card>
          </div>
          <Tag icon="star" tone="gold">{L.rebirth.gain(game.rebirths + 1)}</Tag>
          {#if game.marches.length}<p class="t-small t-bad">{L.rebirth.marching}</p>{/if}
          {#if sure}
            <p class="t-small t-bad t-strong">{L.rebirth.confirm}</p>
            <div class="grid">
              <Button variant="ghost" onclick={() => (sure = false)}>{L.panel.close}</Button>
              <Button variant="danger" disabled={busy} onclick={() => ((sure = false), onrebirth())}>{L.rebirth.go}</Button>
            </div>
          {:else}
            <Button variant="gold" wide disabled={!!game.marches.length} onclick={() => (sure = true)}>{L.rebirth.go}</Button>
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
</style>
