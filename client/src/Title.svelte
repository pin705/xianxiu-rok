<script lang="ts">
  // Màn tiêu đề. 'first': tiêu đề → lời dẫn → đặt tên. 'splash': người cũ, chạm hoặc chờ 1.6 giây là vào.
  import { onMount } from 'svelte'
  import { Button, Seal } from './ui'
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
    if (n.length < 2 || n.length > 20) {
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
        <span class="han">{#each [...L.gameHan] as ch, i (i)}<span class="ch" style:--i={i}>{ch}</span>{/each}</span>
        <span class="stampin"><Seal glyph="宗" size={46} tilt /></span>
      </span>
      <span class="name">{L.game}</span>
      <span class="tag">{L.tagline}</span>
      <span class="tap">{L.tapToStart}</span>
    </button>
  {:else if step === 'intro'}
    <button class="cover dim" onclick={tapIntro}>
      <span class="lines stack">
        {#each L.intro.slice(0, line + 1) as text, i (i)}<span class="ln">{text}</span>{/each}
      </span>
      <span class="tap">{L.tapToContinue}</span>
    </button>
    <span class="skip"><Button variant="ghost" size="sm" onclick={() => (step = 'name')}>{L.skip}</Button></span>
  {:else}
    <div class="cover dim">
      <form class="card paper inked stack center" class:gone={step === 'stamp'} onsubmit={found}>
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
        <Button variant="gold" size="lg" wide type="submit" silent>{L.naming.found}</Button>
      </form>
      {#if step === 'stamp'}
        <div class="stamp stack center">
          <span class="slam"><Seal glyph="宗" size={124} tilt /></span>
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
    background: linear-gradient(transparent 45%, rgb(20 14 10 / 0.72));
  }
  .dim {
    justify-content: center;
    background: rgb(20 14 10 / 0.66);
  }
  /* Đề từ dọc như trên tranh, ấn son bên dưới */
  .logo {
    position: absolute;
    top: calc(56px + var(--safe-t));
    right: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    animation: ink 1.6s var(--ease) both;
  }
  .logo .han {
    font: 72px/1.02 var(--font-han);
    color: var(--ink);
    letter-spacing: 4px;
    writing-mode: vertical-rl;
    text-shadow: 0 0 22px rgb(247 242 230 / 0.95);
  }
  .ch {
    -webkit-mask: linear-gradient(#000 45%, transparent 55%) 0 100% / 100% 260% no-repeat;
    mask: linear-gradient(#000 45%, transparent 55%) 0 100% / 100% 260% no-repeat;
    animation: write 0.7s var(--ease) calc(0.3s + var(--i) * 0.32s) both;
  }
  @keyframes write {
    from {
      filter: blur(3px);
    }
    to {
      -webkit-mask-position: 0 0;
      mask-position: 0 0;
    }
  }
  .stampin {
    animation: slam 0.5s 1.4s var(--spring) both;
  }
  .name {
    font-size: var(--fs-6);
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    text-shadow: 0 2px 8px rgb(0 0 0 / 0.6);
  }
  .tag {
    font-style: italic;
    color: var(--gold-l);
  }
  .tap {
    margin-top: var(--sp-5);
    padding: 10px 28px;
    font-weight: 700;
    letter-spacing: 0.06em;
    background: rgb(20 14 10 / 0.5);
    box-shadow: inset 0 0 0 1px var(--gold);
    clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%);
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
    width: min(100%, 360px);
    padding: var(--sp-4);
    box-shadow: var(--shadow-3);
    animation: ink 0.5s var(--ease) both;
    transition: opacity var(--dur-3), transform var(--dur-3);
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
