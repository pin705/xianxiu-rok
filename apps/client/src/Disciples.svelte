<script lang="ts">
  // Trang Môn hạ: trưởng lão (trụ cột "truyền thừa của riêng mình"), đệ tử theo hệ × bậc, thương binh.
  import {
    ELDERS, ELDER_IDS, ELDER_MAX, TIERS, TYPES, away, count, elderLevel, expAt, hospital,
    type Action, type BuildingId, type ElderId, type State, type UnitId,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Button, Card, Medal, Meter, Page, Section, Sheet, Tag } from './ui'
  import { EMBLEM, L, LOOK, clock, num, sfx } from './lib'

  let { game, now, act, onfocus }: { game: State; now: number; act: (a: Action) => State | null; onfocus: (id: BuildingId, view?: string | null) => void } =
    $props()

  let open = $state<ElderId | null>(null)
  const out = $derived(away(game))
  const hurt = $derived(count(game.wounded))
  const marchOf = (e: ElderId) => game.marches.find(m => m.elder === e)
  const expPart = (e: ElderId) => {
    const lv = elderLevel(game.elders[e])
    return lv >= ELDER_MAX ? 1 : ((game.elders[e] ?? 0) - expAt(lv)) / (expAt(lv + 1) - expAt(lv))
  }
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
                  <small class="t-tiny t-soft">{L.elders[e].title} · {L.units[ELDERS[e].type]}</small>
                  <span class="row" style:--gap="6px"><b class="t-tiny t-gold">{L.lv(elderLevel(game.elders[e]))}</b><span class="grow"><Meter value={expPart(e)} tone="gold" size="sm" /></span></span>
                  <small class="t-tiny" class:t-bad={!!m} class:t-good={!m}>{m ? `${L.monHa.out} · ${clock(m.returnAt - now)}` : L.monHa.home}</small>
                {:else}
                  <small class="t-tiny t-soft row" style:--gap="3px"><Icon name="lock" size={11} />{L.unlockHint[e]}</small>
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
      <div class="table">
        <span></span>
        {#each TIERS as t (t)}<span class="th t-tiny t-soft">{L.tiers[t]}</span>{/each}
        {#each TYPES as type (type)}
          <span class="row" style:--gap="6px"><Medal emblem={EMBLEM.unit[type]} tone={type} size={28} /><span class="stack" style:--gap="0"><b class="t-small">{L.units[type]}</b><small class="t-tiny t-soft">{L.beats(type)}</small></span></span>
          {#each TIERS as t (t)}
            {@const u = `${type}${t}` as UnitId}
            <span class="cell" class:zero={!game.troops[u] && !out[u]}>
              <b class="t-num">{num(game.troops[u])}</b>
              {#if out[u]}<small class="t-tiny t-bad row" style:--gap="2px"><Icon name="flag" size={10} />{num(out[u])}</small>{/if}
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
          <span class="row t-small"><Icon name="heal" size={18} />{L.alchemy.healing(count(game.heal.troops))} · <b class="t-num">{clock(game.heal.finishAt - now)}</b></span>
        {:else if hurt}
          <span class="row t-small"><Icon name="heal" size={18} />{L.alchemy.wounded}: <b class="t-num">{num(hurt)}</b></span>
          <Button size="sm" onclick={() => onfocus('danPhong', 'alchemy')}>{L.monHa.heal}</Button>
        {:else}
          <span class="t-small t-lore">{L.alchemy.noWounded}</span>
        {/if}
      </div>
    </Card>
  </Section>
</Page>

<Sheet open={!!open} onclose={() => (open = null)} title={open ? L.elders[open].name : ''} sub={open ? `${L.elders[open].title} · ${L.units[ELDERS[open].type]}` : ''} lore={open ? L.elders[open].lore : ''}>
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
      <Tag icon="power" tone="good">{L.monHa.leads} +{Math.round((lv - 1) * 4)}% {L.stat.atk.toLowerCase()}, {L.stat.hp.toLowerCase()}</Tag>
    </Section>
    <Section title={L.monHa.skill}>
      <Card tone="glow">
        <span class="row"><Icon name="bolt" size={22} /><span class="stack" style:--gap="1px"><b>{L.elders[e].skill}</b><small class="t-small t-soft">{L.skillText(d.skill)}</small></span></span>
      </Card>
    </Section>
    <Section title={L.monHa.passive}>
      {#each d.passives as p, i (i)}
        <Card>
          <span class="row" class:off={lv < p.at}>
            <Icon name={lv < p.at ? 'lock' : 'check'} size={18} />
            <span class="stack" style:--gap="1px"><b class="t-small">{L.elders[e].passives[i]} · {L.monHa.passiveAt(p.at)}</b><small class="t-small t-soft">{L.bonus(p.key, p.v)}</small></span>
          </span>
        </Card>
      {/each}
    </Section>
    {#if game.items.boiNguyen && lv < ELDER_MAX}
      <div class="mt-4">
        <Button variant="gold" wide icon="boiNguyen" onclick={() => act({ type: 'feed', elder: e, n: 1 }) && sfx('reward')}>{L.monHa.feed(game.items.boiNguyen)}</Button>
      </div>
    {/if}
  {/if}
</Sheet>

<style>
  .table {
    display: grid;
    grid-template-columns: 1.7fr repeat(3, 1fr);
    gap: var(--sp-2) 6px;
    align-items: center;
  }
  .th {
    text-align: center;
    font-weight: 700;
  }
  .cell {
    display: grid;
    justify-items: center;
    padding: 5px 0;
    background: color-mix(in srgb, var(--paper2) 70%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 15%, transparent);
  }
  .zero b {
    color: var(--text-faint);
  }
  .off {
    opacity: 0.55;
  }
</style>
