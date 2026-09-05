<script lang="ts">
  import type { SortMethod } from "@/core/types";
  import { settings } from "@/core/state";
  import { Menu } from "@/core/components";

  const items = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "az", label: "Name A to Z" },
    { value: "za", label: "Name Z to A" },
    { value: "mostTabs", label: "Most tabs" },
  ];
</script>

<Menu
  icon="sort"
  title="Sort sessions"
  value={$settings.sortMethod}
  {items}
  on:select={(event) =>
    settings.changeSetting("sortMethod", event.detail as SortMethod)}
/>
