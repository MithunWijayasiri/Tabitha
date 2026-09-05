<script lang="ts">
  import { tick } from "svelte";
  import { currentSession, sessions, settings } from "@/core/state";
  import { ConfirmModal, Modal } from "@/core/components";
  import { exportBackup, sessionStore } from "@/core/utils";
  import { openFullView, openOptions } from "@utils/extension";

  interface Command {
    title: string;
    hint?: string;
    run: () => void;
  }

  export let open = false;

  const selected = sessions.selection;

  let query = "";
  let inputEl: HTMLInputElement;

  let confirmOpen = false;
  let confirm = { title: "", message: "", run: () => {} };

  function ask(title: string, message: string, run: () => void) {
    confirm = { title, message, run };
    confirmOpen = true;
  }

  $: if (open) {
    query = "";
    tick().then(() => inputEl?.focus());
  }

  async function duplicate() {
    if (!$selected || $selected.id === "current") return;

    const full = await sessionStore.hydrate($selected);

    await sessions.add({ ...full, title: `${full.title} (copy)` });
  }

  let commands: Command[] = [];

  $: commands = [
    {
      title: "Save current session",
      hint: "S",
      run: () => sessions.add($currentSession),
    },
    {
      title: "Duplicate selected session",
      run: duplicate,
    },
    {
      title: "Delete selected session",
      hint: "Delete",
      run: () => {
        // Snapshotted: a dbChanged broadcast can move the selection while the modal is open.
        const target = $selected;

        ask(
          "Delete session",
          `Delete “${target?.title ?? ""}”? This cannot be undone.`,
          () => sessions.remove(target),
        );
      },
    },
    {
      title: "Delete all sessions",
      run: () =>
        ask(
          "Delete all sessions",
          `Delete all ${$sessions.length} saved sessions? This cannot be undone.`,
          sessions.removeAll,
        ),
    },
    {
      title: "Export sessions to a file",
      run: () => exportBackup($settings.exportCompressed),
    },
    {
      title: $settings.darkMode ? "Use the light theme" : "Use the dark theme",
      run: () => settings.changeSetting("darkMode", !$settings.darkMode),
    },
    { title: "Open full view", run: openFullView },
    { title: "Open settings", run: openOptions },
  ];

  $: matches = commands.filter((command) =>
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

<ConfirmModal
  bind:open={confirmOpen}
  title={confirm.title}
  message={confirm.message}
  on:confirm={() => {
    confirm.run();
    confirmOpen = false;
  }}
/>
