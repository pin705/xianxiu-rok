<script lang="ts">
  // Trang Môn hạ: trưởng lão (trụ cột "truyền thừa của riêng mình": hành, pháp bảo, thiên phú), đệ tử theo hệ × bậc, thương binh.
  import {
    ELDERS,
    ELDER_IDS,
    ELDER_MAX,
    GEAR,
    GEAR_IDS,
    TALENTS,
    TALENT_MAX,
    TIERS,
    TYPES,
    away,
    count,
    elderLevel,
    expAt,
    gearOf,
    hospital,
    talentPoints,
    talentUsed,
    tierOpen,
    type BuildingId,
    type ElderId,
    type UnitId,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Button, Card, Medal, Meter, Page, Section, Sheet, Tag } from './ui'
  import { EMBLEM, L, LOOK, clock, num, sfx } from './lib'
  import { useGame } from './game'

  let {
    onfocus,
  }: {
    onfocus: (id: BuildingId, view?: string | null) => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const act = g.act

  let open = $state<ElderId | null>(null)
  let picking = $state(false) // đang chọn pháp bảo cho trưởng lão đang mở
  const out = $derived(away(game))
  const hurt = $derived(count(game.wounded))
  const marchOf = (e: ElderId) => game.marches.find(m => m.elder === e)
  const expPart = (e: ElderId) => {
    const lv = elderLevel(game.elders[e])
    return lv >= ELDER_MAX ? 1 : ((game.elders[e] ?? 0) - expAt(lv)) / (expAt(lv + 1) - expAt(lv))
  }
  // bậc đã mở hoặc đang có quân (5 cột thì chật trên điện thoại)
  const tiers = $derived(
    TIERS.filter(t => t <= 3 || tierOpen(game, t) || TYPES.some(ty => game.troops[`${ty}${t}`] || out[`${ty}${t}`])),
  )
  const owned = $derived(GEAR_IDS.filter(g => game.gear[g]?.lv))
  const marching = (e: ElderId) => game.marches.some(m => m.elder === e)
</script>

<Page title={L.monHa.title} icon="monHa">
  <Section title={L.monHa.elders}>
    <ul class="grid">
      {#each ELDER_IDS as e (e)}
        {@const has = game.elders[e] !== undefined}
        {@const m = marchOf(e)}
        <li>
          <Card onclick={has ? () => (open = e) : undefined} disabled={!has} label={has ? L.elders[e].name : undefined}>
            <span class="row">
              <Portrait look={LOOK[e]} size={50} dim={!has} />
              <span class="grow stack" style:--gap="2px">
                <b class="t-small">{has ? L.elders[e].name : '???'}</b>
                {#if has}
                  <small class="t-tiny t-soft"
                    >{L.elders[e].title} · {L.units[ELDERS[e].type]} · {L.el[ELDERS[e].el]}</small
                  >
                  <span class="row" style:--gap="6px"
                    ><b class="t-tiny t-gold">{L.lv(elderLevel(game.elders[e]))}</b><span class="grow"
                      ><Meter value={expPart(e)} tone="gold" size="sm" /></span
                    ></span
                  >
                  <small class="t-tiny" class:t-bad={!!m} class:t-good={!m}
                    >{m ? `${L.monHa.out} · ${clock(m.returnAt - now)}` : L.monHa.home}</small
                  >
                {:else}
                  <small class="t-tiny t-soft row" style:--gap="3px"
                    ><Icon name="lock" size={11} />{L.unlockHint[e]}</small
                  >
                {/if}
              </span>
            </span>
          </Card>
        </li>
      {/each}
    </ul>
  </Section>

  <Section title="{L.monHa.disciples} · {num(count(game.troops) + count(out))}">
    <Card>
      <div class="table" style:--n={tiers.length}>
        <span></span>
        {#each tiers as t (t)}<span class="th t-tiny t-soft">{L.tiers[t]}</span>{/each}
        {#each TYPES as type (type)}
          <span class="row" style:--gap="6px"
            ><Medal emblem={EMBLEM.unit[type]} tone={type} size={28} /><span class="stack" style:--gap="0"
              ><b class="t-small">{L.units[type]}</b><small class="t-tiny t-soft">{L.beats(type)}</small></span
            ></span
          >
          {#each tiers as t (t)}
            {@const u = `${type}${t}` as UnitId}
            <span class="cell" class:zero={!game.troops[u] && !out[u]}>
              <b class="t-num">{num(game.troops[u])}</b>
              {#if out[u]}<small class="t-tiny t-bad row" style:--gap="2px"
                  ><Icon name="flag" size={10} />{num(out[u])}</small
                >{/if}
            </span>
          {/each}
        {/each}
      </div>
    </Card>
    <Button wide icon="people" onclick={() => onfocus('dienVoTruong', 'train')}>{L.army.recruit}</Button>
  </Section>

  <Section title="{L.monHa.wounded} · {num(hurt)}/{num(hospital(game))}">
    <Card>
      <div class="row between">
        {#if game.heal}
          <span class="row t-small"
            ><Icon name="heal" size={18} />{L.alchemy.healing(count(game.heal.troops))} ·
            <b class="t-num">{clock(game.heal.finishAt - now)}</b></span
          >
        {:else if hurt}
          <span class="row t-small"
            ><Icon name="heal" size={18} />{L.alchemy.wounded}: <b class="t-num">{num(hurt)}</b></span
          >
          <Button size="sm" onclick={() => onfocus('danPhong', 'alchemy')}>{L.monHa.heal}</Button>
        {:else}
          <span class="t-small t-lore">{L.alchemy.noWounded}</span>
        {/if}
      </div>
    </Card>
  </Section>
</Page>

<Sheet
  open={!!open}
  onclose={() => ((open = null), (picking = false))}
  title={open ? L.elders[open].name : ''}
  sub={open
    ? `${L.elders[open].title} · ${L.units[ELDERS[open].type]} · ${L.el[ELDERS[open].el]} (${L.overcomes(ELDERS[open].el)})`
    : ''}
  lore={open ? L.elders[open].lore : ''}
>
  {#snippet art()}{#if open}<Portrait look={LOOK[open]} size={84} />{/if}{/snippet}
  {#if open}
    {@const e = open}
    {@const d = ELDERS[e]}
    {@const lv = elderLevel(game.elders[e])}
    {@const exp = game.elders[e] ?? 0}
    <Section title="{L.lv(lv)} · {L.monHa.exp}">
      {#if lv < ELDER_MAX}
        <Meter value={expPart(e)} tone="gold" size="lg" />
        <p class="t-small t-soft">{num(exp - expAt(lv))}/{num(expAt(lv + 1) - expAt(lv))}</p>
      {:else}
        <p class="t-small t-gold">{L.monHa.maxLevel}</p>
      {/if}
      <Tag icon="power" tone="good"
        >{L.monHa.leads} +{Math.round((lv - 1) * 4)}% {L.stat.atk.toLowerCase()}, {L.stat.hp.toLowerCase()}</Tag
      >
    </Section>
    <Section title={L.monHa.skill}>
      <Card tone="glow">
        <span class="row"
          ><Icon name="bolt" size={22} /><span class="stack" style:--gap="1px"
            ><b>{L.elders[e].skill}</b><small class="t-small t-soft">{L.skillText(d.skill)}</small></span
          ></span
        >
      </Card>
    </Section>
    <Section title={L.monHa.passive}>
      {#each d.passives as p, i (i)}
        <Card>
          <span class="row" class:off={lv < p.at}>
            <Icon name={lv < p.at ? 'lock' : 'check'} size={18} />
            <span class="stack" style:--gap="1px"
              ><b class="t-small">{L.elders[e].passives[i]} · {L.monHa.passiveAt(p.at)}</b><small class="t-small t-soft"
                >{L.bonus(p.key, p.v)}</small
              ></span
            >
          </span>
        </Card>
      {/each}
    </Section>
    {@const g = gearOf(game, e)}
    {@const busy = marching(e)}
    <Section title={L.forge.slot}>
      <Card>
        <div class="row">
          {#if g}
            <Icon name={g} size={30} />
            <span class="grow stack" style:--gap="1px"
              ><b class="t-small">{L.gear[g]} · {L.lv(game.gear[g]!.lv)}</b><small class="t-small t-soft"
                >{L.bonus(GEAR[g].key, GEAR[g].v * game.gear[g]!.lv)}</small
              ></span
            >
            <Button
              variant="quiet"
              size="sm"
              disabled={busy}
              onclick={() => act({ type: 'equip', gear: g, elder: null })}>{L.forge.unequip}</Button
            >
          {:else}
            <span class="grow t-small t-soft">{owned.length ? L.forge.none : L.forge.empty}</span>
          {/if}
          {#if owned.some(x => x !== g)}<Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onclick={() => (picking = !picking)}>{L.forge.equip}</Button
            >{/if}
        </div>
      </Card>
      {#if picking && !busy}
        <p class="t-small t-strong t-gold">{L.forge.pick}</p>
        {#each owned.filter(x => x !== g) as x (x)}
          {@const on = game.gear[x]!.on}
          <Card
            onclick={on && marching(on)
              ? undefined
              : () => act({ type: 'equip', gear: x, elder: e }) && (sfx('reward'), (picking = false))}
            disabled={!!on && marching(on)}
            label={L.gear[x]}
          >
            <span class="row">
              <Icon name={x} size={26} />
              <span class="grow stack" style:--gap="0"
                ><b class="t-small">{L.gear[x]} · {L.lv(game.gear[x]!.lv)}</b><small class="t-tiny t-soft"
                  >{L.bonus(GEAR[x].key, GEAR[x].v * game.gear[x]!.lv)}</small
                ></span
              >
              {#if on}<small class="t-tiny t-soft">{L.forge.worn(L.elders[on].name)}</small>{/if}
            </span>
          </Card>
        {/each}
      {/if}
    </Section>
    {@const pts = talentPoints(game, e) - talentUsed(game, e)}
    {@const tal = game.talents[e] ?? [0, 0, 0]}
    <Section title={L.talent.title}>
      {#snippet aside()}{L.talent.points(pts)}{/snippet}
      <p class="t-small t-soft">{L.talent.hint}</p>
      {#each TALENTS as d, i (i)}
        <Card>
          <div class="row">
            <span class="grow stack" style:--gap="1px"
              ><b class="t-small">{L.talent.branch[i]} · {tal[i]}/{TALENT_MAX}</b><small class="t-small t-soft"
                >{L.bonus(d.key, d.v * Math.max(1, tal[i]))}</small
              ></span
            >
            <Button
              size="sm"
              disabled={!pts || tal[i] >= TALENT_MAX || busy}
              onclick={() => act({ type: 'talent', elder: e, branch: i as 0 | 1 | 2 }) && sfx('reward')}
              >{L.talent.add}</Button
            >
          </div>
        </Card>
      {/each}
      {#if game.items.taiTuy && talentUsed(game, e)}
        <Button
          variant="ghost"
          wide
          icon="taiTuy"
          disabled={busy}
          onclick={() => act({ type: 'wash', elder: e }) && sfx('reward')}>{L.talent.wash(game.items.taiTuy)}</Button
        >
      {/if}
    </Section>
    {#if game.items.boiNguyen && lv < ELDER_MAX}
      <div class="mt-4">
        <Button
          variant="gold"
          wide
          icon="boiNguyen"
          onclick={() => act({ type: 'feed', elder: e, n: 1 }) && sfx('reward')}
          >{L.monHa.feed(game.items.boiNguyen)}</Button
        >
      </div>
    {/if}
  {/if}
</Sheet>

<style>
  .table {
    display: grid;
    grid-template-columns: 1.7fr repeat(var(--n), 1fr);
    gap: var(--sp-2) 6px;
    align-items: center;
  }
  .th {
    text-align: center;
    font-weight: 700;
  }
  /* ô số: nền giấy nhạt, gạch chân mực vẽ tay */
  .cell {
    display: grid;
    justify-items: center;
    padding: 5px 0 8px;
    border: 0 solid transparent;
    border-image: var(--sk-field);
  }
  .zero b {
    color: var(--text-faint);
  }
  .off {
    opacity: 0.55;
  }
</style>
