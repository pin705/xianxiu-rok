<script lang="ts">
  // Huy hiệu hệ đệ tử: chữ Hán (剑 法 体) trên nền màu của hệ, chấm bậc bên dưới.
  import type { Tier, UnitType } from '@rok/rules'
  import { GLYPH } from './lib'

  let { type, tier, size = 40, glyph }: { type: UnitType; tier?: Tier; size?: number; glyph?: string } = $props()
</script>

<span class="unit {type}" style:--s="{size}px" aria-hidden="true">
  <span class="han">{glyph ?? GLYPH.unit[type]}</span>
  {#if tier}<span class="pips">{#each { length: tier } as _}<i></i>{/each}</span>{/if}
</span>

<style>
  .unit {
    position: relative;
    display: inline-grid;
    flex: none;
    place-items: center;
    width: var(--s);
    height: var(--s);
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px rgb(241 217 143 / 0.8), 0 2px 4px rgb(0 0 0 / 0.3);
  }
  .kiem {
    background: radial-gradient(circle at 50% 35%, #5d93bd, #264d6d);
  }
  .phap {
    background: radial-gradient(circle at 50% 35%, #c4586f, #62203a);
  }
  .the {
    background: radial-gradient(circle at 50% 35%, #c9964a, #6b4619);
  }
  .han {
    font-size: calc(var(--s) * 0.55);
    line-height: 1;
    color: #fff8e6;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
  }
  .pips {
    position: absolute;
    bottom: calc(var(--s) * -0.08);
    display: flex;
    gap: 2px;
    padding: 1px 3px;
    background: #13232c;
    border-radius: 6px;
  }
  .pips i {
    width: 4px;
    height: 4px;
    background: var(--gold-l);
    border-radius: 50%;
  }
</style>
