<script lang="ts">
  import { tooltip } from "@/core/utils";
  import type { TagStyle } from "@/core/types";

  export let bgColor: TagStyle["bgColor"] = "royalblue";
  export let textColor: TagStyle["textColor"] = "white";
  export let name: string;

  let className = "";
  export { className as class };
</script>

<span
  style:background-color={bgColor}
  style:color={textColor}
  class="inline-block max-w-[8rem] truncate rounded-sm px-1.5 py-0.5 text-center font-mono text-[10px] uppercase tracking-[0.12em] {className}"
  use:tooltip={{ title: name }}
>
  {name}
</span>
