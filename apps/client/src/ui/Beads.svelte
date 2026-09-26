<script lang="ts">
  // Hạt đếm: n hạt, `on` hạt đầu sáng. look="string": xâu hạt trên sợi chỉ, hạt sáng tô son (bảo hiểm, lượt đã dùng);
  // look="pips": chấm vàng nhỏ không chỉ (tầng công pháp).
  let { n, on = 0, look = 'string' }: { n: number; on?: number; look?: 'string' | 'pips' } = $props()
</script>

<span class="beads {look}" aria-hidden="true">
  {#each Array.from({ length: n }, (_, i) => i) as i (i)}<i class:on={i < on}></i>{/each}
</span>

<style>
  .beads {
    display: inline-flex;
    flex: none;
    align-items: center;
  }
  .string {
    gap: 6px;
    padding: 0 6px;
    /* sợi chỉ xâu hạt */
    background: linear-gradient(var(--paper3), var(--paper3)) center / 100% 2px no-repeat;
  }
  .string i {
    width: 12px;
    height: 12px;
    border: 2px solid var(--rim, var(--ink3));
    border-radius: 50%;
    background: var(--paper);
  }
  .string i.on {
    border-color: var(--cinnabar);
    background: radial-gradient(circle at 35% 35%, var(--cinnabar-l), var(--cinnabar) 60%, var(--lacquer));
  }
  .pips {
    gap: 3px;
  }
  .pips i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1.5px solid var(--gold);
  }
  .pips i.on {
    background: var(--gold);
  }
</style>
