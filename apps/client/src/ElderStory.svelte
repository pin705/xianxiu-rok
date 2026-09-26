<script lang="ts">
  // Liệt truyện trưởng lão (Commander Stories của RoK): ba chương, chương k mở khi trưởng lão tới cấp ELDER_STORY_LV[k]
  import { ELDER_STORY_LV, type ElderId } from '@rok/rules'
  import { Icon } from '@rok/art'
  import { Section } from './ui'
  import { L } from './lib'

  let { elder, lv }: { elder: ElderId; lv: number } = $props()
</script>

<Section title={L.story.title}>
  <ol class="stack chapters" style:--gap="8px">
    {#each L.story.text[elder] as text, k (k)}
      {#if lv >= ELDER_STORY_LV[k]}
        <li class="t-small t-lore">{text}</li>
      {:else}
        <li class="t-small t-soft lock"><Icon name="lock" size={14} /> {L.story.lock(ELDER_STORY_LV[k])}</li>
      {/if}
    {/each}
  </ol>
</Section>

<style>
  .chapters {
    margin: 0;
    padding-left: 1.2em;
  }
  .lock {
    list-style: none;
    margin-left: -1.2em;
  }
</style>
