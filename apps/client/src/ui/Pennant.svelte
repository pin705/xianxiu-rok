<script module lang="ts">
  import { BEAST_EMBLEMS, type MedalTone } from '@rok/art'
  // cờ minh đã chọn (rules ALLY_BADGE [linh thú, màu]): chỉ số → hình chạm linh thú, màu đĩa
  export const BADGE_EMBLEMS = BEAST_EMBLEMS
  export const BADGE_TONES: MedalTone[] = ['red', 'jade', 'gold', 'ink', 'kiem', 'phap', 'the', 'thunder']
</script>

<script lang="ts">
  // Cờ minh treo: lá cờ vẽ tay (ui:ally-banner) đung đưa, trong đĩa trắng giữa cờ là huy hiệu minh đã chọn (badge) hay hiệu minh
  // viết son. mini: cờ nhỏ đầu dòng (danh sách minh), đứng yên. Tắt art thì về huy hiệu.
  import { artOf } from '@rok/art'
  import Medal from './Medal.svelte'

  let { tag, badge, mini = false }: { tag?: string; badge?: [number, number]; mini?: boolean } = $props()
  const src = artOf('ui:ally-banner')?.src
  const emblem = $derived(badge ? BADGE_EMBLEMS[badge[0]] : undefined)
  const tone = $derived(badge ? BADGE_TONES[badge[1]] : undefined)
</script>

{#if src}
  <span class="pennant" class:mini
    ><img {src} alt="" draggable="false" />{#if emblem}<span class="tag"
        ><Medal {emblem} {tone} size={mini ? 16 : 30} /></span
      >{:else if tag}<b class="tag">{tag}</b>{/if}</span
  >
{:else}<Medal emblem={emblem ?? 'crest'} tone={tone ?? 'gold'} size={mini ? 34 : 46} />{/if}

<style>
  .pennant {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 72px;
  }
  img {
    width: 72px;
    height: auto;
    margin-top: -14px;
    filter: drop-shadow(0 4px 5px rgb(0 0 0 / 0.25));
    transform-origin: 50% 0;
    animation: sway 5s ease-in-out infinite;
  }
  /* hiệu minh viết trong đĩa trắng của cờ */
  .tag {
    position: absolute;
    top: 32%;
    left: 50%;
    translate: -50% -50%;
    max-width: 42px;
    overflow: hidden;
    font-size: 12px;
    font-weight: 900;
    color: var(--cinnabar);
  }
  .mini {
    width: 34px;
  }
  .mini img {
    width: 34px;
    margin: -4px 0 0;
    animation: none;
  }
  .mini .tag {
    top: 30%;
    font-size: 8px;
  }
  @keyframes sway {
    50% {
      rotate: 1.5deg;
    }
  }
</style>
