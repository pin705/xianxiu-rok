<script lang="ts">
  // Dải chat (chỉ ở tab Bản đồ và Tiên minh): một dòng tin mới nhất, chạm để mở kênh giới / tiên minh / truyền âm.
  // Chữ đã lọc ở server; người mình chặn thì ẩn ở đây (danh sách chặn nằm trong state của mình).
  // Toạ độ "(x,y)" trong tin (chia sẻ từ bản đồ giới) thành nút nhảy tới ô đó, như link toạ độ xanh của RoK.
  // Chạm một tin: hồ sơ người gửi, truyền âm riêng, chặn, báo cáo. Truyền âm: danh sách cuộc gần đây → từng cuộc.
  import type { Channel, ChatMsg, Dm } from '@rok/protocol'
  import { MAP_W } from '@rok/rules/world'
  import type { Net } from './net'
  import { Icon } from '@rok/art'
  import { Button, Sheet, Tabs } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  type Api = Pick<Net, 'ask' | 'say' | 'report' | 'onChat'>
  type Tab = 'world' | 'ally' | 'dm'
  let {
    me,
    ally = false,
    api,
    toast,
    inline = false,
    onmap,
  }: {
    me: number | null
    ally?: boolean
    api: Api | null
    toast: (t: string) => void
    inline?: boolean
    onmap?: (x: number, y: number) => void // nhảy tới ô trên bản đồ giới
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  const tabs = $derived<Tab[]>(ally ? ['world', 'ally', 'dm'] : ['world', 'dm'])
  let tab = $state<Tab>('world')
  let peer = $state<{ pid: number; name: string } | null>(null) // cuộc truyền âm đang xem
  const ch = $derived<Channel | null>(tab !== 'dm' ? tab : peer && `p${peer.pid}`)
  let open = $state(false)
  let text = $state('')
  let logs = $state<Record<string, ChatMsg[]>>({})
  let dms = $state<Dm[]>([]) // các cuộc truyền âm, mới nhất trước
  let unread = $state<number[]>([]) // người có truyền âm chưa đọc
  let pick = $state<ChatMsg | null>(null)
  const put = (c: string, list: ChatMsg[]) => (logs = { ...logs, [c]: list.slice(-50) })
  const viewing = (pid: number) => (open || inline) && tab === 'dm' && peer?.pid === pid
  $effect(() => {
    if (!api) return
    for (const c of ally ? (['world', 'ally'] as const) : (['world'] as const))
      void api.ask({ k: 'chat', ch: c }).then(list => list && put(c, list))
    void api.ask({ k: 'dms' }).then(list => list && (dms = list))
    return api.onChat((c, ms) => {
      put(c, [...(logs[c] ?? []), ...ms])
      if (c[0] !== 'p') return
      const pid = Number(c.slice(1)),
        last = ms.at(-1)!
      const name = last.pid === pid ? last.name : (dms.find(d => d.pid === pid)?.name ?? peer?.name ?? '?')
      dms = [{ pid, name, last }, ...dms.filter(d => d.pid !== pid)]
      if (last.pid !== me && !viewing(pid)) unread = [...new Set([...unread, pid])]
    })
  })
  function openDm(p: { pid: number; name: string }) {
    tab = 'dm'
    peer = { pid: p.pid, name: p.name }
    open = true
    pick = null
    unread = unread.filter(x => x !== p.pid)
    const c = `p${p.pid}` as const
    if (!logs[c]) void api?.ask({ k: 'chat', ch: c }).then(list => list && put(c, list))
  }
  // Hồ sơ (hay chỗ khác) bấm Truyền âm: chat đang hiện mở cuộc đó
  $effect(() => {
    if (!social.dm) return
    openDm(social.dm)
    social.dm = null
  })
  const shown = $derived(ch ? (logs[ch] ?? []).filter(m => !game.blocks.includes(m.pid)) : [])
  const last = $derived(
    [...(logs.world ?? []), ...(ally ? (logs.ally ?? []) : []), ...dms.map(d => d.last)]
      .filter(m => !game.blocks.includes(m.pid))
      .sort((a, b) => a.at - b.at)
      .at(-1),
  )
  async function send(e: SubmitEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || !api || !ch) return
    const r = await api.say(ch, t)
    if (r.ok) text = ''
    else toast(L.chat.err[r.err] ?? L.chat.err.bad)
  }
  const ago = (at: number) => clock(Math.max(0, game.time - at)).replace(/:\d\d$/, '')
  // toạ độ trong tin: "(x,y)" nằm trong bản đồ giới
  const coords = (t: string) =>
    [...t.matchAll(/\((\d{1,3}), ?(\d{1,3})\)/g)]
      .map(m => ({ x: Number(m[1]), y: Number(m[2]) }))
      .filter(c => c.x < MAP_W && c.y < MAP_W)
</script>

{#snippet body()}
  <Tabs
    items={tabs.map(id => ({
      id,
      label: id === 'dm' ? `${L.chat.dm}${unread.length ? ` (${unread.length})` : ''}` : L.chat[id],
    }))}
    value={tab}
    onchange={t => {
      tab = t
      peer = null
      pick = null
    }}
  />
  {#if tab === 'dm' && !peer}
    <ul class="log stack" style:--gap="4px">
      {#each dms.filter(d => !game.blocks.includes(d.pid)) as d (d.pid)}
        <li>
          <button class="msg" onclick={() => openDm(d)}>
            <b class="t-small">{d.name}</b>{#if unread.includes(d.pid)}<span class="new" aria-hidden="true"></span>{/if}
            <span class="t-small t-soft">{d.last.text}</span>
            <small class="t-tiny t-faint">{ago(d.last.at)}</small>
          </button>
        </li>
      {/each}
      {#if !dms.length}<li class="t-small t-soft">{L.chat.dmNone}</li>{/if}
    </ul>
  {:else}
    {#if peer}<button class="back" onclick={() => (peer = null)}
        ><Icon name="back" size={14} />{L.chat.back} · <b>{peer.name}</b></button
      >{/if}
    {#if tab === 'world' && game.levels.chuDien < 3}<p class="t-small t-soft mt-2">{L.chat.locked}</p>{/if}
    <ol class="log stack" style:--gap="4px">
      {#each shown as m (m.id)}
        <li>
          <button class="msg" class:mine={m.pid === me} onclick={() => (pick = pick?.id === m.id ? null : m)}>
            <b class="t-small">{m.name}</b> <span class="t-small">{m.text}</span>
            <small class="t-tiny t-faint">{ago(m.at)}</small>
          </button>
          {#if onmap}
            {#each coords(m.text) as c, k (k)}
              <button
                class="coord"
                onclick={() => {
                  open = false
                  onmap(c.x, c.y)
                }}><Icon name="flag" size={12} />{L.chat.goto(c.x, c.y)}</button
              >
            {/each}
          {/if}
          {#if pick?.id === m.id && m.pid !== me}
            <div class="row wrap" style:--gap="6px">
              <Button size="sm" variant="ghost" onclick={() => (social.profile = m.pid)}>{L.profile.open}</Button>
              {#if !peer}<Button size="sm" variant="ghost" icon="mail" onclick={() => openDm(m)}>{L.profile.dm}</Button
                >{/if}
              <Button
                size="sm"
                variant="ghost"
                onclick={() => {
                  act({ type: 'block', pid: m.pid, on: true })
                  pick = null
                }}>{L.chat.block}</Button
              >
              <Button
                size="sm"
                variant="quiet"
                onclick={async () => {
                  if (!(await api?.report(m.id))) return
                  pick = null
                  toast(L.chat.reported)
                }}>{L.chat.report}</Button
              >
            </div>
          {/if}
        </li>
      {/each}
      {#if !shown.length}<li class="t-small t-soft">{L.chat.empty}</li>{/if}
    </ol>
    <form class="row" onsubmit={send}>
      <input class="grow" bind:value={text} maxlength="200" placeholder={L.chat.say} aria-label={L.chat.say} />
      <Button size="sm" type="submit" disabled={!text.trim()}>{L.chat.send}</Button>
    </form>
  {/if}
{/snippet}

{#if inline}
  <div class="inline stack">{@render body()}</div>
{:else}
  <button class="strip" onclick={() => (open = true)} aria-label={L.chat.world}>
    <Icon name="mail" size={14} />{#if unread.length}<span class="new" aria-hidden="true"></span>{/if}
    {#if last}<b>{last.name}:</b> <span class="t-ellipsis">{last.text}</span>{:else}<span class="t-soft"
        >{L.chat.empty}</span
      >{/if}
  </button>
  <Sheet {open} onclose={() => (open = false)} title={L.chat[tab]}>{@render body()}</Sheet>
{/if}

<style>
  .strip {
    position: fixed;
    left: 50%;
    bottom: calc(var(--safe-b) + 88px);
    z-index: var(--z-hud);
    display: flex;
    align-items: center;
    gap: 6px;
    width: min(92vw, calc(var(--col) - 24px));
    padding: 6px 12px;
    font-size: 13px;
    color: var(--paper);
    text-align: left;
    white-space: nowrap;
    background: color-mix(in srgb, var(--ink) 72%, transparent);
    border: 0;
    border-radius: 999px;
    translate: -50% 0;
    cursor: pointer;
  }
  .log {
    max-height: 50vh;
    margin: var(--sp-2) 0;
    overflow-y: auto;
  }
  .inline .log {
    max-height: 320px;
  }
  .msg {
    display: block;
    width: 100%;
    padding: 2px 0;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .mine b {
    color: var(--gold-d);
  }
  .new {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin: 0 4px;
    border-radius: 50%;
    background: var(--cinnabar);
  }
  .back {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: var(--sp-2);
    padding: 4px 0;
    font: inherit;
    font-size: var(--fs-2);
    color: inherit;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .coord {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    min-height: 28px;
    margin: 0 6px 2px 0;
    padding: 2px 10px;
    font: inherit;
    font-size: var(--fs-1);
    font-weight: 700;
    color: var(--azurite);
    background: color-mix(in srgb, var(--azurite) 12%, transparent);
    border: 0;
    border-radius: 999px;
    cursor: pointer;
  }
  input {
    min-width: 0;
    padding: 8px 10px;
    font: inherit;
    border: 1.5px solid var(--ink3);
    border-radius: var(--cut);
    background: var(--paper);
  }
</style>
