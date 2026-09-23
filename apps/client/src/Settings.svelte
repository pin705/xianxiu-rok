<script lang="ts">
  // Cài đặt: âm thanh, xuất/nhập save (Safari có thể xoá dữ liệu web ít mở), chơi lại, thông tin.
  import type { State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Button, Card, Section, Sheet, Toggle } from './ui'
  import { LOCALES, LOCALE_IDS, type Locale } from '@rok/i18n'
  import { L, LANG, isMusicOn, nowMs, parse, setLang, setMusicOn, wipe } from './lib'
  import { startMusic, stopMusic } from './music'

  let {
    game,
    open,
    muted,
    onclose,
    onmute,
    onload,
    toast,
  }: {
    game: State
    open: boolean
    muted: boolean
    onclose: () => void
    onmute: () => void
    onload: (s: State) => void
    toast: (t: string) => void
  } = $props()

  let music = $state(isMusicOn())
  let text = $state('')
  let bad = $state(false)
  let confirmReset = $state(false)
  let file = $state<HTMLInputElement>()

  function exportSave() {
    const raw = JSON.stringify(game)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    a.download = `son-ha-tien-tong-${new Date(nowMs()).toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    navigator.clipboard?.writeText(raw).then(
      () => toast(L.settings.copied),
      () => toast(L.settings.downloaded),
    )
  }

  async function pickFile(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0]
    if (f) text = await f.text()
  }

  function importSave() {
    const s = parse(text.trim())
    bad = !s
    if (s && confirm(L.settings.importConfirm)) {
      text = ''
      onload(s)
    }
  }

  function reset() {
    wipe()
    location.reload()
  }
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

  <Section title={L.settings.save}>
    <p class="t-small t-lore">{L.settings.saveHint}</p>
    <Button wide icon="download" onclick={exportSave}>{L.settings.export}</Button>
  </Section>

  <Section title={L.settings.import}>
    <textarea bind:value={text} rows="3" placeholder={L.settings.importHint} oninput={() => (bad = false)}></textarea>
    {#if bad}<p class="t-small t-bad">{L.settings.importBad}</p>{/if}
    <input bind:this={file} class="sr" type="file" accept="application/json,.json" onchange={pickFile} />
    <div class="grid">
      <Button variant="ghost" icon="upload" onclick={() => file?.click()}>.json</Button>
      <Button disabled={!text.trim()} onclick={importSave}>{L.settings.importGo}</Button>
    </div>
  </Section>

  <Section title={L.settings.reset}>
    {#if confirmReset}
      <p class="t-small t-bad t-strong">{L.settings.resetConfirm}</p>
      <div class="grid">
        <Button variant="ghost" onclick={() => (confirmReset = false)}>{L.panel.close}</Button>
        <Button variant="danger" onclick={reset}>{L.settings.reset}</Button>
      </div>
    {:else}
      <Button variant="ghost" wide onclick={() => (confirmReset = true)}>{L.settings.reset}</Button>
    {/if}
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
  textarea {
    width: 100%;
    padding: 12px 14px;
    font: 12px/1.4 ui-monospace, monospace;
    background: transparent;
    border: 0 solid transparent;
    border-image: var(--sk-card-plain);
    resize: vertical;
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
