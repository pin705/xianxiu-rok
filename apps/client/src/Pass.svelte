<script lang="ts">
  // Tu Tiên Lệnh (Lucerne Scroll của RoK — thẻ mùa): cấp lệnh + thanh điểm, dải cấp cuộn ngang — mỗi cột một quà thường (trên) và
  // một quà Kim Lệnh (dưới, khoá tới Hương Hỏa PASS_VIP). Chạm quà đã tới cấp để nhận; "Nhận tất cả"; mở ra cuộn sẵn tới cấp đang lên.
  import {
    PASS_CHEST,
    PASS_FREE,
    PASS_GOLD,
    PASS_LEVELS,
    PASS_STEP,
    PASS_VIP,
    PASS_WEEK,
    passGold,
    passLevel,
    passReady,
    type Reward,
    type State,
  } from '@rok/rules'
  import { Art, Bag, Button, Meter, Prize, Seal, Track } from './ui'
  import { L } from './lib'
  import { useGame } from './game'

  let { s }: { s: State } = $props()
  const g = useGame()
  const lv = $derived(passLevel(s))
  const xp = $derived(s.pass?.xp ?? 0)
  const gold = $derived(passGold(s))
  const ready = $derived(passReady(s).length)
  const claim = (a: { lv?: number; gold?: boolean }) => g.act({ type: 'pass', ...a }, 'reward')
</script>

{#snippet cell(n: number, row: 'top' | 'bottom')}
  {@const isGold = row === 'bottom'}
  {@const r = (isGold ? PASS_GOLD : PASS_FREE)[n - 1] as Reward}
  {@const got = !!(isGold ? s.pass?.gold : s.pass?.got)?.includes(n)}
  <Prize
    gold={isGold}
    can={n <= lv && !got && (!isGold || gold)}
    dim={n > lv}
    lock={isGold && !gold}
    stamp={got ? L.fest.claimed : undefined}
    label={`${isGold ? L.pass.gold : L.pass.free} · ${L.pass.level(n, PASS_LEVELS)}`}
    onclick={() => claim({ lv: n, ...(isGold && { gold: true }) })}
  >
    <Bag res={r.res} items={r.items} size="sm" />
  </Prize>
{/snippet}

<!-- lệnh bài ngọc là tâm điểm: cấp lệnh trong ấn son, vạch điểm tới cấp sau -->
<header class="vista split" style:--gap="4px 10px">
  <span class="rel stack">
    <Art art="fx-pass" icon="scroll" size={64} tilt={-4} lift />
    <span class="at-br" aria-hidden="true"><Seal size={28}>{lv}</Seal></span>
  </span>
  <div class="stack" style:--gap="3px">
    <b class="t-big">{L.pass.title}</b>
    <b class="t-small t-num t-gold">{L.pass.level(lv, PASS_LEVELS)}</b>
    <Meter value={lv >= PASS_LEVELS ? 1 : (xp % PASS_STEP) / PASS_STEP} size="sm" tone="gold" />
    <small class="t-tiny t-soft">{lv >= PASS_LEVELS ? L.pass.max : L.pass.next(xp % PASS_STEP, PASS_STEP)}</small>
  </div>
  <p class="span-all clamp t-tiny t-lore">{L.pass.desc(PASS_CHEST, PASS_WEEK)}</p>
</header>
<small class="t-tiny" class:t-gold={gold} class:t-soft={!gold}>{gold ? L.pass.goldOn : L.pass.goldOff(PASS_VIP)}</small>
{#if ready > 1}<Button variant="gold" wide onclick={() => claim({})}>{L.mail.claimAll(ready)}</Button>{/if}
<!-- đường mốc hai hàng: quà thường trên, Kim Lệnh dưới, sợi chỉ cấp chạy giữa (đã tới: chỉ son, hạt son) -->
<Track
  n={PASS_FREE.length}
  reached={lv}
  cur={Math.min(PASS_LEVELS, lv + 1)}
  top={L.pass.free}
  bottom={L.pass.gold}
  {cell}
/>
<p class="t-tiny t-soft">{L.pass.reset}</p>
