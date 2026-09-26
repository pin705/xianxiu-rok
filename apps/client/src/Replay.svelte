<script lang="ts">
  // Phát lại trận: luật đã tính xong (tất định), ở đây chỉ diễn lại từng lượt rồi hiện kết quả.
  import {
    ELDERS,
    MAX_ROUNDS,
    RAGE_MAX,
    RESOURCES,
    REVENGE_TIME,
    SECTS,
    count,
    type BuildingId,
    type ElderId,
    type Report,
    type Skill,
    type Tier,
    type UnitType,
  } from '@rok/rules'
  import { Icon, Portrait, paintedUrl, portraitRing, type Emblem, type MedalTone } from '@rok/art'
  import { Bag, Button, Card, Medal, Meter, Stat } from './ui'
  import { Battle } from './world/battle'
  import { cssPerDU, mountScene } from './world/stage'
  import { EMBLEM, L, LOOK, num, reportName, sfx, type PanelTab } from './lib'
  import { verdictOf } from './verdict'

  let {
    report,
    onclose,
    onrevenge,
    onfocus,
    now = 0,
  }: {
    report: Report | null
    onclose: () => void
    onrevenge?: (pid: number) => void
    onfocus?: (id: BuildingId, tab: PanelTab) => void // lối đi khi thua: tuyển, chữa thương, công pháp
    now?: number
  } = $props()
  const verdict = $derived(report && verdictOf(report))
  // bị cướp mà thua, còn trong hạn báo thù
  const revenge = $derived(
    !!report && report.kind === 'pvp' && report.def && !report.win && now < report.at + REVENGE_TIME,
  )

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
  // chân nguyên hai bên sau lượt đang xem (thanh vàng dưới tên; chiến báo cũ không có thì ẩn)
  const rage = $derived(f?.rounds[0]?.rage ? (r > 0 ? f.rounds[r - 1].rage : [0, 0]) : undefined)
  // bên không có công pháp (yêu thú) không tụ chân nguyên: không vẽ thanh
  const rageOn = $derived([0, 1].map(k => !!f?.rounds.some(x => x.rage?.[k])))

  // Cảnh trận WebGL: mượn canvas chung của game đặt vào hộp thoại (không tạo thêm context), trả lại khi đóng
  let host = $state<HTMLDivElement>()
  let battle: Battle | undefined
  $effect(() => {
    const rep = shown
    if (!rep || !host) return
    const unmount = mountScene({
      host,
      art: ['battle'],
      make: () => {
        const k = cssPerDU()
        const skills: [Skill | undefined, Skill | undefined] = [
          rep.fights[0]?.a.elder ? ELDERS[rep.fights[0].a.elder].skill : undefined,
          rep.kind === 'sect'
            ? SECTS[rep.i]?.elder.skill
            : rep.fights[0]?.b.elder
              ? ELDERS[rep.fights[0].b.elder].skill
              : undefined, // PvP: trưởng lão bên kia
        ]
        const dep = (e?: ElderId) => (e ? ELDERS[e].skill : undefined)
        const b = new Battle(rep, skills, innerWidth / k, innerHeight / k, [
          dep(rep.fights[0]?.a.deputy),
          dep(rep.fights[0]?.b.deputy),
        ])
        b.root.scale.set(k)
        return b
      },
      tick: (b, app) => b.tick(app.ticker.deltaMS / 1000),
      ready: b => {
        battle = b
        if (import.meta.env.DEV) Object.assign(globalThis, { rokBattle: b })
      },
    })
    return () => {
      unmount()
      battle = undefined
    }
  })
  const pace = $derived(fast ? 0.42 : 0.85)

  function step() {
    if (!report || !f) return
    if (r < f.rounds.length) {
      r++
      battle?.round(fi, r, pace)
      sfx(f.rounds[r - 1].cast.some(Boolean) ? 'whoosh' : 'hit')
    } else if (fi < report.fights.length - 1) {
      fi++
      r = 0
      battle?.wave(fi)
      sfx('thunder')
    } else finish()
  }
  // Xem lại từ đầu
  function again() {
    fi = 0
    r = 0
    done = false
    battle?.wave(0)
  }
  // Bỏ qua: tới lượt cuối của đợt cuối
  function skip() {
    if (!report) return
    fi = report.fights.length - 1
    r = report.fights.at(-1)!.rounds.length
    battle?.jump()
    finish()
  }
  // Hết trận: huy hiệu thắng/bại vẽ tay đập xuống như ấn (rung cảnh đúng lúc chạm giấy), rồi bảng kết quả trồi lên
  function finish() {
    done = true
    sfx(report?.win ? 'win' : 'lose')
    setTimeout(() => {
      battle?.slam()
      sfx('stamp')
    }, 240)
  }
  $effect(() => {
    if (!report || done) return
    const id = setInterval(step, fast ? 420 : 850)
    return () => clearInterval(id)
  })

  // Chi tiết trận (như báo cáo chi tiết của RoK): mỗi bên, từng loại đệ tử vào trận bao nhiêu, còn bao nhiêu; công pháp thi
  // triển mấy lần — gộp mọi đợt / mọi cặp đấu
  let detail = $state(false)
  const breakdown = $derived.by(() => {
    if (!report) return null
    const sum = (side: 0 | 1) => {
      const rows = new Map<string, { type: UnitType; tier: Tier; from: number; left: number }>()
      for (const fx of report.fights) {
        const troops = side ? fx.b.troops : fx.a.troops
        const last = fx.rounds.at(-1)?.n[side]
        troops.forEach((t, k) => {
          const key = `${t.type}${t.tier}`
          const row = rows.get(key) ?? { type: t.type, tier: t.tier, from: 0, left: 0 }
          rows.set(key, { ...row, from: row.from + t.n, left: row.left + (last?.[k] ?? t.n) })
        })
      }
      const casts = report.fights.reduce((n, fx) => n + fx.rounds.filter(rd => rd.cast[side]).length, 0)
      return { rows: [...rows.values()], casts }
    }
    return [sum(0), sum(1)] as const
  })
  const TONE: Partial<Record<Report['kind'], MedalTone>> = {
    trib: 'thunder',
    arena: 'pvp',
    legion: 'thunder',
    drill: 'tower',
    trial: 'red',
    thief: 'ink',
  }
  const tone = $derived<MedalTone>(report ? (TONE[report.kind] ?? (report.kind as MedalTone)) : 'pvp')
  const foeName = $derived(!report ? '' : report.kind === 'trib' ? L.report.wave(fi + 1) : reportName(report))
  const foeEmblem: Emblem = $derived.by(() => {
    if (!report || report.kind === 'trib') return 'thunder'
    if (report.kind === 'legion') return 'ghost'
    if (report.kind === 'drill') return 'fist'
    if (report.kind === 'trial') return 'demon'
    if (report.kind === 'thief') return 'ghost'
    if (report.kind === 'pvp' || report.kind === 'arena' || report.kind === 'camp') return 'crest'
    if (report.kind === 'spot') return EMBLEM.spot[report.spot ?? 'vein'] ?? 'lotus'
    return EMBLEM[report.kind][report.i]
  })
  const retreat = $derived(
    !!report &&
      !report.win &&
      !!f &&
      f.rounds.length >= 10 &&
      counts(1, f.rounds.length).some(x => x > 0) &&
      counts(0, f.rounds.length).some(x => x > 0),
  )
  const dead = $derived(report ? count(report.dead) : 0)
</script>

<dialog bind:this={dlg} class="replay paper" class:trib={report?.kind === 'trib'} aria-label={L.report.title} {onclose}>
  <!-- svelte-ignore a11y_autofocus -->
  <div class="stage" bind:this={host} tabindex="-1" autofocus></div>
  {#if report && f}
    <header class="row foe">
      <Medal emblem={foeEmblem} {tone} size={46} />
      <span class="stack" style:--gap="0"
        ><b class="t-head">{foeName}</b>{#if report.kind === 'tower'}<small class="t-small t-bad t-strong"
            >{L.tower.floor(f.b.level)}</small
          >{:else if f.b.level > 1}<small class="t-small t-bad t-strong">{L.lv(f.b.level)}</small
          >{/if}{#if rage && rageOn[1]}<span class="rage" title={L.report.rage}
            ><Meter value={rage[1] / RAGE_MAX} tone="gold" size="xs" /></span
          >{/if}</span
      >
    </header>

    <div class="mid">
      <p class="round row center">
        <Icon name="swords" size={16} />{#if report.kind === 'trib'}{L.report.wave(fi + 1)} ·
        {/if}{L.report.round(r, MAX_ROUNDS)}
      </p>
    </div>
    <!-- Công pháp xuất chiêu: dải sơn mài quét ngang, chân dung trưởng lão, tên chiêu viết lớn -->
    {#key r}
      {#if cast[0] && f.a.elder}
        <div class="cutin" style:--d="{pace * 1.7}s" aria-live="polite">
          <span class="band"></span>
          <span class="who" style:--ring="url({paintedUrl('ring', portraitRing, 100)})"
            ><Portrait look={LOOK[f.a.elder]} size={88} /></span
          >
          <span class="stack name" style:--gap="0"
            ><small class="t-strong">{L.elders[f.a.elder].name}</small><b class="skill">{L.elders[f.a.elder].skill}</b
            >{#if f.a.deputy}<small class="t-strong depl"
                >{L.army.deputy}: {L.elders[f.a.deputy].name} · {L.elders[f.a.deputy].skill}</small
              >{/if}</span
          >
        </div>
      {/if}
      {#if cast[1]}
        <div class="cutin foe" style:--d="{pace * 1.7}s" aria-live="polite">
          <span class="band"></span>
          <span class="who"><Medal emblem={foeEmblem} {tone} size={72} /></span>
          <span class="stack name" style:--gap="0"
            ><small class="t-strong">{foeName}</small><b class="skill">{L.report.foeSkill}</b></span
          >
        </div>
      {/if}
    {/key}
    <!-- Độ kiếp sang đợt mới: huy hiệu lôi kiếp và tên đợt loang ra như mực -->
    {#key fi}
      {#if report.kind === 'trib' && fi > 0 && !done}
        <div class="wave stack center">
          <Medal emblem="thunder" tone="thunder" size={88} /><b class="t-title">{L.report.wave(fi + 1)}</b>
        </div>
      {/if}
    {/key}
    <p class="sr">
      {f.a.troops.map((t, k) => `${L.units[t.type]} ${counts(0, r)[k]}`).join(', ')} — {f.b.troops
        .map((t, k) => `${L.units[t.type]} ${counts(1, r)[k]}`)
        .join(', ')}
    </p>

    <header class="row ours">
      {#if f.a.elder}<Portrait look={LOOK[f.a.elder]} size={46} />{/if}
      {#if f.a.deputy}<span class="dep"><Portrait look={LOOK[f.a.deputy]} size={30} /></span>{/if}
      <span class="stack" style:--gap="0"
        ><b class="t-head"
          >{f.a.elder
            ? f.a.deputy
              ? L.army.duo(L.elders[f.a.elder].name, L.elders[f.a.deputy].name)
              : L.elders[f.a.elder].name
            : ''}</b
        ><small class="t-small t-gold t-strong">{L.lv(f.a.level)}</small>{#if rage && rageOn[0]}<span
            class="rage"
            title={L.report.rage}><Meter value={rage[0] / RAGE_MAX} tone="gold" size="xs" /></span
          >{/if}</span
      >
    </header>

    {#if done}
      <div class="verdict" class:lose={!report.win}>
        <span class="splat"></span><Medal
          emblem={report.win ? 'win' : 'lose'}
          tone={report.win ? 'red' : 'ink'}
          size={140}
        />
      </div>
      <div class="result">
        <Card tone={report.win ? 'glow' : 'paper'}>
          <div class="stack">
            {#if report.kind === 'thief'}
              <!-- Dạ Hành Đạo Tặc: không có thắng thua, chỉ sát thương -->
              <h2 class="t-title center t-gold">{L.thief.last(L.thief.pm(report.i))}</h2>
            {:else}
              <h2 class="t-title center" class:t-bad={!report.win}>
                {report.kind === 'trib'
                  ? report.win
                    ? L.report.tribWin
                    : L.report.tribLose
                  : report.win
                    ? L.report.win
                    : L.report.lose}
              </h2>
            {/if}
            {#if verdict && report.kind !== 'thief'}<p class="center t-small t-strong" class:t-gold={report.win}>
                {verdict.text}
              </p>{/if}
            {#if verdict && !report.win && onfocus && report.kind !== 'drill' && report.kind !== 'thief'}
              <div class="row wrap center">
                <Button size="sm" variant="gold" onclick={() => onfocus('dienVoTruong', 'train')}
                  >{verdict.counter ? L.verdict.recruit(L.units[verdict.counter]) : L.verdict.recruitAny}</Button
                >
                {#if count(report.hurt)}<Button size="sm" variant="ghost" onclick={() => onfocus('danPhong', 'alchemy')}
                    >{L.verdict.heal}</Button
                  >{/if}
                <Button size="sm" variant="ghost" onclick={() => onfocus('tangKinhCac', 'library')}
                  >{L.verdict.study}</Button
                >
              </div>
            {/if}
            {#if retreat}<p class="center t-small t-lore">{L.report.retreat}</p>{/if}
            {#if count(report.hurt) - dead}<Stat label={L.report.hurt}
                ><Icon name="heal" size={16} />{num(count(report.hurt) - dead)}</Stat
              >{/if}
            {#if dead}<Stat label={L.report.dead} tone="bad"><Icon name="skull" size={16} />{num(dead)}</Stat>{/if}
            {#if report.gain.exp && f.a.elder}<Stat label="{L.report.exp} · {L.elders[f.a.elder].name}" tone="gold"
                >+{num(report.gain.exp)}</Stat
              >{/if}
            <Bag res={report.gain.res} items={report.gain.items} />
            {#if report.lost && RESOURCES.some(x => report.lost?.[x])}<Stat label={L.pvp.lost} tone="bad"
                ><Bag res={report.lost} /></Stat
              >{/if}
            {#if report.gain.elder}
              <span class="row"
                ><Portrait look={LOOK[report.gain.elder]} size={36} /><span class="t-strong"
                  >{L.report.newElder}: {L.elders[report.gain.elder].name}</span
                ></span
              >
            {/if}
            {#if breakdown}
              <Button variant="quiet" size="sm" onclick={() => (detail = !detail)}>{L.report.detail}</Button>
              {#if detail}
                <div class="detail">
                  {#each breakdown as b, side (side)}
                    <div class="stack" style:--gap="2px">
                      <b class="t-small">{side ? foeName : L.army.ours}</b>
                      {#each b.rows as x (`${x.type}${x.tier}`)}
                        <small class="t-tiny t-num"
                          >{L.units[x.type]}
                          {L.tiers[x.tier]}: {num(x.from)} → {num(x.left)}
                          <span class="t-bad">−{num(x.from - x.left)}</span></small
                        >
                      {/each}
                      {#if b.casts}<small class="t-tiny t-gold">{L.report.casts(b.casts)}</small>{/if}
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
            <div class="grid">
              <Button variant="ghost" onclick={again}>{L.report.replay}</Button>
              <Button variant="gold" onclick={() => dlg?.close()}>{L.report.close}</Button>
            </div>
            {#if revenge && onrevenge}<Button variant="danger" wide icon="swords" onclick={() => onrevenge(report.i)}
                >{L.pvp.revenge}</Button
              >{/if}
          </div>
        </Card>
      </div>
    {:else}
      <div class="row center ctl">
        <Button variant="ghost" size="sm" onclick={() => (fast = !fast)}>{L.report.speed} ×{fast ? 2 : 1}</Button>
        <Button size="sm" onclick={skip}>{L.report.skip}</Button>
      </div>
    {/if}
  {/if}
</dialog>

<style>
  .detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-2);
    padding: 8px;
    background: color-mix(in srgb, var(--paper2, var(--paper)) 70%, transparent);
    border-radius: 8px;
  }
  .replay {
    width: 100vw;
    height: 100dvh;
    margin: 0;
    padding: 0;
  }
  .replay::backdrop {
    background: var(--paper2);
  }
  .stage {
    position: absolute;
    inset: 0;
    outline: none;
  }
  /* mọi phần HTML nằm trên canvas */
  /* :where: không cộng độ ưu tiên, để .mid / .cutin phía dưới đặt lại vị trí mà không cần !important */
  .replay > :where(:not(.stage)) {
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
  .rage {
    display: block;
    width: 96px;
    margin-top: 3px;
  }
  .mid {
    top: 56%;
    display: grid;
    justify-items: center;
    gap: var(--sp-2);
    translate: -50% -50%;
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
    left: 0;
    width: 100%;
    height: 104px;
    translate: 0 -50%;
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
  /* dải chiêu thức: một nét mực quét ngang cả màn (địch: mực son), hai đầu bút khô tước sợi */
  .band {
    position: absolute;
    inset: 8px -12px;
    z-index: -1;
    border: 0 solid transparent;
    border-image: var(--sk-toast);
    filter: drop-shadow(0 6px 10px rgb(var(--shade) / 0.4));
    rotate: -3deg;
    animation: band-in var(--d) var(--ease) both;
  }
  .foe .band {
    border-image: var(--sk-toast-bad);
    rotate: 3deg;
    animation-name: band-in-r;
  }
  /* chân dung trong khung vàng vẽ tay */
  .who {
    position: relative;
    display: grid;
    place-items: center;
    filter: drop-shadow(0 4px 8px rgb(var(--shade) / 0.45));
    animation: slide-in var(--d) var(--spring) both;
  }
  .who::after {
    content: '';
    position: absolute;
    inset: -8%;
    background: var(--ring) center / 100% 100% no-repeat;
    pointer-events: none;
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
  /* dòng phó trưởng lão dưới tên chiêu: xuống dòng trong bề ngang màn, không tràn mép */
  .depl {
    max-width: min(60vw, 360px);
    font-size: var(--fs-1);
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
    0% {
      clip-path: inset(0 100% 0 0);
    }
    16%,
    82% {
      clip-path: inset(0 0 0 0);
    }
    100% {
      clip-path: inset(0 0 0 100%);
    }
  }
  @keyframes band-in-r {
    0% {
      clip-path: inset(0 0 0 100%);
    }
    16%,
    82% {
      clip-path: inset(0 0 0 0);
    }
    100% {
      clip-path: inset(0 100% 0 0);
    }
  }
  @keyframes slide-in {
    0%,
    8% {
      opacity: 0;
      translate: -70px 0;
    }
    30%,
    100% {
      opacity: 1;
      translate: 0 0;
    }
  }
  @keyframes slide-in-r {
    0%,
    12% {
      opacity: 0;
      translate: 70px 0;
    }
    34%,
    100% {
      opacity: 1;
      translate: 0 0;
    }
  }
  @keyframes cut-out {
    0%,
    84% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  /* ---- Đợt kiếp mới ---- */
  /* neo mép dưới ngay trên nhãn lượt (tâm ở 56%): huy hiệu + tên đợt không đè chữ, màn cao hay thấp cũng vậy */
  .wave {
    bottom: calc(44% + 26px);
    justify-items: center;
    color: var(--silk);
    text-shadow: 0 2px 10px rgb(0 0 0 / 0.6);
    pointer-events: none;
    animation: wave 1.6s var(--ease) forwards;
  }
  @keyframes wave {
    0% {
      opacity: 0;
      scale: 1.25;
      filter: blur(6px);
    }
    18%,
    70% {
      opacity: 1;
      scale: 1;
      filter: blur(0);
    }
    100% {
      opacity: 0;
      scale: 0.96;
    }
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
    0% {
      opacity: 0;
      scale: 2.8;
      rotate: -14deg;
    }
    48% {
      opacity: 1;
      scale: 0.9;
      rotate: 0deg;
    }
    70% {
      scale: 1.04;
    }
    100% {
      opacity: 1;
      scale: 1;
    }
  }
  @keyframes splat {
    from {
      scale: 0.2;
      opacity: 0.5;
    }
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
