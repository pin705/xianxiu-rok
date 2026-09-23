<script lang="ts">
  // Phát lại trận: luật đã tính xong (tất định), ở đây chỉ diễn lại từng lượt rồi hiện kết quả.
  import { ELDERS, MAX_ROUNDS, SECTS, count, type Report, type Skill } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Button, Card, Medal, Stat } from './ui'
  import { Battle } from './world/battle'
  import { cssPerDU, getApp } from './world/stage'
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

  // Cảnh trận WebGL: mượn canvas chung của game đặt vào hộp thoại (không tạo thêm context), trả lại khi đóng
  let host = $state<HTMLDivElement>()
  let battle: Battle | undefined
  $effect(() => {
    const rep = shown
    if (!rep || !host) return
    let dead = false
    let undo = () => {}
    getApp().then(app => {
      if (dead) return
      const k = cssPerDU()
      const skills: [Skill | undefined, Skill | undefined] = [
        rep.fights[0]?.a.elder ? ELDERS[rep.fights[0].a.elder].skill : undefined,
        rep.kind === 'sect' ? SECTS[rep.i]?.elder.skill : undefined,
      ]
      const b = new Battle(rep, skills, innerWidth / k, innerHeight / k)
      b.root.scale.set(k)
      const shownBefore = app.stage.children.filter(c => c.visible)
      shownBefore.forEach(c => (c.visible = false))
      app.stage.addChild(b.root)
      host!.prepend(app.canvas)
      const tick = () => b.tick(app.ticker.deltaMS / 1000)
      app.ticker.add(tick)
      battle = b
      undo = () => {
        app.ticker.remove(tick)
        b.destroy()
        shownBefore.forEach(c => (c.visible = true))
        document.body.prepend(app.canvas)
        battle = undefined
      }
    })
    return () => {
      dead = true
      undo()
    }
  })
  const pace = $derived(fast ? 0.42 : 0.85)

  function step() {
    if (!report || !f) return
    if (r < f.rounds.length) {
      r++
      battle?.round(fi, r, pace)
      sfx('hit')
    } else if (fi < report.fights.length - 1) {
      fi++
      r = 0
      battle?.wave(fi)
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
  <!-- svelte-ignore a11y_autofocus -->
  <div class="stage" bind:this={host} tabindex="-1" autofocus></div>
  {#if report && f}
    <header class="row foe">
      <Medal glyph={foeGlyph} tone={report.kind === 'trib' ? 'thunder' : report.kind} size={46} />
      <span class="stack" style:--gap="0"><b class="t-head">{foeName}</b>{#if f.b.level > 1}<small class="t-small t-bad t-strong">{L.lv(f.b.level)}</small>{/if}</span>
    </header>

    <div class="mid">
      <p class="round row center"><Icon name="swords" size={16} />{#if report.kind === 'trib'}{L.report.wave(fi + 1)} · {/if}{L.report.round(r, MAX_ROUNDS)}</p>
      {#key r}
        {#if cast[1]}<span class="cast foe">{L.report.foeSkill}</span>{/if}
        {#if cast[0] && f.a.elder}<span class="cast">{L.elders[f.a.elder].skill}!</span>{/if}
      {/key}
    </div>
    <p class="sr">{f.a.troops.map((t, k) => `${L.units[t.type]} ${counts(0, r)[k]}`).join(', ')} — {f.b.troops.map((t, k) => `${L.units[t.type]} ${counts(1, r)[k]}`).join(', ')}</p>

    <header class="row ours">
      {#if f.a.elder}<Portrait look={LOOK[f.a.elder]} size={46} />{/if}
      <span class="stack" style:--gap="0"><b class="t-head">{f.a.elder ? L.elders[f.a.elder].name : ''}</b><small class="t-small t-gold t-strong">{L.lv(f.a.level)}</small></span>
    </header>

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
              <Button variant="ghost" onclick={() => ((fi = 0), (r = 0), (done = false), battle?.wave(0))}>{L.report.replay}</Button>
              <Button variant="gold" onclick={() => dlg?.close()}>{L.report.close}</Button>
            </div>
          </div>
        </Card>
      </div>
    {:else}
      <div class="row center ctl">
        <Button variant="ghost" size="sm" onclick={() => (fast = !fast)}>{L.report.speed} ×{fast ? 2 : 1}</Button>
        <Button size="sm" onclick={() => ((fi = report.fights.length - 1), (r = report.fights.at(-1)!.rounds.length), (done = true), battle?.jump())}>{L.report.skip}</Button>
      </div>
    {/if}
  {/if}
</dialog>

<style>
  .replay {
    width: 100vw;
    height: 100dvh;
    margin: 0;
    padding: 0;
  }
  .replay::backdrop {
    background: var(--lacquer);
  }
  .stage {
    position: absolute;
    inset: 0;
    outline: none;
  }
  /* mọi phần HTML nằm trên canvas */
  .replay > :not(.stage) {
    position: absolute;
    z-index: 1;
    left: 50%;
    width: min(100% - 24px, calc(var(--col) - 24px));
    translate: -50% 0;
  }
  .foe {
    top: calc(var(--sp-3) + var(--safe-t));
  }
  .ours {
    bottom: calc(64px + var(--safe-b));
  }
  .mid {
    top: 56%;
    display: grid;
    justify-items: center;
    gap: var(--sp-2);
    translate: -50% -50% !important;
  }
  .foe b,
  .ours b,
  .round {
    -webkit-text-stroke: 3px var(--paper);
    paint-order: stroke fill;
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
    bottom: calc(var(--sp-4) + var(--safe-b));
  }
  .result {
    bottom: calc(var(--sp-3) + var(--safe-b));
    animation: rise var(--dur-3) var(--spring);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
  }
</style>
