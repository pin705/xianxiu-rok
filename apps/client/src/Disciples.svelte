<script lang="ts">
  // Trang Môn hạ: trưởng lão (trụ cột "truyền thừa của riêng mình": hành, pháp bảo, thiên phú), đệ tử theo hệ × bậc, thương binh.
  import {
    ELDERS,
    RARITY,
    ELDER_IDS,
    ELDER_MAX,
    GEAR,
    GEAR_IDS,
    TALENT_STAR,
    TALENT_TIER,
    TALENT_TREES,
    TALENT_TREE_SIZE,
    talentError,
    talentSpent,
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
    PASSIVE_LV,
    type Bonus,
    type BuildingId,
    type ElderId,
    type UnitId,
    isMarching,
    STAR_MAX,
    TAVERN_HALL,
    TOKEN_SUMMON,
    starCost,
    starOf,
    EXPERTISE,
    SKILL_MAX,
    expertOf,
    ngoCost,
    ngoError,
    skillLv,
  } from '@rok/rules'
  import Tavern from './Tavern.svelte'
  import { Icon, Portrait } from '@rok/art'
  import ElderStory from './ElderStory.svelte'
  import ElderSwap from './ElderSwap.svelte'
  import ElderRelic from './ElderRelic.svelte'
  import { Beads, Button, Card, Medal, Meter, Page, Scroll, Section, Sheet, Tabs, Tag } from './ui'
  import { EMBLEM, L, LOOK, clock, num, unitName, type PanelTab } from './lib'
  import Help from './Help.svelte'
  import { useGame } from './game'

  let {
    onfocus,
    share,
  }: {
    onfocus: (id: BuildingId, view?: PanelTab | null) => void
    share?: (text: string) => void // gửi thẻ trưởng lão vào chat (kênh minh nếu có minh)
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
  const owned = $derived(GEAR_IDS.filter(id => game.gear[id]?.lv))
  // sắp trưởng lão (như danh sách tướng của RoK): đã thu nhận trước, rồi theo cấp / phẩm / sao — nhớ theo máy
  let tree = $state(0) // cây thiên phú đang xem
  const SORTS = ['lv', 'rar', 'star'] as const
  type Sort = (typeof SORTS)[number]
  let sort = $state<Sort>(
    (() => {
      try {
        const v = localStorage.getItem('rok.elderSort') as Sort
        return SORTS.includes(v) ? v : 'lv'
      } catch {
        return 'lv'
      }
    })(),
  )
  function pickSort(v: Sort) {
    sort = v
    try {
      localStorage.setItem('rok.elderSort', v)
    } catch {
      /* chế độ riêng tư: chỉ nhớ trong phiên */
    }
  }
  const key = (e: ElderId) =>
    sort === 'rar' ? RARITY[e] : sort === 'star' ? starOf(game, e) : elderLevel(game.elders[e] ?? 0)
  const roster = $derived(
    [...ELDER_IDS].sort((a, b) => {
      const ha = game.elders[a] !== undefined ? 1 : 0,
        hb = game.elders[b] !== undefined ? 1 : 0
      return hb - ha || key(b) - key(a)
    }),
  )
</script>

<Page title={L.monHa.title} icon="monHa">
  {#if game.levels.chuDien >= TAVERN_HALL}
    <Section title={L.tavern.title}>
      <Tavern />
    </Section>
  {/if}
  <Section title={L.monHa.elders}>
    {#snippet aside()}<Help k={2} />{/snippet}
    <div class="row wrap" style:--gap="4px">
      <small class="t-tiny t-soft">{L.monHa.sortBy}</small>
      {#each SORTS as v (v)}<Button size="sm" variant={sort === v ? 'gold' : 'ghost'} onclick={() => pickSort(v)}
          >{L.monHa.sort[v]}</Button
        >{/each}
    </div>
    <!-- sảnh treo tranh: mỗi trưởng lão một bức tranh treo (trục trên dưới), dấu trạng thái đóng góc -->
    <ul class="grid" style:--cols="3" style:--gap="16px 10px">
      {#each roster as e (e)}
        {@const has = game.elders[e] !== undefined}
        {@const m = marchOf(e)}
        <li class="stack" style:--gap="6px">
          <Scroll
            rar={RARITY[e]}
            off={!has}
            onclick={() => (open = e)}
            title={has ? undefined : L.unlockHint[e]}
            label={has ? L.elders[e].name : L.unlockHint[e]}
            name={has ? L.elders[e].name : '???'}
            meter={has ? expPart(e) : undefined}
            stamp={has ? (m ? clock(m.returnAt - now) : L.monHa.home) : undefined}
            stampTone={m ? 'bad' : 'good'}
          >
            <Portrait look={LOOK[e]} size={66} dim={!has} />
            {#snippet sub()}
              {#if has}{L.lv(elderLevel(game.elders[e]))} {'★'.repeat(starOf(game, e))}{:else}<Icon
                  name="lock"
                  size={11}
                />{#if game.tokens[e]}{game.tokens[e]}/{TOKEN_SUMMON}{/if}{/if}
            {/snippet}
          </Scroll>
          {#if !has && (game.tokens[e] ?? 0) >= TOKEN_SUMMON}
            <Button variant="gold" size="sm" wide onclick={() => act({ type: 'recruit', elder: e }, 'reward')}
              >{L.tavern.recruit}</Button
            >
          {/if}
        </li>
      {/each}
    </ul>
  </Section>

  <Section title="{L.monHa.disciples} · {num(count(game.troops) + count(out))}">
    <Card>
      <div class="matrix" style:--n={tiers.length}>
        <span></span>
        {#each tiers as t (t)}<span class="th t-tiny t-soft">{L.tiers[t]}</span>{/each}
        {#each TYPES as type (type)}
          <span class="row" style:--gap="6px"
            ><Medal emblem={EMBLEM.unit[type]} tone={type} size={28} /><span class="stack" style:--gap="0"
              ><b class="t-small">{unitName(type, game)}</b><small class="t-tiny t-soft">{L.beats(type)}</small></span
            ></span
          >
          {#each tiers as t (t)}
            {@const u = `${type}${t}` as UnitId}
            <span class="well">
              <b class="t-num" class:t-faint={!game.troops[u] && !out[u]}>{num(game.troops[u])}</b>
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
    {#snippet aside()}<Help k={3} />{/snippet}
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
  onclose={() => {
    open = null
    picking = false
  }}
  title={open ? L.elders[open].name : ''}
  sub={open
    ? `${L.rarity[RARITY[open]]} · ${L.elders[open].title} · ${L.units[ELDERS[open].type]} · ${L.el[ELDERS[open].el]} (${L.overcomes(ELDERS[open].el)})`
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
      <!-- chia sẻ thẻ trưởng lão vào chat (như chia sẻ tướng của RoK): tin có mã #tl để chat vẽ thẻ -->
      {#if share}<Button
          size="sm"
          variant="ghost"
          icon="upload"
          onclick={() => share(`${L.elders[e].name} · ${L.lv(lv)} #tl:${e}:${lv}:${starOf(game, e)}`)}
          >{L.monHa.share}</Button
        >{/if}
    </Section>
    <Section title="{L.tavern.stars(starOf(game, e))} · {L.tavern.token} {game.tokens[e] ?? 0}">
      <p class="t-small t-soft">{L.tavern.starHint}</p>
      {#if starOf(game, e) < STAR_MAX}
        <Button
          size="sm"
          variant="gold"
          disabled={(game.tokens[e] ?? 0) < starCost(game, e)}
          onclick={() => act({ type: 'star', elder: e }, 'reward')}>{L.tavern.star(starCost(game, e))}</Button
        >
      {/if}
    </Section>
    {@const sk = skillLv(game, e)}
    <Section title={L.monHa.skill}>
      <Card tone="glow">
        <span class="row"
          ><Icon name="bolt" size={22} /><span class="stack grow" style:--gap="1px"
            ><b>{L.elders[e].skill}</b><small class="t-small t-soft">{L.skillText(d.skill)}</small><small
              class="t-tiny t-gold">{L.monHa.tier(L.monHa.tiers[sk[0] - 1], sk[0], SKILL_MAX)}</small
            ></span
          ><Beads look="pips" n={SKILL_MAX} on={sk[0]} /></span
        >
      </Card>
    </Section>
    <Section title={L.monHa.passive}>
      {#each d.passives as p, i (i)}
        <Card>
          <span class="row" class:dim={lv < p.at}>
            <Icon name={lv < p.at ? 'lock' : 'check'} size={18} />
            <span class="stack grow" style:--gap="1px"
              ><b class="t-small">{L.elders[e].passives[i]} · {L.monHa.passiveAt(p.at)}</b><small class="t-small t-soft"
                >{L.bonus(p.key, p.v * (1 + PASSIVE_LV * (sk[i + 1] - 1)))}</small
              ><small class="t-tiny t-gold">{L.monHa.tier(L.monHa.tiers[sk[i + 1] - 1], sk[i + 1], SKILL_MAX)}</small
              ></span
            >
            <Beads look="pips" n={SKILL_MAX} on={sk[i + 1]} />
          </span>
        </Card>
      {/each}
      <!-- Ngộ công pháp: tín vật của trưởng lão này, một môn ngẫu nhiên lên tầng (mầm server) -->
      {@const why = ngoError(game, e)}
      {#if !expertOf(game, e)}<p class="t-small t-soft">
          {why === 'max_level' ? L.monHa.ngoMax : L.monHa.ngoHint}
        </p>{/if}
      {#if why !== 'max_level'}
        <Button size="sm" variant="gold" disabled={!!why} onclick={() => act({ type: 'ngo', elder: e }, 'reward')}
          >{L.monHa.ngo(ngoCost(game, e))}</Button
        >
      {/if}
      {#if expertOf(game, e)}
        <Card tone="glow">
          <span class="stack" style:--gap="2px"
            ><b class="t-gold">{L.monHa.expert}</b><small class="t-small">{L.monHa.expertHint}</small><small
              class="t-small t-soft"
              >{Object.entries(EXPERTISE)
                .map(([k, v]) => L.bonus(k as Bonus, v ?? 0))
                .join(' · ')}</small
            ></span
          >
        </Card>
      {/if}
      <ElderSwap elder={e} />
      <ElderRelic elder={e} />
    </Section>
    {@const g = gearOf(game, e)}
    {@const busy = isMarching(game, e)}
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
            onclick={on && isMarching(game, on)
              ? undefined
              : () => {
                  if (act({ type: 'equip', gear: x, elder: e }, 'reward')) picking = false
                }}
            disabled={!!on && isMarching(game, on)}
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
    {@const tal = game.talents[e] ?? []}
    <!-- Linh căn ba mạch: chọn cây, mỗi tầng hai nút (điểm / tối đa, hiệu lực), tầng chưa mở ghi cần bao nhiêu điểm trong cây -->
    <Section title={L.talent.title}>
      {#snippet aside()}{L.talent.points(pts)}{/snippet}
      <p class="t-small t-soft">{L.talent.hint(TALENT_TIER, TALENT_STAR)}</p>
      <Tabs
        items={TALENT_TREES.map((_, k) => ({
          id: String(k),
          label: `${L.talent.trees[k]} · ${L.talent.spent(talentSpent(game, e, k))}`,
        }))}
        value={String(tree)}
        onchange={k => (tree = Number(k))}
      />
      {#each [0, 1, 2, 3] as tier (tier)}
        {@const open = talentSpent(game, e, tree) >= TALENT_TIER[tier]}
        <div class="stack mt-1" style:--gap="4px" class:dim={!open}>
          {#if !open}<small class="t-tiny t-soft"
              ><Icon name="lock" size={12} /> {L.talent.need(TALENT_TIER[tier])}</small
            >{/if}
          <div class="stack" style:--gap="6px">
            {#each TALENT_TREES[tree] as d, k (k)}
              {#if d.tier === tier}
                {@const i = tree * TALENT_TREE_SIZE + k}
                {@const n = tal[i] ?? 0}
                <Card tone={d.tier === 3 ? 'glow' : undefined}>
                  <div class="row" style:--gap="6px">
                    <span class="grow stack" style:--gap="1px"
                      ><b class="t-small">{L.talent.nodes[tree][k]} · {n}/{d.max}</b><small class="t-tiny t-soft"
                        >{L.bonus(d.key.replace('.own', `.${ELDERS[e].type}`) as Bonus, d.v * Math.max(1, n))}</small
                      ></span
                    >
                    <Button
                      size="sm"
                      disabled={!!talentError(game, e, i) || busy}
                      onclick={() => act({ type: 'talent', elder: e, node: i }, 'reward')}>{L.talent.add}</Button
                    >
                  </div>
                </Card>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
      {#if game.items.taiTuy && talentUsed(game, e)}
        <Button
          variant="ghost"
          wide
          icon="taiTuy"
          disabled={busy}
          onclick={() => act({ type: 'wash', elder: e }, 'reward')}>{L.talent.wash(game.items.taiTuy)}</Button
        >
      {/if}
    </Section>
    <ElderStory elder={e} {lv} />
    {#if game.items.boiNguyen && lv < ELDER_MAX}
      <div class="mt-4">
        <Button variant="gold" wide icon="boiNguyen" onclick={() => act({ type: 'feed', elder: e, n: 1 }, 'reward')}
          >{L.monHa.feed(game.items.boiNguyen)}</Button
        >
      </div>
    {/if}
  {/if}
</Sheet>
