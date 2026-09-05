<script lang="ts">
  import { settings } from "@/core/state";
  import { ColorInput, IconButton, Tag } from "@/core/components";
  import { addTag } from "@/core/utils";

  let addedTag = { name: "", bgColor: "royalblue", textColor: "white" };

  function onInput(
    ev: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
    tagName: string,
  ) {
    const value = ev.currentTarget.value;

    if (value.length < 1 || value.length > 15)
      return (ev.currentTarget.value = $settings.tags[tagName]!.name!);

    $settings.tags[tagName]!.name = value;
  }

  function onChange(
    ev: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
    tagName: string,
  ) {
    const value = ev.currentTarget.value;

    $settings.tags[value] = $settings.tags[tagName]!;

    delete $settings.tags[tagName];

    settings.changeSetting("tags", $settings.tags);
  }
</script>

<div class="flex flex-col">
  {#each Object.keys($settings.tags) as tagName (tagName)}
    <div class="flex items-center gap-4 border-t border-line py-3">
      <input
        type="text"
        value={tagName}
        minlength="1"
        maxlength="12"
        aria-label="Tag name"
        on:input={(ev) => onInput(ev, tagName)}
        on:change={(ev) => onChange(ev, tagName)}
        class="w-32 flex-none border-b border-line bg-transparent px-1 pb-1 text-sm font-medium outline-none focus:border-accent"
      />

      <ColorInput
        bind:color={$settings.tags[tagName]!.bgColor}
        on:change={() => settings.changeSetting("tags", $settings.tags)}
        >Background</ColorInput
      >

      <ColorInput
        bind:color={$settings.tags[tagName]!.textColor}
        on:change={() => settings.changeSetting("tags", $settings.tags)}
        >Text</ColorInput
      >

      <Tag
        name={$settings.tags[tagName]!.name ?? tagName}
        bgColor={$settings.tags[tagName]?.bgColor}
        textColor={$settings.tags[tagName]?.textColor}
        class="ml-auto"
      />

      <IconButton
        icon="delete"
        class="text-base text-ink-muted hover:text-danger"
        title="Delete tag"
        on:click={() => {
          delete $settings.tags[tagName];

          settings.changeSetting("tags", $settings.tags);
        }}
      />
    </div>
  {/each}

  <div class="flex items-center gap-4 border-t border-line py-3">
    <input
      type="text"
      bind:value={addedTag.name}
      minlength="1"
      maxlength="12"
      placeholder="New tag"
      aria-label="New tag name"
      class="w-32 flex-none border-b border-line bg-transparent px-1 pb-1 text-sm font-medium outline-none placeholder:font-normal placeholder:text-ink-faint focus:border-accent"
    />

    <ColorInput bind:color={addedTag.bgColor}>Background</ColorInput>
    <ColorInput bind:color={addedTag.textColor}>Text</ColorInput>

    <button
      type="button"
      class="ml-auto rounded bg-accent px-4 py-1.5 text-xs font-semibold text-accent-content hover:bg-accent-focus disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
      disabled={addedTag.name.trim().length < 1}
      on:click={() => {
        if (addedTag.name.length < 1 || addedTag.name.length > 15) return;

        addTag(addedTag.name, {
          bgColor: addedTag.bgColor,
          textColor: addedTag.textColor,
        });

        addedTag = { name: "", bgColor: "royalblue", textColor: "white" };
      }}>Add tag</button
    >
  </div>
</div>
