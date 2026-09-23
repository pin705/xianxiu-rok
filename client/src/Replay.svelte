<script lang="ts">
  // Phát lại trận: luật đã tính xong (tất định), ở đây chỉ diễn lại từng lượt rồi hiện kết quả.
  import { MAX_ROUNDS, count, type Report } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Button, Card, Medal, Stat } from './ui'
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

<dialog bind:this={dlg} class="replay paper" class:trib={report?.kind === 'trib'} aria-label={L.report.title} onclose={onclose}>
  {#if report && f}
    <div class="field">
      {#key `${fi}-${r}`}<div class="flash" class:on={report.kind === 'trib' && r > 0}></div>{/key}
      <header class="row">
        <Medal glyph={foeGlyph} tone={report.kind === 'trib' ? 'thunder' : report.kind} size={46} />
        <span class="stack" style:--gap="0"><b class="t-head">{foeName}</b>{#if f.b.level > 1}<small class="t-small t-bad t-strong">{L.lv(f.b.level)}</small>{/if}</span>
      </header>
      <ul class="stacks">
        {#each f.b.troops as t, k (k)}
          {@const n = counts(1, r)[k]}
          {@const d = counts(1, r - 1)[k] - n}
          <li class:gone={!n}>
            <Medal glyph={report.kind === 'trib' ? GLYPH.thunder : GLYPH.unit[t.type]} tone={report.kind === 'trib' ? 'thunder' : t.type} size={50} pips={t.tier} />
            <b class="t-num">{num(n)}</b>
            {#if r > 0 && d > 0}{#key r}<span class="dmg">−{num(d)}</span>{/key}{/if}
          </li>
        {/each}
      </ul>

      <div class="mid">
        <p class="round row center"><Icon name="swords" size={16} />{#if report.kind === 'trib'}{L.report.wave(fi + 1)} · {/if}{L.report.round(r, MAX_ROUNDS)}</p>
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
            <Medal glyph={GLYPH.unit[t.type]} tone={t.type} size={50} pips={t.tier} />
            <b class="t-num">{num(n)}</b>
            {#if r > 0 && d !== 0}{#key r}<span class="dmg" class:up={d < 0}>{d > 0 ? '−' : '+'}{num(Math.abs(d))}</span>{/key}{/if}
          </li>
        {/each}
      </ul>
      <header class="row">
        {#if f.a.elder}<Portrait look={LOOK[f.a.elder]} size={46} />{/if}
        <span class="stack" style:--gap="0"><b class="t-head">{f.a.elder ? L.elders[f.a.elder].name : ''}</b><small class="t-small t-gold t-strong">{L.lv(f.a.level)}</small></span>
      </header>
    </div>

    {#if done}
      <div class="result">
        <Card tone={report.win ? 'glow' : 'paper'}>
          <div class="stack">
            <h2 class="t-title center" class:t-bad={!report.win}>{report.kind === 'trib' ? (report.win ? L.report.tribWin : L.report.tribLose) : report.win ? L.report.win : L.report.lose}</h2>
            {#if retreat}<p class="center t-small t-lore">{L.report.retreat}</p>{/if}
            {#if count(report.hurt) - dead}<Stat label={L.report.hurt}><Icon name="heal" size={16} />{num(count(report.hurt) - dead)}</Stat>{/if}
            {#if dead}<Stat label={L.report.dead} tone="bad"><Icon name="skull" size={16} />{num(dead)}</Stat>{/if}
            {#if report.gain.exp && f.a.elder}<Stat label="{L.report.exp} · {L.elders[f.a.elder].name}" tone="gold">+{num(report.gain.exp)}</Stat>{/if}
            <Bag res={report.gain.res} items={report.gain.items} />
            {#if report.gain.elder}
              <span class="row"><Portrait look={LOOK[report.gain.elder]} size={36} /><span class="t-strong">{L.report.newElder}: {L.elders[report.gain.elder].name}</span></span>
            {/if}
            <div class="grid">
              <Button variant="ghost" onclick={() => ((fi = 0), (r = 0), (done = false))}>{L.report.replay}</Button>
              <Button variant="gold" onclick={() => dlg?.close()}>{L.report.close}</Button>
            </div>
          </div>
        </Card>
      </div>
    {:else}
      <div class="row center ctl">
        <Button variant="ghost" size="sm" onclick={() => (fast = !fast)}>{L.report.speed} ×{fast ? 2 : 1}</Button>
        <Button size="sm" onclick={() => ((fi = report.fights.length - 1), (r = report.fights.at(-1)!.rounds.length), (done = true))}>{L.report.skip}</Button>
      </div>
    {/if}
  {/if}
</dialog>

<style>
  .replay {
    width: min(100%, var(--col));
    height: 100dvh;
    margin: 0 auto;
    padding: calc(var(--sp-3) + var(--safe-t)) var(--sp-4) calc(var(--sp-4) + var(--safe-b));
  }
  /* sân đấu: vệt mực loang giữa giấy */
  .replay::before {
    content: '';
    position: absolute;
    inset: 18% -10%;
    background: radial-gradient(ellipse at center, color-mix(in srgb, var(--ink) 16%, transparent), transparent 65%);
    pointer-events: none;
  }
  .trib::before {
    background: radial-gradient(ellipse at center, rgb(52 40 110 / 0.35), transparent 65%);
  }
  .replay::backdrop {
    background: var(--lacquer);
  }
  .field {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto 1fr auto;
    gap: var(--sp-3);
    height: calc(100% - 60px);
  }
  .flash {
    position: absolute;
    inset: -40px;
    pointer-events: none;
  }
  .flash.on {
    animation: flash 0.5s var(--ease);
  }
  @keyframes flash {
    from {
      background: rgb(236 230 255 / 0.7);
    }
  }
  .stacks {
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    justify-content: center;
    gap: var(--sp-4) var(--sp-5);
  }
  .stacks li {
    position: relative;
    display: grid;
    justify-items: center;
    gap: var(--sp-2);
    transition: opacity var(--dur-3), filter var(--dur-3);
  }
  .stacks b {
    font-size: var(--fs-4);
  }
  .gone {
    opacity: 0.35;
    filter: grayscale(1);
  }
  .dmg {
    position: absolute;
    top: -10px;
    right: -20px;
    font-size: var(--fs-4);
    font-weight: 900;
    color: var(--cinnabar);
    -webkit-text-stroke: 3px var(--paper);
    paint-order: stroke fill;
    animation: dmg 0.8s var(--ease) forwards;
  }
  .dmg.up {
    color: var(--malachite);
  }
  @keyframes dmg {
    from {
      opacity: 1;
      transform: translateY(6px) scale(1.35);
    }
    to {
      opacity: 0;
      transform: translateY(-18px);
    }
  }
  .mid {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: var(--sp-2);
    min-height: 80px;
  }
  .round {
    font-weight: 800;
    color: var(--gold-d);
  }
  .cast {
    padding: 6px 16px;
    font-size: var(--fs-4);
    font-weight: 900;
    color: var(--ink);
    background: linear-gradient(var(--gold-l), var(--gold));
    clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%);
    animation: cast 0.8s var(--spring);
  }
  .cast.foe {
    color: var(--silk);
    background: linear-gradient(var(--cinnabar-l), var(--cinnabar));
  }
  @keyframes cast {
    from {
      opacity: 0;
      transform: scale(1.6);
    }
  }
  .ctl {
    margin-top: var(--sp-3);
  }
  .result {
    position: absolute;
    inset: auto var(--sp-3) calc(var(--sp-3) + var(--safe-b));
    animation: rise var(--dur-3) var(--spring);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
  }
</style>
