<script lang="ts">
  import { Modal } from "@/core/components";
  import { createEventDispatcher, tick } from "svelte";

  export let type: "Save" | "Rename";

  export let value = "";

  export let minlength = 1;
  export let maxlength = 120;

  let disabled = true;
  let errMsg = "";

  export let open = false;

  $: if (value?.length < minlength || value?.length > maxlength) {
    disabled = true;
    errMsg = `Use between ${minlength} and ${maxlength} characters.`;
  } else if (/[<>]/.test(value)) {
    disabled = true;
    errMsg = "A session name cannot contain < or >.";
  } else disabled = false;

  let inputEl: HTMLInputElement;

  $: if (open) {
    tick().then(() => {
      inputEl?.focus();
    });
  } else {
    value = "";
  }

  const dispatch = createEventDispatcher<{ inputSubmit: string }>();

  function submit() {
    dispatch("inputSubmit", value);

    value = "";
  }
</script>

<Modal bind:open>
  <svelte:fragment slot="header"
    >{type === "Save" ? "Save session" : "Rename session"}</svelte:fragment
  >

  <svelte:fragment slot="content">
    <label class="flex w-[24rem] flex-col gap-2">
      <span class="label">Session name</span>
      <input
        bind:this={inputEl}
        class="w-full border-b-[1.5px] border-line bg-transparent px-1 pb-1.5 text-sm font-medium outline-none placeholder:font-normal placeholder:text-ink-faint focus:border-accent"
        type="text"
        name={type}
        id={type}
        placeholder="e.g. Client onboarding audit"
        spellcheck={false}
        {minlength}
        {maxlength}
        bind:value
        on:keydown={(event) => {
          if (event.key === "Enter" && !disabled) submit();
        }}
      />
    </label>

    {#if disabled}
      <p class="text-xs font-medium text-danger">{errMsg}</p>
    {/if}
  </svelte:fragment>

  <button
    {disabled}
    slot="footer"
    type="button"
    class="rounded bg-accent px-4 py-1.5 text-xs font-semibold text-accent-content hover:bg-accent-focus disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
    on:click={submit}>{type === "Save" ? "Save" : "Rename"}</button
  >
</Modal>
