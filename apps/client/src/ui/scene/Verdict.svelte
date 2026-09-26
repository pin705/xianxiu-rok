<script lang="ts">
  // Dấu thắng / bại đập xuống màn cảnh như ấn: huy hiệu lớn trên vệt mực loang (son khi thắng, mực khi thua).
  import Medal from '../Medal.svelte'

  let { win }: { win: boolean } = $props()
</script>

<div class="verdict" class:lose={!win}>
  <span class="splat"></span><Medal emblem={win ? 'win' : 'lose'} tone={win ? 'red' : 'ink'} size={140} />
</div>

<style>
  .verdict {
    position: absolute;
    z-index: 1;
    top: 20%;
    left: 50%;
    width: min(100% - 24px, calc(var(--col) - 24px));
    translate: -50% 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    animation: slam 0.5s cubic-bezier(0.5, 0, 0.75, 0) both;
  }
  .verdict > :global(*) {
    grid-area: 1 / 1;
  }
  .splat {
    width: 260px;
    height: 260px;
    background: var(--cinnabar);
    -webkit-mask: var(--blot-mask) center / contain no-repeat;
    mask: var(--blot-mask) center / contain no-repeat;
    opacity: 0.22;
    animation: splat 0.7s var(--ease) 0.24s both;
  }
  .lose .splat {
    background: var(--ink);
  }
  @keyframes slam {
    0% {
      opacity: 0;
      scale: 2.8;
      rotate: -14deg;
    }
    48% {
      opacity: 1;
      scale: 0.9;
      rotate: 0deg;
    }
    70% {
      scale: 1.04;
    }
    100% {
      opacity: 1;
      scale: 1;
    }
  }
  @keyframes splat {
    from {
      scale: 0.2;
      opacity: 0.5;
    }
  }
</style>
