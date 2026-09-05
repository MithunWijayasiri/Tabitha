<script lang="ts">
  import { tick } from "svelte";
  import { IconButton } from "@/core/components";
  import { shouldIgnoreShortcut, tooltip } from "@/core/utils";
  import { resolveKeybinding } from "@/core/constants";

  export let value: string;

  let open = false;

  let inputEl: HTMLInputElement;

  async function show() {
    open = true;
    await tick();
    inputEl?.focus();
  }

  function handleFocusOut(event: FocusEvent) {
    if (
      (event.currentTarget as Node).contains(event.relatedTarget as Node) ||
      value !== ""
    )
      return;

    open = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (shouldIgnoreShortcut(event)) return;

    if (resolveKeybinding(event)?.code === "KeyF") {
      show();
      event.preventDefault();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex items-center" on:focusout={handleFocusOut}>
  {#if open}
    <div
      class="flex w-[13rem] items-center gap-2 border-b border-ink px-1 pb-1 text-ink"
    >
      <IconButton icon="search" role="img" class="text-base text-ink-faint" />
      <input
        bind:this={inputEl}
        bind:value
        on:keydown={(event) => {
          if (event.key === "Escape") {
            value = "";
            open = false;
          }
        }}
        spellcheck={false}
        type="text"
        placeholder="Search sessions and tabs"
        class="w-full bg-transparent text-xs font-medium outline-none placeholder:font-normal placeholder:text-ink-faint"
      />
      <IconButton
        icon="close"
        title="Clear search"
        class="text-base text-ink-faint hover:text-danger"
        on:click={() => {
          if (value === "") open = false;
          value = "";
        }}
      />
    </div>
  {:else}
    <button type="button" class="tool" use:tooltip={{ title: "Search" }} on:click={show}>
      <IconButton icon="search" role="img" class="text-lg" />
    </button>
  {/if}
</div>
