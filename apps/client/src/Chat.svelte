<script lang="ts">
  // Dải chat (chỉ ở tab Bản đồ và Tiên minh): một dòng tin mới nhất, chạm để mở kênh giới / tiên minh.
  // Chữ đã lọc ở server; người mình chặn thì ẩn ở đây (danh sách chặn nằm trong state của mình).
  import type { Channel, ChatMsg } from '@rok/protocol'
  import type { Net } from './net'
  import { Icon } from '@rok/art'
  import { Button, Sheet, Tabs } from './ui'
  import { L, clock } from './lib'
  import { useGame } from './game'

  type Api = Pick<Net, 'ask' | 'say' | 'report' | 'onChat'>
  let {
    me,
    ally = false,
    api,
    toast,
    inline = false,
  }: {
    me: number | null
    ally?: boolean
    api: Api | null
    toast: (t: string) => void
    inline?: boolean
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  const channels = $derived<Channel[]>(ally ? ['world', 'ally'] : ['world'])
  let ch = $state<Channel>('world')
  let open = $state(false)
  let text = $state('')
  let logs = $state<Record<Channel, ChatMsg[]>>({ world: [], ally: [] })
  let pick = $state<ChatMsg | null>(null)
  $effect(() => {
    if (!api) return
    for (const c of channels)
      void api.ask({ k: 'chat', ch: c }).then(list => {
        if (list) logs = { ...logs, [c]: list }
      })
    return api.onChat((c, ms) => (logs = { ...logs, [c]: [...logs[c], ...ms].slice(-50) }))
  })
  const shown = $derived(logs[ch].filter(m => !game.blocks.includes(m.pid)))
  const last = $derived(
    [...logs.world, ...(ally ? logs.ally : [])]
      .filter(m => !game.blocks.includes(m.pid))
      .sort((a, b) => a.at - b.at)
      .at(-1),
  )
  async function send(e: SubmitEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || !api) return
    const r = await api.say(ch, t)
    if (r.ok) text = ''
    else toast(L.chat.err[r.err] ?? L.chat.err.bad)
  }
  const ago = (at: number) => clock(Math.max(0, game.time - at)).replace(/:\d\d$/, '')
</script>

{#snippet body()}
  <Tabs
    items={channels.map(id => ({ id, label: L.chat[id] }))}
    value={ch}
    onchange={c => {
      ch = c as Channel
      pick = null
    }}
  />
  {#if ch === 'world' && game.levels.chuDien < 3}<p class="t-small t-soft mt-2">{L.chat.locked}</p>{/if}
  <ol class="log stack" style:--gap="4px">
    {#each shown as m (m.id)}
      <li>
        <button class="msg" class:mine={m.pid === me} onclick={() => (pick = pick?.id === m.id ? null : m)}>
          <b class="t-small">{m.name}</b> <span class="t-small">{m.text}</span>
          <small class="t-tiny t-faint">{ago(m.at)}</small>
        </button>
        {#if pick?.id === m.id && m.pid !== me}
          <div class="row wrap" style:--gap="6px">
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
    <Button size="sm" disabled={!text.trim()}>{L.chat.send}</Button>
  </form>
{/snippet}

{#if inline}
  <div class="inline stack">{@render body()}</div>
{:else}
  <button class="strip" onclick={() => (open = true)} aria-label={L.chat.world}>
    <Icon name="mail" size={14} />
    {#if last}<b>{last.name}:</b> <span class="t-ellipsis">{last.text}</span>{:else}<span class="t-soft"
        >{L.chat.empty}</span
      >{/if}
  </button>
  <Sheet {open} onclose={() => (open = false)} title={L.chat[ch]}>{@render body()}</Sheet>
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
  input {
    min-width: 0;
    padding: 8px 10px;
    font: inherit;
    border: 1.5px solid var(--ink3);
    border-radius: var(--cut);
    background: var(--paper);
  }
</style>
