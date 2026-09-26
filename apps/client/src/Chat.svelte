<script lang="ts">
  // Dải chat (chỉ ở tab Bản đồ và Tiên minh): một dòng tin mới nhất, chạm để mở kênh giới / tiên minh / truyền âm.
  // Chữ đã lọc ở server; người mình chặn thì ẩn ở đây (danh sách chặn nằm trong state của mình).
  // Toạ độ "(x,y)" trong tin (chia sẻ từ bản đồ giới) thành nút nhảy tới ô đó, như link toạ độ xanh của RoK.
  // Chạm một tin: hồ sơ người gửi, truyền âm riêng, chặn, báo cáo, trả lời (trích dẫn "#q<mã>"); tin của mình thu hồi được trong
  // 2 phút. Hàng biểu cảm chèn emoji vào ô gõ. Truyền âm: nhóm chat tự tạo + cuộc gần đây → từng cuộc.
  // Tin là bong bóng lời nói (như cố vấn ở Advisor): người khác bên trái, mình bên phải tô son nhạt.
  import type { Ack, Channel, ChatMsg, Dm, FriendView, GroupView } from '@rok/protocol'
  import type { WorldAction } from '@rok/rules/world'
  import { ELDERS, RARITY, type ElderId, type Report } from '@rok/rules'
  import type { Net } from './net'
  import { Icon, Portrait } from '@rok/art'
  import { Button, Sheet, Tabs } from './ui'
  import { L, LOOK, clock, coords } from './lib'
  import { useGame } from './game'
  import { social } from './social.svelte'

  type Api = Pick<Net, 'ask' | 'say' | 'report' | 'onChat' | 'unsay'>
  type Tab = 'world' | 'ally' | 'dm'
  let {
    me,
    ally = false,
    api,
    toast,
    inline = false,
    onmap,
    onreplay,
    narrow = false,
    send: act2,
  }: {
    me: number | null
    ally?: boolean
    api: Api | null
    toast: (t: string) => void
    inline?: boolean
    onmap?: (x: number, y: number) => void // nhảy tới ô trên bản đồ giới
    onreplay?: (r: Report) => void // xem trận người khác chia sẻ ("#r<id>" trong tin)
    narrow?: boolean // dải chat ở núi: chừa chỗ nút tạp dịch bên phải
    send?: (a: WorldAction) => Promise<Ack> // nhóm chat: lập, rời
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const act = g.act

  const tabs = $derived<Tab[]>(ally ? ['world', 'ally', 'dm'] : ['world', 'dm'])
  let tab = $state<Tab>('world')
  let peer = $state<{ ch: Channel; name: string } | null>(null) // cuộc truyền âm / nhóm đang xem
  const ch = $derived<Channel | null>(tab !== 'dm' ? tab : (peer?.ch ?? null))
  let open = $state(false)
  let text = $state('')
  let logs = $state<Record<string, ChatMsg[]>>({})
  let dms = $state<Dm[]>([]) // các cuộc truyền âm, mới nhất trước
  let groups = $state<GroupView[]>([]) // nhóm chat tự tạo của mình
  let friends = $state<FriendView[]>([]) // đạo hữu đã kết giao (tải khi mở thẻ Truyền âm)
  let unread = $state<string[]>([]) // kênh truyền âm / nhóm có tin chưa đọc
  let groupName = $state('')
  const loadGroups = () => api?.ask({ k: 'groups' }).then(list => list && (groups = list))
  const group = $derived(peer?.ch[0] === 'g' ? groups.find(x => `g${x.id}` === peer?.ch) : undefined)
  let pick = $state<ChatMsg | null>(null)
  let reply = $state<ChatMsg | null>(null) // đang trả lời tin này
  let emoji = $state(false)
  const EMOJI = ['😀', '😂', '😍', '👍', '🙏', '🔥', '⚔️', '🛡️', '💰', '🎉', '😢', '😡']
  const RECALL = 120_000 // như server: thu hồi trong 2 phút
  const put = (c: string, list: ChatMsg[]) => (logs = { ...logs, [c]: list.slice(-50) })
  // tin tới cùng mã (tin vừa thu hồi) thay tin cũ, tin mới nối vào cuối
  const merge = (old: ChatMsg[], ms: ChatMsg[]) => [
    ...old.map(m => ms.find(x => x.id === m.id) ?? m),
    ...ms.filter(x => !old.some(m => m.id === x.id)),
  ]
  const viewing = (c: string) => (open || inline) && tab === 'dm' && peer?.ch === c
  $effect(() => {
    if (!api) return
    for (const c of ally ? (['world', 'ally'] as const) : (['world'] as const))
      void api.ask({ k: 'chat', ch: c }).then(list => list && put(c, list))
    void api.ask({ k: 'dms' }).then(list => list && (dms = list))
    void loadGroups()
    void api.ask({ k: 'friends' }).then(list => list && (friends = list))
    return api.onChat((c, ms) => {
      put(c, merge(logs[c] ?? [], ms))
      if (c[0] !== 'p' && c[0] !== 'g') return
      const last = ms.at(-1)!
      if (c[0] === 'p') {
        const pid = Number(c.slice(1))
        const name = last.pid === pid ? last.name : (dms.find(d => d.pid === pid)?.name ?? peer?.name ?? '?')
        dms = [{ pid, name, last }, ...dms.filter(d => d.pid !== pid)]
      } else if (groups.some(x => `g${x.id}` === c)) groups = groups.map(x => (`g${x.id}` === c ? { ...x, last } : x))
      else void loadGroups() // vừa được thêm vào nhóm mới
      if (last.pid !== me && !viewing(c)) unread = [...new Set([...unread, c])]
    })
  })
  function openPeer(p: { ch: Channel; name: string }) {
    tab = 'dm'
    peer = p
    open = true
    pick = null
    unread = unread.filter(x => x !== p.ch)
    if (!logs[p.ch]) void api?.ask({ k: 'chat', ch: p.ch }).then(list => list && put(p.ch, list))
  }
  const openDm = (p: { pid: number; name: string }) => openPeer({ ch: `p${p.pid}`, name: p.name })
  async function newGroup(e: SubmitEvent) {
    e.preventDefault()
    if (!act2 || !(await act2({ type: 'groupNew', name: groupName })).ok) return
    groupName = ''
    void loadGroups()
  }
  async function leaveGroup(id: number) {
    if (!act2 || !(await act2({ type: 'groupLeave', id })).ok) return
    peer = null
    void loadGroups()
  }
  // Hồ sơ (hay chỗ khác) bấm Truyền âm: chat đang hiện mở cuộc đó
  $effect(() => {
    if (!social.dm) return
    openDm(social.dm)
    social.dm = null
  })
  const shown = $derived(ch ? (logs[ch] ?? []).filter(m => !game.blocks.includes(m.pid)) : [])
  const last = $derived(
    [
      ...(logs.world ?? []),
      ...(ally ? (logs.ally ?? []) : []),
      ...dms.map(d => d.last),
      ...groups.flatMap(x => x.last ?? []),
    ]
      .filter(m => !game.blocks.includes(m.pid))
      .sort((a, b) => a.at - b.at)
      .at(-1),
  )
  async function send(e: SubmitEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || !api || !ch) return
    const r = await api.say(ch, `${reply ? `#q${reply.id} ` : ''}${t}`)
    if (r.ok) {
      text = ''
      reply = null
    } else toast(L.chat.err[r.err] ?? L.chat.err.bad)
  }
  async function recall(m: ChatMsg) {
    pick = null
    if (!(await api?.unsay(m.id))) toast(L.chat.recallLate)
  }
  // tin được trả lời ("#q<mã>" đầu tin): tìm trong kênh đang xem
  const quoteOf = (t: string) => {
    const id = Number(/^#q(\d{1,9}) /.exec(t)?.[1])
    return id ? (logs[ch ?? ''] ?? []).find(m => m.id === id) : undefined
  }
  const ago = (at: number) => clock(Math.max(0, game.time - at)).replace(/:\d\d$/, '')
  // thẻ trưởng lão chia sẻ trong tin: "#tl:<trưởng lão>:<cấp>:<sao>" — chat vẽ thẻ; mã (cả mã chiến báo) bỏ khỏi chữ
  const TL = /#tl:(\w+):(\d{1,3}):([1-6])/g
  const cards = (t: string) =>
    [...t.matchAll(TL)]
      .filter(m => Object.hasOwn(ELDERS, m[1]))
      .map(m => ({ e: m[1] as ElderId, lv: Number(m[2]), star: Number(m[3]) }))
  const plain = (t: string) =>
    t
      ? t
          .replace(TL, '')
          .replace(/#r\d{1,9}\b/g, '')
          .replace(/^#q\d{1,9} /, '')
          .trim() // mã chiến báo có nút Xem trận riêng, mã trả lời vẽ thành trích dẫn
      : L.chat.recalled
  // chiến báo chia sẻ trong tin: "#r<id>" (của chính người gửi)
  const shared = (t: string) => [...t.matchAll(/#r(\d{1,9})\b/g)].map(m => Number(m[1]))
  async function watch(m: ChatMsg, id: number) {
    const r = await api?.ask({ k: 'shared', pid: m.pid, id })
    if (!r) return toast(L.chat.err.unavailable)
    open = false
    onreplay?.(r)
  }
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
      if (t === 'dm') {
        void loadGroups()
        void api?.ask({ k: 'friends' }).then(list => list && (friends = list))
      }
    }}
  />
  {#if tab === 'dm' && !peer}
    <ul class="log stack" style:--gap="4px">
      <!-- đạo hữu (đang chơi trước), nhóm chat tự tạo, rồi các cuộc truyền âm -->
      {#if friends.length}
        <li class="row wrap" style:--gap="4px">
          <small class="t-tiny t-soft">{L.chat.friends}</small>
          {#each [...friends].sort((a, b) => Number(b.online) - Number(a.online)) as f (f.pid)}
            <button class="friend" class:on={f.online} onclick={() => openDm(f)}>{f.name}</button>
          {/each}
        </li>
      {/if}
      {#each groups as x (x.id)}
        <li>
          <button class="msg" onclick={() => openPeer({ ch: `g${x.id}`, name: x.name })}>
            <b class="t-small"><Icon name="people" size={12} /> {x.name}</b>{#if unread.includes(`g${x.id}`)}<span
                class="new"
                aria-hidden="true"
              ></span>{/if}
            <span class="t-small t-soft"
              >{x.last ? `${x.last.name}: ${plain(x.last.text)}` : L.chat.members(x.members.length)}</span
            >
          </button>
        </li>
      {/each}
      {#each dms.filter(d => !game.blocks.includes(d.pid)) as d (d.pid)}
        <li>
          <button class="msg" onclick={() => openDm(d)}>
            <b class="t-small">{d.name}</b>{#if unread.includes(`p${d.pid}`)}<span class="new" aria-hidden="true"
              ></span>{/if}
            <span class="t-small t-soft">{plain(d.last.text)}</span>
            <small class="t-tiny t-faint">{ago(d.last.at)}</small>
          </button>
        </li>
      {/each}
      {#if !dms.length && !groups.length}<li class="t-small t-soft">{L.chat.dmNone}</li>{/if}
    </ul>
    {#if act2}
      <form class="row mt-2" onsubmit={newGroup}>
        <input
          class="grow"
          bind:value={groupName}
          maxlength="20"
          placeholder={L.chat.groupName}
          aria-label={L.chat.groupName}
        />
        <Button size="sm" type="submit" icon="people" disabled={[...groupName.trim()].length < 2}
          >{L.chat.groupNew}</Button
        >
      </form>
      <small class="t-tiny t-soft">{L.chat.groupHint}</small>
    {/if}
  {:else}
    {#if peer}<button class="back" onclick={() => (peer = null)}
        ><Icon name="back" size={14} />{L.chat.back} · <b>{peer.name}</b></button
      >{/if}
    {#if group}
      <!-- nhóm: người trong nhóm (thêm người từ hồ sơ của họ), rời nhóm -->
      <div class="row wrap" style:--gap="4px">
        <small class="grow t-tiny t-soft">{group.members.map(x => x.name).join(' · ')}</small>
        {#if act2}<Button size="sm" variant="quiet" onclick={() => group && leaveGroup(group.id)}
            >{L.chat.groupLeave}</Button
          >{/if}
      </div>
    {/if}
    {#if tab === 'world' && game.levels.chuDien < 3}<p class="t-small t-soft mt-2">{L.chat.locked}</p>{/if}
    <ol class="log talk stack" style:--gap="6px">
      {#each shown as m (m.id)}
        <li>
          <button class="msg" class:mine={m.pid === me} onclick={() => (pick = pick?.id === m.id ? null : m)}>
            {#if quoteOf(m.text)}{@const q = quoteOf(m.text)!}<span class="quote t-tiny"
                ><Icon name="back" size={10} /> {q.name}: {plain(q.text)}</span
              >{/if}
            <b class="t-small">{m.name}</b> <span class="t-small" class:gone={!m.text}>{plain(m.text)}</span>
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
          {#each cards(m.text) as c, k (k)}
            <span class="elder rar{RARITY[c.e]}"
              ><Portrait look={LOOK[c.e]} size={28} /><b class="t-small">{L.elders[c.e].name}</b><small class="t-tiny"
                >{L.lv(c.lv)} {'★'.repeat(c.star)}</small
              ></span
            >
          {/each}
          {#if onreplay}
            {#each shared(m.text) as id (id)}
              <button class="coord" onclick={() => watch(m, id)}
                ><Icon name="swords" size={12} />{L.report.watch}</button
              >
            {/each}
          {/if}
          {#if pick?.id === m.id && m.text}
            <div class="row wrap" style:--gap="6px">
              <Button
                size="sm"
                variant="ghost"
                onclick={() => {
                  reply = m
                  pick = null
                }}>{L.chat.reply}</Button
              >
              {#if m.pid === me && game.time - m.at < RECALL}<Button size="sm" variant="quiet" onclick={() => recall(m)}
                  >{L.chat.recall}</Button
                >{/if}
            </div>
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
    {#if reply}
      <p class="row replying t-tiny">
        <Icon name="back" size={10} /><span class="grow t-ellipsis"
          >{L.chat.replyTo(reply.name)}: {plain(reply.text)}</span
        >
        <button class="x" aria-label={L.chat.cancel} onclick={() => (reply = null)}>×</button>
      </p>
    {/if}
    {#if emoji}
      <div class="row wrap emojis" style:--gap="2px">
        {#each EMOJI as e (e)}<button class="emo" onclick={() => (text += e)}>{e}</button>{/each}
      </div>
    {/if}
    <form class="row" onsubmit={send}>
      <button type="button" class="emo" aria-label={L.chat.emoji} aria-pressed={emoji} onclick={() => (emoji = !emoji)}
        >😀</button
      >
      <input class="grow" bind:value={text} maxlength="200" placeholder={L.chat.say} aria-label={L.chat.say} />
      <Button size="sm" type="submit" disabled={!text.trim()}>{L.chat.send}</Button>
    </form>
  {/if}
{/snippet}

{#if inline}
  <div class="inline stack">{@render body()}</div>
{:else}
  <button class="strip" class:narrow onclick={() => (open = true)} aria-label={L.chat.world}>
    <Icon name="mail" size={14} />{#if unread.length}<span class="new" aria-hidden="true"></span>{/if}
    {#if last}<b>{last.name}:</b> <span class="t-ellipsis">{plain(last.text)}</span>{:else}<span class="t-soft"
        >{L.chat.empty}</span
      >{/if}
  </button>
  <Sheet {open} onclose={() => (open = false)} title={L.chat[tab]}>{@render body()}</Sheet>
{/if}

<style>
  .quote {
    display: block;
    margin-bottom: 2px;
    padding-left: 6px;
    border-left: 2px solid var(--paper3);
    color: var(--text-soft);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .gone {
    font-style: italic;
    color: var(--text-faint);
  }
  .replying {
    padding: 2px 6px;
    border-left: 2px solid var(--gold);
    background: var(--paper2);
  }
  .x {
    padding: 0 6px;
    font-size: var(--fs-3);
  }
  .emo {
    min-width: 32px;
    min-height: 32px;
    font-size: 18px;
    line-height: 1;
  }
  .elder {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 2px 0 0 6px;
    padding: 2px 8px 2px 2px;
    border: 1.5px solid var(--paper3);
    border-radius: 999px;
    background: var(--paper2);
  }
  .rar2 {
    border-color: var(--azurite);
  }
  .rar3 {
    border-color: #9b73c4;
  }
  .rar4 {
    border-color: var(--gold-d, #9a6b16);
  }
  .friend {
    padding: 2px 8px;
    font: inherit;
    font-size: var(--fs-1);
    color: var(--text);
    background: color-mix(in srgb, var(--paper2) 80%, transparent);
    border: 1px solid var(--line, rgb(var(--shade) / 0.2));
    border-radius: 999px;
    cursor: pointer;
  }
  .friend.on::before {
    content: '●';
    margin-right: 3px;
    color: var(--malachite);
  }
  .strip {
    position: fixed;
    left: 50%;
    bottom: calc(var(--safe-b) + var(--nav-h, 88px));
    z-index: var(--z-hud);
    display: flex;
    align-items: center;
    gap: 6px;
    width: min(92vw, calc(var(--col) - 24px));
    padding: 6px 12px;
    font-size: 13px;
    color: var(--text);
    text-align: left;
    white-space: nowrap;
    /* nền giấy mờ thay viên mực đen: hoà vào tranh thủy mặc, không thành vệt tối đè ngang cảnh */
    background: color-mix(in srgb, var(--paper2) 78%, transparent);
    border: 1px solid color-mix(in srgb, var(--paper3) 80%, transparent);
    box-shadow: 0 1px 4px rgb(var(--shade) / 0.15);
    border-radius: 999px;
    translate: -50% 0;
    cursor: pointer;
  }
  .strip.narrow {
    left: 12px;
    width: min(calc(100vw - 110px), calc(var(--col) - 110px));
    translate: 0 0;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .strip.narrow {
      left: calc(var(--rail) + 16px);
    }
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
    padding: 4px 0;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;
  }
  .log:not(.talk) > li {
    border-bottom: 1px dashed var(--paper3);
  }
  /* bong bóng lời nói: giấy trắng viền mực, góc nhọn phía người nói */
  .talk .msg {
    width: auto;
    max-width: 88%;
    padding: 5px 11px 6px;
    background: rgb(255 255 255 / 0.92);
    border: 1.5px solid var(--rim, var(--ink3));
    border-radius: 14px 14px 14px 4px;
    box-shadow: 0 2px 6px rgb(var(--shade) / 0.12);
  }
  .talk .msg > b {
    display: block;
    font-size: var(--fs-1);
  }
  .talk .msg.mine {
    margin-left: auto;
    background: color-mix(in srgb, var(--cinnabar) 9%, var(--paper));
    border-radius: 14px 14px 4px 14px;
  }
  .talk > li:has(.mine) {
    display: grid;
    justify-items: end;
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
    border: 1.5px solid var(--rim, var(--ink3));
    border-radius: var(--cut);
    background: var(--paper);
  }
</style>
