<script lang="ts">
  // Lệnh bài bậc để chọn (độ khó, cấp thử thách): giấy trắng sương pha son theo `k` (0..1 — càng cao càng đậm son), viền đầu
  // dày; tên + dòng phụ canh giữa. Xếp bằng `.fill`.
  import { sfx } from '../lib'

  let {
    k,
    label,
    sub,
    disabled = false,
    onclick,
  }: { k: number; label: string; sub?: string; disabled?: boolean; onclick: () => void } = $props()
</script>

<button
  type="button"
  class="grade"
  style:--k={k}
  {disabled}
  aria-label={label}
  onclick={() => {
    sfx('tap')
    onclick()
  }}
>
  <b>{label}</b>
  {#if sub}<small class="t-tiny">{sub}</small>{/if}
</button>

<style>
  .grade {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-height: 58px;
    padding: 8px 4px;
    text-align: center;
    background: color-mix(in srgb, var(--cinnabar) calc(var(--k) * 30%), var(--silk));
    border: 1px solid color-mix(in srgb, var(--cinnabar) calc(var(--k) * 100%), var(--paper3));
    border-top: 4px solid color-mix(in srgb, var(--cinnabar) calc(var(--k) * 100%), var(--ink3));
    border-radius: 3px;
    box-shadow: 0 2px 4px rgb(var(--shade) / 0.12);
  }
  .grade:active:not(:disabled) {
    transform: scale(0.96);
  }
</style>
