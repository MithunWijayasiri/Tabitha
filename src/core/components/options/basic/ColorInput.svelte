<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { tagColors } from "@/core/constants";

  export let color: string;

  const dispatch = createEventDispatcher<{ change: null }>();
</script>

<div class="flex max-w-max flex-col gap-1.5">
  <span class="label"><slot /></span>

  <div class="flex items-center gap-1">
    {#each tagColors as preset (preset)}
      <button
        type="button"
        aria-label="Use {preset}"
        style:background-color={preset}
        class="h-5 w-5 rounded-sm border {color.toLowerCase() === preset
          ? 'border-ink'
          : 'border-line'}"
        on:click={() => {
          color = preset;
          dispatch("change");
        }}
      ></button>
    {/each}

    <!-- Native picker for anything outside the palette. -->
    <label
      class="ml-1 h-5 w-5 cursor-pointer overflow-hidden rounded-sm border border-line focus-within:outline focus-within:outline-2 focus-within:outline-accent"
      style:background-color={color}
    >
      <input
        type="color"
        aria-label="Custom colour"
        class="h-full w-full opacity-0"
        bind:value={color}
        on:change
      />
    </label>
  </div>
</div>
