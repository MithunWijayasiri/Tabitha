<script lang="ts">
  import { EXT_NAME, isPopup } from "@/core/constants";
  import { filterOptions, notification, sessions } from "@/core/state";
  import {
    SearchBar,
    Notification,
    IconButton,
    Sorting,
    TagFilter,
  } from "@/core/components";
  import { openFullView, openOptions } from "@utils/extension";
  import { tooltip } from "@/core/utils";

  $: count = $sessions?.length ?? 0;

  $: tabsCount = ($sessions ?? []).reduce(
    (total, session) => total + (session.tabsNumber ?? 0),
    0,
  );
</script>

<header
  class="flex flex-none items-center gap-3 border-b-[1.5px] border-ink bg-panel px-4 py-2.5"
>
  <h1 class="opsz-lg text-[22px] leading-none">{EXT_NAME}</h1>

  <p class="label pt-1">
    {count}
    {count === 1 ? "session" : "sessions"} &middot; {tabsCount}
    {tabsCount === 1 ? "tab" : "tabs"}
  </p>

  <div class="ml-auto flex items-center gap-1">
    <SearchBar bind:value={$filterOptions.query} />

    <TagFilter />
    <Sorting />

    {#if isPopup}
      <button
        type="button"
        class="tool"
        use:tooltip={{ title: "Open full view" }}
        on:click={async () => {
          await openFullView();
          window.close();
        }}
      >
        <IconButton icon="open" role="img" class="text-lg" />
      </button>
    {/if}

    <button
      type="button"
      class="tool"
      use:tooltip={{ title: "Settings" }}
      on:click={async () => {
        await openOptions();

        if (isPopup) window.close();
      }}
    >
      <IconButton icon="settings" role="img" class="text-lg" />
    </button>
  </div>
</header>

<Notification detail={$notification} />
