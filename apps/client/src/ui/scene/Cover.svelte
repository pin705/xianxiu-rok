<script lang="ts">
  // Lớp bìa trong Splash: chữ sáng trên cảnh, nền tối dần về chân, nội dung dồn xuống đáy (màn tiêu đề).
  // veil: màn mực mờ đều, nội dung giữa (lời dẫn, tờ đặt tên); pick: nội dung từ đầu, cuộn được, tiêu đề vàng `heading` +
  // lời `hint` (chọn đạo thống). onclick: cả lớp bấm được. corner: nút nhỏ góc trên phải (Bỏ qua), nằm ngoài lớp bấm.
  import type { Snippet } from 'svelte'

  let {
    veil = false,
    pick = false,
    heading,
    hint,
    label,
    onclick,
    corner,
    children,
  }: {
    veil?: boolean
    pick?: boolean
    heading?: string
    hint?: string
    label?: string
    onclick?: () => void
    corner?: Snippet
    children: Snippet
  } = $props()
</script>

{#snippet body()}{#if heading}<h2 class="t-title head">{heading}</h2>{/if}{#if hint}<p class="t-small hint">
      {hint}
    </p>{/if}{@render children()}{/snippet}
{#if onclick}
  <button type="button" class="cover" class:veil class:pick aria-label={label} {onclick}>{@render body()}</button>
{:else}
  <div class="cover" class:veil class:pick>{@render body()}</div>
{/if}
{#if corner}<span class="corner">{@render corner()}</span>{/if}

<style>
  .cover {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-2);
    width: 100%;
    padding: 0 var(--sp-5) calc(56px + var(--safe-b));
    color: var(--silk);
    text-align: center;
    background: linear-gradient(transparent 45%, rgb(var(--shade) / 0.72));
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .cover {
      padding-bottom: 88px;
    }
  }
  .veil {
    justify-content: center;
    background: rgb(var(--shade) / 0.66);
  }
  /* chọn đạo thống: cả màn, trên nền núi tối — chữ sáng */
  .pick {
    --gap: var(--sp-1);
    justify-content: flex-start;
    gap: var(--sp-1);
    padding: calc(var(--sp-4) + var(--safe-t)) var(--sp-4) calc(var(--sp-4) + var(--safe-b));
    overflow-y: auto;
  }
  .head {
    margin: 0;
    color: var(--gold-l);
  }
  .hint {
    max-width: 320px;
    margin: 0 0 var(--sp-2);
    opacity: 0.85;
  }
  .corner {
    position: absolute;
    top: calc(var(--sp-3) + var(--safe-t));
    right: var(--sp-3);
  }
</style>
