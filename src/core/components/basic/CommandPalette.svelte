<script lang="ts">
  import { tick } from "svelte";
  import type { Command } from "@/core/commands";
  import { Modal } from "@/core/components";

  export let open = false;
  export let commands: Command[] = [];

  let query = "";
  let inputEl: HTMLInputElement;

  $: if (open) {
    query = "";
    tick().then(() => inputEl?.focus());
  }

  $: matches = commands.filter(
    (command) =>
      command.palette &&
      command.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function runCommand(command: Command) {
    open = false;
    command.run();
  }
</script>

<Modal bind:open width="26rem">
  <svelte:fragment slot="content">
    <input
      bind:this={inputEl}
      bind:value={query}
      type="text"
      spellcheck={false}
      placeholder="Type a command"
      class="w-full border-b-[1.5px] border-line bg-transparent px-1 pb-2 text-sm font-medium outline-none placeholder:font-normal placeholder:text-ink-faint focus:border-accent"
      on:keydown={(event) => {
        if (event.key === "Enter" && matches[0]) runCommand(matches[0]);
      }}
    />

    {#if matches.length}
      <ul class="max-h-[18rem] overflow-y-auto">
        {#each matches as command (command.title)}
          <li>
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded px-2 py-2 text-left text-xs font-medium hover:bg-panel-alt"
              on:click={() => runCommand(command)}
            >
              <span class="flex-1 truncate">{command.title}</span>
              {#if command.hint}
                <kbd
                  class="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint"
                  >{command.hint}</kbd
                >
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="px-2 py-4 text-xs text-ink-faint">
        No command matches “{query.trim()}”.
      </p>
    {/if}
  </svelte:fragment>
</Modal>
