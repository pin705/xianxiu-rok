<script lang="ts">
  // Bậc thềm lên miếu: `n` bậc đá cao dần sang phải, số bậc trên mặt; bậc ≤ `at` tô son, bậc `at` có hạt son (đang đứng).
  // Cấp Hương Hỏa, bậc danh vọng — thang cấp ngắn nhìn một lần thấy hết.
  let { n, at }: { n: number; at: number } = $props()
</script>

<ol class="stairs" aria-hidden="true">
  {#each { length: n } as _, i (i)}
    <li class:hit={i <= at} class:cur={i === at} style:--h="{16 + i * 3.5}px"><b>{i}</b></li>
  {/each}
</ol>

<style>
  .stairs {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 70px;
    padding: 0 2px;
    list-style: none;
    border-bottom: 2px solid var(--ink3);
  }
  li {
    position: relative;
    display: grid;
    flex: 1;
    align-content: start;
    justify-items: center;
    height: var(--h);
    padding-top: 2px;
    background: linear-gradient(
      color-mix(in srgb, var(--ink3) 18%, var(--silk)),
      color-mix(in srgb, var(--ink3) 35%, var(--silk))
    );
    border-top: 3px solid var(--ink3);
    border-radius: 2px 2px 0 0;
  }
  b {
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    color: var(--text-soft);
  }
  .hit {
    background: linear-gradient(
      color-mix(in srgb, var(--cinnabar) 14%, var(--silk)),
      color-mix(in srgb, var(--cinnabar) 26%, var(--silk))
    );
    border-top-color: var(--cinnabar);
  }
  .hit b {
    color: var(--cinnabar);
  }
  /* bậc đang đứng: hạt son trên mặt bậc */
  .cur::before {
    content: '';
    position: absolute;
    top: -13px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--cinnabar) 22%, transparent);
  }
</style>
