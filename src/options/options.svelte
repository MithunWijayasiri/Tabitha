<script lang="ts">
  import { notification } from "@/core/state";
  import {
    Notification,
    Tab,
    General,
    Tags,
    Backup,
    KeyboardShortcuts,
    About,
    CommandPalette,
  } from "@/core/components";
  import { EXT_NAME, resolveKeybinding } from "@/core/constants";
  import { shouldIgnoreShortcut } from "@/core/utils";

  let group: string;

  let open = false;
</script>

<svelte:window
  on:keydown={(ev) => {
    if (shouldIgnoreShortcut(ev, true)) return;

    if (resolveKeybinding(ev)?.code === "KeyK") {
      open = !open;
      ev.preventDefault();
    }
  }}
/>

<header class="flex-none border-b-[1.5px] border-ink bg-panel">
  <div class="mx-auto flex max-w-3xl items-center gap-6 px-6">
    <h1 class="opsz-lg py-3 text-[22px] leading-none">{EXT_NAME}</h1>

    <nav class="ml-auto flex gap-6">
      <Tab title="General" path="general" bind:group />
      <Tab title="Tags" path="tags" bind:group />
      <Tab title="Backup" path="backup" bind:group />
      <Tab title="Shortcuts" path="keyboard-shortcuts" bind:group />
      <Tab title="About" path="about" bind:group />
    </nav>
  </div>
</header>

<main class="flex-1 overflow-y-auto">
  <div class="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-8">
    {#if group === "tags"}
      <Tags />
    {:else if group === "backup"}
      <Backup />
    {:else if group === "keyboard-shortcuts"}
      <KeyboardShortcuts />
    {:else if group === "about"}
      <About />
    {:else}
      <General />
    {/if}
  </div>
</main>

<Notification detail={$notification} />

<CommandPalette bind:open />

<svelte:head>
  <title>{EXT_NAME} settings</title>
</svelte:head>
