<script lang="ts">
  // Bong bóng gợi ý nhún nhảy trên công trình: có việc có thể làm ngay (xây, tuyển, luyện, độ kiếp)
  import { Icon, type IconName } from '@rok/art'

  let { icon, size = 30, tone = 'gold' }: { icon: IconName; size?: number; tone?: 'gold' | 'paper' } = $props()
</script>

<span class="hint {tone}" style:--s="{size}px"><Icon name={icon} size={Math.round(size * 0.52)} /></span>

<style>
  .hint {
    display: grid;
    place-items: center;
    width: var(--s);
    height: var(--s);
    color: var(--ink);
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--silk), 0 0 0 3px var(--gold-d), var(--shadow-2);
    animation: nudge 1.6s var(--ease) infinite;
  }
  .gold {
    background: radial-gradient(circle at 45% 35%, var(--silk), var(--gold-l) 60%, var(--gold));
  }
  .paper {
    background: var(--paper) var(--paper-tex);
    background-size: 96px;
  }
  @keyframes nudge {
    50% {
      translate: 0 -4px;
    }
  }
</style>
