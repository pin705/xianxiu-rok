<script lang="ts">
  // Khoảnh khắc lớn (đột phá, luân hồi, thất bại): huy hiệu lớn đập xuống như ấn, tên khoảnh khắc trên dải lụa son đuôi én
  // (fail: dấu mực nghiêng thay dải lụa), glory: hào quang nét bút vàng xoay chậm sau huy hiệu; spin: huy hiệu xoay vào.
  // Phần con (lời, nút) xếp dưới, canh giữa.
  import type { Snippet } from 'svelte'
  import { radiance } from '@rok/art'
  import Painting from './Painting.svelte'

  let {
    title,
    glory = false,
    fail = false,
    spin = false,
    medal,
    children,
  }: { title: string; glory?: boolean; fail?: boolean; spin?: boolean; medal: Snippet; children?: Snippet } = $props()
</script>

<div class="moment center stack">
  {#if glory}<div class="rays" aria-hidden="true">
      <Painting key="radiance" make={() => radiance()} w={440} h={440} />
    </div>{/if}
  <span class="big" class:spin>{@render medal()}</span>
  <h2 class="t-title" class:ribbon={!fail} class:stamp={fail} class:fail>{title}</h2>
  {#if children}{@render children()}{/if}
</div>

<style>
  .moment {
    position: relative;
    --gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-2) var(--sp-1);
    overflow: hidden;
  }
  .moment > :global(*:not(.rays)) {
    position: relative;
  }
  /* hào quang tâm trùng tâm huy hiệu */
  .rays {
    position: absolute;
    left: 50%;
    top: calc(var(--sp-3) + 58px);
    translate: -50% -50%;
    animation: turn 18s linear infinite;
    pointer-events: none;
  }
  .big {
    display: grid;
    justify-items: center;
    filter: drop-shadow(0 0 18px rgb(var(--gold-glow) / 0.75));
    animation: stamp 0.7s 0.1s var(--spring) both;
  }
  /* dải lụa son vẽ tay sau chữ (tắt art: dải son) */
  .ribbon {
    justify-self: center;
    min-width: 72%;
    padding: 10px 44px 16px;
    color: var(--text-inv);
    text-shadow: 0 2px 2px rgb(0 0 0 / 0.35);
    background: var(--ui-ribbon-img, var(--cinnabar)) center / 100% 100% no-repeat;
    animation: stamp 0.5s 0.5s var(--spring) both;
  }
  /* thất bại: dấu mực lớn nghiêng (lớp .stamp chung), như đóng tay lên giấy */
  .fail {
    justify-self: center;
    padding: 4px 16px 6px;
    font-size: var(--fs-6);
    color: var(--text-soft);
    border-width: 3px;
    animation: stamp 0.5s 0.4s var(--spring) both;
  }
  .spin {
    animation: spinIn 1.2s var(--ease) both;
  }
  @keyframes turn {
    to {
      rotate: 1turn;
    }
  }
  @keyframes stamp {
    from {
      opacity: 0;
      transform: scale(2.2);
    }
  }
  @keyframes spinIn {
    from {
      opacity: 0;
      transform: rotate(-200deg) scale(0.4);
    }
  }
</style>
