<script lang="ts">
  // Tài khoản (trong Cài đặt): khách thì gắn email + mật khẩu; đã gắn thì đổi mật khẩu. Mã chuyển máy (một lần, 15 phút),
  // bật thông báo đẩy, đăng xuất / đăng xuất mọi nơi, xoá tài khoản. Server kiểm mọi thứ (apps/server/src/http/account.ts).
  import { onMount } from 'svelte'
  import type { Net } from './net'
  import { Button, Card, Section } from './ui'
  import { L, clock, sfx } from './lib'

  let { account, now, onout }: { account: Net['account']; now: number; onout: () => void } = $props()

  let info = $state<{ email: string | null; push: string | null } | null>(null)
  let email = $state('')
  let pass = $state('')
  let old = $state('')
  let msg = $state<{ text: string; bad?: boolean } | null>(null)
  let busy = $state(false)
  let code = $state<{ code: string; until: number } | null>(null)
  let out = $state<'one' | 'all' | 'remove' | null>(null) // đang hỏi lại trước khi đăng xuất / xoá
  let pushed = $state(typeof Notification !== 'undefined' && Notification.permission === 'granted')

  onMount(() => void account.info().then(r => r.ok && (info = r.data)))
  const fail = (e: string) => {
    msg = { text: L.account.err[e] ?? L.account.err.server, bad: true }
    sfx('err')
  }
  async function run(f: () => Promise<{ ok: true } | { ok: false; error: string }>, done?: string) {
    if (busy) return false
    busy = true
    msg = null
    const r = await f()
    busy = false
    if (!r.ok) {
      fail(r.error)
      return false
    }
    if (done) msg = { text: done }
    return true
  }
  async function link(e: SubmitEvent) {
    e.preventDefault()
    if (await run(() => account.link(email, pass))) {
      info = { ...info!, email: email.trim().toLowerCase() }
      pass = ''
      sfx('reward')
    }
  }
  async function change(e: SubmitEvent) {
    e.preventDefault()
    if (await run(() => account.password(old, pass), L.account.changed)) old = pass = ''
  }
  async function makeCode() {
    const r = await account.code()
    if (r.ok) code = r.data
    else fail(r.error)
  }
  async function push() {
    const r = await account.push(info!.push!)
    pushed = r === 'on'
    if (r === 'denied') msg = { text: L.push.denied, bad: true }
    else if (r !== 'on') fail('server')
  }
  async function leave() {
    const r = out === 'remove' ? await account.remove(pass || undefined) : await account.logout(out === 'all')
    if (r.ok) onout()
    else fail(r.error)
  }
</script>

<Section title={L.settings.account}>
  {#if info}
    <p class="t-small t-lore">{info.email ? L.account.linked(info.email) : L.account.guest}</p>
    {#if !info.email}
      <form class="stack" onsubmit={link}>
        <input
          type="email"
          bind:value={email}
          autocomplete="email"
          placeholder={L.account.email}
          aria-label={L.account.email}
        />
        <input
          type="password"
          bind:value={pass}
          autocomplete="new-password"
          minlength="8"
          placeholder={L.account.pass}
          aria-label={L.account.pass}
        />
        <Button variant="gold" wide type="submit" disabled={busy || !email.includes('@') || pass.length < 8}
          >{L.account.link}</Button
        >
      </form>
    {:else}
      <form class="stack" onsubmit={change}>
        <input
          type="password"
          bind:value={old}
          autocomplete="current-password"
          placeholder={L.account.old}
          aria-label={L.account.old}
        />
        <input
          type="password"
          bind:value={pass}
          autocomplete="new-password"
          minlength="8"
          placeholder={L.account.fresh}
          aria-label={L.account.fresh}
        />
        <Button variant="ghost" wide type="submit" disabled={busy || !old || pass.length < 8}>{L.account.change}</Button
        >
      </form>
    {/if}

    <Card>
      <div class="stack" style:--gap="4px">
        <b class="t-small">{L.account.code}</b>
        <small class="t-small t-soft">{L.account.codeHint}</small>
        {#if code && code.until > now}
          <p class="code t-num" aria-live="polite">{code.code.slice(0, 4)}-{code.code.slice(4)}</p>
          <small class="t-tiny t-soft">{L.account.codeLeft(clock(code.until - now))}</small>
        {:else}
          <Button size="sm" variant="ghost" disabled={busy} onclick={makeCode}>{L.account.makeCode}</Button>
        {/if}
      </div>
    </Card>

    {#if info.push && !pushed}<Button variant="ghost" wide icon="mail" onclick={push}
        >{L.push.toggle}: {L.push.on}</Button
      >{/if}
    {#if msg}<p class="t-small" class:t-bad={msg.bad} class:t-good={!msg.bad} role="status">{msg.text}</p>{/if}

    {#if out}
      <p class="t-small t-bad t-strong">
        {out === 'remove'
          ? `${L.account.removeHint} ${L.account.removeSure}`
          : !info.email
            ? L.account.guestOut
            : out === 'all'
              ? L.account.logoutAll
              : L.account.logout}
      </p>
      {#if out === 'remove' && info.email}<input
          type="password"
          bind:value={pass}
          autocomplete="current-password"
          placeholder={L.account.old}
          aria-label={L.account.old}
        />{/if}
      <div class="grid">
        <Button variant="ghost" onclick={() => ((out = null), (pass = ''))}>{L.panel.close}</Button>
        <Button variant="danger" disabled={out === 'remove' && !!info.email && !pass} onclick={leave}
          >{out === 'remove' ? L.account.remove : out === 'all' ? L.account.logoutAll : L.account.logout}</Button
        >
      </div>
    {:else}
      <div class="row wrap">
        <Button size="sm" variant="quiet" onclick={() => (out = 'one')}>{L.account.logout}</Button>
        <Button size="sm" variant="quiet" onclick={() => (out = 'all')}>{L.account.logoutAll}</Button>
        <Button size="sm" variant="quiet" onclick={() => (out = 'remove')}>{L.account.remove}</Button>
      </div>
    {/if}
  {/if}
</Section>

<style>
  input {
    width: 100%;
    padding: 8px 10px;
    font: inherit;
    border: 1.5px solid var(--ink3);
    border-radius: var(--cut);
    background: var(--paper);
  }
  .code {
    font-size: var(--fs-5);
    font-weight: 700;
    letter-spacing: 0.12em;
    user-select: all;
  }
</style>
