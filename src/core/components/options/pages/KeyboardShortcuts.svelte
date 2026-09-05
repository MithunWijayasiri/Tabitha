<script lang="ts">
  import { Section, Shortcut } from "@/core/components";
  import { keymap } from "@/core/constants";
</script>

<Section
  title="Keyboard shortcuts"
  description="These work whenever the panel or the full view has focus and you are not typing in a field."
>
  {#each keymap as binding (binding.code)}
    <Shortcut keybind={binding.keys} action={binding.action} />
  {/each}
</Section>
