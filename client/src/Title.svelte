<script lang="ts">
  // Màn tiêu đề. 'first': tiêu đề → lời dẫn → đặt tên. 'splash': người cũ, chạm hoặc chờ 1.6 giây là vào.
  import { onMount } from 'svelte'
  import { L, sfx, suggestNames } from './lib'

  let { mode, onstart, ondone }: { mode: 'first' | 'splash'; onstart: (name: string) => void; ondone: () => void } = $props()

  let step: 'title' | 'intro' | 'name' | 'stamp' = $state('title')
  let line = $state(0)
  const [first, ...rest] = suggestNames(4)
  let name = $state(first)
  let ideas = $state(rest)
  let error = $state('')

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
  function found(e: SubmitEvent) {
    e.preventDefault()
    const n = name.trim().replace(/\s+/g, ' ')
    if (n.length < 2 || n.length > 16) {
      error = L.naming.tooShort
      return
    }
    step = 'stamp'
    sfx('done')
    setTimeout(() => onstart(n), 1300)
  }
</script>

<div class="title-screen">
  {#if step === 'title'}
    <button class="cover" onclick={tapTitle} aria-label={L.tapToStart}>
      <span class="logo">
        <span class="han">{L.gameHan}</span>
        <span class="seal">宗</span>
      </span>
      <span class="vi">{L.game}</span>
      <span class="tag">{L.tagline}</span>
      <span class="tap">{L.tapToStart}</span>
    </button>
  {:else if step === 'intro'}
    <button class="cover dark" onclick={tapIntro}>
      <span class="lines">
        {#each L.intro.slice(0, line + 1) as text, i (i)}
          <span class="ln">{text}</span>
        {/each}
      </span>
      <span class="tap">{L.tapToContinue}</span>
    </button>
    <button class="skip" onclick={() => (step = 'name')}>{L.skip}</button>
  {:else}
    <div class="cover dark">
      <form class="card" class:gone={step === 'stamp'} onsubmit={found}>
        <h2>{L.naming.title}</h2>
        <p class="hint">{L.naming.hint}</p>
        <input bind:value={name} maxlength="16" aria-label={L.naming.title} oninput={() => (error = '')} />
        <div class="ideas">
          {#each ideas as idea (idea)}
            <button type="button" class="idea" onclick={() => (name = idea)}>{idea}</button>
          {/each}
          <button type="button" class="idea more" onclick={() => (ideas = suggestNames(3))}>{L.naming.reroll}</button>
        </div>
        {#if error}<p class="err">{error}</p>{/if}
        <button class="found">{L.naming.found}</button>
      </form>
      {#if step === 'stamp'}
        <div class="stamp">
          <span class="bigseal">宗</span>
          <span class="sectname">{name.trim()}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .title-screen {
    position: fixed;
    inset: 0;
    z-index: 10;
    max-width: 480px;
    margin: 0 auto;
  }
  .cover {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    width: 100%;
    padding: 0 24px calc(56px + env(safe-area-inset-bottom));
    font: inherit;
    color: #fff;
    text-align: center;
    background: linear-gradient(rgb(255 255 255 / 0) 40%, rgb(8 18 26 / 0.75));
    border: 0;
    cursor: pointer;
  }
  .cover.dark {
    justify-content: center;
    background: rgb(8 18 26 / 0.72);
    cursor: default;
  }
  button.cover.dark {
    cursor: pointer;
  }

  /* Đề từ dọc như trên tranh, ấn đỏ bên dưới */
  .logo {
    position: absolute;
    top: calc(64px + env(safe-area-inset-top));
    right: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    animation: ink 1.6s ease-out both;
  }
  .han {
    font: 70px/1.05 var(--seal);
    color: #13222b;
    letter-spacing: 4px;
    writing-mode: vertical-rl;
    text-shadow: 0 0 24px rgb(255 255 255 / 0.9);
  }
  .seal {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    font: 30px/1 var(--seal);
    color: #fff;
    background: var(--cinnabar);
    border-radius: 6px;
    box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.35);
    transform: rotate(-3deg);
    animation: stampIn 0.5s 1.1s cubic-bezier(0.3, 1.6, 0.5, 1) both;
  }
  @keyframes ink {
    from {
      opacity: 0;
      filter: blur(6px);
      transform: translateY(12px);
    }
  }
  @keyframes stampIn {
    from {
      opacity: 0;
      transform: scale(2) rotate(-14deg);
    }
  }
  .vi {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    text-shadow: 0 2px 8px rgb(0 0 0 / 0.5);
  }
  .tag {
    font-size: 13px;
    color: var(--gold-l);
    letter-spacing: 0.04em;
  }
  .tap {
    margin-top: 26px;
    padding: 10px 26px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.08em;
    border: 1px solid rgb(241 217 143 / 0.7);
    border-radius: 999px;
    background: rgb(8 18 26 / 0.45);
    animation: breathe 1.8s ease-in-out infinite;
  }
  @keyframes breathe {
    50% {
      opacity: 0.45;
    }
  }

  .lines {
    display: grid;
    gap: 22px;
    max-width: 320px;
  }
  .ln {
    font-size: 19px;
    line-height: 1.55;
    animation: ink 1.2s ease-out both;
  }
  .skip {
    position: absolute;
    top: calc(14px + env(safe-area-inset-top));
    right: 14px;
    padding: 6px 14px;
    font-size: 13px;
    color: #fff;
    background: rgb(255 255 255 / 0.12);
    border: 1px solid rgb(255 255 255 / 0.3);
    border-radius: 999px;
    cursor: pointer;
  }

  .card {
    display: grid;
    gap: 12px;
    width: min(100%, 360px);
    padding: 22px 20px;
    color: var(--ink);
    text-align: center;
    background: linear-gradient(#f7f9f5, #e6eee9);
    border: 1px solid var(--gold);
    border-radius: 18px;
    box-shadow: 0 20px 40px rgb(0 0 0 / 0.4);
    animation: ink 0.5s ease-out both;
    transition: opacity 0.4s, transform 0.4s;
  }
  .card.gone {
    opacity: 0;
    transform: scale(0.94);
  }
  h2 {
    font-size: 20px;
  }
  .hint {
    font-size: 13px;
    color: var(--wash);
  }
  input {
    width: 100%;
    padding: 12px;
    font: 600 20px var(--font);
    color: var(--ink);
    text-align: center;
    background: #fff;
    border: 0;
    border-bottom: 2px solid var(--azurite);
    border-radius: 10px 10px 4px 4px;
  }
  input:focus {
    outline: 2px solid var(--gold);
  }
  .ideas {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
  }
  .idea {
    padding: 6px 10px;
    font-size: 13px;
    color: var(--azurite);
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
  }
  .idea.more {
    color: var(--wash);
    border-style: dashed;
  }
  .err {
    font-size: 13px;
    color: var(--cinnabar);
  }
  .found {
    min-height: 50px;
    margin-top: 4px;
    font-size: 17px;
    font-weight: 700;
    color: #2b2210;
    background: linear-gradient(#f8e3a0, #c9a14a);
    border: 0;
    border-radius: 14px;
    box-shadow: 0 4px 0 #7c5f22;
    cursor: pointer;
  }
  .found:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #7c5f22;
  }

  .stamp {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 16px;
  }
  .bigseal {
    display: grid;
    place-items: center;
    width: 120px;
    height: 120px;
    font: 84px/1 var(--seal);
    color: #fff;
    background: var(--cinnabar);
    border-radius: 12px;
    box-shadow: inset 0 0 0 4px rgb(255 255 255 / 0.35), 0 0 0 0 rgb(194 59 34 / 0.5);
    animation: slam 0.55s cubic-bezier(0.3, 1.5, 0.5, 1) both, ripple 1s 0.4s ease-out;
  }
  @keyframes slam {
    from {
      opacity: 0;
      transform: scale(2.4) rotate(-18deg);
    }
    to {
      transform: rotate(-3deg);
    }
  }
  @keyframes ripple {
    to {
      box-shadow: inset 0 0 0 4px rgb(255 255 255 / 0.35), 0 0 0 40px rgb(194 59 34 / 0);
    }
  }
  .sectname {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #fff;
    animation: ink 0.8s 0.4s ease-out both;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
</style>
