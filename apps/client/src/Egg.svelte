<script lang="ts">
  // Linh Noãn Kỳ Bảo (Holy Knight's Treasure của RoK) trong trung tâm sự kiện: chọn món chủ lực, chạm một quả trong 9 linh noãn để
  // đập (server rút bằng mầm — quả nứt chờ patch rồi mới vỡ ra quà), đập ×10, lệnh còn, lượt miễn phí, rương mốc theo số quả đã đập.
  import {
    FESTS,
    bagFamily,
    festTokens,
    spinError,
    spins,
    wheelFree,
    type BagId,
    type FestId,
    type Items,
    type Metric,
  } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Bag, Button, Card } from './ui'
  import { L, num, sfx } from './lib'
  import { useGame } from './game'

  let { id }: { id: FestId } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)
  const d = $derived.by(() => {
    const def = FESTS[id]
    return def.kind === 'egg' ? def : null
  })
  const got = $derived(game.fest[id]?.got ?? []) // kết quả đập (số âm) và rương mốc đã nhận
  const eggs = $derived(spins(game, id))
  const free = $derived(wheelFree(game, id, now))
  const stage = $derived(d ? d.stages[Math.min(game.fest[id]?.stage ?? 0, d.stages.length - 1)] : {})
  const first = (r: { items?: Items }) => Object.entries(r.items ?? {})[0] as [BagId, number] | undefined

  let pick = $state(0)
  let pending = $state<number | null>(null) // số quả đã đập lúc bấm
  let hit = $state<number | null>(null) // quả đang nứt (chỉ số trong 9 quả)
  let last = $state<{ items: Items; jackpot: boolean } | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  function crack(n: 1 | 10, egg: number) {
    if (!g.act({ type: 'spin', id, n, pick })) return
    pending = eggs
    hit = egg
    last = null
    clearTimeout(timer)
    // server im lặng: thôi chờ
    timer = setTimeout(() => {
      pending = null
      hit = null
    }, 8000)
  }
  // kết quả về: gộp quà các quả vừa đập (−1: món chủ lực, −(k + 2): quà thường thứ k)
  $effect(() => {
    if (!d || pending === null || eggs <= pending) return
    const items: Items = {}
    let jackpot = false
    for (const x of got.filter(v => v < 0).slice(pending)) {
      jackpot ||= x === -1
      const r = x === -1 ? d.picks[pick] : d.pool[-x - 2].r
      for (const [k, v] of Object.entries(r.items ?? {})) items[k as BagId] = (items[k as BagId] ?? 0) + (v ?? 0)
    }
    pending = null
    clearTimeout(timer)
    timer = setTimeout(() => {
      last = { items, jackpot }
      hit = null
      sfx('reward')
    }, 500)
  })
  $effect(() => () => clearTimeout(timer))
  const busy = $derived(pending !== null || hit !== null)
  const err = (n: 1 | 10) => spinError({ ...game, time: now }, id, n, pick)
</script>

{#if d}
  <p class="t-small t-strong">{L.egg.pick}</p>
  <div class="picks" role="radiogroup">
    {#each d.picks as r, i (i)}
      {@const it = first(r)}
      <button
        role="radio"
        class="pick"
        class:on={i === pick}
        aria-checked={i === pick}
        disabled={busy}
        onclick={() => (pick = i)}
      >
        {#if it}<Icon name={bagFamily(it[0])} size={30} /><b class="t-num n">×{it[1]}</b>{/if}
      </button>
    {/each}
  </div>
  <div class="nest" aria-label={L.egg.tap}>
    {#each Array(9) as _, k (k)}
      <button
        class="egg"
        class:crack={hit === k}
        aria-label={free ? L.egg.free : L.egg.one(d.cost)}
        disabled={busy || !!err(1)}
        onclick={() => crack(1, k)}
      ></button>
    {/each}
  </div>
  <p class="row between">
    <b class="t-num t-gold">{L.fest.tokens(num(festTokens(game, id)), L.fest.tokenName[id])}</b>
    <small class="t-tiny t-soft">{L.egg.eggs(eggs)}</small>
  </p>
  <div class="row acts">
    <Button variant="gold" disabled={busy || !!err(1)} onclick={() => crack(1, 4)}
      >{free ? L.egg.free : L.egg.one(d.cost)}</Button
    >
    <Button disabled={busy || !!err(10)} onclick={() => crack(10, 4)}>{L.egg.ten(d.cost * (free ? 9 : 10))}</Button>
  </div>
  {#if busy && !last}<small class="t-small t-soft">{L.egg.cracking}</small>{/if}
  {#if last}
    <Card tone="glow">
      <div class="stack" style:--gap="6px">
        <b class="t-small" class:t-gold={last.jackpot}>{last.jackpot ? L.egg.jackpot : L.egg.got}</b>
        <Bag items={last.items} size="sm" named />
      </div>
    </Card>
  {/if}
  <!-- rương mốc theo tổng số quả đã đập trong lượt (không làm mới mỗi ngày) -->
  <ul class="stack chests" style:--gap="6px">
    {#each d.goals as goal, i (i)}
      <li class="row">
        <b class="t-num n2">{Math.min(eggs, goal)}/{goal}</b>
        <span class="grow"><Bag items={d.rewards[i].items} size="sm" /></span>
        {#if got.includes(i)}<small class="t-tiny t-soft">{L.fest.claimed}</small>
        {:else if eggs >= goal}<Button size="sm" variant="gold" onclick={() => g.act({ type: 'fest', id, i }, 'reward')}
            >{L.fest.claim}</Button
          >{/if}
      </li>
    {/each}
  </ul>
  <Card>
    <ul class="today">
      {#each Object.entries(stage) as [m, v] (m)}
        <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
      {/each}
    </ul>
  </Card>
{/if}

<style>
  .picks {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--sp-2);
    margin: var(--sp-1) 0 var(--sp-2);
  }
  .pick {
    display: grid;
    place-items: center;
    padding: var(--sp-1);
    background: var(--paper2);
    border: 1.5px solid var(--paper3);
    border-radius: 10px;
  }
  .pick.on {
    border-color: var(--gold);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--gold) 45%, transparent);
  }
  .n {
    font-size: var(--fs-1);
  }
  /* 9 quả linh noãn: trứng ngọc vẽ bằng CSS, quả đang đập rung rồi nứt */
  .nest {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-2);
    width: 100%;
    max-width: 220px;
    margin: var(--sp-2) auto;
  }
  .egg {
    aspect-ratio: 4 / 5;
    background:
      radial-gradient(ellipse 30% 22% at 38% 30%, rgb(255 255 255 / 0.85), transparent 70%),
      radial-gradient(ellipse at 50% 60%, var(--gold-l), var(--gold-d));
    border: 2px solid var(--gold-d);
    border-radius: 50% 50% 46% 46% / 58% 58% 42% 42%;
    box-shadow: 0 4px 0 color-mix(in srgb, var(--ink, #2b2b2b) 20%, transparent);
    cursor: pointer;
  }
  .egg:disabled {
    cursor: default;
    filter: saturate(0.6);
  }
  .egg.crack {
    animation: shake 0.25s linear infinite;
    filter: none;
  }
  @keyframes shake {
    25% {
      rotate: -6deg;
    }
    75% {
      rotate: 6deg;
    }
  }
  .acts {
    --gap: var(--sp-2);
    flex-wrap: wrap;
    justify-content: center;
  }
  .chests {
    margin: var(--sp-2) 0;
    padding: 0;
    list-style: none;
  }
  .n2 {
    min-width: 5ch;
  }
  .today {
    margin: 0;
    padding-left: 1.1em;
  }
</style>
