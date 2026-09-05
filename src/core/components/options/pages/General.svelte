<script lang="ts">
  import browser from "webextension-polyfill";
  import { settings } from "@/core/state";
  import { Switch, Section, ConfirmModal } from "@/core/components";
  import { handleFilterListChange, sendMessage } from "@/core/utils";

  $: urlList = $settings.urlFilterList?.join("\n") ?? "";

  let resetShow = false;

  function clampSetting(
    event: Event & { currentTarget: HTMLInputElement },
    key: "autoSaveMaxSessions" | "autoSaveTimer",
    min: number,
    max: number,
  ) {
    const value = Math.min(
      Math.max(Number(event.currentTarget.value), min),
      max,
    );

    event.currentTarget.value = String(value);

    settings.changeSetting(key, value);
  }
</script>

<Section title="Interface">
  <Switch
    title="Open in a panel"
    description="Turn this off and the toolbar button opens the full tab view instead."
    checked={$settings.popupView}
    on:change={() => {
      settings.changeSetting("popupView", !$settings.popupView);
    }}
  />

  <Switch
    title="Dark theme"
    checked={$settings.darkMode}
    on:change={() => settings.changeSetting("darkMode", !$settings.darkMode)}
  />
</Section>

<Section
  title="Saving sessions"
  description="What Tabitha writes down when you save."
>
  <Switch
    title="Skip the name prompt when saving"
    description="Saves straight away under the name “Unnamed session”. Rename it later."
    checked={$settings.doNotAskForTitle}
    on:change={() => {
      settings.changeSetting("doNotAskForTitle", !$settings.doNotAskForTitle);
    }}
  />

  <Switch
    title="Leave pinned tabs out of saved sessions"
    checked={$settings.excludePinned}
    on:change={() =>
      settings.changeSetting("excludePinned", !$settings.excludePinned)}
  />

  <label class="flex flex-col gap-2 border-t border-line py-3">
    <span class="text-sm font-medium text-ink"
      >Only save matching addresses</span
    >
    <span class="text-xs text-ink-faint"
      >One match pattern per line. Leave empty to save every tab.</span
    >
    <textarea
      name="filter-list"
      id="filter-list"
      rows="6"
      placeholder={`https://*.google.com/*
https://www.youtube.com/*
file:///*/*`}
      class="mt-1 resize-none rounded border border-line bg-panel-alt p-2.5 font-mono text-xs text-ink outline-none placeholder:text-ink-faint focus:border-accent"
      inputmode="url"
      value={urlList}
      on:change={(ev) => handleFilterListChange(ev, urlList)}></textarea>
  </label>
</Section>

<Section
  title="Automatic saving"
  description="Tabitha saves your open windows on a timer and keeps the most recent ones."
>
  <Switch
    title="Save the current session on a timer"
    checked={$settings.autoSave}
    on:change={() => {
      settings.changeSetting("autoSave", !$settings.autoSave);

      if ($settings.autoSave) sendMessage({ message: "scheduleAutoSave" });
      else browser.alarms.clear("tabitha-autosave");
    }}
  />

  <label
    class="flex items-center gap-4 border-t border-line py-3 {$settings.autoSave
      ? ''
      : 'opacity-50'}"
  >
    <span class="flex-1">
      <span class="block text-sm font-medium text-ink"
        >Automatic saves to keep</span
      >
      <span class="mt-1 block text-xs text-ink-faint"
        >The oldest one is dropped when the limit is reached. Maximum 15.</span
      >
    </span>
    <input
      type="number"
      class="h-8 w-16 flex-none rounded border border-line bg-panel-alt text-center text-sm font-medium text-ink outline-none focus:border-accent"
      min="1"
      max="15"
      value={$settings.autoSaveMaxSessions}
      on:change={(event) => clampSetting(event, "autoSaveMaxSessions", 1, 15)}
      disabled={!$settings.autoSave}
    />
  </label>

  <label
    class="flex items-center gap-4 border-t border-line py-3 {$settings.autoSave
      ? ''
      : 'opacity-50'}"
  >
    <span class="flex-1">
      <span class="block text-sm font-medium text-ink"
        >Minutes between saves</span
      >
      <span class="mt-1 block text-xs text-ink-faint">One minute or more.</span>
    </span>
    <input
      type="number"
      class="h-8 w-16 flex-none rounded border border-line bg-panel-alt text-center text-sm font-medium text-ink outline-none focus:border-accent"
      min="1"
      value={$settings.autoSaveTimer}
      on:change={(event) => {
        clampSetting(event, "autoSaveTimer", 1, 1440);

        sendMessage({ message: "scheduleAutoSave" });
      }}
      disabled={!$settings.autoSave}
    />
  </label>
</Section>

<Section title="Restoring sessions">
  <Switch
    title="Restore tabs unloaded"
    description="Each tab loads the first time you click it, so restoring a large session is fast and uses little memory."
    checked={$settings.discarded}
    on:change={() => settings.changeSetting("discarded", !$settings.discarded)}
  />
</Section>

<Section title="Reset">
  <div class="border-t border-line py-3">
    <button
      type="button"
      class="rounded border border-danger px-4 py-1.5 text-xs font-semibold text-danger hover:bg-danger hover:text-white"
      on:click={() => (resetShow = true)}
    >
      Reset all settings
    </button>
    <p class="mt-2 text-xs text-ink-faint">
      Puts every setting back to its default. Your saved sessions are kept.
    </p>
  </div>
</Section>

<ConfirmModal
  bind:open={resetShow}
  title="Reset all settings"
  message="Put every setting back to its default? Your saved sessions are kept."
  confirmLabel="Reset"
  on:confirm={() => {
    settings.clear();
    resetShow = false;
  }}
/>
