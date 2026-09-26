<script lang="ts">
  // Dải chia phần: mỗi nguồn một đoạn màu khoáng dài theo tỉ lệ `n`, viền mực mảnh (thế lực theo nguồn, cơ cấu quân…).
  // color: biến màu (vd. 'var(--gold)'); đoạn n ≤ 0 thì bỏ.
  type Part = { key: string; n: number; color: string }
  let { parts }: { parts: Part[] } = $props()
</script>

<span class="share" aria-hidden="true">
  {#each parts as p (p.key)}
    {#if p.n > 0}<i style:flex={p.n} style:background={p.color}></i>{/if}
  {/each}
</span>

<style>
  .share {
    display: flex;
    gap: 2px;
    height: 12px;
    padding: 2px;
    background: var(--silk);
    border: 1px solid var(--ink3);
    border-radius: 3px;
  }
  i {
    min-width: 3px;
    border-radius: 1px;
  }
</style>
