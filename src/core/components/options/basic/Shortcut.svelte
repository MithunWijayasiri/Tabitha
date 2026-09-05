<script lang="ts">
  export let keybind: string[];
  export let action: string;
</script>

<p class="flex items-center gap-2 border-t border-line py-2.5">
  <span class="flex-1 text-sm font-medium text-ink">{action}</span>

  {#each keybind as key, i (key)}
    <kbd
      class="min-w-[2rem] rounded border border-line bg-panel-alt px-2 py-1 text-center font-mono text-[10px] uppercase tracking-wider text-ink-muted"
      >{key}</kbd
    >
    {#if i + 1 !== keybind.length}
      <span class="text-xs text-ink-faint">+</span>
    {/if}
  {/each}
</p>
