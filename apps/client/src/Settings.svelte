<script lang="ts">
  // Cài đặt: âm thanh, ngôn ngữ, hướng dẫn, tài khoản, thông tin. Tiến độ nằm trên server (không còn xuất/nhập save).
  import type { State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Card, Section, Sheet, Toggle } from './ui'
  import { LOCALES, LOCALE_IDS, type Locale } from '@rok/i18n'
  import { L, LANG, isMusicOn, setLang, setMusicOn } from './lib'
  import { startMusic, stopMusic } from './music'

  let {
    game,
    open,
    muted,
    onclose,
    onmute,
  }: {
    game: State
    open: boolean
    muted: boolean
    onclose: () => void
    onmute: () => void
    toast?: (t: string) => void
  } = $props()

  let music = $state(isMusicOn())
</script>

<Sheet {open} {onclose} title={L.settings.title}>
  <Toggle checked={!muted} onchange={onmute}><Icon name={muted ? 'mute' : 'sound'} size={20} />{L.settings.sound}</Toggle>
  <Toggle
    checked={music}
    onchange={on => {
      music = on
      setMusicOn(on)
      if (on) startMusic()
      else stopMusic()
    }}><Icon name="music" size={20} />{L.settings.music}</Toggle
  >
  <!-- tên mỗi ngôn ngữ viết bằng chính ngôn ngữ đó: người đọc không hiểu ngôn ngữ đang hiện vẫn tìm được tiếng mình -->
  <label class="lang row">
    <Icon name="globe" size={20} />
    <select aria-label="Language" value={LANG} onchange={e => setLang(e.currentTarget.value as Locale)}>
      {#each LOCALE_IDS as id (id)}<option value={id}>{LOCALES[id].name}</option>{/each}
    </select>
  </label>

  <Section title={L.guide.title}>
    <div class="stack">
      {#each L.guide.items as [q, a] (q)}
        <Card>
          <details>
            <summary class="row t-strong"><span class="chev"><Icon name="arrow" size={14} /></span>{q}</summary>
            <p class="t-small t-soft mt-2">{a}</p>
          </details>
        </Card>
      {/each}
    </div>
  </Section>

  <Section title={L.settings.account}>
    <p class="t-small t-lore">{L.settings.accountHint(game.name)}</p>
  </Section>

  <Section title={L.settings.about}>
    <p class="t-small t-soft">{L.settings.version(__VERSION__)}</p>
    <p class="t-small t-soft">{L.settings.credits}</p>
  </Section>
</Sheet>

<style>
  .lang {
    min-height: 50px;
    padding: 0 var(--sp-1);
    background: var(--img-dots) left bottom / 12px 6px repeat-x;
  }
  /* ô chọn ngôn ngữ: nền giấy nhạt, gạch chân mực vẽ tay */
  .lang select {
    flex: 1;
    min-height: 40px;
    padding: 0 10px 4px;
    font: inherit;
    font-weight: 700;
    color: inherit;
    background: transparent;
    border: 0 solid transparent;
    border-image: var(--sk-field);
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
  }
  summary {
    --gap: 6px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .chev {
    display: grid;
    color: var(--cinnabar);
    transition: rotate var(--dur-2) var(--ease);
  }
  details[open] .chev {
    rotate: 90deg;
  }
</style>
