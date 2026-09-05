<script lang="ts">
  import { Section } from "@/core/components";
  import { EXT_NAME, EXT_VER, EXT_MODE } from "@/core/constants";
</script>

<Section title="About">
  <dl class="flex flex-col">
    <div class="flex items-center gap-4 border-t border-line py-3">
      <dt class="label flex-1">Extension</dt>
      <dd class="text-sm font-medium text-ink">{EXT_NAME}</dd>
    </div>

    <div class="flex items-center gap-4 border-t border-line py-3">
      <dt class="label flex-1">Version</dt>
      <dd class="font-mono text-xs text-ink">{EXT_VER}</dd>
    </div>

    {#if EXT_MODE}
      <div class="flex items-center gap-4 border-t border-line py-3">
        <dt class="label flex-1">Build</dt>
        <dd class="font-mono text-xs text-ochre">{EXT_MODE}</dd>
      </div>
    {/if}
  </dl>
</Section>
