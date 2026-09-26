<script lang="ts">
  // Tên game trên bìa: huy hiệu (emblem) đập xuống như ấn ở trên, tên lớn nghiêng gạch nét vàng hiện như mực, dòng phụ vàng.
  import type { Snippet } from 'svelte'

  let { title, tagline, emblem }: { title: string; tagline: string; emblem: Snippet } = $props()
</script>

<span class="logo">{@render emblem()}</span>
<span class="name">{title}</span>
<span class="tag">{tagline}</span>

<style>
  .logo {
    position: absolute;
    top: calc(64px + var(--safe-t));
    left: 50%;
    translate: -50% 0;
    filter: drop-shadow(0 6px 14px rgb(var(--shade) / 0.45));
    animation: slam-in 0.55s 0.5s var(--spring) both;
  }
  .name {
    padding: 0 18px 12px;
    font-size: var(--fs-7);
    font-style: italic;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: 0.02em;
    text-shadow: 0 2px 10px rgb(0 0 0 / 0.65);
    background: var(--stroke-gold) no-repeat center bottom / 100% 12px;
    animation: ink-in 1.2s 0.9s var(--ease) both;
  }
  @media (min-width: 1024px) and (min-height: 600px) {
    .name {
      font-size: calc(var(--fs-7) * 1.5);
    }
  }
  .tag {
    font-style: italic;
    color: var(--gold-l);
  }
</style>
