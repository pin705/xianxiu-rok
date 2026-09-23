<script lang="ts">
  // Phát lại trận: luật đã tính xong (tất định), ở đây chỉ diễn lại từng lượt rồi hiện kết quả.
  import { MAX_ROUNDS, PILL_IDS, RESOURCES, count, type Report } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import Unit from './Unit.svelte'
  import { GLYPH, L, LOOK, num, reportName, sfx } from './lib'

  let { report, onclose }: { report: Report | null; onclose: () => void } = $props()

  let dlg = $state<HTMLDialogElement>()
  $effect(() => {
    if (!dlg) return
    if (report && !dlg.open) dlg.showModal()
    if (!report && dlg.open) dlg.close()
  })

  let fi = $state(0) // trận thứ mấy (độ kiếp có 3 đợt)
  let r = $state(0) // lượt đang xem, 0 = trước khi đánh
  let fast = $state(false)
  let done = $state(false)
  let shown = $state<Report | null>(null)
  // Chiến báo khác → diễn lại từ đầu
  $effect.pre(() => {
    if (report === shown) return
    shown = report
    fi = 0
    r = 0
    done = false
  })

  const f = $derived(report?.fights[fi])
  const counts = (side: 0 | 1, at: number) =>
    !f ? [] : at <= 0 ? (side ? f.b : f.a).troops.map(t => t.n) : f.rounds[at - 1].n[side]
  const cast = $derived(f && r > 0 ? f.rounds[r - 1].cast : [false, false])

  function step() {
    if (!report || !f) return
    if (r < f.rounds.length) {
      r++
      sfx('hit')
    } else if (fi < report.fights.length - 1) {
      fi++
      r = 0
      sfx('thunder')
    } else {
      done = true
      sfx(report.win ? 'win' : 'lose')
    }
  }
  $effect(() => {
    if (!report || done) return
    const id = setInterval(step, fast ? 420 : 850)
    return () => clearInterval(id)
  })

  const foeName = $derived(!report ? '' : report.kind === 'trib' ? L.report.wave(fi + 1) : reportName(report))
  const foeGlyph = $derived(
    !report ? '' : report.kind === 'trib' ? GLYPH.thunder : report.kind === 'beast' ? GLYPH.beast[report.i] : report.kind === 'sect' ? GLYPH.sect[report.i] : GLYPH.realm[report.i],
  )
  const retreat = $derived(!!report && !report.win && !!f && f.rounds.length >= 10 && counts(1, f.rounds.length).some(x => x > 0) && counts(0, f.rounds.length).some(x => x > 0))
  const dead = $derived(report ? count(report.dead) : 0)
</script>

<dialog bind:this={dlg} class="replay" class:trib={report?.kind === 'trib'} aria-label={L.report.title} onclose={onclose}>
  {#if report && f}
    <div class="field">
      {#key `${fi}-${r}`}<div class="flash" class:on={report.kind === 'trib' && r > 0}></div>{/key}
      <header class="side top">
        <span class="medal"><span class="han">{foeGlyph}</span></span>
        <span class="who"><b>{foeName}</b>{#if f.b.level > 1}<small>{L.lv(f.b.level)}</small>{/if}</span>
      </header>
      <ul class="stacks">
        {#each f.b.troops as t, k (k)}
          {@const n = counts(1, r)[k]}
          {@const d = counts(1, r - 1)[k] - n}
          <li class:gone={!n}>
            <Unit type={t.type} tier={t.tier} size={46} glyph={report.kind === 'trib' ? GLYPH.thunder : undefined} />
            <b>{num(n)}</b>
            {#if r > 0 && d > 0}{#key r}<span class="dmg">−{num(d)}</span>{/key}{/if}
          </li>
        {/each}
      </ul>

      <div class="mid">
        <p class="round">
          <Icon name="swords" size={16} />
          {#if report.kind === 'trib'}{L.report.wave(fi + 1)} · {/if}{L.report.round(r, MAX_ROUNDS)}
        </p>
        {#key r}
          {#if cast[1]}<span class="cast foe">{L.report.foeSkill}</span>{/if}
          {#if cast[0] && f.a.elder}<span class="cast">{L.elders[f.a.elder].skill}!</span>{/if}
        {/key}
      </div>

      <ul class="stacks">
        {#each f.a.troops as t, k (k)}
          {@const n = counts(0, r)[k]}
          {@const d = counts(0, r - 1)[k] - n}
          <li class:gone={!n}>
            <Unit type={t.type} tier={t.tier} size={46} />
            <b>{num(n)}</b>
            {#if r > 0 && d !== 0}{#key r}<span class="dmg" class:up={d < 0}>{d > 0 ? '−' : '+'}{num(Math.abs(d))}</span>{/key}{/if}
          </li>
        {/each}
      </ul>
      <header class="side">
        {#if f.a.elder}<Portrait look={LOOK[f.a.elder]} size={44} />{/if}
        <span class="who">
          <b>{f.a.elder ? L.elders[f.a.elder].name : ''}</b>
          <small>{L.lv(f.a.level)}</small>
        </span>
      </header>
    </div>

    {#if done}
      <div class="result" class:win={report.win}>
        <h2>{report.kind === 'trib' ? (report.win ? L.report.tribWin : L.report.tribLose) : report.win ? L.report.win : L.report.lose}</h2>
        {#if retreat}<p class="muted">{L.report.retreat}</p>{/if}
        <ul>
          {#if count(report.hurt) - dead}<li><Icon name="heal" size={18} />{L.report.hurt}<b>{num(count(report.hurt) - dead)}</b></li>{/if}
          {#if dead}<li class="bad"><Icon name="skull" size={18} />{L.report.dead}<b>{num(dead)}</b></li>{/if}
          {#if RESOURCES.some(x => report.gain.res[x]) || PILL_IDS.some(p => report.gain.items[p])}
            <li class="gain">
              {L.report.gain}
              <span>
                {#each RESOURCES as x (x)}{#if report.gain.res[x]}<i><Icon name={x} size={16} />{num(report.gain.res[x] ?? 0)}</i>{/if}{/each}
                {#each PILL_IDS as p (p)}{#if report.gain.items[p]}<i><Icon name={p} size={16} />×{report.gain.items[p]}</i>{/if}{/each}
              </span>
            </li>
          {/if}
          {#if report.gain.exp && f.a.elder}<li><Icon name="star" size={18} />{L.report.exp} · {L.elders[f.a.elder].name}<b>+{num(report.gain.exp)}</b></li>{/if}
          {#if report.gain.elder}
            <li class="elder"><Portrait look={LOOK[report.gain.elder]} size={36} />{L.report.newElder}<b>{L.elders[report.gain.elder].name}</b></li>
          {/if}
        </ul>
        <div class="two">
          <button class="btn ghost" onclick={() => ((fi = 0), (r = 0), (done = false))}>{L.report.replay}</button>
          <button class="btn gold" onclick={() => dlg?.close()}>{L.report.close}</button>
        </div>
      </div>
    {:else}
      <div class="ctl">
        <button class="btn ghost small" onclick={() => (fast = !fast)}>{L.report.speed} ×{fast ? 2 : 1}</button>
        <button class="btn small" onclick={() => ((fi = report.fights.length - 1), (r = report.fights.at(-1)!.rounds.length), (done = true))}>{L.report.skip}</button>
      </div>
    {/if}
  {/if}
</dialog>

<style>
  .replay {
    width: min(100%, 480px);
    max-width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0 auto;
    padding: calc(12px + env(safe-area-inset-top)) 14px calc(16px + env(safe-area-inset-bottom));
    color: #f6f1e4;
    background: radial-gradient(ellipse at 50% 45%, #2a3f47, #0d1a20 70%);
    border: 0;
  }
  .replay.trib {
    background: radial-gradient(ellipse at 50% 40%, #3b2f5c, #110d1f 70%);
  }
  .replay::backdrop {
    background: #0b141a;
  }
  .field {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto 1fr auto;
    gap: 10px;
    height: calc(100% - 64px);
  }
  .flash {
    position: absolute;
    inset: -20px;
    pointer-events: none;
  }
  .flash.on {
    animation: flash 0.5s ease-out;
  }
  @keyframes flash {
    0% {
      background: rgb(230 220 255 / 0.55);
    }
    100% {
      background: transparent;
    }
  }
  .side {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .medal {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    background: radial-gradient(circle at 50% 35%, #8a3a2a, #3b1208);
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px var(--gold-l);
  }
  .trib .medal {
    background: radial-gradient(circle at 50% 35%, #7d62c9, #2c1d57);
  }
  .medal .han {
    font-size: 26px;
    color: #fff8e6;
  }
  .who {
    display: grid;
  }
  .who b {
    font-size: 16px;
  }
  .who small {
    font-size: 12px;
    color: var(--gold-l);
  }
  .mid {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 8px;
    min-height: 76px;
  }
  .cast {
    padding: 6px 14px;
    font-size: 15px;
    font-weight: 700;
    color: #2b2210;
    background: linear-gradient(#f8e3a0, #c9a14a);
    border-radius: 10px;
    box-shadow: 0 0 18px rgb(248 227 160 / 0.6);
    animation: cast 0.8s ease-out;
  }
  .cast.foe {
    color: #fff;
    background: linear-gradient(#d0543a, #9e2c18);
    box-shadow: 0 0 18px rgb(208 84 58 / 0.6);
  }
  @keyframes cast {
    from {
      opacity: 0;
      transform: scale(1.6);
    }
  }
  .stacks {
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    justify-content: center;
    gap: 18px 22px;
    padding: 0;
    list-style: none;
  }
  .stacks li {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 6px;
    transition: opacity 0.4s, filter 0.4s;
  }
  .stacks li.gone {
    opacity: 0.35;
    filter: grayscale(1);
  }
  .stacks b {
    font-size: 16px;
    font-variant-numeric: tabular-nums;
  }
  .dmg {
    position: absolute;
    top: -8px;
    right: -18px;
    font-size: 15px;
    font-weight: 700;
    color: #ff8f78;
    text-shadow: 0 1px 3px #000;
    pointer-events: none;
    animation: dmg 0.8s ease-out forwards;
  }
  .dmg.up {
    color: #9be3a5;
  }
  @keyframes dmg {
    from {
      opacity: 1;
      transform: translateY(6px) scale(1.3);
    }
    to {
      opacity: 0;
      transform: translateY(-16px);
    }
  }
  .round {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--gold-l);
  }
  .ctl {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 14px;
  }
  .result {
    position: absolute;
    inset: auto 14px calc(16px + env(safe-area-inset-bottom));
    padding: 20px 16px 16px;
    background: linear-gradient(#1a2c36, #0f1d25);
    border: 1px solid var(--cinnabar);
    border-radius: 18px;
    box-shadow: 0 -10px 40px rgb(0 0 0 / 0.5);
    animation: rise 0.35s cubic-bezier(0.3, 1.3, 0.5, 1);
  }
  .result.win {
    border-color: var(--gold);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
  }
  .result h2 {
    font-size: 26px;
    text-align: center;
    letter-spacing: 0.08em;
    color: #ffb4a4;
  }
  .result.win h2 {
    color: var(--gold-l);
  }
  .result > p {
    margin-top: 4px;
    font-size: 13px;
    text-align: center;
  }
  .result ul {
    display: grid;
    gap: 6px;
    margin-top: 14px;
    padding: 0;
    list-style: none;
  }
  .result li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 14px;
    background: rgb(255 255 255 / 0.06);
    border-radius: 10px;
  }
  .result li b {
    margin-left: auto;
  }
  .result li.bad {
    color: #ffb4a4;
  }
  .result .gain span {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-left: auto;
  }
  .result .gain i {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-style: normal;
    font-weight: 600;
  }
  .result .elder {
    color: var(--gold-l);
    background: rgb(201 161 74 / 0.18);
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
  }
  @media (prefers-reduced-motion: reduce) {
    .flash.on,
    .cast,
    .dmg,
    .result {
      animation: none;
    }
  }
</style>
