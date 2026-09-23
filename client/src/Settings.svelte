<script lang="ts">
  // Cài đặt: âm thanh, xuất/nhập save (Safari có thể xoá dữ liệu web ít mở), chơi lại, thông tin.
  import type { State } from '@rok/rules'
  import { Icon } from '@rok/art'
  import Sheet from './Sheet.svelte'
  import { L, LANG, nowMs, parse, setLang, wipe } from './lib'

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

  let text = $state('')
  let bad = $state(false)
  let confirmReset = $state(false)

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

<Sheet {open} {onclose} label={L.settings.title}>
  <div class="head">
    <h2><Icon name="gear" size={20} />{L.settings.title}</h2>
    <button class="sheet-x" onclick={onclose} aria-label={L.panel.close}><Icon name="close" size={18} /></button>
  </div>

  <label class="toggle">
    <span><Icon name={muted ? 'mute' : 'sound'} size={20} />{L.settings.sound}</span>
    <input type="checkbox" checked={!muted} onchange={onmute} />
  </label>
  <div class="lang" role="group" aria-label="Ngôn ngữ / Language">
    <button class:on={LANG === 'vi'} aria-pressed={LANG === 'vi'} onclick={() => LANG !== 'vi' && setLang('vi')}>Tiếng Việt</button>
    <button class:on={LANG === 'en'} aria-pressed={LANG === 'en'} onclick={() => LANG !== 'en' && setLang('en')}>English</button>
  </div>

  <h3>{L.settings.save}</h3>
  <p class="muted note">{L.settings.saveHint}</p>
  <button class="btn wide" onclick={exportSave}><Icon name="download" size={18} />{L.settings.export}</button>

  <h3>{L.settings.import}</h3>
  <textarea bind:value={text} rows="3" placeholder={L.settings.importHint} oninput={() => (bad = false)}></textarea>
  {#if bad}<p class="warn note">{L.settings.importBad}</p>{/if}
  <div class="two">
    <label class="btn ghost file">
      <Icon name="upload" size={18} />.json
      <input type="file" accept="application/json,.json" onchange={pickFile} />
    </label>
    <button class="btn" disabled={!text.trim()} onclick={importSave}>{L.settings.importGo}</button>
  </div>

  <h3>{L.settings.reset}</h3>
  {#if confirmReset}
    <p class="warn note">{L.settings.resetConfirm}</p>
    <div class="two">
      <button class="btn ghost" onclick={() => (confirmReset = false)}>{L.panel.close}</button>
      <button class="btn red" onclick={reset}>{L.settings.reset}</button>
    </div>
  {:else}
    <button class="btn ghost wide" onclick={() => (confirmReset = true)}>{L.settings.reset}</button>
  {/if}

  <h3>{L.settings.about}</h3>
  <p class="muted note">{L.settings.version(__VERSION__)}</p>
  <p class="muted note">{L.settings.credits}</p>
</Sheet>

<style>
  .head {
    position: relative;
    padding: 18px 0 8px;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 19px;
    color: var(--gold-l);
  }
  .head .sheet-x {
    top: 14px;
    right: 0;
  }
  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    padding: 12px;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(201 161 74 / 0.35);
    border-radius: 12px;
    cursor: pointer;
  }
  .toggle span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .toggle input {
    width: 20px;
    height: 20px;
    accent-color: var(--gold);
  }
  .lang {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-top: 8px;
    padding: 4px;
    background: rgb(0 0 0 / 0.25);
    border-radius: 12px;
  }
  .lang button {
    min-height: 36px;
    font-size: 14px;
    font-weight: 600;
    color: #b9c6ca;
    background: none;
    border: 0;
    border-radius: 9px;
    cursor: pointer;
  }
  .lang .on {
    color: #2b2210;
    background: linear-gradient(#f8e3a0, #c9a14a);
  }
  .note {
    margin-bottom: 10px;
    font-size: 13px;
    line-height: 1.5;
  }
  textarea {
    width: 100%;
    margin-bottom: 8px;
    padding: 10px;
    font: 12px/1.4 ui-monospace, monospace;
    color: #f6f1e4;
    background: rgb(0 0 0 / 0.3);
    border: 1px solid rgb(201 161 74 / 0.4);
    border-radius: 10px;
    resize: vertical;
  }
  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .file {
    position: relative;
    overflow: hidden;
  }
  .file input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
</style>
