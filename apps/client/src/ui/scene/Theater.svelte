<script lang="ts">
  // Màn cảnh toàn màn hình (hộp thoại): canvas cảnh phía sau (`host` — màn gắn cảnh Pixi vào), các lớp giao diện đè lên
  // trong cột giữa: top (đầu màn), mid (giữa, hơi dưới tâm), bottom (trên chân), foot (sát chân; rise: trồi lên — bảng
  // kết quả). children: lớp tự đặt vị trí (dải chiêu, dấu thắng bại…). Màn giữ `dlg` để mở/đóng.
  import type { Snippet } from 'svelte'

  let {
    dlg = $bindable(),
    host = $bindable(),
    label,
    onclose,
    rise = false,
    top,
    mid,
    bottom,
    foot,
    children,
  }: {
    dlg?: HTMLDialogElement
    host?: HTMLDivElement
    label: string
    onclose: () => void
    rise?: boolean
    top?: Snippet
    mid?: Snippet
    bottom?: Snippet
    foot?: Snippet
    children?: Snippet
  } = $props()
</script>

<dialog bind:this={dlg} class="theater paper" aria-label={label} {onclose}>
  <!-- svelte-ignore a11y_autofocus -->
  <div class="stage" bind:this={host} tabindex="-1" autofocus></div>
  {#if top}<div class="layer top">{@render top()}</div>{/if}
  {#if mid}<div class="layer mid">{@render mid()}</div>{/if}
  {@render children?.()}
  {#if bottom}<div class="layer bottom">{@render bottom()}</div>{/if}
  {#if foot}<div class="layer foot" class:rise>{@render foot()}</div>{/if}
</dialog>

<style>
  .theater {
    width: 100vw;
    height: 100dvh;
    margin: 0;
    padding: 0;
  }
  .theater::backdrop {
    background: var(--paper2);
  }
  .stage {
    position: absolute;
    inset: 0;
    outline: none;
  }
  .layer {
    position: absolute;
    z-index: 1;
    left: 50%;
    width: min(100% - 24px, calc(var(--col) - 24px));
    translate: -50% 0;
  }
  .top {
    top: calc(var(--sp-3) + var(--safe-t));
  }
  .bottom {
    bottom: calc(64px + var(--safe-b));
  }
  .mid {
    top: 56%;
    display: grid;
    justify-items: center;
    gap: var(--sp-2);
    translate: -50% -50%;
  }
  .foot {
    bottom: calc(var(--sp-4) + var(--safe-b));
  }
  .rise {
    bottom: calc(var(--sp-3) + var(--safe-b));
    animation: rise var(--dur-3) var(--spring) 0.55s both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
  }
</style>
