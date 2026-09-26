<script lang="ts">
  // Luận Đạo Bảng (threads — luật ở rules/world/board.ts): danh sách chủ đề của cả giới (sôi nổi trước) và ô mở chủ đề; chạm một chủ đề
  // thì xem đủ lời, trả lời; chủ đề của mình xoá được
  import { BOARD_TEXT, BOARD_TITLE, CHAT_HALL } from '@rok/rules'
  import type { WorldAction } from '@rok/rules/world'
  import type { Ack, Answer } from '@rok/protocol'
  import type { Net } from './net'
  import { Button, Card, Speech } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let {
    me,
    ask,
    send,
    toast,
  }: { me: number | null; ask?: Net['ask']; send?: (a: WorldAction) => Promise<Ack>; toast: (t: string) => void } =
    $props()
  const g = useGame()
  const can = $derived(!!send && g.game.levels.chuDien >= CHAT_HALL)
  let rows = $state<Answer['board']>([])
  let topic = $state<Answer['topic']>(null)
  let title = $state('')
  let body = $state('')
  let reply = $state('')
  const load = () => ask?.({ k: 'board' }).then(r => r && (rows = r))
  const show = (id: number) => ask?.({ k: 'topic', id }).then(t => (topic = t))
  $effect(() => {
    void load()
  })
  const ago = (at: number) => L.chat.ago(Math.max(0, g.now - at))
  async function act(a: WorldAction) {
    if (!send) return false
    const r = await send(a)
    if (!r.ok) toast(L.err[r.err] ?? L.err.bad)
    return r.ok
  }
  async function post(e: SubmitEvent) {
    e.preventDefault()
    if (!(await act({ type: 'boardPost', title, text: body }))) return
    title = body = ''
    void load()
  }
  async function answer(e: SubmitEvent) {
    e.preventDefault()
    if (!topic || !(await act({ type: 'boardReply', id: topic.id, text: reply }))) return
    reply = ''
    void show(topic.id)
  }
  function back() {
    topic = null
    void load()
  }
  async function drop(id: number) {
    if (!(await act({ type: 'boardDel', id }))) return
    topic = null
    void load()
  }
</script>

{#if topic}
  <!-- một chủ đề: lời mở, các lời trả lời, ô trả lời -->
  <div class="stack" style:--gap="6px">
    <div class="row between">
      <Button size="sm" variant="quiet" icon="back" onclick={back}>{L.board.back}</Button>
      {#if topic.pid === me}<Button size="sm" variant="quiet" onclick={() => topic && drop(topic.id)}
          >{L.board.del}</Button
        >{/if}
    </div>
    <b class="t-head">{topic.title}</b>
    <Speech fit side="left"
      ><b class="t-tiny">{topic.name}</b><span class="t-small">{topic.text}</span>
      <small class="t-tiny t-faint">{ago(topic.at)}</small></Speech
    >
    {#each topic.replies as r, i (i)}
      <Speech fit side="left"
        ><b class="t-tiny">{r.name}</b><span class="t-small">{r.text}</span>
        <small class="t-tiny t-faint">{ago(r.at)}</small></Speech
      >
    {/each}
    {#if !topic.replies.length}<p class="t-small t-soft">{L.board.noReply}</p>{/if}
    {#if can}
      <form class="row" style:--gap="6px" onsubmit={answer}>
        <input class="grow" bind:value={reply} maxlength={BOARD_TEXT} placeholder={L.board.reply} />
        <Button size="sm" variant="gold" type="submit" disabled={!reply.trim()}>{L.board.send}</Button>
      </form>
    {/if}
  </div>
{:else}
  <div class="stack" style:--gap="6px">
    <p class="t-small t-soft">{L.board.hint}</p>
    {#each rows as r (r.id)}
      <Card>
        <button class="w-full t-left stack" style:--gap="2px" onclick={() => show(r.id)}>
          <b class="t-small">{r.title}</b>
          <small class="t-tiny t-soft">{r.name} · {L.board.replies(r.n)} · {ago(r.last)}</small>
        </button>
      </Card>
    {/each}
    {#if !rows.length}<p class="t-small t-soft">{L.board.none}</p>{/if}
    {#if can}
      <form class="stack" style:--gap="6px" onsubmit={post}>
        <input bind:value={title} maxlength={BOARD_TITLE} placeholder={L.board.title} />
        <textarea bind:value={body} maxlength={BOARD_TEXT} rows="2" placeholder={L.board.body}></textarea>
        <Button size="sm" variant="gold" type="submit" disabled={!title.trim() || !body.trim()}>{L.board.post}</Button>
      </form>
    {:else}<p class="t-small t-soft">{L.board.locked}</p>{/if}
  </div>
{/if}
