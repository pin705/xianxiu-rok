<script lang="ts">
  // Tờ giấy dòng: một hàng ngang (tranh · nội dung · nút) trên giấy trắng mờ viền mảnh — rương ngày, trận vừa đánh.
  // edge: vạch trái (ink mực · red son); glow: quầng vàng; mark: dấu đóng góc trên (markTone ink: dấu mực — thua).
  import type { Snippet } from 'svelte'

  let {
    edge,
    glow = false,
    mark,
    markTone = 'red',
    children,
  }: {
    edge?: 'ink' | 'red'
    glow?: boolean
    mark?: string
    markTone?: 'red' | 'ink'
    children: Snippet
  } = $props()
</script>

<div class="docket {edge ?? ''}" class:edged={!!edge} class:glow>
  {@render children()}
  {#if mark}<span class="stamp mark" class:ink={markTone === 'ink'}>{mark}</span>{/if}
</div>

<style>
  .docket {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px 6px 6px;
    background: rgb(255 255 255 / 0.55);
    border: 1px solid var(--paper3);
    border-radius: 4px;
  }
  .edged {
    padding: 8px 10px;
    border-left: 3px solid var(--text-soft);
  }
  .red {
    border-left-color: var(--cinnabar);
  }
  .glow {
    box-shadow: 0 0 12px rgb(var(--gold-glow) / 0.45);
  }
  .mark {
    position: absolute;
    top: -10px;
    left: 58px;
    background: var(--paper);
  }
  .mark.ink {
    color: var(--text-soft);
  }
</style>
