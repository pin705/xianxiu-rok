<script module lang="ts">
  export type MedalTone = 'kiem' | 'phap' | 'the' | 'beast' | 'sect' | 'realm' | 'thunder' | 'ink' | 'jade'
</script>

<script lang="ts">
  // Huy hiệu tròn chữ Hán: hệ đệ tử, yêu thú, tông môn địch, bí cảnh, lôi kiếp. Chấm vàng bên dưới = bậc.
  let { glyph, tone = 'ink', size = 40, pips = 0, dim = false }: { glyph: string; tone?: MedalTone; size?: number; pips?: number; dim?: boolean } = $props()
</script>

<span class="medal {tone}" class:dim style:--s="{size}px" aria-hidden="true">
  <span class="han">{glyph}</span>
  {#if pips}<span class="pips">{#each { length: pips } as _}<i></i>{/each}</span>{/if}
</span>

<style>
  .medal {
    --a: var(--ink2);
    --b: var(--ink);
    position: relative;
    display: inline-grid;
    flex: none;
    place-items: center;
    width: var(--s);
    height: var(--s);
    color: var(--silk);
    background:
      radial-gradient(circle at 50% 32%, rgb(255 255 255 / 0.22), transparent 60%),
      var(--paper-tex),
      radial-gradient(circle at 50% 40%, var(--a), var(--b));
    background-size: auto, 96px, auto;
    background-blend-mode: normal, multiply, normal;
    border-radius: 50%;
    box-shadow: inset 0 0 0 calc(var(--s) * 0.05) var(--gold-l), 0 0 0 1px var(--ink), var(--shadow-1);
  }
  .han {
    font-size: calc(var(--s) * 0.56);
    line-height: 1;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.45);
  }
  .kiem {
    --a: var(--azurite-l);
    --b: var(--azurite-d);
  }
  .phap {
    --a: var(--cinnabar-l);
    --b: #5e1f24;
  }
  .the {
    --a: var(--ochre-l);
    --b: #5c3b17;
  }
  .beast {
    --a: var(--ochre);
    --b: #3b2a14;
  }
  .sect {
    --a: var(--cinnabar);
    --b: #4a150b;
  }
  .realm,
  .jade {
    --a: var(--malachite-l);
    --b: var(--malachite-d);
  }
  .thunder {
    --a: #8a73cf;
    --b: #2a1d55;
  }
  .dim {
    filter: grayscale(1) brightness(0.8);
    opacity: 0.7;
  }
  .pips {
    position: absolute;
    bottom: calc(var(--s) * -0.1);
    display: flex;
    gap: 2px;
    padding: 1.5px 3px;
    background: var(--ink);
    border-radius: 6px;
  }
  .pips i {
    width: 4px;
    height: 4px;
    background: var(--gold-l);
    border-radius: 50%;
  }
</style>
