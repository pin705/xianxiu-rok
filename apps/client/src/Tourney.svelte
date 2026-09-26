<script lang="ts">
  // Luận Kiếm Đại Hội (Sunset Canyon Tournament của RoK — luật ở rules/world/tourney.ts): nhánh đấu theo vòng, bên thắng tô vàng, trận
  // đã đấu có nút Xem (chiến báo của bên đánh, cả giới xem được); chưa tới tuần cuối mùa thì chỉ có dòng giới thiệu
  import { TOURNEY_DAY, type Report } from '@rok/rules'
  import type { TourneyView } from '@rok/rules/world'
  import type { Net } from './net'
  import { Button, Section, Tag } from './ui'
  import { L } from './lib'

  let {
    cup,
    api,
    me,
    onreplay,
  }: { cup?: TourneyView; api: Pick<Net, 'ask'> | null; me: number | null; onreplay: (r: Report) => void } = $props()
  const rounds = $derived(cup ? [...new Set(cup.games.map(x => x.r))].map(r => cup.games.filter(x => x.r === r)) : [])
  const champ = $derived(
    cup?.champ === undefined
      ? null
      : cup.games.map(x => (x.a === cup.champ ? x.an : x.b === cup.champ ? x.bn : null)).find(Boolean),
  )
  async function watch(pid: number, id: number) {
    const r = await api?.ask({ k: 'shared', pid, id })
    if (r) onreplay(r)
  }
</script>

<Section title={L.tourney.title}>
  <p class="t-tiny t-soft">{L.tourney.hint(TOURNEY_DAY + 1, TOURNEY_DAY + 4)}</p>
  {#if cup && !cup.n}<p class="t-small t-soft">{L.tourney.none}</p>{/if}
  {#if champ}<Tag icon="star" tone="gold">{L.tourney.champ(champ)}</Tag>{/if}
  {#each rounds as games (games[0].r)}
    <b class="t-small mt-2">{L.tourney.round(games.length * 2)}</b>
    <ul class="stack plain" style:--gap="4px">
      {#each games as x (x.a)}
        <li class="row t-small">
          <span class="grow t-ellipsis" class:t-gold={x.win === true} class:t-strong={x.a === me}>{x.an}</span>
          <small class="t-tiny t-soft">vs</small>
          <span class="grow t-ellipsis t-right" class:t-gold={x.win === false} class:t-strong={x.b === me}>{x.bn}</span>
          {#if x.rep !== undefined}
            <Button size="sm" variant="ghost" onclick={() => watch(x.a, x.rep!)}>{L.tourney.watch}</Button>
          {:else if x.win === undefined}<small class="t-tiny t-soft">{L.tourney.wait}</small>{/if}
        </li>
      {/each}
    </ul>
  {/each}
</Section>
