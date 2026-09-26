<script lang="ts">
  // Lá bùa treo trên sợi chỉ son (đặt trong hàng `.charm-line`): đinh son đầu lá, phần con (icon, tên, hiệu quả) canh giữa,
  // `band` dải son đáy lá (giờ còn lại; always: dải mực — thường trực); jade: viền lục (khiên, bảo hộ); tilt: nghiêng (độ).
  import type { Snippet } from 'svelte'

  let {
    tilt = 0,
    jade = false,
    band,
    always = false,
    children,
  }: { tilt?: number; jade?: boolean; band?: string; always?: boolean; children: Snippet } = $props()
</script>

<li class="charm" class:jade style:rotate="{tilt}deg">
  {@render children()}
  {#if band}<small class="band t-num" class:always>{band}</small>{/if}
</li>

<style>
  .charm {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 14px 8px 0;
    overflow: hidden;
    text-align: center;
    background: var(--silk);
    border: 1px solid var(--paper3);
    border-radius: 3px;
    box-shadow: 0 3px 6px rgb(var(--shade) / 0.14);
  }
  .charm::before {
    content: '';
    position: absolute;
    top: 4px;
    left: calc(50% - 5px);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer));
  }
  .jade {
    border-color: var(--malachite);
  }
  .band {
    width: calc(100% + 16px);
    margin-top: auto;
    padding: 2px 4px 3px;
    font-weight: 800;
    color: var(--silk);
    background: var(--cinnabar);
  }
  .always {
    background: color-mix(in srgb, var(--ink) 80%, transparent);
  }
</style>
