<script lang="ts">
  // Cài đặt: âm thanh, xuất/nhập save (Safari có thể xoá dữ liệu web ít mở), chơi lại, thông tin.
  import type { State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Button, Card, Section, Sheet, Tabs, Toggle } from './ui'
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
    }}><Icon name="sound" size={20} />{L.settings.music}</Toggle
  >
  <Tabs items={[{ id: 'vi', label: 'Tiếng Việt' }, { id: 'en', label: 'English' }] as const} value={LANG} onchange={setLang} />

  <Section title={L.guide.title}>
    <div class="stack">
      {#each L.guide.items as [q, a] (q)}
        <Card>
          <details>
            <summary class="t-strong">{q}</summary>
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
  textarea {
    width: 100%;
    padding: var(--sp-2);
    font: 12px/1.4 ui-monospace, monospace;
    background: color-mix(in srgb, var(--paper2) 60%, transparent);
    border: 1px solid color-mix(in srgb, var(--ink) 35%, transparent);
    resize: vertical;
  }
  summary {
    cursor: pointer;
    list-style: none;
  }
  summary::before {
    content: '▸ ';
    color: var(--cinnabar);
  }
  details[open] summary::before {
    content: '▾ ';
  }
</style>
