<script lang="ts">
  // Chân dung chưởng môn trên thanh HUD: tranh mặt trong khung (ngọc vẽ tay hoặc vòng khung đã chọn), bấm được.
  // shield: vòng khiên xanh + dấu khiên góc (đang được bảo hộ); ink: khung ngọc lớn tràn ra ngoài.
  import { Icon, Portrait, type Look } from '@rok/art'

  let {
    look,
    frame,
    ink = false,
    shield,
    label,
    onclick,
  }: {
    look: Look
    frame: string
    ink?: boolean
    shield?: string // chú thích khi đang được bảo hộ (còn bao lâu)
    label: string
    onclick: () => void
  } = $props()
</script>

<button class="avatar" class:ink class:shielded={!!shield} {onclick} aria-label={label}>
  <Portrait {look} size={50} /><img class="frame" src={frame} alt="" draggable="false" />
  {#if shield}<span class="shield" title={shield}><Icon name="shield" size={18} /></span>{/if}
</button>

<style>
  .avatar {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 56px;
    height: 56px;
    padding: 0;
    background: none;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
  }
  .shielded {
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--malachite) 70%, transparent),
      0 0 10px color-mix(in srgb, var(--malachite) 50%, transparent);
  }
  .shield {
    position: absolute;
    right: -4px;
    bottom: -4px;
    line-height: 0;
  }
  .frame {
    position: absolute;
    inset: -3px;
    width: 62px;
    height: 62px;
    pointer-events: none;
  }
  .ink {
    width: 60px;
    height: 60px;
  }
  .ink .frame {
    inset: -10px;
    width: 80px;
    height: 80px;
  }
</style>
