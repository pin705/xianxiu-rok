<script lang="ts">
  // Chân dung trong vòng giấy để chọn người (chủ tướng, phó tướng): tên dưới, dòng phụ (cấp, tuyệt kỹ, "đang xuất chinh");
  // on: vòng son phóng nhẹ; disabled: không chọn được; empty: vòng nét đứt không chân dung ("không có phó").
  // Xếp thành hàng cuộn ngang bằng .scroller.
  import type { Snippet } from 'svelte'

  let {
    on = false,
    disabled = false,
    empty = false,
    label,
    name,
    sub,
    bad = false,
    onclick,
    children,
  }: {
    on?: boolean
    disabled?: boolean
    empty?: boolean
    label: string
    name?: string
    sub?: string
    bad?: boolean // dòng phụ tô son (đang bận)
    onclick: () => void
    children?: Snippet
  } = $props()
</script>

<button type="button" class="cameo" class:on {disabled} aria-pressed={on} aria-label={label} {onclick}>
  <span class="ring" class:empty>{@render children?.()}</span>
  {#if name}<b class="fn">{name}</b>{/if}
  {#if sub}<small class="t-tiny clamp" class:t-soft={!bad} class:t-bad={bad}>{sub}</small>{/if}
</button>

<style>
  .cameo {
    display: grid;
    flex: none;
    justify-items: center;
    align-content: start;
    gap: 2px;
    width: 84px;
    padding: 4px 2px;
    text-align: center;
    color: var(--text);
  }
  .ring {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border: 3px solid var(--paper3);
    border-radius: 50%;
    background: var(--paper);
    transition: transform var(--dur-2) var(--spring);
  }
  .ring.empty {
    border-style: dashed;
  }
  .on .ring {
    border-color: var(--cinnabar);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--cinnabar) 22%, transparent);
    transform: scale(1.06);
  }
  .fn {
    max-width: 100%;
    overflow: hidden;
    font-size: var(--fs-1);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  small {
    line-height: 1.15;
  }
</style>
