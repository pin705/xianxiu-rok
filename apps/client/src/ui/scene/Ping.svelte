<script lang="ts">
  // Vòng son nháy loang tại điểm (x, y px) — chỗ vừa nhảy tới trên bản đồ.
  let { x, y }: { x: number; y: number } = $props()
</script>

<span class="ping" style:left="{x}px" style:top="{y}px" aria-hidden="true"></span>

<style>
  .ping {
    position: absolute;
    width: 44px;
    height: 44px;
    border: 3px solid var(--cinnabar);
    border-radius: 50%;
    translate: -50% -50%;
    animation: ping 1s var(--ease) infinite;
  }
  @keyframes ping {
    from {
      scale: 0.4;
      opacity: 1;
    }
    to {
      scale: 1.6;
      opacity: 0;
    }
  }
</style>
