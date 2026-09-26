<script lang="ts">
  // Trung tâm sự kiện (như Events của RoK): hàng thẻ sự kiện đang mở (chấm đỏ = quà chờ nhận; thẻ đầu là Tu Tiên Lệnh — thẻ mùa),
  // chi tiết sự kiện đang chọn: đồng hồ kết thúc, rồi theo kiểu — 7 ô ngày đăng nhập · danh sách mục tiêu · điểm hôm nay + các mốc rương.
  import {
    FESTS,
    FEST_IDS,
    FEST_RANKED,
    FEST_TOP,
    DAY,
    FEST_ALLY_PRIZES,
    PASS_HALL,
    advance,
    festBought,
    festCalendar,
    festDone,
    festEnds,
    festGot,
    festOpen,
    festPoints,
    festRewards,
    festTokens,
    festValue,
    festStar,
    FEST_STAR_TOKENS,
    passReady,
    wheelFree,
    luck,
    nextDay,
    type Army,
    type DropSrc,
    type ElderId,
    type Report,
    type FestId,
    type Metric,
  } from '@rok/rules'
  import { Icon, Portrait, type IconName } from '@rok/art'
  import { Badge, Bag, Banner, Button, Card, Chip, Entry, Meter, Note, Rail, Sheet, Tabs } from './ui'
  import { L, LOOK, num, seeFest, seenFests, sfx } from './lib'
  import { useGame } from './game'
  import Rescue from './Rescue.svelte'
  import type { FestView } from '@rok/protocol'
  import type { Net } from './net'
  import Wheel from './Wheel.svelte'
  import Dice from './Dice.svelte'
  import Egg from './Egg.svelte'
  import Delve from './Delve.svelte'
  import Thief from './Thief.svelte'
  import Wish from './Wish.svelte'
  import Cards from './Cards.svelte'
  import Swap from './Swap.svelte'
  import Offer from './Offer.svelte'
  import Omen from './Omen.svelte'
  import Stall from './Stall.svelte'
  import Escort from './Escort.svelte'
  import Race from './Race.svelte'
  import Maze from './Maze.svelte'
  import Pass from './Pass.svelte'
  import SeasonCal from './SeasonCal.svelte'
  import Trial from './Trial.svelte'

  let {
    open,
    onclose,
    api = null,
    opened,
    onfight,
    onmaze,
    onescort,
    onreplay,
  }: {
    open: boolean
    onclose: () => void
    api?: Pick<Net, 'ask'> | null
    opened?: number // lúc mở mùa của giới (Lịch giới)
    onfight?: (elder: ElderId, army: Army, thief?: boolean) => Promise<Report | null> // trận Thí Luyện / Đạo Tặc: server giải, client xem lại
    onmaze?: (i: number, team: number) => Promise<Report | null> // Hoàng Kim Mê Cảnh: mở ô (có thể là trận)
    onescort?: (id: FestId, lv: number, elder: ElderId, army: Army) => Promise<Report | null> // Áp Tiêu Hộ Hàng
    onreplay?: (r: Report) => void
  } = $props()
  const g = useGame()
  const now = $derived(g.now)
  // state đưa tới bây giờ: sang ngày mới thì sự kiện mới mở ngay, không chờ thao tác kế tiếp
  const s = $derived(open ? advance(g.game, now) : g.game)
  const act = g.act

  const ICON: Record<FestId, IconName> = {
    nhatKhoa: 'scroll',
    thatNhat: 'star',
    tanThu: 'flag',
    tanGioi: 'globe',
    tongLenh: 'kimDuyen',
    khaiVu: 'globe',
    binhThe: 'skull',
    tranhBa: 'swords',
    sanYeu: 'bolt',
    thoMoc: 'hammer',
    luyenBinh: 'people',
    tuKhiTranh: 'clock',
    thuLinh: 'globe',
    tangKinh: 'scroll',
    tramYeu: 'skull',
    tichCoc: 'cauldron',
    tamBao: 'globe',
    khaiDien: 'star',
    hoaKien: 'swords',
    boQue: 'scroll',
    catTuong: 'star',
    luyenBinhPhu: 'bolt',
    thuongDoi: 'globe',
    apTieu: 'shield',
    vanDang: 'star',
    truyenCong: 'scroll',
    gioiChu: 'swords',
    yeuHoang: 'skull',
    linhDia: 'bolt',
    lienTram: 'shield',
    dongTam: 'people',
    tranhPhong: 'swords',
    conLon: 'hammer',
    thucSon: 'swords',
    ngaMi: 'cauldron',
    trungThu: 'star',
    tanXuan: 'mail',
    dongChi: 'star',
    thatTich: 'heal',
    quyTiet: 'skull',
    thonTrang: 'shield',
    vayCong: 'swords',
    thienCo: 'star',
    vanHoa: 'nganDuyen',
    linhNoan: 'kimDuyen',
    khaoCo: 'hammer',
    tamHe: 'people',
    thuLuc: 'power',
    chinhChien: 'swords',
    khaiLo: 'hammer',
    daTac: 'skull',
    tocChien: 'bolt',
    meCanh: 'kimDuyen',
    phienBai: 'scroll',
    nguyenTieu: 'star',
    xuanHoi: 'star',
    trienLam: 'scroll',
    doanNgo: 'globe',
    haChi: 'star',
    baVi: 'cauldron',
    nguyenThu: 'nganDuyen',
    truyenDao: 'flag',
    manThuong: 'cauldron',
  }
  // tranh thẻ sự kiện vẽ tay (ui:fx-*): cột trái, băng rôn đầu sự kiện, lịch; tắt art thì về Icon
  const FX: Record<FestId, string> = {
    nhatKhoa: 'scroll',
    thatNhat: 'login',
    tanThu: 'flag',
    tanGioi: 'explore',
    tongLenh: 'treasure',
    khaiVu: 'explore',
    binhThe: 'demon',
    tranhBa: 'battle',
    sanYeu: 'bolt',
    thoMoc: 'build',
    luyenBinh: 'train',
    tuKhiTranh: 'clock',
    thuLinh: 'explore',
    tangKinh: 'scroll',
    tramYeu: 'demon',
    tichCoc: 'cauldron',
    tamBao: 'treasure',
    khaiDien: 'login',
    hoaKien: 'train',
    boQue: 'scroll',
    catTuong: 'treasure',
    luyenBinhPhu: 'train',
    thuongDoi: 'explore',
    apTieu: 'battle',
    vanDang: 'moon',
    truyenCong: 'scroll',
    gioiChu: 'battle',
    yeuHoang: 'demon',
    linhDia: 'bolt',
    lienTram: 'shield',
    dongTam: 'train',
    tranhPhong: 'battle',
    conLon: 'build',
    thucSon: 'battle',
    ngaMi: 'cauldron',
    trungThu: 'moon',
    tanXuan: 'spring',
    dongChi: 'moon',
    thatTich: 'love',
    quyTiet: 'demon',
    thonTrang: 'shield',
    vayCong: 'battle',
    thienCo: 'moon',
    vanHoa: 'treasure',
    linhNoan: 'love',
    khaoCo: 'explore',
    tamHe: 'train',
    thuLuc: 'battle',
    chinhChien: 'demon',
    khaiLo: 'build',
    daTac: 'demon',
    tocChien: 'bolt',
    meCanh: 'treasure',
    phienBai: 'love',
    nguyenTieu: 'moon',
    xuanHoi: 'spring',
    trienLam: 'treasure',
    doanNgo: 'spring',
    haChi: 'spring',
    baVi: 'cauldron',
    nguyenThu: 'love',
    truyenDao: 'flag',
    manThuong: 'treasure',
  }
  // lịch 7 ngày (sự kiện tương lai chưa mở vẫn hiện để người chơi chuẩn bị, như Event Calendar của RoK)
  const cal = $derived(
    open ? festCalendar(s, now, 7).map(d => ({ ...d, ids: d.ids.filter(id => !FESTS[id].panel) })) : [],
  )
  const weekday = (day: number) => L.fest.weekday[(((day - 4) % 7) + 7) % 7]
  // sự kiện của bảng khác (Nhật Khóa ở bảng Nhiệm vụ ngày) không lặp lại ở đây
  const list = $derived(FEST_IDS.filter(id => !FESTS[id].panel && festOpen(s, id, now)))
  // kho đổi: một chấm khi có món đổi được (không đếm từng món, không "nhận tất cả")
  const shop = (id: FestId) => FESTS[id].kind === 'shop'
  const waiting = (id: FestId) => {
    const n = festRewards(id).filter((_, i) => festDone(s, id, i) && !got(id, i)).length
    if (luck(FESTS[id])) return n + (wheelFree(s, id, now) ? 1 : 0) // vòng quà, bàn xúc xắc: còn lượt miễn phí
    return shop(id) ? Math.min(1, n) : n
  }
  const got = (id: FestId, i: number) => festGot(s, id, i)
  let pick = $state<FestId | null>(null)
  let scroll = $state(false) // đang xem Tu Tiên Lệnh
  let season = $state(false) // đang xem Lịch giới
  let dayPick = $state<number | null>(null) // ngày đang xem của lễ có nhánh theo ngày (null: ngày mới mở nhất)
  const hasPass = $derived(s.levels.chuDien >= PASS_HALL)
  // cột thẻ trái: Tu Tiên Lệnh, Lịch giới, rồi các sự kiện đang mở
  type Tag = FestId | 'pass' | 'season'
  const tags = $derived([
    ...(hasPass
      ? [{ id: 'pass' as Tag, label: L.pass.title, art: 'fx-pass', icon: 'scroll' as IconName, n: passReady(s).length }]
      : []),
    ...(opened ? [{ id: 'season' as Tag, label: L.scal.title, art: 'fx-calendar', icon: 'clock' as IconName }] : []),
    ...list.map(id => ({
      id: id as Tag,
      label: L.fest.names[id].name,
      art: `fx-${FX[id]}`,
      icon: ICON[id],
      n: waiting(id),
      fresh: fresh(id),
    })),
  ])
  function choose(id: FestId) {
    pick = id
    show(null)
  }
  function show(k: 'pass' | 'season' | null) {
    scroll = k === 'pass'
    season = k === 'season'
  }
  const cur = $derived(pick && list.includes(pick) ? pick : (list[0] ?? null))
  // lượt lễ mới mở chưa xem: dấu "!" vàng trên thẻ; mở tới thì thôi
  let seen = $state(seenFests())
  const fresh = (id: FestId) => !seen.includes(`${id}:${s.fest[id]?.key ?? 0}`)
  $effect(() => {
    if (open && cur && !scroll && !season && fresh(cur)) {
      seeFest(cur, s.fest[cur]?.key ?? 0)
      seen = seenFests()
    }
  })
  const def = $derived(cur ? FESTS[cur] : null)
  // nhánh theo ngày có tên (Khai Sơn / Tân Giới Thất Nhật); lúc ngày 0 của lượt bắt đầu: lễ tân thủ theo giờ lập tông môn, lễ đầu mùa
  // theo giờ mở mùa, còn lại theo 0h các ngày của khung
  const branches = $derived(cur === 'tanThu' ? L.fest.branch : cur === 'tanGioi' ? L.fest.branchGioi : null)
  function zeroOf(id: FestId, stage: number) {
    const w = FESTS[id].window
    const at = w.kind === 'newbie' ? s.born : w.kind === 'season' ? s.seasonAt : undefined
    return (w.kind === 'newbie' || w.kind === 'season') && at !== undefined
      ? at + w.from * DAY
      : nextDay(now) - (stage + 1) * DAY
  }
  const stage = $derived(
    cur && (def?.kind === 'points' || def?.kind === 'shop')
      ? def.stages[Math.min(s.fest[cur]?.stage ?? 0, def.stages.length - 1)]
      : null,
  )
  const pts = $derived(cur ? festPoints(s, cur) : 0)
  // lễ có xếp hạng (Tông Môn Tranh Bá): hỏi server bảng của lượt đang mở mỗi lần mở / đổi sang lễ đó
  let board = $state<FestView | null>(null)
  let whole = $state(false) // bảng cả lượt (mặc định: bảng ải hôm nay của lễ có ải)
  $effect(() => {
    const id = open && cur && (FEST_RANKED as readonly FestId[]).includes(cur) ? cur : null
    board = null
    if (id) void api?.ask({ k: 'fest', id }).then(b => cur === id && (board = b))
  })
  const claim = (i: number) => cur && act({ type: 'fest', id: cur, i }, 'reward')
  // Nhận tất cả: mọi quà đã đủ điều kiện ở mọi sự kiện đang mở trong bảng này
  const ready = $derived(list.filter(id => !shop(id)).reduce((n, id) => n + waiting(id), 0))
  function claimAll() {
    let any = false
    for (const id of list.filter(x => !shop(x)))
      festRewards(id).forEach((_, i) => {
        if (festDone(s, id, i) && !got(id, i)) any = !!act({ type: 'fest', id, i }) || any
      })
    if (any) sfx('reward')
  }
</script>

<Sheet {open} {onclose} title={L.fest.title}>
  <!-- bố cục trung tâm sự kiện của game: cột thẻ tranh bên trái (cuộn riêng, dính đầu), sự kiện đang chọn bên phải -->
  <div class="mt-2 items-start" class:split={tags.length > 0}>
    {#if tags.length}
      <Rail
        items={tags}
        value={scroll ? 'pass' : season ? 'season' : cur}
        onchange={id => (id === 'pass' || id === 'season' ? show(id) : choose(id))}
      />
    {/if}
    <div class="stack">
      {#if season && opened}
        <SeasonCal {opened} {now} />
      {:else if scroll && hasPass}
        <Pass {s} />
      {:else if !list.length}
        <p class="t-soft">{L.fest.none}</p>
      {:else}
        {#if ready > 1}<Button variant="gold" wide onclick={claimAll}>{L.mail.claimAll(ready)}</Button>{/if}
        {#if cur && def}
          {@const f = s.fest[cur]!}
          <!-- băng rôn sự kiện: tranh thẻ lớn nghiêng bên phải, tên viết bút lông, đồng hồ kết thúc trên dải son -->
          <Banner
            title={L.fest.names[cur].name}
            art="fx-{FX[cur]}"
            picSize={76}
            band={L.fest.ends(L.ago(Math.max(0, festEnds(s, cur, now) - now)))}
          >
            <p class="t-small t-lore">{L.fest.names[cur].desc}</p>
          </Banner>
          <div class="stack mt-2 mb-3">
            {#if festStar(cur, f.key)}
              {@const star = festStar(cur, f.key)!}
              <!-- trưởng lão của đợt (MGE): top hạng nhận tín vật người này -->
              <p class="row t-small">
                <Portrait look={LOOK[star]} size={34} /><span class="stack" style:--gap="0"
                  ><b class="t-gold">{L.fest.star(L.elders[star].name)}</b><small class="t-tiny t-soft"
                    >{L.fest.starHint(FEST_STAR_TOKENS.length, FEST_STAR_TOKENS[0])}</small
                  ></span
                >
              </p>
            {/if}
          </div>

          {#if def.kind === 'login'}
            <p class="t-small t-strong">{L.fest.days(Math.min(f.days, def.rewards.length), def.rewards.length)}</p>
            <ul class="fill mt-2" style:--min="76px" style:--gap="14px 8px">
              {#each def.rewards as r, i (i)}
                {@const done = festDone(s, cur, i)}
                <li>
                  <Note snug tilt={i % 2 ? 1 : -1.2} ready={done && !got(cur, i)} dim={!done}>
                    <div class="stack justify-center t-center" style:--gap="4px">
                      <b class="t-small">{L.fest.day(i + 1)}</b>
                      <Bag res={r.res} items={r.items} size="sm" />
                      {#if r.elder}<small class="t-gold">{L.elders[r.elder].name}</small>{/if}
                      {#if got(cur, i)}
                        <span class="stamp">{L.fest.claimed}</span>
                      {:else if done}
                        <Button size="sm" variant="gold" onclick={() => claim(i)}>{L.fest.claim}</Button>
                      {/if}
                    </div>
                  </Note>
                </li>
              {/each}
            </ul>
          {:else if def.kind === 'tasks'}
            {#if cur === 'yeuHoang'}<Trial {s} {onfight} {onreplay} />{/if}
            {@const days = [...new Set(def.tasks.map(t => t.day ?? 0))]}
            {@const day = Math.min(dayPick ?? f.stage, days.at(-1) ?? 0)}
            {#if days.length > 1}
              <!-- nhánh theo ngày (Khai Sơn Thất Nhật): ngày chưa mở có khoá và giờ mở; chấm đỏ = quà chờ nhận trong ngày đó -->
              <div class="scroller" role="tablist">
                {#each days as d (d)}
                  {@const n = def.tasks.filter(
                    (t, i) => (t.day ?? 0) === d && festDone(s, cur, i) && !got(cur, i),
                  ).length}
                  <Chip tab on={d === day} onclick={() => (dayPick = d)}>
                    <span class="stack justify-center" style:--gap="1px">
                      <b class="t-small">{L.fest.day(d + 1)}</b>
                      {#if branches}<small class="t-tiny">{branches[d]}</small>{/if}
                      {#if d > f.stage}<Icon name="lock" size={14} />{/if}
                    </span>
                    {#if d <= f.stage && n}<Badge {n} />{/if}
                  </Chip>
                {/each}
              </div>
              {#if day > f.stage}<p class="t-small t-soft">
                  <!-- ngày chưa mở: lễ tân thủ theo giờ lập tông môn, lễ theo lịch theo 0h các ngày của khung -->
                  {L.fest.opensIn(L.ago(Math.max(0, zeroOf(cur, f.stage) + day * DAY - now)))}
                </p>{/if}
            {/if}
            <ul class="stack plain">
              {#each def.tasks as t, i (i)}
                {@const v = festValue(s, cur, t.m)}
                <li hidden={(t.day ?? 0) !== day && days.length > 1}>
                  <Card tone={festDone(s, cur, i) && !got(cur, i) ? 'glow' : undefined}>
                    <div class="stack" style:--gap="4px">
                      <p class="row between">
                        <b class="t-small"
                          >{(def.abs ? L.fest.task[t.m] : (L.fest.gain[t.m] ?? L.fest.task[t.m]))(num(t.n))}</b
                        ><small class="t-num t-soft">{num(Math.min(v, t.n))}/{num(t.n)}</small>
                      </p>
                      <Meter value={Math.min(1, v / t.n)} size="sm" />
                      <div class="row between">
                        <Bag res={t.reward.res} items={t.reward.items} size="sm" />
                        {#if got(cur, i)}<span class="stamp">{L.fest.claimed}</span>
                        {:else if festDone(s, cur, i)}<Button size="sm" variant="gold" onclick={() => claim(i)}
                            >{L.fest.claim}</Button
                          >{/if}
                      </div>
                    </div>
                  </Card>
                </li>
              {/each}
            </ul>
            {#if def.chests}
              <!-- rương cuối theo số việc đã nhận quà -->
              {@const done = f.got.filter(k => k < def.tasks.length).length}
              <h3 class="t-body mt-4 mb-2">{L.fest.chests}</h3>
              <ol class="path">
                {#each def.chests as c, k (k)}
                  {@const i = def.tasks.length + k}
                  <li class:hit={done >= c.need}>
                    <Card tone={festDone(s, cur, i) && !got(cur, i) ? 'glow' : undefined}>
                      <div class="stack" style:--gap="4px">
                        <p class="row between">
                          <b class="t-small">{L.fest.chestNeed(c.need)}</b><small class="t-num t-soft"
                            >{Math.min(done, c.need)}/{c.need}</small
                          >
                        </p>
                        <Meter value={Math.min(1, done / c.need)} size="sm" />
                        <div class="row between">
                          <Bag items={c.reward.items} size="sm" />
                          {#if got(cur, i)}<span class="stamp">{L.fest.claimed}</span>
                          {:else if festDone(s, cur, i)}<Button size="sm" variant="gold" onclick={() => claim(i)}
                              >{L.fest.claim}</Button
                            >{/if}
                        </div>
                      </div>
                    </Card>
                  </li>
                {/each}
              </ol>
            {/if}
          {:else if def.kind === 'wheel'}
            <Wheel id={cur} />
          {:else if def.kind === 'dice'}
            <Dice id={cur} />
          {:else if def.kind === 'egg'}
            <Egg id={cur} />
          {:else if def.kind === 'dig'}
            <Delve id={cur} />
          {:else if def.kind === 'cards'}
            <Cards id={cur} />
          {:else if def.kind === 'swap'}
            <Swap id={cur} />
          {:else if def.kind === 'offer'}
            <Offer id={cur} />
          {:else if def.kind === 'omen'}
            <Omen id={cur} />
          {:else if def.kind === 'stall'}
            <Stall id={cur} />
          {:else if def.kind === 'escort'}
            <Escort id={cur} {s} onfight={onescort && ((lv, e, a) => onescort(cur, lv, e, a))} {onreplay} />
          {:else if def.kind === 'wish'}
            <Wish id={cur} />
          {:else if def.kind === 'thief'}
            <Thief {s} onfight={onfight && ((e, a) => onfight(e, a, true))} {onreplay} />
          {:else if def.kind === 'shop'}
            <p class="row between">
              <b class="t-title t-num t-gold">{L.fest.tokens(num(festTokens(s, cur)), L.fest.tokenName[cur])}</b>
            </p>
            {#if cur === 'thonTrang'}<Rescue />{/if}
            {#if stage}
              <Card>
                <ul class="plain">
                  {#each Object.entries(stage) as [m, v] (m)}
                    <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
                  {/each}
                </ul>
              </Card>
            {/if}
            <ul class="stack plain">
              {#each def.shop as it, i (i)}
                {@const left = it.max - festBought(s, cur, i)}
                <li>
                  <Card tone={left && festDone(s, cur, i) ? 'glow' : undefined}>
                    <div class="row between">
                      <span class="stack" style:--gap="2px"
                        ><Bag res={it.reward.res} items={it.reward.items} size="sm" /><small class="t-tiny t-soft"
                          >{left ? L.fest.left(left, it.max) : L.fest.soldOut}</small
                        ></span
                      >
                      <Button size="sm" disabled={!left || !festDone(s, cur, i)} onclick={() => claim(i)}
                        >{L.fest.buy(num(it.price))}</Button
                      >
                    </div>
                  </Card>
                </li>
              {/each}
            </ul>
          {:else}
            {#if def.kind === 'race'}<Race {s} />{/if}
            {#if def.kind === 'maze'}<Maze {s} onfight={onmaze} {onreplay} />{/if}
            <p class="row between">
              <b class="t-title t-num t-gold"
                >{def.kind === 'drop'
                  ? L.fest.pouches(num(pts))
                  : def.kind === 'maze'
                    ? L.maze.best(pts)
                    : L.fest.points(num(pts))}</b
              >
            </p>
            {#if def.kind === 'drop'}
              <!-- lễ rơi đồ: việc nào có thể rơi Linh Nang, tỉ lệ -->
              <Card>
                <ul class="plain">
                  {#each Object.entries(def.chance) as [src, p] (src)}
                    <li class="t-small">{L.fest.dropFrom[src as DropSrc](Math.round((p ?? 0) * 100))}</li>
                  {/each}
                </ul>
              </Card>
            {/if}
            {#if stage}
              <Card>
                <p class="t-small t-strong">{L.fest.today}</p>
                <ul class="plain">
                  {#each Object.entries(stage) as [m, v] (m)}
                    <li class="t-small">{L.fest.per(v ?? 0, L.fest.unit[m as Metric])}</li>
                  {/each}
                </ul>
              </Card>
            {/if}
            <ol class="path">
              {#each def.goals as goal, i (i)}
                <li class:hit={pts >= goal}>
                  <Card tone={festDone(s, cur, i) && !got(cur, i) ? 'glow' : undefined}>
                    <div class="stack" style:--gap="4px">
                      <p class="row between">
                        <b class="t-small">{def.kind === 'maze' ? L.maze.goal(goal) : L.fest.goal(num(goal))}</b><small
                          class="t-num t-soft">{num(Math.min(pts, goal))}/{num(goal)}</small
                        >
                      </p>
                      <Meter value={Math.min(1, pts / goal)} size="sm" />
                      <div class="row between">
                        <Bag res={def.rewards[i].res} items={def.rewards[i].items} size="sm" />
                        {#if got(cur, i)}<span class="stamp">{L.fest.claimed}</span>
                        {:else if festDone(s, cur, i)}<Button size="sm" variant="gold" onclick={() => claim(i)}
                            >{L.fest.claim}</Button
                          >{/if}
                      </div>
                    </div>
                  </Card>
                </li>
              {/each}
            </ol>
            {#if board}
              <!-- bảng xếp hạng của lượt lễ (như Mightiest Governor): hết tuần top FEST_TOP nhận quà qua thư; lễ có ải thêm bảng ải hôm nay -->
              {@const rows = board.stage && !whole ? board.stage : board}
              <h3 class="t-body mt-4 mb-2">{L.fest.board}</h3>
              {#if board.stage}
                <Tabs
                  items={[
                    { id: 'stage', label: L.fest.tabStage(board.stage.k + 1) },
                    { id: 'all', label: L.fest.tabAll },
                  ]}
                  value={whole ? 'all' : 'stage'}
                  onchange={id => (whole = id === 'all')}
                />
              {/if}
              <p class="t-tiny t-soft">{rows === board ? L.fest.boardHint(FEST_TOP) : L.fest.stageHint(FEST_TOP)}</p>
              {#if rows.me}<p class="t-small t-gold t-strong">{L.rank.me}: #{rows.me.rank} · {num(rows.me.pts)}</p>{/if}
              <ol class="ledger" style:--gap="3px">
                {#each rows.top as r, k (r.pid)}
                  <li class="between t-small" class:on={k + 1 === rows.me?.rank}>
                    <span class="row" style:--gap="6px"><i class="rank-no r{k + 1}">{k + 1}</i>{r.name}</span><b
                      class="t-num">{num(r.pts)}</b
                    >
                  </li>
                {/each}
              </ol>
              {#if !rows.top.length}<p class="t-small t-soft">{L.rank.none}</p>{/if}
              {#if board.allies}
                <!-- bảng tiên minh (như Clarion Call): tổng điểm người trong minh -->
                <h3 class="t-body mt-4 mb-2">{L.fest.allyBoard}</h3>
                <p class="t-tiny t-soft">{L.fest.allyHint(FEST_ALLY_PRIZES.length)}</p>
                {#if board.myAlly}<p class="t-small t-gold t-strong">
                    {L.fest.myAlly(board.myAlly.rank, num(board.myAlly.pts))}
                  </p>{/if}
                <ol class="ledger" style:--gap="3px">
                  {#each board.allies as r, k (r.id)}
                    <li class="between t-small" class:on={k + 1 === board.myAlly?.rank}>
                      <span class="row" style:--gap="6px"><i class="rank-no r{k + 1}">{k + 1}</i>[{r.tag}]</span><b
                        class="t-num">{num(r.pts)}</b
                      >
                    </li>
                  {/each}
                </ol>
                {#if !board.allies.length}<p class="t-small t-soft">{L.rank.none}</p>{/if}
              {/if}
            {/if}
          {/if}
        {/if}
      {/if}
      <!-- Lịch 7 ngày: hôm nay và các sự kiện sắp mở -->
      <h3 class="t-body mt-4 mb-2">{L.fest.calendar}</h3>
      <ul class="ledger top">
        {#each cal as d, k (d.day)}
          <li>
            <b class="label-col" class:t-bad={k === 0}>{k === 0 ? L.fest.todayShort : weekday(d.day)}</b>
            <span class="row wrap" style:--gap="4px">
              {#each d.ids as id (id)}
                <Entry
                  art="fx-{FX[id]}"
                  icon={ICON[id]}
                  label={L.fest.names[id].name}
                  on={list.includes(id)}
                  onclick={() => list.includes(id) && choose(id)}
                />
              {:else}
                <small class="t-soft">—</small>
              {/each}
            </span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</Sheet>
