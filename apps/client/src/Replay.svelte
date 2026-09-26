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
  import { Bag, Button, Card, Cutin, Flash, Medal, Meter, Stat, Theater, Verdict } from './ui'
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
      // sát thương theo nguồn (đòn thường / công pháp) và đệ tử hồi lại — chiến báo cũ không có thì 0
      const all = report.fights.flatMap(fx => fx.rounds)
      const plain = all.reduce((n, rd) => n + (rd.src?.[side][0] ?? 0), 0)
      const skill = all.reduce((n, rd) => n + (rd.src?.[side][1] ?? 0), 0)
      const heal = all.reduce((n, rd) => n + (rd.heal?.[side] ?? 0), 0)
      return { rows: [...rows.values()], casts, plain, skill, heal }
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
    maze: 'gold',
    escort: 'gold',
  }
  const tone = $derived<MedalTone>(report ? (TONE[report.kind] ?? (report.kind as MedalTone)) : 'pvp')
  const foeName = $derived(!report ? '' : report.kind === 'trib' ? L.report.wave(fi + 1) : reportName(report))
  const foeEmblem: Emblem = $derived.by(() => {
    if (!report || report.kind === 'trib') return 'thunder'
    if (report.kind === 'legion') return 'ghost'
    if (report.kind === 'drill') return 'fist'
    if (report.kind === 'trial') return 'demon'
    if (report.kind === 'thief') return 'ghost'
    if (report.kind === 'escort') return 'demon' // tà tu phục kích
    if (report.kind === 'maze') return 'demon'
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

<Theater bind:dlg bind:host label={L.report.title} {onclose} rise={done}>
  {#snippet top()}{#if report && f}
      <header class="row">
        <Medal emblem={foeEmblem} {tone} size={46} />
        <span class="stack" style:--gap="0"
          ><b class="t-head t-outline">{foeName}</b>{#if report.kind === 'tower'}<small class="t-small t-bad t-strong"
              >{L.tower.floor(f.b.level)}</small
            >{:else if f.b.level > 1}<small class="t-small t-bad t-strong">{L.lv(f.b.level)}</small
            >{/if}{#if rage && rageOn[1]}<span class="mt-1" style:width="96px" title={L.report.rage}
              ><Meter value={rage[1] / RAGE_MAX} tone="gold" size="xs" /></span
            >{/if}</span
        >
      </header>
    {/if}{/snippet}
  {#snippet mid()}{#if report && f}
      <p class="row center t-strong t-gold t-outline">
        <Icon name="swords" size={16} />{#if report.kind === 'trib'}{L.report.wave(fi + 1)} ·
        {/if}{L.report.round(r, MAX_ROUNDS)}
      </p>
    {/if}{/snippet}
  {#if report && f}
    <!-- Công pháp xuất chiêu: dải sơn mài quét ngang, chân dung trưởng lão, tên chiêu viết lớn -->
    {#key r}
      {#if cast[0] && f.a.elder}
        {@const e = f.a.elder}
        <Cutin
          d={pace * 1.7}
          ring="url({paintedUrl('ring', portraitRing, 100)})"
          who={L.elders[e].name}
          skill={L.elders[e].skill}
          sub={f.a.deputy
            ? `${L.army.deputy}: ${L.elders[f.a.deputy].name} · ${L.elders[f.a.deputy].skill}`
            : undefined}>{#snippet pic()}<Portrait look={LOOK[e]} size={88} />{/snippet}</Cutin
        >
      {/if}
      {#if cast[1]}
        <Cutin foe d={pace * 1.7} who={foeName} skill={L.report.foeSkill}
          >{#snippet pic()}<Medal emblem={foeEmblem} {tone} size={72} />{/snippet}</Cutin
        >
      {/if}
    {/key}
    <!-- Độ kiếp sang đợt mới: huy hiệu lôi kiếp và tên đợt loang ra như mực -->
    {#key fi}
      {#if report.kind === 'trib' && fi > 0 && !done}
        <Flash><Medal emblem="thunder" tone="thunder" size={88} /><b class="t-title">{L.report.wave(fi + 1)}</b></Flash>
      {/if}
    {/key}
    <p class="sr">
      {f.a.troops.map((t, k) => `${L.units[t.type]} ${counts(0, r)[k]}`).join(', ')} — {f.b.troops
        .map((t, k) => `${L.units[t.type]} ${counts(1, r)[k]}`)
        .join(', ')}
    </p>
    {#if done}<Verdict win={report.win} />{/if}
  {/if}
  {#snippet bottom()}{#if report && f}
      <header class="row">
        {#if f.a.elder}<Portrait look={LOOK[f.a.elder]} size={46} />{/if}
        {#if f.a.deputy}<Portrait look={LOOK[f.a.deputy]} size={30} />{/if}
        <span class="stack" style:--gap="0"
          ><b class="t-head t-outline"
            >{f.a.elder
              ? f.a.deputy
                ? L.army.duo(L.elders[f.a.elder].name, L.elders[f.a.deputy].name)
                : L.elders[f.a.elder].name
              : ''}</b
          ><small class="t-small t-gold t-strong">{L.lv(f.a.level)}</small>{#if rage && rageOn[0]}<span
              class="mt-1"
              style:width="96px"
              title={L.report.rage}><Meter value={rage[0] / RAGE_MAX} tone="gold" size="xs" /></span
            >{/if}</span
        >
      </header>
    {/if}{/snippet}
  {#snippet foot()}{#if report && f}
      {#if done}
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
            {#if count(report.hurt) - dead - count(report.light ?? {})}<Stat label={L.report.hurt}
                ><Icon name="heal" size={16} />{num(count(report.hurt) - dead - count(report.light ?? {}))}</Stat
              >{/if}
            {#if count(report.light ?? {})}<Stat label={L.report.light} tone="good"
                ><Icon name="heal" size={16} />{num(count(report.light ?? {}))}</Stat
              >{/if}
            {#if dead}<Stat label={L.report.dead} tone="bad"><Icon name="skull" size={16} />{num(dead)}</Stat>{/if}
            {#if report.wall}<Stat label={L.pvp.wallCut} tone={report.def ? 'good' : 'bad'}
                ><Icon name="shield" size={16} />{num(report.wall)}</Stat
              >{/if}
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
                <div class="grid inset">
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
                      {#if b.plain + b.skill}<small class="t-tiny t-num"
                          >{L.report.dmg(num(b.plain), num(b.skill))}</small
                        >{/if}
                      {#if b.heal}<small class="t-tiny t-good">{L.report.healed(num(b.heal))}</small>{/if}
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
      {:else}
        <div class="row center">
          <Button variant="ghost" size="sm" onclick={() => (fast = !fast)}>{L.report.speed} ×{fast ? 2 : 1}</Button>
          <Button size="sm" onclick={skip}>{L.report.skip}</Button>
        </div>
      {/if}
    {/if}{/snippet}
</Theater>
