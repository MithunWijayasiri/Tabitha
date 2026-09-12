<script lang="ts">
  import { EXT_NAME, isPopup } from "@/core/constants";
  import { settings } from "@/core/state";
  import { openFullView } from "@utils/extension";
  import { Commands, Header, Sessions, StatusBar } from "@/core/components";
  import { log } from "@/core/utils";

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
</script>

<svelte:head>
  <title>
    {EXT_NAME}
  </title>
</svelte:head>

<Header />
<Sessions />

<StatusBar />

<Commands />
