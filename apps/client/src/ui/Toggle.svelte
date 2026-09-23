<script lang="ts">
  // Công tắc bật/tắt trên một hàng có nhãn: rãnh vẽ tay (tắt: mực nhạt, bật: lục khoáng), núm đĩa giấy vòng mực
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
    min-height: 50px;
    padding: 0 var(--sp-1);
    font-weight: 700;
    cursor: pointer;
    background: var(--img-dots) left bottom / 12px 6px repeat-x;
  }
  input {
    position: relative;
    width: 54px;
    height: 30px;
    flex: none;
    appearance: none;
    -webkit-appearance: none;
    background: var(--img-switch) center / 100% 100% no-repeat;
    cursor: pointer;
  }
  input::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 26px;
    height: 26px;
    background: var(--img-knob) center / 100% 100% no-repeat;
    transition: translate var(--dur-2) var(--spring);
  }
  input:checked {
    background-image: var(--img-switch-on);
  }
  input:checked::before {
    translate: 24px 0;
  }
</style>
