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
<CommandPalette bind:open />
