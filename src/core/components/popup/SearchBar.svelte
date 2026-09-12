<script lang="ts">
  import { onMount } from "svelte";
  import { IconButton } from "@/core/components";
  import { provideCommandPorts } from "@/core/commands";

  export let value: string;

  let inputEl: HTMLInputElement;

  onMount(() => provideCommandPorts({ focusSearch: () => inputEl?.focus() }));
</script>

<div
  class="flex w-[11.5rem] items-center gap-2 rounded border border-line bg-field px-2 py-1 focus-within:border-accent"
>
  <IconButton icon="search" role="img" class="text-sm text-ink-faint" />

  <input
    bind:this={inputEl}
    bind:value
    on:keydown={(event) => {
      if (event.key !== "Escape") return;

      value = "";
      inputEl?.blur();
    }}
    spellcheck={false}
    type="text"
    placeholder="Search"
    aria-label="Search sessions and tabs"
    class="w-full min-w-0 bg-transparent text-xs font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-faint"
  />

  {#if value}
    <IconButton
      icon="close"
      title="Clear search"
      class="text-sm text-ink-faint hover:text-danger"
      on:click={() => (value = "")}
    />
  {/if}
</div>
