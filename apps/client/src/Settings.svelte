<script lang="ts">
  // Cài đặt: âm thanh, ngôn ngữ, hướng dẫn, tài khoản, thông tin. Tiến độ nằm trên server (không còn xuất/nhập save).
  // Bố cục: mỗi nhóm một tấm bảng giấy khung đôi (Card), trong bảng là các hàng kẻ chấm — không xếp chồng từng thẻ rời.
  import { Icon } from '@rok/art'
  import { Button, Card, Fold, Section, Select, Sheet, Toggle } from './ui'
  import { SECLUDE_DAYS } from '@rok/rules'
  import { LOCALES, LOCALE_IDS, type Locale } from '@rok/i18n'
  import { L, LANG, calm, isMusicOn, setCalm, setLang, setMusicOn } from './lib'
  import { startMusic, stopMusic } from './music'
  import Account from './Account.svelte'
  import type { Net } from './net'
  import { useGame } from './game'

  let {
    open,
    muted,
    account,
    onclose,
    onmute,
    onout,
  }: {
    open: boolean
    muted: boolean
    account?: Net['account'] // online: màn tài khoản (gắn email, mã chuyển máy, đăng xuất, xoá)
    onclose: () => void
    onmute: () => void
    onout?: () => void
    toast?: (t: string) => void
  } = $props()
  const g = useGame()
  const game = $derived(g.game)
  const now = $derived(g.now)

  let music = $state(isMusicOn())
  let calmOn = $state(calm())
</script>

<Sheet {open} {onclose} title={L.settings.title}>
  <Card>
    <Toggle checked={!muted} onchange={onmute}
      ><Icon name={muted ? 'mute' : 'sound'} size={20} />{L.settings.sound}</Toggle
    >
    <Toggle
      checked={music}
      onchange={on => {
        music = on
        setMusicOn(on)
        if (on) startMusic()
        else stopMusic()
      }}><Icon name="music" size={20} />{L.settings.music}</Toggle
    >
    <!-- Giảm chuyển động / tiết kiệm pin: tắt hiệu ứng, mây bay, phần thưởng bay (hệ điều hành đã bật thì game theo sẵn) -->
    <Toggle
      checked={calmOn}
      onchange={on => {
        calmOn = on
        setCalm(on)
      }}><Icon name="power" size={20} />{L.settings.calm}</Toggle
    >
    <!-- tên mỗi ngôn ngữ viết bằng chính ngôn ngữ đó: người đọc không hiểu ngôn ngữ đang hiện vẫn tìm được tiếng mình -->
    <Select
      icon="globe"
      label="Language"
      value={LANG}
      options={LOCALE_IDS.map(id => ({ id, label: LOCALES[id].name }))}
      onchange={id => setLang(id as Locale)}
    />
  </Card>
  <!-- Bế Quan Lệnh: nghỉ dài ngày, không ai cướp được (đang bế quan thì nút xuất quan ở HUD) -->
  <Section title={L.seclude.title}>
    <p class="t-tiny t-soft">{L.seclude.hint}</p>
    <div class="grid" style:--cols="3" style:--gap="6px">
      {#each SECLUDE_DAYS as d (d)}
        <Button
          size="sm"
          variant="ghost"
          disabled={!!game.seclude && game.seclude.until > now}
          onclick={() => g.act({ type: 'seclude', days: d }, 'reward')}>{L.seclude.go(d)}</Button
        >
      {/each}
    </div>
  </Section>

  <Section title={L.guide.title}>
    <!-- cẩm nang: một tấm bảng, mỗi mục một hàng mở ra (không xếp chồng từng thẻ) -->
    <Card>
      {#each L.guide.items as [q, a] (q)}
        <Fold title={q}><p class="t-small t-soft">{a}</p></Fold>
      {/each}
    </Card>
  </Section>

  {#if account && open}
    <Account {account} {now} onout={() => onout?.()} />
  {:else}
    <Section title={L.settings.account}>
      <p class="t-small t-lore">{L.settings.accountHint(game.name)}</p>
    </Section>
  {/if}

  <Section title={L.settings.about}>
    <p class="t-small t-soft">{L.settings.version(__VERSION__)}</p>
    <p class="t-small t-soft">{L.settings.credits}</p>
  </Section>
</Sheet>
