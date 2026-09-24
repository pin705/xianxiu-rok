<script lang="ts">
  // Mũi tên vàng vẽ tay chỉ đường (nhiệm vụ đang dẫn tới đây)
  import { paintedUrl, pointerArt } from '@rok/art'
</script>

<img
  class="pointer"
  src={paintedUrl('pointer', pointerArt, 32)}
  width="25"
  height="32"
  alt=""
  aria-hidden="true"
  draggable="false"
/>

<style>
  .pointer {
    display: block;
    animation: point 0.9s var(--ease) infinite;
  }
  @keyframes point {
    50% {
      translate: 0 -7px;
    }
  }
</style>
