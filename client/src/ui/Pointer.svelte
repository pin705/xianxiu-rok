<script lang="ts">
  // Mũi tên vàng chỉ đường (nhiệm vụ đang dẫn tới đây)
</script>

<svg class="pointer" viewBox="-12 -14 24 30" width="26" height="32" aria-hidden="true">
  <path d="M0 14-9.5 1H-3.6V-11H3.6V1H9.5Z" />
</svg>

<style>
  .pointer {
    display: block;
    overflow: visible;
    filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.4));
    animation: point 0.9s var(--ease) infinite;
  }
  path {
    fill: var(--gold-l);
    stroke: var(--gold-d);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
  @keyframes point {
    50% {
      translate: 0 -7px;
    }
  }
</style>
