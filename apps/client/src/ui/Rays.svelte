<script lang="ts">
  // Hào quang tia sáng xoay chậm sau đồ vật (ấn mở khoá, tranh thu nhận): lớp trang trí đặt trong khung có position.
  // size: cạnh vuông (css), y: tâm theo chiều dọc khung, reach: bán kính tia còn thấy (% mặt nạ), alpha: độ đậm,
  // tone: kênh rgb của màu tia (mặc định quầng vàng; phẩm dùng --glow-rar*).
  let {
    size = '220%',
    y = '50%',
    reach = 31,
    alpha = 0.35,
    tone = 'var(--gold-glow)',
  }: { size?: string; y?: string; reach?: number; alpha?: number; tone?: string } = $props()
</script>

<span
  class="rays"
  aria-hidden="true"
  style:--size={size}
  style:--y={y}
  style:--reach="{reach}%"
  style:--alpha={alpha}
  style:--tone={tone}
></span>

<style>
  .rays {
    position: absolute;
    top: var(--y);
    left: 50%;
    width: var(--size);
    aspect-ratio: 1;
    translate: -50% -50%;
    background: repeating-conic-gradient(rgb(var(--tone) / var(--alpha)) 0deg 8deg, transparent 8deg 22deg);
    mask: radial-gradient(circle, #000 0%, transparent var(--reach));
    animation: spin 30s linear infinite;
    pointer-events: none;
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .rays {
      animation: none;
    }
  }
</style>
