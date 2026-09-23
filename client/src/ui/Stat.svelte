<script lang="ts">
  // Một dòng sổ sách: nhãn … chấm dẫn … giá trị
  import type { Snippet } from 'svelte'

  let { label, tone, children }: { label: string; tone?: 'good' | 'bad' | 'gold'; children: Snippet } = $props()
</script>

<div class="stat">
  <span class="k">{label}</span>
  <span class="lead" aria-hidden="true"></span>
  <span class="v {tone ?? ''}">{@render children()}</span>
</div>

<style>
  .stat {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-height: 26px;
  }
  .k {
    color: var(--text-soft);
  }
  .lead {
    flex: 1;
    min-width: 12px;
    border-bottom: 1.5px dotted color-mix(in srgb, var(--ink) 35%, transparent);
    translate: 0 -4px;
  }
  .v {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-weight: 800;
  }
  .good {
    color: var(--good);
  }
  .bad {
    color: var(--bad);
  }
  .gold {
    color: var(--gold-d);
  }
</style>
