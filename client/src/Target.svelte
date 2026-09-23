<script lang="ts">
  // Bảng mục tiêu trên bản đồ: yêu thú, tông môn đối địch, bí cảnh. Xem địch, phần thưởng, chọn đội rồi xuất quân.
  import {
    BEASTS, BEATS, PILL_IDS, REALMS, RESOURCES, SECTS, TYPES, beastExp, beastLoot, coolKey, enemyOf, marchSlots, marchTime,
    might, targetError, tierFor,
    type Army, type ElderId, type Reward, type State, type Target, type UnitType,
  } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import ArmyPick from './Army.svelte'
  import Sheet from './Sheet.svelte'
  import Unit from './Unit.svelte'
  import { GLYPH, L, LOOK, clock, num } from './lib'

  let {
    game,
    now,
    target,
    onclose,
    onmarch,
    onrecruit,
  }: {
    game: State
    now: number
    target: Target | null
    onclose: () => void
    onmarch: (t: Target, elder: ElderId, army: Army) => void
    onrecruit: () => void
  } = $props()

  // Hệ khắc được hệ chính của địch
  const counter = (t: UnitType) => TYPES.find(x => BEATS[x] === t)!
  const info = $derived.by(() => {
    const t = target
    if (!t) return null
    if (t.kind === 'beast') {
      const lv = t.i + 1
      return {
        glyph: GLYPH.beast[t.i], sub: L.map.beast(lv), type: BEASTS[t.i].type, lore: '',
        reward: { res: { linhThach: beastLoot(lv), linhThao: beastLoot(lv), linhKhoang: beastLoot(lv) }, exp: beastExp(lv) } as Reward,
        rewardLabel: L.map.reward, tier: tierFor(lv),
      }
    }
    if (t.kind === 'sect') {
      const d = SECTS[t.i]
      const first = !game.sects[t.i]
      return {
        glyph: GLYPH.sect[t.i], sub: `${L.map.sect} · ${L.panel.hall(d.hall)}`, type: d.type, lore: L.sects[t.i].lore,
        reward: first ? { ...d.first, exp: d.exp } : { res: { linhThach: d.loot, linhThao: d.loot, linhKhoang: d.loot }, exp: d.exp },
        rewardLabel: first ? L.map.firstWin : L.map.repeat, tier: tierFor(d.hall), skill: d.elder,
      }
    }
    const d = REALMS[t.i]
    const f = Math.min(game.realms[t.i], d.floors.length - 1)
    return {
      glyph: GLYPH.realm[t.i], sub: `${L.map.realm} · ${L.map.floor(Math.min(game.realms[t.i] + 1, d.floors.length), d.floors.length)}`,
      type: d.type, lore: L.realms[t.i].lore, reward: d.floors[f].reward, rewardLabel: L.map.reward, tier: d.tier,
    }
  })
  const err = $derived(target ? targetError(game, target, now) : null)
  const foe = $derived(target && err !== 'max_level' ? enemyOf(game, target) : null)
  const need = $derived.by(() => {
    const t = target
    if (!t || err !== 'locked') return ''
    if (t.kind === 'beast') return L.map.lockedBeast(t.i)
    return L.panel.locked(t.kind === 'sect' ? SECTS[t.i].hall : REALMS[t.i].hall)
  })
</script>

<Sheet open={!!target} {onclose} label={target ? L.target(target) : ''}>
  {#if target && info}
    <div class="head">
      <span class="medal {target.kind}"><span class="han">{info.glyph}</span></span>
      <div>
        <h2>{L.target(target)}</h2>
        <p class="sub">{info.sub}</p>
      </div>
      <button class="sheet-x" onclick={onclose} aria-label={L.panel.close}><Icon name="close" size={18} /></button>
    </div>
    {#if info.lore}<p class="lore">{info.lore}</p>{/if}

    {#if foe}
      <h3>{L.map.enemy}</h3>
      <ul class="foe">
        {#each foe.troops as t, i (i)}
          <li><Unit type={t.type} tier={t.tier} size={30} /><span>~{num(t.n)} {L.units[t.type]}</span></li>
        {/each}
      </ul>
      {#if info.skill}
        <p class="skill"><Icon name="bolt" size={14} />{L.lv(info.skill.level)} · {L.skillText(info.skill.skill)}</p>
      {/if}
      {@const c = counter(info.type)}
      <p class="hint"><Icon name="swords" size={14} />{L.map.counter} <b>{L.units[c]}</b> ({L.beats(c).replace('Khắc', 'khắc')})</p>
    {/if}

    <h3>{info.rewardLabel}</h3>
    <ul class="reward">
      {#each RESOURCES as r (r)}
        {#if info.reward.res?.[r]}<li><Icon name={r} size={18} />{num(info.reward.res[r] ?? 0)}</li>{/if}
      {/each}
      {#each PILL_IDS as p (p)}
        {#if info.reward.items?.[p]}<li><Icon name={p} size={18} />{L.pills[p].name} ×{info.reward.items[p]}</li>{/if}
      {/each}
      {#if info.reward.exp}<li><Icon name="star" size={16} />{L.map.exp(info.reward.exp)}</li>{/if}
      {#if info.reward.elder && game.elders[info.reward.elder] === undefined}
        <li class="elder"><Portrait look={LOOK[info.reward.elder]} size={28} />{L.report.newElder}: {L.elders[info.reward.elder].name}</li>
      {/if}
    </ul>

    {#if err === 'locked'}
      <p class="state bad"><Icon name="lock" size={16} />{need}</p>
    {:else if err === 'max_level'}
      <p class="state good"><Icon name="check" size={16} />{L.map.cleared}</p>
    {:else if err === 'cooldown'}
      <p class="state"><Icon name="clock" size={16} />{L.map.respawn(clock((game.cool[coolKey(target)] ?? 0) - now))}</p>
    {:else if err === 'busy'}
      <p class="state"><Icon name="flag" size={16} />{L.map.heading}</p>
    {:else if foe}
      {@const realm = target.kind === 'realm'}
      {@const full = !realm && game.marches.length >= marchSlots(game)}
      {#if full}<p class="state bad"><Icon name="flag" size={16} />{L.map.slotsFull}</p>{/if}
      <ArmyPick
        {game}
        foe={might(foe)}
        cta={realm ? L.map.enter : L.map.go}
        time={realm ? undefined : clock(marchTime(game, target))}
        disabled={full}
        onsubmit={(e, a) => onmarch(target!, e, a)}
        {onrecruit}
      />
    {/if}
  {/if}
</Sheet>

<style>
  .head {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 0 -16px;
    padding: 18px 48px 14px 16px;
    color: var(--ink);
    background: linear-gradient(135deg, #e9dfc6, #f6f0e0 60%, #e4d6b6);
    border-radius: 18px 18px 0 0;
  }
  .medal {
    display: grid;
    flex: none;
    place-items: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 3px var(--gold-l), 0 3px 8px rgb(0 0 0 / 0.3);
  }
  .medal .han {
    font-size: 34px;
    color: #fff8e6;
  }
  .beast {
    background: radial-gradient(circle at 50% 35%, #8a6a3a, #3b2a14);
  }
  .sect {
    background: radial-gradient(circle at 50% 35%, #b8412c, #561a0e);
  }
  .realm {
    background: radial-gradient(circle at 50% 35%, #3f9aa0, #123f4a);
  }
  h2 {
    font-size: 20px;
    line-height: 1.2;
  }
  .sub {
    margin-top: 2px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--azurite);
  }
  .lore {
    margin-top: 12px;
    font-size: 13px;
    line-height: 1.5;
    color: #c9d4d7;
  }
  .foe,
  .reward {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0;
    list-style: none;
  }
  .foe li,
  .reward li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 4px;
    font-size: 13px;
    background: rgb(255 255 255 / 0.06);
    border-radius: 999px;
  }
  .reward li {
    padding: 6px 10px;
  }
  .reward .elder {
    padding: 3px 10px 3px 3px;
    color: var(--gold-l);
    background: rgb(201 161 74 / 0.18);
  }
  .skill,
  .hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 12.5px;
    color: #c9d4d7;
  }
  .hint b {
    color: var(--gold-l);
  }
  .state {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    font-size: 14px;
    background: rgb(255 255 255 / 0.06);
    border-radius: 12px;
  }
  .state.bad {
    color: #ffb4a4;
  }
  .state.good {
    color: #9be3a5;
  }
</style>
