<script lang="ts">
  // Dòng chọn một món: tranh đồ vật (ui:<art>, lùi về icon) + tên + dòng phụ; đang chọn viền son, khoá mờ.
  // Xếp dọc thành cột chọn (đổi đi / nhận về ở Thương hội…).
  import type { IconName } from '@rok/art'
  import { sfx } from '../lib'
  import Art from './Art.svelte'

  let {
    art,
    icon,
    label,
    sub,
    on = false,
    disabled = false,
    onclick,
  }: {
    art: string
    icon: IconName
    label: string
    sub?: string
    on?: boolean
    disabled?: boolean
    onclick: () => void
  } = $props()
</script>

<button
  type="button"
  class="choice"
  class:on
  {disabled}
  aria-label={label}
  aria-pressed={on}
  onclick={() => {
    sfx('tap')
    onclick()
  }}
>
  <Art {art} {icon} size={44} />
  <span class="stack" style:--gap="0"
    ><b class="t-small">{label}</b>{#if sub}<small class="t-tiny t-soft t-num">{sub}</small>{/if}</span
  >
</button>

<style>
  .choice {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    min-height: 50px;
    padding: 2px 6px;
    color: var(--text-soft);
    text-align: left;
    border: 1.5px solid transparent;
    border-radius: 8px;
  }
  .on {
    color: var(--text);
    border-color: var(--cinnabar);
  }
  .choice:disabled {
    opacity: 0.35;
  }
</style>
