<script lang="ts">
  // Bảng mục tiêu trên bản đồ: yêu thú, tông môn đối địch, bí cảnh. Xem địch, phần thưởng, chọn đội rồi xuất quân.
  import {
    BEASTS,
    BEATS,
    ELEMENTS,
    OVERCOMES,
    REALMS,
    SECTS,
    TOWER,
    TYPES,
    beastExp,
    beastLoot,
    coolKey,
    enemyOf,
    eventMul,
    isWeekend,
    marchSlots,
    marchTime,
    might,
    targetError,
    tierFor,
    towerReward,
    towerType,
    winChance,
    type Army,
    type ElderId,
    type Reward,
    type Target,
    type UnitType,
  } from '@rok/rules'
  import { Portrait } from '@rok/art'
  import ArmyPick from './Army.svelte'
  import { Bag, Card, Medal, Section, Sheet, Tag } from './ui'
  import { EMBLEM, L, LOOK, clock, num } from './lib'
  import { useGame } from './game'

  let {
    target,
    onclose,
    onmarch,
    onrecruit,
  }: {
    target: Target | null
    onclose: () => void
    onmarch: (t: Target, elder: ElderId, army: Army) => void
    onrecruit: () => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const busy = $derived(g.busy)

  // Hệ khắc được hệ chính của địch
  const counter = (t: UnitType) => TYPES.find(x => BEATS[x] === t)!
  // sự kiện cuối tuần: số hiển thị khớp số thật nhận (chiến lợi phẩm đánh lại, kinh nghiệm)
  const ev = $derived(eventMul(now))
  const weekendTag = $derived(isWeekend(now) ? ` · ${L.weekend.tag}` : '')
  const info = $derived.by(() => {
    const t = target
    if (!t) return null
    if (t.kind === 'beast') {
      const lv = t.i + 1
      return {
        emblem: EMBLEM.beast[t.i],
        sub: L.map.beast(lv),
        type: BEASTS[t.i].type,
        lore: '',
        reward: {
          res: { linhThach: beastLoot(lv) * ev, linhThao: beastLoot(lv) * ev, linhKhoang: beastLoot(lv) * ev },
          exp: beastExp(lv) * ev,
        } as Reward,
        rewardLabel: L.map.reward + weekendTag,
        tier: tierFor(lv),
      }
    }
    if (t.kind === 'sect') {
      const d = SECTS[t.i]
      const first = !game.sects[t.i]
      return {
        emblem: EMBLEM.sect[t.i],
        sub: `${L.map.sect} · ${L.panel.hall(d.hall)}`,
        type: d.type,
        lore: L.sects[t.i].lore,
        reward: first
          ? { ...d.first, exp: d.exp * ev }
          : { res: { linhThach: d.loot * ev, linhThao: d.loot * ev, linhKhoang: d.loot * ev }, exp: d.exp * ev },
        rewardLabel: first ? L.map.firstWin : L.map.repeat + weekendTag,
        tier: tierFor(d.hall),
        skill: d.elder,
      }
    }
    if (t.kind === 'tower') {
      const f = game.tower
      return {
        emblem: EMBLEM.tower[0],
        sub: `${L.tower.kind} · ${L.tower.floor(f + 1)}`,
        type: towerType(f),
        lore: `${L.tower.lore} ${L.tower.hint}`,
        reward: towerReward(f),
        rewardLabel: `${L.map.firstWin} · ${L.tower.best(f)}`,
        tier: 3 as const,
      }
    }
    const d = REALMS[t.i]
    const f = Math.min(game.realms[t.i], d.floors.length - 1)
    return {
      emblem: EMBLEM.realm[t.i],
      sub: `${L.map.realm} · ${L.map.floor(Math.min(game.realms[t.i] + 1, d.floors.length), d.floors.length)}`,
      type: d.type,
      lore: L.realms[t.i].lore,
      reward: d.floors[f].reward,
      rewardLabel: L.map.reward,
      tier: d.tier,
    }
  })
  const err = $derived(target ? targetError(game, target, now) : null)
  const foe = $derived(target && err !== 'max_level' ? enemyOf(game, target) : null)
  const need = $derived.by(() => {
    const t = target
    if (!t || err !== 'locked') return ''
    if (t.kind === 'beast') return L.map.lockedBeast(t.i)
    return L.panel.locked(t.kind === 'sect' ? SECTS[t.i].hall : t.kind === 'tower' ? TOWER.hall : REALMS[t.i].hall)
  })
</script>

<Sheet open={!!target} {onclose} title={target ? L.target(target) : ''} sub={info?.sub} lore={info?.lore || undefined}>
  {#snippet art()}
    {#if target && info}<Medal emblem={info.emblem} tone={target.kind} size={62} />{/if}
  {/snippet}
  {#if target && info}
    {#if foe}
      <Section title={L.map.enemy}>
        <ul class="row wrap">
          {#each foe.troops as t, i (i)}
            <li class="row" style:--gap="5px">
              <Medal emblem={EMBLEM.unit[t.type]} tone={t.type} size={30} pips={t.tier} /><span class="t-small t-strong"
                >~{num(t.n)} {L.units[t.type]}</span
              >
            </li>
          {/each}
        </ul>
        {#if info.skill}
          <Tag icon="bolt" tone="bad">{L.lv(info.skill.level)} · {L.skillText(info.skill.skill)}</Tag>
        {/if}
        {@const c = counter(info.type)}
        <Tag icon="swords" tone="good"
          >{L.map.counter} {L.units[c]} ({L.beats(c).replace(/^\p{Lu}/u, ch => ch.toLowerCase())})</Tag
        >
        {#if foe.el}
          {@const el = foe.el}
          <Tag icon="star" tone="gold"
            >{L.trib.element(L.el[el])} · {L.map.counter} {L.el[ELEMENTS.find(x => OVERCOMES[x] === el)!]}</Tag
          >
        {/if}
      </Section>
    {/if}

    <Section title={info.rewardLabel}>
      <Bag res={info.reward.res} items={info.reward.items} exp={info.reward.exp} named />
      {#if info.reward.elder && game.elders[info.reward.elder] === undefined}
        <Card tone="glow">
          <span class="row"
            ><Portrait look={LOOK[info.reward.elder]} size={34} /><span class="t-small t-strong"
              >{L.report.newElder}: {L.elders[info.reward.elder].name}</span
            ></span
          >
        </Card>
      {/if}
    </Section>

    <div class="mt-3">
      {#if err === 'locked'}
        <Tag icon="lock" tone="bad">{need}</Tag>
      {:else if err === 'max_level'}
        <Tag icon="check" tone="good">{L.map.cleared}</Tag>
      {:else if err === 'cooldown'}
        <Tag icon="clock">{L.map.respawn(clock((game.cool[coolKey(target)] ?? 0) - now))}</Tag>
      {:else if err === 'busy'}
        <Tag icon="flag">{L.map.heading}</Tag>
      {:else if foe}
        {@const realm = target.kind === 'realm' || target.kind === 'tower'}
        {@const full = !realm && game.marches.length >= marchSlots(game)}
        {#if full}<Tag icon="flag" tone="bad">{L.map.slotsFull}</Tag>{/if}
        <ArmyPick
          foe={might(foe)}
          chance={(e, a) => winChance(game, e, a, target!)}
          cta={realm ? L.map.enter : L.map.go}
          time={realm ? undefined : clock(marchTime(game, target))}
          disabled={full || busy}
          onsubmit={(e, a) => onmarch(target!, e, a)}
          {onrecruit}
        />
      {/if}
    </div>
  {/if}
</Sheet>
