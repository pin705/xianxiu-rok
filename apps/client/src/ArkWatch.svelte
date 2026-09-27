<script lang="ts">
  // Khán giả Tranh Đoạt Linh Châu (xem Ark of Osiris của RoK): cả giới xem mọi trận đang diễn — chọn cặp, bảng điểm hai minh,
  // sơ đồ chiến trường (minh A bên trái), nhật ký hiệp. Mở thì hỏi server, còn mở thì hỏi lại mỗi WATCH_MS.
  import { ARK_ROUND, ARK_ROUNDS, weekOf } from '@rok/rules'
  import { arkAt, type ArkFight } from '@rok/rules/world'
  import type { Net } from './net'
  import { Button, Sheet } from './ui'
  import ArkMap, { arkLogText } from './ArkMap.svelte'
  import { L, clock } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  const WATCH_MS = 20_000
  let { api }: { api: Pick<Net, 'ask'> | null } = $props()
  const g = useGame()
  let live = $state<ArkFight[] | null>(null)
  let sel = $state(0)
  const f = $derived(live?.[Math.min(sel, live.length - 1)] ?? null)
  const next = $derived(f ? arkAt(weekOf(g.now)) + (f.round + 1) * ARK_ROUND - g.now : 0)
  async function load() {
    const r = await api?.ask({ k: 'arkWatch' })
    if (r) live = r
  }
  $effect(() => {
    if (!social.arkWatch) return
    void load()
    const t = setInterval(() => void load(), WATCH_MS)
    return () => clearInterval(t)
  })
</script>

<Sheet open={social.arkWatch} onclose={() => (social.arkWatch = false)} title={L.ark.watch}>
  {#if !live}
    <p class="t-small t-soft">{L.ark.watchLoading}</p>
  {:else if !f}
    <p class="t-small t-soft">{L.ark.watchNone}</p>
  {:else}
    {#if live.length > 1}
      <div class="row wrap" style:--gap="6px">
        {#each live as x, k (x.a)}
          <Button size="sm" variant={f === x ? 'gold' : 'ghost'} onclick={() => (sel = k)}>[{x.an}] – [{x.bn}]</Button>
        {/each}
      </div>
    {/if}
    <p class="row center"><b class="t-title t-num">[{f.an}] {f.pts[0]} – {f.pts[1]} [{f.bn}]</b></p>
    <p class="row center t-small t-soft">
      {f.round < ARK_ROUNDS ? L.ark.round(f.round + 1, ARK_ROUNDS, clock(Math.max(0, next))) : L.ark.ended}
    </p>
    <ArkMap {f} side={0} />
    <small class="t-tiny t-soft">{L.ark.watchLegend(f.an, f.bn)}</small>
    <!-- công huân cá nhân: ba người cao nhất mỗi bên -->
    <b class="t-small">{L.ark.mvp}</b>
    <div class="grid">
      {#each [0, 1] as sd (sd)}
        <ol class="stack plain" style:--gap="2px">
          {#each [...f.units]
            .filter(u => u.side === sd)
            .sort((x, y) => (y.sc ?? 0) - (x.sc ?? 0))
            .slice(0, 3) as u, k (u.pid)}
            <li class="row between t-tiny">
              <span class="t-ellipsis">{k + 1}. [{sd ? f.bn : f.an}] {u.nm ?? '?'}</span><b class="t-num">{u.sc ?? 0}</b
              >
            </li>
          {/each}
        </ol>
      {/each}
    </div>
    {#if f.log.length}
      <ol class="stack plain mt-1" style:--gap="2px">
        {#each [...f.log].reverse().slice(0, 8) as e, i (i)}
          <li class="t-tiny"><span class="t-soft">{e[0]}·</span> {arkLogText(f, e)}</li>
        {/each}
      </ol>
    {/if}
  {/if}
</Sheet>
