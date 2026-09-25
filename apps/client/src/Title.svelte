<script lang="ts">
  // Màn tiêu đề. 'first': tiêu đề → lời dẫn → chọn đạo thống → đặt tên (server lập tông môn). 'splash': người cũ, chạm hoặc chờ 1.6 giây là vào.
  // wait: đã xong màn tiêu đề nhưng server chưa gửi state (mạng chậm) — hiện dòng "đang kết nối".
  import { onMount } from 'svelte'
  import { DAO_IDS, type DaoId } from '@rok/rules'
  import { DAO_TONES, artAll, onArtProgress } from '@rok/art'
  import { Button, Medal } from './ui'
  import { L, sfx, suggestNames } from './lib'
  import DaoChoose from './DaoChoose.svelte'

  let {
    mode,
    wait = false,
    onstart,
    ondone,
    onlogin,
  }: {
    mode: 'first' | 'splash'
    wait?: boolean
    onstart: (name: string, dao: DaoId) => Promise<string | null>
    ondone: () => void
    onlogin?: (how: { email: string; pass: string } | { code: string }) => Promise<string | null> // vào tông môn đã có (máy khác)
  } = $props()

  let step: 'title' | 'intro' | 'dao' | 'name' | 'stamp' | 'email' | 'code' = $state('title')
  let dao: DaoId = $state(DAO_IDS[0])
  let email = $state('')
  let pass = $state('')
  let code = $state('')
  let line = $state(0)
  const [first, ...rest] = suggestNames(4)
  let name = $state(first)
  let ideas = $state(rest)
  let error = $state('')
  let sending = $state(false)

  // Màn tiêu đề kiêm màn tải (như Godot): tải hết tranh (@rok/art artAll) rồi mới vào game — vào rồi không cảnh nào phải đợi.
  // Người mới vẫn xem lời dẫn, đặt tên trong lúc tải; tới bước vào game mà chưa xong thì đợi trên vạch tiến độ.
  let loaded = $state(1)
  let ready = $state(false) // artAll xong thật (vạch 100% giữa chừng không tính)
  let live = true
  onMount(() => onArtProgress((done, total) => (loaded = total ? done / total : 1)))
  onMount(() => void artAll().then(() => (ready = true)))
  onMount(() => () => void (live = false))
  let entered = false
  const go = () => {
    if (!live || entered) return
    entered = true
    ondone()
  }
  const enter = (min: number) => void Promise.all([new Promise(r => setTimeout(r, min)), artAll()]).then(go)
  onMount(() => {
    if (mode === 'splash') enter(1600) // người cũ: đủ 1.6 giây và tranh đã về
  })

  function tapTitle() {
    sfx('tap')
    if (mode === 'splash') return void (ready && go()) // đang tải: chạm không bỏ qua được
    step = 'intro'
  }
  function tapIntro() {
    sfx('tap')
    if (line < L.intro.length - 1) line++
    else step = 'dao'
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
    const err = await onstart(n, dao)
    sending = false
    if (err) {
      error = err === 'name_taken' ? L.naming.taken : err === 'name' ? L.naming.bad : L.err.offline
      return
    }
    step = 'stamp'
    sfx('done')
    enter(1300)
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
    enter(0)
  }
  const to = (s: typeof step) => () => {
    error = ''
    step = s
  }
</script>

<div class="title-screen">
  {#if !ready}
    <div class="load" role="progressbar" aria-valuenow={Math.round(loaded * 100)} aria-valuemin="0" aria-valuemax="100">
      <span class="bar"><i style:width="{loaded * 100}%"></i></span>
      <span class="pct">{Math.round(loaded * 100)}%</span>
    </div>
  {/if}
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
    <span class="skip"><Button variant="ghost" size="sm" onclick={() => (step = 'dao')}>{L.skip}</Button></span>
  {:else if step === 'dao'}
    <div class="cover dim pick">
      <h2 class="t-title">{L.dao.pick}</h2>
      <p class="t-small hint">{L.dao.pickHint}</p>
      <DaoChoose bind:value={dao} note={L.dao.note} onpick={() => (step = 'name')} />
    </div>
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
        <button type="button" class="dao row center" onclick={to('dao')} aria-label={L.dao.pick}>
          <Medal emblem={dao} tone={DAO_TONES[dao]} size={44} />
          <b>{L.dao.names[dao].name}</b>
          <small class="t-tiny t-soft">· {L.dao.swap}</small>
        </button>
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
          <span class="slam"><Medal emblem={dao} tone={DAO_TONES[dao]} size={136} /></span>
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
  /* chọn đạo thống: cả màn, trên nền núi tối — chữ sáng */
  .pick {
    --gap: var(--sp-1);
    justify-content: flex-start;
    gap: var(--sp-1);
    padding: calc(var(--sp-4) + var(--safe-t)) var(--sp-4) calc(var(--sp-4) + var(--safe-b));
    overflow-y: auto;
  }
  .pick .t-title {
    margin: 0;
    color: var(--gold-l);
  }
  .hint {
    max-width: 320px;
    margin: 0 0 var(--sp-2);
    opacity: 0.85;
  }
  .dao {
    gap: var(--sp-2);
    padding: 4px 12px 4px 4px;
    color: inherit;
    font: inherit;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    border: 0;
    border-radius: 999px;
    cursor: pointer;
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
    border-bottom: 2px solid var(--rim);
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
  .load {
    position: absolute;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 28px);
    translate: -50% 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    pointer-events: none;
  }
  .bar {
    width: min(46vw, 200px);
    height: 3px;
    background: color-mix(in srgb, var(--ink) 15%, transparent);
    border-radius: 2px;
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--ink);
    transition: width 0.3s;
  }
  .pct {
    font-size: var(--fs-1, 12px);
    font-variant-numeric: tabular-nums;
    color: var(--text);
    opacity: 0.7;
    min-width: 3ch;
  }
</style>
