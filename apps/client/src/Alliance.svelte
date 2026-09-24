<script lang="ts">
  // Trang Tiên minh: chưa có minh thì xem các minh trong giới (vào ngay) hoặc lập minh; có rồi thì cống hiến / Minh khố /
  // Minh lễ, lối vào Hộ Minh Đại Trận và Cống Hiến Các, bố cáo, giúp đỡ, người trong minh (chức vị, đang chơi), chat kênh
  // minh. Luật ở rules/world, server kiểm lại mọi thao tác.
  import { ALLY_COST, ALLY_GIFT_LV, ALLY_HALL, DONATE_MAX, RESOURCES, jobOf, type JobKind } from '@rok/rules'
  import {
    donateLeft,
    giftLevel,
    helpsOf,
    seatsOf,
    type AllyInfo,
    type AllyRow,
    type Role,
    type WorldAction,
  } from '@rok/rules/world'
  import type { Ack } from '@rok/protocol'
  import type { Snippet } from 'svelte'
  import { Icon } from '@rok/art'
  import { Button, Card, Confirm, Medal, Meter, Page, Section, Tag } from './ui'
  import { L, clock, num, sfx } from './lib'
  import { useGame } from './game'
  import AllyTech from './AllyTech.svelte'
  import AllyShop from './AllyShop.svelte'

  let {
    me,
    ally,
    rows,
    send,
    chat,
  }: {
    me: number | null
    ally: AllyInfo | null
    rows: AllyRow[] | null // danh sách minh (khi chưa vào minh nào)
    send: (a: WorldAction) => Promise<Ack>
    chat?: Snippet
  } = $props()
  const g = useGame()
  const game = $derived(g.game)

  let name = $state('')
  let tag = $state('')
  let editing = $state<string | null>(null)
  let pick = $state<number | null>(null)
  let sheet = $state<'tech' | 'shop' | null>(null)
  const maxHelps = $derived(ally ? helpsOf(ally) : 0)
  const left = $derived(donateLeft(game, g.now))
  const gift = $derived(ally ? giftLevel(ally) : 1)
  const giftPart = $derived(
    ally && gift < ALLY_GIFT_LV.length
      ? ((ally.gift ?? 0) - ALLY_GIFT_LV[gift - 1]) / (ALLY_GIFT_LV[gift] - ALLY_GIFT_LV[gift - 1])
      : 1,
  )
  const myRole = $derived<Role | -1>(ally && me !== null ? (ally.members[me] ?? -1) : -1)
  const JOBS: JobKind[] = ['build', 'train', 'heal', 'study', 'forge']
  const running = $derived(JOBS.filter(k => jobOf(game, k)))
  const asked = (k: JobKind) =>
    !!ally?.helps.some(h => h.pid === me && h.job === k && h.startAt === jobOf(game, k)?.startAt)
  const others = $derived(
    ally ? ally.helps.filter(h => h.pid !== me && me !== null && !h.by.includes(me) && h.by.length < maxHelps) : [],
  )
  const nameOf = (pid: number) => ally?.people.find(p => p.pid === pid)?.name ?? '?'
  const go = async (a: WorldAction, sound: 'reward' | 'tap' = 'tap') => {
    const ok = (await send(a)).ok
    if (ok) sfx(sound)
    return ok
  }
</script>

<Page title={L.ally.title} icon="tienMinh">
  {#if !ally}
    <p class="t-lore">{L.ally.intro}</p>
    <Section title={L.ally.list}>
      {#if rows && !rows.length}<p class="t-small t-soft">{L.ally.none}</p>{/if}
      <ul class="stack">
        {#each rows ?? [] as r (r.id)}
          <li>
            <Card>
              <span class="row">
                <Medal emblem="crest" tone="gold" size={34} />
                <span class="grow stack" style:--gap="1px"
                  ><b>{r.name} [{r.tag}]</b><small class="t-small t-soft"
                    >{L.ally.members(r.n, r.max)} · {L.power} {num(r.power)}</small
                  ></span
                >
                <Button size="sm" onclick={() => go({ type: 'allyJoin', id: r.id }, 'reward')}>{L.ally.join}</Button>
              </span>
            </Card>
          </li>
        {/each}
      </ul>
    </Section>
    <Section title={L.ally.found}>
      <p class="t-small t-soft">{L.ally.foundHint}</p>
      <form
        class="stack"
        onsubmit={e => {
          e.preventDefault()
          go({ type: 'allyFound', name, tag }, 'reward')
        }}
      >
        <input bind:value={name} maxlength="20" placeholder={L.ally.name} aria-label={L.ally.name} />
        <input
          bind:value={tag}
          maxlength="4"
          placeholder={L.ally.tag}
          aria-label={L.ally.tag}
          style:text-transform="uppercase"
        />
        <Button
          variant="gold"
          wide
          type="submit"
          disabled={game.levels.chuDien < ALLY_HALL ||
            RESOURCES.some(r => game.res[r] < ALLY_COST) ||
            name.trim().length < 2 ||
            tag.trim().length < 2}>{L.ally.found}</Button
        >
      </form>
    </Section>
  {:else}
    <Card tone="silk">
      <span class="row">
        <Medal emblem="crest" tone="gold" size={46} />
        <span class="grow stack" style:--gap="1px"
          ><b class="t-head">{ally.name} [{ally.tag}]</b><small class="t-small t-soft"
            >{L.ally.members(ally.people.length, seatsOf(ally))} · {L.ally.role[myRole === -1 ? 0 : myRole]}</small
          ></span
        >
      </span>
      <div class="stats mt-2">
        <span title={L.guild.creditHint}
          ><small class="t-tiny t-soft">{L.guild.credit}</small><b class="t-num">{num(game.contrib?.credit ?? 0)}</b
          ></span
        >
        <span title={L.guild.fundHint}
          ><small class="t-tiny t-soft">{L.guild.fund}</small><b class="t-num">{num(ally.fund ?? 0)}</b></span
        >
        <span title={L.guild.giftHint}
          ><small class="t-tiny t-soft">{L.guild.gift}</small><b>{L.guild.giftLv(gift)}</b><Meter
            value={giftPart}
            size="xs"
            tone="gold"
          /></span
        >
      </div>
    </Card>

    <!-- lối vào như menu tiên minh của RoK: ô hình + tên + dòng phụ, chấm đỏ khi lượt cung phụng đầy (đang phí lượt hồi) -->
    <div class="tiles">
      <button type="button" class="tile" onclick={() => (sheet = 'tech')}>
        {#if left >= DONATE_MAX}<span class="dot-red" aria-hidden="true"></span>{/if}
        <Icon name="shield" size={30} />
        <b class="t-small">{L.guild.tech}</b>
        <small class="t-tiny t-soft">{L.guild.left(left)}</small>
      </button>
      <button type="button" class="tile" onclick={() => (sheet = 'shop')}>
        <Icon name="hoSon" size={30} />
        <b class="t-small">{L.guild.shop}</b>
        <small class="t-tiny t-soft">{L.guild.credit} {num(game.contrib?.credit ?? 0)}</small>
      </button>
    </div>
    <AllyTech open={sheet === 'tech'} onclose={() => (sheet = null)} {ally} officer={myRole >= 1} {send} />
    <AllyShop open={sheet === 'shop'} onclose={() => (sheet = null)} {ally} officer={myRole >= 1} {send} />

    <Section title={L.ally.notice}>
      {#if editing !== null}
        <textarea bind:value={editing} maxlength="200" rows="3" aria-label={L.ally.notice}></textarea>
        <Button
          size="sm"
          onclick={async () => (await go({ type: 'allyNotice', text: editing ?? '' })) && (editing = null)}
          >{L.ally.save}</Button
        >
      {:else}
        <p class="t-small t-lore">{ally.notice || L.ally.noNotice}</p>
        {#if myRole >= 1}<Button size="sm" variant="ghost" onclick={() => (editing = ally?.notice ?? '')}
            >{L.ally.edit}</Button
          >{/if}
      {/if}
    </Section>

    <Section title={L.ally.help}>
      <p class="t-small t-soft">{L.ally.helpHint(maxHelps)}</p>
      {#if running.length}
        <div class="row wrap">
          {#each running as k (k)}
            <Button size="sm" variant="ghost" disabled={asked(k)} onclick={() => go({ type: 'helpAsk', job: k })}
              >{L.jobs[k]} · {asked(k) ? L.ally.asked : L.ally.ask}</Button
            >
          {/each}
        </div>
      {/if}
      <ul class="stack" style:--gap="2px">
        {#each ally.helps as h (h.pid + h.job + h.startAt)}<li class="t-small">
            {L.ally.wants(nameOf(h.pid), L.jobs[h.job], h.by.length, maxHelps)}
          </li>{/each}
        {#if !ally.helps.length}<li class="t-small t-soft">{L.ally.noHelp}</li>{/if}
      </ul>
      <Button
        variant="gold"
        wide
        icon="people"
        disabled={!others.length}
        onclick={() => go({ type: 'helpAll' }, 'reward')}>{L.ally.helpAll(others.length)}</Button
      >
    </Section>

    <Section title={L.ally.members(ally.people.length)}>
      <ul class="stack">
        {#each ally.people as p (p.pid)}
          <li>
            <Card
              onclick={myRole >= 1 && p.pid !== me ? () => (pick = pick === p.pid ? null : p.pid) : undefined}
              label={p.name}
            >
              <span class="row">
                <span class="dot" class:on={p.online} title={p.online ? L.ally.online : ''}></span>
                <span class="grow stack" style:--gap="0"
                  ><b class="t-small">{p.name}</b><small class="t-tiny t-soft"
                    >{L.realm(p.hall)} · {L.power} {num(p.power)}</small
                  ></span
                >
                <Tag size="sm" tone={p.role === 2 ? 'gold' : 'plain'}>{L.ally.role[p.role]}</Tag>
              </span>
            </Card>
            {#if pick === p.pid}
              <div class="row wrap mt-2">
                {#if myRole === 2}
                  {#if p.role === 0}<Button
                      size="sm"
                      variant="ghost"
                      onclick={() => go({ type: 'allyRole', pid: p.pid, role: 1 })}>{L.ally.promote}</Button
                    >{/if}
                  {#if p.role === 1}<Button
                      size="sm"
                      variant="ghost"
                      onclick={() => go({ type: 'allyRole', pid: p.pid, role: 0 })}>{L.ally.demote}</Button
                    >{/if}
                  <Button size="sm" variant="ghost" onclick={() => go({ type: 'allyRole', pid: p.pid, role: 2 })}
                    >{L.ally.lead}</Button
                  >
                {/if}
                {#if myRole > p.role}<Button
                    size="sm"
                    variant="danger"
                    onclick={() => go({ type: 'allyKick', pid: p.pid })}>{L.ally.kick}</Button
                  >{/if}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </Section>

    {#if ally.rallies.length}
      <Section title={L.world.rally}>
        <ul class="stack" style:--gap="2px">
          {#each ally.rallies as r (r.id)}<li class="t-small">
              {L.world.rallyAt(
                nameOf(r.by),
                r.task === 'hit' ? L.world.point.boss : L.world.point.vein,
                clock(Math.max(0, r.at - game.time)),
              )}
            </li>{/each}
        </ul>
        <p class="t-tiny t-soft">{L.world.rallyHint}</p>
      </Section>
    {/if}

    {#if chat}<Section title={L.chat.ally}>{@render chat()}</Section>{/if}

    <div class="mt-4">
      <Confirm warn={L.ally.leaveSure} label={L.ally.leave} onconfirm={() => go({ type: 'allyLeave' })}>
        {#snippet trigger(ask)}
          <Button variant="quiet" wide onclick={ask}><Icon name="back" size={16} />{L.ally.leave}</Button>
        {/snippet}
      </Confirm>
    </div>
  {/if}
</Page>

<style>
  input,
  textarea {
    width: 100%;
    padding: 8px 10px;
    font: inherit;
    border: 1.5px solid var(--ink3);
    border-radius: var(--cut);
    background: var(--paper);
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ink3);
  }
  .on {
    background: var(--malachite);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--sp-2);
  }
  .stats > span {
    display: grid;
    gap: 1px;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--sp-2);
  }
  .tile {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 10px 8px;
    font: inherit;
    color: inherit;
    background: var(--silk);
    border: 1.5px solid var(--paper3);
    border-radius: 12px;
    cursor: pointer;
  }
  .tile:active {
    transform: scale(0.97);
  }
  .dot-red {
    position: absolute;
    top: 6px;
    right: 8px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--cinnabar);
    box-shadow: 0 0 0 2px var(--silk);
  }
</style>
