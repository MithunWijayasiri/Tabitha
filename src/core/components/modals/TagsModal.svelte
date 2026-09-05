<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Modal, ColorInput, Tag } from "@/core/components";
  import { settings } from "@/core/state";
  import { addTag } from "@/core/utils";

  export let open = false;

  let selectVal = "createANewTag";

  let tag = { name: "", bgColor: "royalblue", textColor: "white" };

  $: tag =
    !open || selectVal === "createANewTag"
      ? { name: "", bgColor: "royalblue", textColor: "white" }
      : {
          name: selectVal,
          bgColor: $settings.tags[selectVal]?.bgColor ?? "royalblue",
          textColor: $settings.tags[selectVal]?.textColor ?? "white",
        };

  $: creating = selectVal === "createANewTag";

  const dispatch = createEventDispatcher<{ tagSubmit: string }>();
</script>

<Modal bind:open width="22rem">
  <svelte:fragment slot="header">Add a tag</svelte:fragment>

  <form
    slot="content"
    class="flex flex-col gap-4"
    on:submit|preventDefault={() => {
      if (creating) {
        if (!tag.name.trim()) return;

        addTag(tag.name, {
          bgColor: tag.bgColor,
          textColor: tag.textColor,
        });

        dispatch("tagSubmit", tag.name);
      } else dispatch("tagSubmit", selectVal);

      open = false;
    }}
  >
    <label class="flex flex-col gap-2">
      <span class="label">Tag</span>
      <select
        name="tags"
        id="tags"
        class="rounded border border-line bg-panel-alt px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-accent"
        bind:value={selectVal}
      >
        <option value="createANewTag">New tag…</option>
        {#if $settings.tags}
          {#each Object.keys($settings.tags) as name (name)}
            <option value={name}>{name}</option>
          {/each}
        {/if}
      </select>
    </label>

    {#if creating}
      <label class="flex flex-col gap-2">
        <span class="label">Name</span>
        <input
          type="text"
          minlength="1"
          maxlength="15"
          placeholder="e.g. Personal"
          class="border-b-[1.5px] border-line bg-transparent px-1 pb-1.5 text-sm font-medium outline-none placeholder:font-normal placeholder:text-ink-faint focus:border-accent"
          value={tag.name}
          on:input={(event) => {
            const value = event.currentTarget.value;

            if (value.length > 15)
              return (event.currentTarget.value = tag.name);

            tag.name = value;
          }}
        />
      </label>

      <div class="flex gap-6">
        <ColorInput bind:color={tag.bgColor}>Background</ColorInput>
        <ColorInput bind:color={tag.textColor}>Text</ColorInput>
      </div>
    {/if}

    <div class="flex items-center gap-3 border-t border-line pt-3">
      <span class="label">Preview</span>
      <Tag
        name={tag.name || "tag"}
        bgColor={tag.bgColor}
        textColor={tag.textColor}
      />

      <button
        class="ml-auto rounded bg-accent px-4 py-1.5 text-xs font-semibold text-accent-content hover:bg-accent-focus disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
        disabled={creating && !tag.name.trim()}
      >
        {creating ? "Add tag" : "Apply tag"}
      </button>
    </div>
  </form>
</Modal>
