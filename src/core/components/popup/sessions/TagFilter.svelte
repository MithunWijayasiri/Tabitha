<script lang="ts">
  import { filterOptions, sessions, settings, tags } from "@/core/state";
  import { Menu } from "@/core/components";

  const loaded = sessions.loaded;

  $: tagsFilter = $settings.tagsFilter;

  $: if (tagsFilter !== "__all__" && $loaded && !$tags[tagsFilter])
    settings.changeSetting("tagsFilter", "__all__");

  $: items = [
    {
      value: "__all__",
      label: "All sessions",
      hint: String($sessions?.length ?? 0),
    },
    ...Object.keys($tags).map((tag) => ({
      value: tag,
      label: tag,
      hint: String($tags[tag]),
    })),
  ];
</script>

<Menu
  icon="tag"
  title="Filter by tag"
  value={$filterOptions.tagsFilter}
  {items}
  on:select={(event) => settings.changeSetting("tagsFilter", event.detail)}
/>
