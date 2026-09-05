<script lang="ts">
  import type { Icon } from "@/core/types";
  import { createEventDispatcher } from "svelte";
  import { IconButton } from "@/core/components";
  import { tooltip } from "@/core/utils";

  export let icon: Icon;
  export let title: string;
  export let value: string;
  export let items: { value: string; label: string; hint?: string }[];

  const dispatch = createEventDispatcher<{ select: string }>();

  let open = false;
  let root: HTMLDivElement;

  function handleFocusOut(event: FocusEvent) {
    if (!root.contains(event.relatedTarget as Node)) open = false;
  }
</script>

<svelte:window
  on:keydown={(event) => {
    if (open && event.key === "Escape") open = false;
  }}
/>

<div class="relative" bind:this={root} on:focusout={handleFocusOut}>
  <button
    type="button"
    class="tool"
    aria-haspopup="menu"
    aria-expanded={open}
    use:tooltip={{ title }}
    on:click={() => (open = !open)}
  >
    <IconButton {icon} role="img" class="text-lg" />
  </button>

  {#if open}
    <div
      role="menu"
      aria-label={title}
      class="absolute right-0 top-9 z-20 min-w-[11rem] rounded border border-line bg-panel py-1 shadow-lg shadow-black/10"
    >
      {#each items as item (item.value)}
        <button
          type="button"
          role="menuitemradio"
          aria-checked={item.value === value}
          class="flex w-full items-center gap-3 px-3 py-1.5 text-left text-xs font-medium hover:bg-panel-alt {item.value ===
          value
            ? 'text-accent'
            : 'text-ink-muted'}"
          on:click={() => {
            dispatch("select", item.value);
            open = false;
          }}
        >
          <span class="flex-1 truncate">{item.label}</span>
          {#if item.hint}
            <span class="font-mono text-[10px] text-ink-faint">{item.hint}</span
            >
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
