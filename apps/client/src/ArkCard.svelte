<script lang="ts">
  // Tranh Đoạt Linh Châu (Ark of Osiris giản lược): ghi danh; trong trận — sơ đồ 11 ô (phe giữ, số đội hai bên, Linh Châu, Tụ Linh
  // Nhãn phe mình đã nối), điểm hai minh, đồng hồ hiệp, đội của mình và lệnh đứng (chạm ô rồi "Tới đây"), nhật ký hiệp; sau trận — kết quả
  import { ARK_ROUND, ARK_ROUNDS, ARK_SKILLS, type ArkSkill } from '@rok/rules'
  import { arkAt, type ArkRow, type WorldAction } from '@rok/rules/world'
  import { weekOf } from '@rok/rules'
  import { artOf } from '@rok/art'
  import { Art, Button, Section, Tag } from './ui'
  import ArkMap, { arkLogText } from './ArkMap.svelte'
  import { L, clock } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  let {
    row,
    me,
    aid,
    officer,
    go,
  }: {
    row: ArkRow | undefined
    me: number
    aid: number // tiên minh của mình (bên nào trên chiến trường)
    officer: boolean
    go: (a: WorldAction, sound?: 'reward' | 'tap') => Promise<boolean>
  } = $props()
  const g = useGame()
  const fight = artOf('ui:fx-battle')?.src // hai tu sĩ giao kiếm: đầu mục khi chưa vào trận
  const f = $derived(row?.live ?? null)
  const mine = $derived(f?.units.find(u => u.pid === me))
  const side = $derived(f?.b === aid ? 1 : 0)
  let pick = $state<number | null>(null)
  const start = $derived(arkAt(weekOf(g.now)))
  const next = $derived(f ? start + (f.round + 1) * ARK_ROUND - g.now : 0)
  const tag = (sd: 0 | 1) => (f ? (sd === 0 ? f.an : f.bn) : '')
</script>

{#snippet vs(tags: Record<number, string>, a: number, b: number, won: number[] = [])}
  <span
    ><b class:t-gold={won.includes(a)}>[{tags[a] ?? '?'}]</b> –
    <b class:t-gold={won.includes(b)}>[{tags[b] ?? '?'}]</b></span
  >
{/snippet}

<Section title={L.ark.title}>
  <p class="t-small t-soft">{L.ark.hint}</p>
  {#if f}
    {#if f.cup}<Tag tone="gold">{L.ark.cup.title} · {L.ark.cup[f.cup]}</Tag>{/if}
    <!-- bảng điểm hai minh: số to ở giữa, hiệp và giờ bên dưới -->
    <p class="row center">
      <b class="t-title t-num">[{tag(side as 0 | 1)}] {f.pts[side]} – {f.pts[side ? 0 : 1]} [{tag(side ? 0 : 1)}]</b>
    </p>
    <p class="row center t-small">
      <span class="t-soft"
        >{f.round < ARK_ROUNDS ? L.ark.round(f.round + 1, ARK_ROUNDS, clock(Math.max(0, next))) : L.ark.ended}</span
      >
    </p>
    <ArkMap {f} side={side as 0 | 1} picked={pick} onpick={node => (pick = node)} />
    {#if mine}
      <p class="t-small">
        {mine.rest && mine.rest > f.round ? L.ark.resting : L.ark.me(L.ark.nodes[mine.at], L.ark.nodes[mine.to])}
        {#if f.orb?.by === me}<Tag tone="gold">{L.ark.carrying}</Tag>{/if}
      </p>
      <small class="t-tiny t-gold">{L.ark.sc(mine.sc ?? 0)}</small>
    {/if}
    {#if officer && mine && f.round < ARK_ROUNDS}
      <!-- chiến pháp: mỗi trận mỗi cái một lần, hiệu lực cả minh ở hiệp kế -->
      <b class="t-small">{L.ark.skillTitle}</b>
      <div class="row wrap" style:--gap="6px">
        {#each Object.keys(ARK_SKILLS) as ArkSkill[] as k (k)}
          {@const used = f.used?.[side]?.includes(k)}
          {@const on = f.buffs?.find(b => b.side === side && b.k === k)}
          <Button
            size="sm"
            variant={used ? 'ghost' : 'gold'}
            disabled={used}
            onclick={() => go({ type: 'arkSkill', k }, 'reward')}
            >{L.ark.skills[k][0]}{on ? ` · ${L.ark.skillOn(on.r)}` : used ? ` · ${L.ark.skillUsed}` : ''}</Button
          >
        {/each}
      </div>
      <small class="t-tiny t-soft"
        >{(Object.keys(ARK_SKILLS) as ArkSkill[]).map(k => L.ark.skills[k].join(': ')).join(' · ')}</small
      >
    {/if}
    {#if pick !== null && mine && f.round < ARK_ROUNDS}
      <div class="row wrap" style:--gap="6px">
        <b class="t-small">{L.ark.nodes[pick]}</b>
        <Button size="sm" variant="gold" onclick={() => go({ type: 'arkOrder', to: pick! })}>{L.ark.go}</Button>
        {#if officer}<Button size="sm" variant="ghost" onclick={() => go({ type: 'arkOrder', to: pick!, all: true })}
            >{L.ark.goAll}</Button
          >{/if}
      </div>
    {/if}
    {#if f.log.length}
      <ol class="stack plain mt-1" style:--gap="2px">
        {#each [...f.log].reverse().slice(0, 6) as e, i (i)}
          <li class="t-tiny"><span class="t-soft">{e[0]}·</span> {arkLogText(f, e)}</li>
        {/each}
      </ol>
    {/if}
  {:else}
    <div class="row">
      {#if fight}<Art art="fx-battle" icon="swords" size={72} />{/if}
      <b class="grow t-small">{row?.signed ? L.ark.signed : L.ark.when(clock(Math.max(0, start - g.now)))}</b>
    </div>
    {#if officer}
      <Button
        size="sm"
        variant={row?.signed ? 'quiet' : 'gold'}
        icon="flag"
        onclick={() => go({ type: row?.signed ? 'arkUnsign' : 'arkSign' }, 'reward')}
        >{row?.signed ? L.ark.unsign : L.ark.sign}</Button
      >
    {/if}
    {#each row?.last ?? [] as r (r.a)}
      <small class="t-small t-strong">{L.ark.last(r.an, r.bn, r.wa, r.wb)}</small>
    {/each}
  {/if}
  {#if g.now >= start && g.now < start + (ARK_ROUNDS + 1) * ARK_ROUND}
    <Button size="sm" variant="ghost" icon="globe" onclick={() => (social.arkWatch = true)}>{L.ark.watchOpen}</Button>
  {/if}
  {#if row?.cup}
    <!-- vòng playoff: bán kết 1–4, 2–3; chung kết và tranh hạng ba khi bán kết xong; bên thắng tô vàng -->
    {@const c = row.cup}
    <small class="t-tiny t-soft mt-2">{L.ark.cup.title}</small>
    <ul class="stack plain" style:--gap="1px">
      <li class="row between t-small">
        <span>{L.ark.cup.semi}</span>
        <span class="row" style:--gap="10px"
          >{@render vs(c.tags, c.seeds[0], c.seeds[3], c.win)}{@render vs(c.tags, c.seeds[1], c.seeds[2], c.win)}</span
        >
      </li>
      {#if c.win.length === 2}
        <li class="row between t-small">
          <span>{L.ark.cup.final}</span>{@render vs(c.tags, c.win[0], c.win[1], c.final?.slice(0, 1))}
        </li>
        <li class="row between t-small">
          <span>{L.ark.cup.third}</span>{@render vs(c.tags, c.lose[0], c.lose[1], c.third?.slice(0, 1))}
        </li>
      {/if}
      {#if c.final}<li class="t-small t-gold"><b>{L.ark.cup.champ(c.tags[c.final[0]] ?? '?')}</b></li>{/if}
    </ul>
  {/if}
  {#if row?.league?.length}
    <!-- Cửu Thiên Luận Đạo Hội: bảng giải cả mùa, minh mình tô vàng -->
    <small class="t-tiny t-soft mt-2">{L.ark.league}</small>
    <ol class="stack plain" style:--gap="1px">
      {#each row.league as r, k (r.id)}
        <li class="row between t-small" class:t-gold={r.id === aid}>
          <span class="row" style:--gap="6px"><i class="rank-no r{k + 1}">{k + 1}</i>[{r.tag}]</span><span class="t-num"
            >{L.ark.leagueRow(r.w, r.l, r.pts)}</span
          >
        </li>
      {/each}
    </ol>
  {/if}
</Section>
