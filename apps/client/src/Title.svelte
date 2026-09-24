<script lang="ts">
  // Màn tiêu đề. 'first': tiêu đề → lời dẫn → đặt tên (server lập tông môn). 'splash': người cũ, chạm hoặc chờ 1.6 giây là vào.
  // wait: đã xong màn tiêu đề nhưng server chưa gửi state (mạng chậm) — hiện dòng "đang kết nối".
  import { onMount } from 'svelte'
  import { Button, Medal } from './ui'
  import { L, sfx, suggestNames } from './lib'

  let {
    mode,
    wait = false,
    onstart,
    ondone,
    onlogin,
  }: {
    mode: 'first' | 'splash'
    wait?: boolean
    onstart: (name: string) => Promise<string | null>
    ondone: () => void
    onlogin?: (how: { email: string; pass: string } | { code: string }) => Promise<string | null> // vào tông môn đã có (máy khác)
  } = $props()

  let step: 'title' | 'intro' | 'name' | 'stamp' | 'email' | 'code' = $state('title')
  let email = $state('')
  let pass = $state('')
  let code = $state('')
  let line = $state(0)
  const [first, ...rest] = suggestNames(4)
  let name = $state(first)
  let ideas = $state(rest)
  let error = $state('')
  let sending = $state(false)

  onMount(() => {
    if (mode !== 'splash') return
    const t = setTimeout(ondone, 1600)
    return () => clearTimeout(t)
  })

  function tapTitle() {
    sfx('tap')
    if (mode === 'splash') return ondone()
    step = 'intro'
  }
  function tapIntro() {
    sfx('tap')
    if (line < L.intro.length - 1) line++
    else step = 'name'
  }
  async function found(e: SubmitEvent) {
    e.preventDefault()
    if (sending) return
    const n = name.trim().replace(/\s+/g, ' ')
    if ([...n].length < 2 || [...n].length > 20) {
      error = L.naming.tooShort
      return
    }
    sending = true
    const err = await onstart(n)
    sending = false
    if (err) {
      error = err === 'name_taken' ? L.naming.taken : err === 'name' ? L.naming.bad : L.err.offline
      return
    }
    step = 'stamp'
    sfx('done')
    setTimeout(ondone, 1300)
  }
  async function login(e: SubmitEvent) {
    e.preventDefault()
    if (sending || !onlogin) return
    sending = true
    const err = await onlogin(step === 'code' ? { code } : { email, pass })
    sending = false
    if (err)
      return void (error =
        step === 'code' && err === 'wrong' ? L.account.err.code : (L.account.err[err] ?? L.account.err.server))
    sfx('done')
    ondone()
  }
  const to = (s: typeof step) => () => {
    error = ''
    step = s
  }
</script>

<div class="title-screen">
  {#if step === 'title'}
    <button class="cover" onclick={tapTitle} aria-label={L.tapToStart}>
      <span class="logo"><Medal emblem="crest" tone="gold" size={104} /></span>
      <span class="name">{L.game}</span>
      <span class="tag">{L.tagline}</span>
      <span class="tap">{wait ? L.net.connecting : L.tapToStart}</span>
    </button>
  {:else if step === 'intro'}
    <button class="cover dim" onclick={tapIntro}>
      <span class="lines stack">
        {#each L.intro.slice(0, line + 1) as text, i (i)}<span class="ln">{text}</span>{/each}
      </span>
      <span class="tap">{L.tapToContinue}</span>
    </button>
    <span class="skip"><Button variant="ghost" size="sm" onclick={() => (step = 'name')}>{L.skip}</Button></span>
  {:else if step === 'email' || step === 'code'}
    <div class="cover dim">
      <form class="card scroll-skin stack center" onsubmit={login}>
        <h2 class="t-title">{step === 'code' ? L.account.enterCode : L.account.login}</h2>
        {#if step === 'code'}
          <input
            bind:value={code}
            maxlength="12"
            autocomplete="one-time-code"
            autocapitalize="characters"
            aria-label={L.account.codeLabel}
            placeholder={L.account.codeLabel}
            oninput={() => (error = '')}
          />
        {:else}
          <input
            type="email"
            bind:value={email}
            autocomplete="email"
            aria-label={L.account.email}
            placeholder={L.account.email}
            oninput={() => (error = '')}
          />
          <input
            type="password"
            bind:value={pass}
            autocomplete="current-password"
            aria-label={L.account.pass}
            placeholder={L.account.pass}
            oninput={() => (error = '')}
          />
        {/if}
        {#if error}<p class="t-small t-bad">{error}</p>{/if}
        <Button
          variant="gold"
          size="lg"
          wide
          type="submit"
          silent
          disabled={sending ||
            (step === 'code' ? code.replace(/[^0-9a-z]/gi, '').length !== 8 : !email.includes('@') || pass.length < 8)}
          >{sending ? L.net.connecting : L.account.go}</Button
        >
        <Button variant="quiet" size="sm" onclick={to('name')}>{L.account.back}</Button>
      </form>
    </div>
  {:else}
    <div class="cover dim">
      <form class="card scroll-skin stack center" class:gone={step === 'stamp'} onsubmit={found}>
        <h2 class="t-title">{L.naming.title}</h2>
        <p class="t-small t-lore">{L.naming.hint}</p>
        <input bind:value={name} maxlength="20" aria-label={L.naming.title} oninput={() => (error = '')} />
        <div class="row wrap center">
          {#each ideas as idea (idea)}
            <Button variant="ghost" size="sm" onclick={() => (name = idea)}>{idea}</Button>
          {/each}
          <Button variant="quiet" size="sm" onclick={() => (ideas = suggestNames(3))}>{L.naming.reroll}</Button>
        </div>
        {#if error}<p class="t-small t-bad">{error}</p>{/if}
        <Button variant="gold" size="lg" wide type="submit" silent disabled={sending}
          >{sending ? L.net.connecting : L.naming.found}</Button
        >
        {#if onlogin}
          <div class="row wrap center">
            <Button variant="quiet" size="sm" onclick={to('email')}>{L.account.have} {L.account.login}</Button>
            <Button variant="quiet" size="sm" onclick={to('code')}>{L.account.enterCode}</Button>
          </div>
        {/if}
      </form>
      {#if step === 'stamp'}
        <div class="stamp stack center">
          <span class="slam"><Medal emblem="crest" tone="red" size={136} /></span>
          <span class="sectname">{name.trim()}</span>
          {#if wait}<span class="tap">{L.net.connecting}</span>{/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .title-screen {
    position: fixed;
    inset: 0;
    z-index: var(--z-hud);
    max-width: var(--col);
    margin: 0 auto;
  }
  .cover {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-2);
    width: 100%;
    padding: 0 var(--sp-5) calc(56px + var(--safe-b));
    color: var(--silk);
    text-align: center;
    background: linear-gradient(transparent 45%, rgb(var(--shade) / 0.72));
  }
  /* desktop: trải toàn màn hình, chữ lớn hơn */
  @media (min-width: 1024px) and (min-height: 600px) {
    .title-screen {
      max-width: none;
    }
    .cover {
      padding-bottom: 88px;
    }
    .name {
      font-size: calc(var(--fs-7) * 1.5);
    }
  }
  .dim {
    justify-content: center;
    background: rgb(var(--shade) / 0.66);
  }
  /* Huy hiệu tông môn (núi, mặt trời son) đập xuống như ấn, rồi tên game hiện ra */
  .logo {
    position: absolute;
    top: calc(64px + var(--safe-t));
    left: 50%;
    translate: -50% 0;
    filter: drop-shadow(0 6px 14px rgb(var(--shade) / 0.45));
    animation: slam 0.55s 0.5s var(--spring) both;
  }
  .name {
    padding: 0 18px 12px;
    font-size: var(--fs-7);
    font-style: italic;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: 0.02em;
    text-shadow: 0 2px 10px rgb(0 0 0 / 0.65);
    background: var(--stroke-gold) no-repeat center bottom / 100% 12px;
    animation: ink 1.2s 0.9s var(--ease) both;
  }
  .tag {
    font-style: italic;
    color: var(--gold-l);
  }
  /* dải mực quét ngang, chỉ vàng: như nét bút mời chạm */
  .tap {
    margin-top: var(--sp-5);
    padding: 13px 40px 14px;
    font-weight: 700;
    letter-spacing: 0.06em;
    border: 0 solid transparent;
    border-image: var(--sk-toast);
    animation: breathe 1.8s var(--ease) infinite;
  }
  @keyframes breathe {
    50% {
      opacity: 0.45;
    }
  }
  .lines {
    --gap: var(--sp-5);
    max-width: 320px;
  }
  .ln {
    font-size: var(--fs-5);
    font-style: italic;
    line-height: 1.55;
    animation: ink 1.2s var(--ease) both;
  }
  .skip {
    position: absolute;
    top: calc(var(--sp-3) + var(--safe-t));
    right: var(--sp-3);
  }
  .card {
    --gap: var(--sp-3);
    color: var(--text); /* hộp giấy nằm trong .cover chữ sáng: đặt lại màu mực */
    width: min(100%, 360px);
    padding: 30px 28px;
    box-shadow: var(--shadow-3);
    animation: ink 0.5s var(--ease) both;
    transition:
      opacity var(--dur-3),
      transform var(--dur-3);
  }
  .gone {
    opacity: 0;
    transform: scale(0.94);
  }
  input {
    width: 100%;
    padding: var(--sp-2);
    font-size: var(--fs-6);
    font-weight: 800;
    text-align: center;
    background: transparent;
    border: 0;
    border-bottom: 2px solid var(--ink);
  }
  input:focus {
    outline: none;
    border-color: var(--cinnabar);
  }
  .stamp {
    position: absolute;
    inset: 0;
    align-content: center;
    justify-items: center;
    --gap: var(--sp-4);
  }
  .slam {
    animation: slam 0.55s var(--spring) both;
  }
  .sectname {
    font-size: var(--fs-6);
    font-weight: 800;
    letter-spacing: 0.1em;
    animation: ink 0.8s 0.4s var(--ease) both;
  }
  @keyframes ink {
    from {
      opacity: 0;
      filter: blur(6px);
      transform: translateY(12px);
    }
  }
  @keyframes slam {
    from {
      opacity: 0;
      transform: scale(2.3) rotate(-14deg);
    }
  }
</style>
