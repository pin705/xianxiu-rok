<script lang="ts">
  // Công tắc bật/tắt trên một hàng có nhãn
  import type { Snippet } from 'svelte'
  import { sfx } from '../lib'

  let { checked, onchange, children }: { checked: boolean; onchange: (on: boolean) => void; children: Snippet } = $props()
</script>

<label class="toggle">
  <span class="row">{@render children()}</span>
  <input type="checkbox" role="switch" {checked} onchange={e => (sfx('tap'), onchange(e.currentTarget.checked))} />
</label>

<style>
  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    min-height: 48px;
    padding: 0 var(--sp-1);
    font-weight: 700;
    cursor: pointer;
    border-bottom: 1px dashed color-mix(in srgb, var(--ink) 25%, transparent);
  }
  input {
    position: relative;
    width: 50px;
    height: 26px;
    flex: none;
    appearance: none;
    -webkit-appearance: none;
    background: color-mix(in srgb, var(--ink) 25%, transparent);
    border-radius: 13px;
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.35);
    cursor: pointer;
    transition: background var(--dur-2) var(--ease);
  }
  input::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: radial-gradient(circle at 40% 35%, var(--silk), var(--paper2));
    border-radius: 50%;
    box-shadow: var(--shadow-1);
    transition: translate var(--dur-2) var(--spring);
  }
  input:checked {
    background: var(--malachite);
  }
  input:checked::before {
    translate: 24px 0;
  }
</style>
