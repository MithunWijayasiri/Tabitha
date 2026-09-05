<script lang="ts">
  import type { Icon } from "@/core/types";
  import { tooltip } from "@/core/utils";

  export let icon: Icon = "default";
  export let title: string = "";
  export let role: "button" | "img" = "button";
  export let disabled = false;

  export { className as class };
  let className = "text-lg hover:text-accent-focus";

  $: src = `../../icons/${icon}.svg`;

  $: mask =
    `mask-image:url(${src});mask-repeat:no-repeat;mask-position:center;mask-size:cover;` +
    `-webkit-mask-image:url(${src});-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;-webkit-mask-size:cover`;
</script>

{#if role === "img"}
  <span
    aria-hidden="true"
    class="block h-[1em] w-[1em] flex-none bg-current {className}"
    style={mask}
  ></span>
{:else}
  <button
    type="button"
    {disabled}
    aria-label={title}
    use:tooltip={{ title }}
    class="block h-[1em] w-[1em] flex-none cursor-pointer bg-current disabled:cursor-not-allowed disabled:opacity-40 {className}"
    style={mask}
    on:click
  ></button>
{/if}
