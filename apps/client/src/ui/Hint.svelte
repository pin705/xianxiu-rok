<script lang="ts">
  // Bong bóng gợi ý nhún nhảy trên công trình (có việc làm ngay: xây, tuyển, luyện, độ kiếp): đĩa vàng hoặc đĩa giấy vẽ tay.
  // still: đĩa đứng yên (biểu tượng đầu dòng trong sổ); glyph: cỡ biểu tượng (mặc định nửa đĩa).
  import { Icon, type IconName } from '@rok/art'

  let {
    icon,
    size = 32,
    tone = 'gold',
    still = false,
    glyph,
  }: { icon: IconName; size?: number; tone?: 'gold' | 'paper'; still?: boolean; glyph?: number } = $props()
</script>

<span class="hint {tone}" class:still style:--s="{size}px"
  ><Icon name={icon} size={glyph ?? Math.round(size * 0.5)} /></span
>

<style>
  .hint {
    display: grid;
    place-items: center;
    width: var(--s);
    height: var(--s);
    color: var(--text);
    background: var(--img-disc-gold) center / 100% 100% no-repeat;
    animation: nudge 1.6s var(--ease) infinite;
  }
  .paper {
    background-image: var(--img-disc-paper);
  }
  .still {
    flex: none;
    animation: none;
  }
  @keyframes nudge {
    50% {
      translate: 0 -4px;
    }
  }
</style>
