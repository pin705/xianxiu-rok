<script lang="ts">
  // Phát lại trận: luật đã tính xong (tất định), ở đây chỉ diễn lại từng lượt rồi hiện kết quả.
  import { ELDERS, MAX_ROUNDS, SECTS, count, type Report, type Skill } from '@rok/rules'
  import { Icon, Portrait } from '@rok/art'
  import { Bag, Button, Card, Medal, Seal, Stat } from './ui'
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
      if (import.meta.env.DEV) Object.assign(globalThis, { rokBattle: b })
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
    } else finish()
  }
  // Hết trận: dấu 胜/败 đóng xuống (rung cảnh đúng lúc dấu chạm giấy), rồi bảng kết quả trồi lên
  function finish() {
    done = true
    sfx(report?.win ? 'win' : 'lose')
    setTimeout(() => battle?.slam(), 240)
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
    </div>
    <!-- Công pháp xuất chiêu: dải sơn mài quét ngang, chân dung trưởng lão, tên chiêu viết lớn -->
    {#key r}
      {#if cast[0] && f.a.elder}
        <div class="cutin" style:--d="{pace * 1.7}s" aria-live="polite">
          <span class="band lacquer"></span>
          <span class="who"><Portrait look={LOOK[f.a.elder]} size={88} /></span>
          <span class="stack name" style:--gap="0"><small class="t-strong">{L.elders[f.a.elder].name}</small><b class="skill">{L.elders[f.a.elder].skill}</b></span>
        </div>
      {/if}
      {#if cast[1]}
        <div class="cutin foe" style:--d="{pace * 1.7}s" aria-live="polite">
          <span class="band"></span>
          <span class="who"><Medal glyph={foeGlyph} tone={report.kind === 'trib' ? 'thunder' : report.kind} size={72} /></span>
          <span class="stack name" style:--gap="0"><small class="t-strong">{foeName}</small><b class="skill">{L.report.foeSkill}</b></span>
        </div>
      {/if}
    {/key}
    <!-- Độ kiếp sang đợt mới: triện 劫 và tên đợt loang ra như mực -->
    {#key fi}
      {#if report.kind === 'trib' && fi > 0 && !done}
        <div class="wave stack center"><Seal glyph="劫" size={76} tone="ink" tilt /><b class="t-title">{L.report.wave(fi + 1)}</b></div>
      {/if}
    {/key}
    <p class="sr">{f.a.troops.map((t, k) => `${L.units[t.type]} ${counts(0, r)[k]}`).join(', ')} — {f.b.troops.map((t, k) => `${L.units[t.type]} ${counts(1, r)[k]}`).join(', ')}</p>

    <header class="row ours">
      {#if f.a.elder}<Portrait look={LOOK[f.a.elder]} size={46} />{/if}
      <span class="stack" style:--gap="0"><b class="t-head">{f.a.elder ? L.elders[f.a.elder].name : ''}</b><small class="t-small t-gold t-strong">{L.lv(f.a.level)}</small></span>
    </header>

    {#if done}
      <div class="verdict" class:lose={!report.win}><span class="splat"></span><Seal glyph={report.win ? '胜' : '败'} size={128} tone={report.win ? 'red' : 'ink'} tilt /></div>
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
        <Button size="sm" onclick={() => ((fi = report.fights.length - 1), (r = report.fights.at(-1)!.rounds.length), battle?.jump(), finish())}>{L.report.skip}</Button>
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
  /* ---- Xuất chiêu: dải xiên quét ngang cả màn ---- */
  .cutin {
    top: 64%;
    left: 0 !important;
    width: 100% !important;
    height: 104px;
    translate: 0 -50% !important;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding-inline: max(var(--sp-4), calc(50% - var(--col) / 2 + var(--sp-4)));
    pointer-events: none;
    animation: cut-out var(--d) linear forwards;
  }
  .cutin.foe {
    top: 30%;
    flex-direction: row-reverse;
    text-align: right;
  }
  .band {
    position: absolute;
    inset: 12px 0;
    z-index: -1;
    border-block: 3px solid var(--gold);
    box-shadow: var(--shadow-2);
    rotate: -3deg;
    scale: 1.1 1;
    animation: band-in var(--d) var(--ease) both;
  }
  .foe .band {
    background: var(--cinnabar) var(--lacquer-tex);
    background-size: 96px;
    border-color: var(--gold-l);
    rotate: 3deg;
    animation-name: band-in-r;
  }
  .who {
    display: grid;
    padding: 3px;
    border-radius: 50%;
    background: linear-gradient(var(--gold-l), var(--gold-d));
    box-shadow: var(--shadow-2);
    animation: slide-in var(--d) var(--spring) both;
  }
  .foe .who {
    animation-name: slide-in-r;
  }
  .name {
    color: var(--silk);
    text-shadow: var(--text-shadow-inv);
    animation: slide-in-r var(--d) var(--spring) both;
  }
  .foe .name {
    animation-name: slide-in;
  }
  .skill {
    padding-bottom: 6px;
    font-size: min(var(--fs-7), 7.4vw);
    white-space: nowrap;
    font-style: italic;
    font-weight: 900;
    line-height: 1.1;
    color: var(--gold-l);
    background: var(--stroke-gold) left bottom / 100% 12px no-repeat;
  }
  @keyframes band-in {
    0% { clip-path: inset(0 100% 0 0); }
    16%, 82% { clip-path: inset(0 0 0 0); }
    100% { clip-path: inset(0 0 0 100%); }
  }
  @keyframes band-in-r {
    0% { clip-path: inset(0 0 0 100%); }
    16%, 82% { clip-path: inset(0 0 0 0); }
    100% { clip-path: inset(0 100% 0 0); }
  }
  @keyframes slide-in {
    0%, 8% { opacity: 0; translate: -70px 0; }
    30%, 100% { opacity: 1; translate: 0 0; }
  }
  @keyframes slide-in-r {
    0%, 12% { opacity: 0; translate: 70px 0; }
    34%, 100% { opacity: 1; translate: 0 0; }
  }
  @keyframes cut-out {
    0%, 84% { opacity: 1; }
    100% { opacity: 0; }
  }

  /* ---- Đợt kiếp mới ---- */
  .wave {
    top: 42%;
    justify-items: center;
    color: var(--silk);
    text-shadow: 0 2px 10px rgb(0 0 0 / 0.6);
    pointer-events: none;
    animation: wave 1.6s var(--ease) forwards;
  }
  @keyframes wave {
    0% { opacity: 0; scale: 1.25; filter: blur(6px); }
    18%, 70% { opacity: 1; scale: 1; filter: blur(0); }
    100% { opacity: 0; scale: 0.96; }
  }

  /* ---- Dấu thắng/bại đóng xuống ---- */
  .verdict {
    top: 20%;
    display: grid;
    place-items: center;
    pointer-events: none;
    animation: slam 0.5s cubic-bezier(0.5, 0, 0.75, 0) both;
  }
  .verdict > :global(*) {
    grid-area: 1 / 1;
  }
  .splat {
    width: 260px;
    height: 260px;
    background: var(--cinnabar);
    -webkit-mask: var(--blot-mask) center / contain no-repeat;
    mask: var(--blot-mask) center / contain no-repeat;
    opacity: 0.22;
    animation: splat 0.7s var(--ease) 0.24s both;
  }
  .lose .splat {
    background: var(--ink);
  }
  @keyframes slam {
    0% { opacity: 0; scale: 2.8; rotate: -14deg; }
    48% { opacity: 1; scale: 0.9; rotate: 0deg; }
    70% { scale: 1.04; }
    100% { opacity: 1; scale: 1; }
  }
  @keyframes splat {
    from { scale: 0.2; opacity: 0.5; }
  }
  .ctl {
    bottom: calc(var(--sp-4) + var(--safe-b));
  }
  .result {
    bottom: calc(var(--sp-3) + var(--safe-b));
    animation: rise var(--dur-3) var(--spring) 0.55s both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
  }
</style>
