<script lang="ts">
  // Luận Kiếm Đài (như Sunset Canyon của RoK, bất đồng bộ): điểm + bậc, lượt hôm nay, rương ngày; thẻ Đối thủ (đội hình thủ
  // của họ, Luận kiếm → xem lại trận), Đội hình (thứ tự ra trận, hệ đệ tử của từng trưởng lão), Nhật ký, Bảng tuần.
  import {
    ARENA_CHEST,
    ARENA_TRIES,
    ELDERS,
    ELDER_IDS,
    PVP_HALL,
    TYPES,
    arenaBand,
    arenaN,
    arenaOf,
    elderLevel,
    lineupOf,
    marchSlots,
    KY_SHOP,
    kyBought,
    type ArenaTeam,
    type BagId,
    type Report,
  } from '@rok/rules'
  import { canRevenge, type WorldAction } from '@rok/rules/world'
  import type { Ack, ArenaView } from '@rok/protocol'
  import type { Net } from './net'
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Button, Card, Sheet, Tabs, Tag } from './ui'
  import { L, LOOK, num, sfx } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'
  import ItemCell from './ItemCell.svelte'
  import { itemName } from './bag'

  let {
    api,
    send,
    me,
    onreplay,
  }: {
    api: Pick<Net, 'ask'> | null
    send: (a: WorldAction) => Promise<Ack>
    me: number | null
    onreplay: (r: Report) => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  type Tab = 'foes' | 'lineup' | 'log' | 'board' | 'shop'
  let tab = $state<Tab>('foes')
  let view = $state.raw<ArenaView | null>(null)
  let last = $state.raw<Report | null>(null) // trận vừa đánh
  const load = () => api?.ask({ k: 'arena' }).then(v => (view = v))
  $effect(() => {
    if (social.arena) void load()
  })
  const a = $derived(arenaOf(game, now))
  const band = $derived(arenaBand(a.pts))
  // đội hình đang sửa (lưu mới gửi)
  let draft = $state<ArenaTeam[] | null>(null)
  const lineup = $derived(draft ?? lineupOf(game))
  const free = $derived(ELDER_IDS.filter(e => game.elders[e] !== undefined && !lineup.some(x => x.elder === e)))
  const edit = (f: (l: ArenaTeam[]) => ArenaTeam[]) => (draft = f([...lineup]))
  async function duel(pid: number, revenge = false) {
    const r = await send({ type: 'arena', pid, ...(revenge && { revenge: true }) })
    if (!r.ok) return
    sfx('march')
    last = r.rep?.find(x => x.kind === 'arena') ?? null
    void load()
  }
</script>

<Sheet open={social.arena} onclose={() => (social.arena = false)} title={L.arena.title} lore={L.arena.lore}>
  {#if game.levels.chuDien < PVP_HALL}
    <p class="t-small t-soft">{L.arena.locked}</p>
  {:else}
    <div class="stack">
      <Card tone="glow">
        <div class="row between">
          <span class="stack" style:--gap="1px"
            ><b class="t-head t-num">{num(a.pts)}</b><small class="t-tiny t-soft"
              >{L.arena.pts}{#if view?.rank}
                · {L.arena.rank(view.rank)}{/if}</small
            ></span
          >
          <Tag tone="gold" icon="star">{L.arena.band[band]}</Tag>
        </div>
        <p class="row between t-small">
          <span>{L.arena.left(a.left, ARENA_TRIES)}</span><b class="t-gold t-num">{L.arena.ky} {num(a.ky ?? 0)}</b>
        </p>
        <!-- hết lượt mà còn Luận Kiếm Lệnh (từ Nhật Khóa): thêm một lượt -->
        {#if a.left < 1 && (game.items.luanKiem ?? 0) > 0}<Button
            size="sm"
            variant="gold"
            icon="swords"
            onclick={() => g.act({ type: 'arenaTicket' }, 'reward')}>{L.arena.ticket(game.items.luanKiem ?? 0)}</Button
          >{/if}
        <div class="row between mt-2">
          <span class="stack" style:--gap="2px"
            ><small class="t-tiny">{L.arena.chest(L.arena.band[band])}</small><Bag
              items={ARENA_CHEST[band].items}
              size="sm"
            /></span
          >
          <Button
            size="sm"
            variant="gold"
            disabled={a.chest === a.day}
            onclick={() => g.act({ type: 'arenaChest' }, 'reward')}>{L.arena.open}</Button
          >
        </div>
      </Card>

      {#if last}
        <Card tone={last.win ? 'glow' : 'silk'}>
          <div class="row">
            <b class="grow" class:t-good={last.win} class:t-bad={!last.win}
              >{L.arena.result(last.win, a.log[0]?.delta ?? 0)}</b
            >
            <Button size="sm" variant="ghost" icon="swords" onclick={() => last && onreplay(last)}
              >{L.report.replay}</Button
            >
          </div>
        </Card>
      {/if}

      <Tabs
        items={[
          { id: 'foes', label: L.arena.foes },
          { id: 'lineup', label: L.arena.lineup },
          { id: 'log', label: L.arena.log },
          { id: 'board', label: L.arena.board },
          { id: 'shop', label: L.arena.shop },
        ]}
        value={tab}
        onchange={t => (tab = t as Tab)}
      />

      {#if tab === 'foes'}
        <ul class="stack">
          {#each view?.foes ?? [] as f (f.pid)}
            <li>
              <Card>
                <div class="row">
                  <span class="grow stack" style:--gap="1px"
                    ><b>{f.name}</b><small class="t-tiny t-soft">{L.realm(f.hall)} · {L.arena.pts} {num(f.pts)}</small
                    ></span
                  >
                  <Button size="sm" variant="gold" icon="swords" disabled={a.left < 1} onclick={() => duel(f.pid)}
                    >{L.arena.fight}</Button
                  >
                </div>
                <div class="row wrap mt-2" style:--gap="6px">
                  {#each f.lineup as x (x.elder)}
                    <span class="team"
                      ><Portrait look={LOOK[x.elder]} size={26} /><small class="t-tiny"
                        >{L.elders[x.elder].name} · {L.units[x.type]}<br />{L.arena.team(x.lv, x.n)}</small
                      ></span
                    >
                  {/each}
                </div>
              </Card>
            </li>
          {/each}
          {#if view && !view.foes.length}<li class="t-small t-soft">{L.arena.noFoes}</li>{/if}
        </ul>
        <Button size="sm" variant="quiet" icon="swords" onclick={load}>{L.arena.refresh}</Button>
      {:else if tab === 'lineup'}
        <p class="t-small t-soft">{L.arena.lineupHint(marchSlots(game))}</p>
        <ol class="stack">
          {#each lineup as x, k (x.elder)}
            <li>
              <Card tone="silk">
                <div class="row">
                  <b class="t-num">{k + 1}</b>
                  <Portrait look={LOOK[x.elder]} size={30} />
                  <span class="grow stack" style:--gap="1px"
                    ><b class="t-small">{L.elders[x.elder].name}</b><small class="t-tiny t-soft"
                      >{L.arena.team(elderLevel(game.elders[x.elder]), arenaN(game, x.elder))}</small
                    ></span
                  >
                  {#if k > 0}<Button
                      size="sm"
                      variant="quiet"
                      label={L.arena.up}
                      onclick={() => edit(l => [...l.slice(0, k - 1), l[k], l[k - 1], ...l.slice(k + 1)])}
                      ><Icon name="arrow" size={14} /></Button
                    >{/if}
                  <Button size="sm" variant="quiet" onclick={() => edit(l => l.filter((_, i) => i !== k))}
                    >{L.arena.remove}</Button
                  >
                </div>
                <div class="row mt-2" style:--gap="4px">
                  {#each TYPES as ty (ty)}
                    <Button
                      size="sm"
                      variant={x.type === ty ? 'gold' : 'ghost'}
                      onclick={() => edit(l => l.map((y, i) => (i === k ? { ...y, type: ty } : y)))}
                      >{L.units[ty]}</Button
                    >
                  {/each}
                </div>
              </Card>
            </li>
          {/each}
        </ol>
        {#if lineup.length < marchSlots(game) && free.length}
          <div class="row wrap">
            {#each free as e (e)}
              <Button
                size="sm"
                variant="ghost"
                label="{L.arena.add}: {L.elders[e].name}"
                onclick={() => edit(l => [...l, { elder: e, type: ELDERS[e].type }])}
                ><Portrait look={LOOK[e]} size={20} />{L.elders[e].name}</Button
              >
            {/each}
          </div>
        {/if}
        <Button
          variant="gold"
          wide
          disabled={!draft}
          onclick={() => {
            if (draft && g.act({ type: 'arenaSet', lineup: draft }, 'reward')) draft = null
          }}>{L.arena.save}</Button
        >
      {:else if tab === 'log'}
        <ul class="stack" style:--gap="4px">
          {#each a.log as e, k (k)}
            <li class="row t-small" class:t-good={e.win} class:t-bad={!e.win}>
              <span class="grow"
                >{#if e.def}{e.win ? L.arena.held(e.foe, e.delta) : L.arena.fell(e.foe, e.delta)}{:else}{e.win
                    ? L.arena.won(e.foe, e.delta)
                    : L.arena.lost(e.foe, e.delta)}{/if}</span
              >
              <!-- phục thù: người vừa thắng mình lúc giữ đài, mỗi ngày một lần, không tốn lượt -->
              {#if e.def && !e.win && canRevenge(game, e.pid, now)}<Button
                  size="sm"
                  variant="danger"
                  icon="swords"
                  onclick={() => duel(e.pid, true)}>{L.arena.revenge}</Button
                >{/if}
            </li>
          {/each}
          {#if !a.log.length}<li class="t-small t-soft">{L.arena.noLog}</li>{/if}
        </ul>
      {:else if tab === 'shop'}
        <!-- Luận Kiếm Thương Điếm: Kiếm Ý từ mỗi trận và rương ngày, mỗi món có hạn mỗi tuần -->
        <ul class="goods">
          {#each KY_SHOP as x, i (x.item)}
            {@const n = kyBought(game, now)[i]}
            <li class="good">
              <ItemCell id={x.item as BagId} n={x.n} />
              <b class="t-tiny">{itemName(x.item as BagId)}</b>
              <small class="t-tiny t-num">{L.arena.ky} {num(x.price)} · {L.arena.limit(n, x.week)}</small>
              <Button
                size="sm"
                variant="gold"
                wide
                disabled={n >= x.week || (a.ky ?? 0) < x.price}
                onclick={() => g.act({ type: 'arenaBuy', i }, 'reward')}>{L.arena.buy}</Button
              >
            </li>
          {/each}
        </ul>
      {:else}
        <ol class="stack" style:--gap="2px">
          {#each view?.board ?? [] as r, k (r.pid)}
            <li class="row between t-small" class:mine={r.pid === me}>
              <span>{k + 1}. {r.name}</span><b class="t-num">{num(r.pts)}</b>
            </li>
          {/each}
        </ol>
      {/if}
    </div>
  {/if}
</Sheet>

<style>
  .team {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px 2px 2px;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 999px;
  }
  .mine {
    font-weight: 800;
    color: var(--gold-d);
  }
  .goods {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .good {
    display: grid;
    justify-items: center;
    gap: 3px;
    padding: 8px;
    text-align: center;
    background: var(--silk);
    border: 1.5px solid var(--paper3);
    border-radius: 12px;
  }
</style>
