<script lang="ts">
  // Lá bùa nhỏ ghim son để chọn một mức (bậc đệ tử, cấp độ…): xếp hàng bằng `.grid`, nghiêng xen kẽ; đang chọn viền son;
  // khoá: mờ, đinh xám, dòng `lock` (tầng cần) thay cho hạt `pips`.
  import { Icon } from '@rok/art'
  import { sfx } from '../lib'

  let {
    label,
    pips = 0,
    lock,
    on = false,
    disabled = false,
    title,
    onclick,
  }: {
    label: string
    pips?: number
    lock?: string
    on?: boolean
    disabled?: boolean
    title?: string
    onclick: () => void
  } = $props()
</script>

<button
  type="button"
  class="slip"
  class:on
  {disabled}
  {title}
  aria-label={label}
  aria-pressed={on}
  onclick={() => {
    sfx('tap')
    onclick()
  }}
>
  <b>{label}</b>
  {#if lock}
    <small><Icon name="lock" size={11} />{lock}</small>
  {:else if pips}
    <i class="pips"
      >{#each { length: pips } as _, i (i)}<i></i>{/each}</i
    >
  {/if}
</button>

<style>
  .slip {
    position: relative;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 3px;
    min-height: 56px;
    padding: 10px 2px 6px;
    font-size: var(--fs-1);
    line-height: 1.15;
    text-align: center;
    color: var(--text-soft);
    background: var(--talisman);
    border: 1px solid var(--talisman-edge);
    border-radius: 3px;
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.12);
  }
  .slip:nth-child(odd) {
    rotate: -1.5deg;
  }
  .slip:nth-child(even) {
    rotate: 1deg;
  }
  .slip::before {
    content: '';
    position: absolute;
    top: -5px;
    left: calc(50% - 5px);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--pin);
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
  }
  .on {
    color: var(--cinnabar);
    border-color: var(--cinnabar);
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--cinnabar) 30%, transparent),
      0 3px 8px rgb(0 0 0 / 0.16);
  }
  .slip:disabled {
    opacity: 0.6;
  }
  .slip:disabled::before {
    background: var(--paper3);
  }
  small {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    font-weight: 700;
  }
  .pips {
    display: flex;
    gap: 2px;
  }
  .pips i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, var(--silk), var(--gold-l) 50%, var(--gold));
    box-shadow: 0 0 0 0.5px var(--gold-d);
  }
</style>
