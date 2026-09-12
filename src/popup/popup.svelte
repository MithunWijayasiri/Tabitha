<script lang="ts">
  import { EXT_NAME, isPopup, resolveKeybinding } from "@/core/constants";
  import { settings } from "@/core/state";
  import { openFullView } from "@utils/extension";
  import { CommandPalette, Header, Sessions } from "@/core/components";
  import { shouldIgnoreShortcut, log } from "@/core/utils";

  shouldLoadPopup();

  async function shouldLoadPopup() {
    try {
      await settings.init();

      if (!isPopup) return;

      if (!$settings.popupView) {
        await openFullView();

        window.close();
      }
    } catch (error) {
      log.error("settings init failed:", error);
    }
  }

  let open = false;
</script>

<svelte:head>
  <title>
    {EXT_NAME}
  </title>
</svelte:head>

<svelte:window
  on:keydown={(ev) => {
    if (shouldIgnoreShortcut(ev, true)) return;

    if (resolveKeybinding(ev)?.code === "KeyK") {
      open = !open;
      ev.preventDefault();
    }
  }}
/>

<Header />
<Sessions />

<footer
  class="flex flex-none items-center gap-1.5 border-t border-line bg-panel px-4 py-1.5"
>
  <kbd class="kbd">Ctrl</kbd>
  <kbd class="kbd">K</kbd>
  <span class="label ml-1.5">Command palette</span>
</footer>

<CommandPalette bind:open />
