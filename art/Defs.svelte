<svelte:options namespace="svg" />

<script lang="ts">
  // Gradient mà Art dùng. Đặt một lần trong mỗi <svg> có vẽ Art.
</script>

<defs>
  <linearGradient id="crag" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color: var(--rock-top)" />
    <stop offset=".5" style="stop-color: var(--rock)" />
    <stop offset="1" style="stop-color: var(--rock-d)" />
  </linearGradient>
  <radialGradient id="lamp">
    <stop offset="0" stop-color="#ffe29a" stop-opacity=".95" />
    <stop offset="1" stop-color="#ffb850" stop-opacity="0" />
  </radialGradient>
  <radialGradient id="fire">
    <stop offset="0" stop-color="#ffcf7a" stop-opacity=".9" />
    <stop offset="1" stop-color="#ff8a3d" stop-opacity="0" />
  </radialGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color: var(--spirit); stop-opacity: 0" />
    <stop offset="1" style="stop-color: var(--spirit); stop-opacity: .85" />
  </linearGradient>
  <radialGradient id="orb">
    <stop offset="0" stop-color="#ffffff" />
    <stop offset=".4" style="stop-color: var(--spirit); stop-opacity: .85" />
    <stop offset="1" style="stop-color: var(--spirit); stop-opacity: 0" />
  </radialGradient>
</defs>
