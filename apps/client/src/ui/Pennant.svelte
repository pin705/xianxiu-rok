<script lang="ts">
  // Cờ minh treo: lá cờ vẽ tay (ui:ally-banner) đung đưa, hiệu minh viết son trong đĩa trắng giữa cờ. mini: cờ nhỏ đầu dòng
  // (danh sách minh), đứng yên. Tắt art thì về huy hiệu.
  import { artOf } from '@rok/art'
  import Medal from './Medal.svelte'

  let { tag, mini = false }: { tag?: string; mini?: boolean } = $props()
  const src = artOf('ui:ally-banner')?.src
</script>

{#if src}
  <span class="pennant" class:mini
    ><img {src} alt="" draggable="false" />{#if tag}<b class="tag">{tag}</b>{/if}</span
  >
{:else}<Medal emblem="crest" tone="gold" size={mini ? 34 : 46} />{/if}

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
