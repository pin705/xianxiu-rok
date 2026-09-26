<script lang="ts">
  // Cuốn bí kíp giấy gáy chỉ son bên trái: tên đậm + lời ngắn, cả cuốn bấm để chọn (công pháp cho giáo đầu, lựa chọn 1/3).
  // Xếp nhiều cuốn bằng lưới .fill.
  import { sfx } from '../lib'

  let { title, text, onclick }: { title: string; text?: string; onclick: () => void } = $props()
</script>

<button
  type="button"
  class="book"
  aria-label={title}
  onclick={() => {
    sfx('tap')
    onclick()
  }}
>
  <b>{title}</b>{#if text}<small class="t-tiny">{text}</small>{/if}
</button>

<style>
  .book {
    display: grid;
    align-content: start;
    gap: 4px;
    min-height: 92px;
    padding: 10px 8px 10px 14px;
    text-align: left;
    color: var(--text);
    background: linear-gradient(90deg, var(--cinnabar) 0 4px, var(--silk) 4px);
    border: 1px solid var(--paper3);
    border-radius: 2px 6px 6px 2px;
    box-shadow: 0 3px 6px rgb(var(--shade) / 0.14);
  }
  .book:active {
    transform: translateY(1px);
  }
  b {
    font-size: var(--fs-3);
    line-height: 1.15;
  }
</style>
