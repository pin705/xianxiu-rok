<script lang="ts">
  // Dấu triện son: chữ Hán trắng khắc trên nền son, mép mực ăn giấy (mặt nạ vẽ tay --seal-mask).
  let { glyph, size = 40, tone = 'red', tilt = false }: { glyph: string; size?: number; tone?: 'red' | 'gold' | 'ink'; tilt?: boolean } = $props()
</script>

<span class="seal {tone}" class:tilt style:--s="{size}px" aria-hidden="true"><span class="han">{glyph}</span></span>

<style>
  .seal {
    display: inline-grid;
    flex: none;
    place-items: center;
    width: var(--s);
    height: var(--s);
    font-size: calc(var(--s) * 0.64);
    line-height: 1;
    color: var(--paper);
    background: var(--cinnabar);
    -webkit-mask: var(--seal-mask) center / 100% 100%;
    mask: var(--seal-mask) center / 100% 100%;
  }
  .gold {
    color: var(--ink);
    background: linear-gradient(var(--gold-l), var(--gold));
  }
  .ink {
    background: var(--ink);
  }
  .tilt {
    rotate: -4deg;
  }
  .han {
    translate: 0 4%;
  }
</style>
