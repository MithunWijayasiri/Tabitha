import { storage, type Storage } from "webextension-polyfill";
import type { Settings, FilterOptions } from "@/core/types";
import { writable, type Writable } from "svelte/store";
import { notification } from "@/core/state";
import {
  getStorage,
  setStorage,
  STORAGE_PREFIX,
  applyTheme,
  getStorageItem,
  log,
} from "@/core/utils";
import { autoSaveDefaults } from "@/core/constants";

export const filterOptions: Writable<FilterOptions> = writable({
  query: "",
  sortMethod: "newest",
  tagsFilter: "__all__",
});

export const settings = (() => {
  let loaded: Promise<Settings>;

  const defaultSettings: Settings = {
    popupView: true,
    darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
    selectionId: "current",
    discarded: true,
    urlFilterList: undefined,
    autoSave: autoSaveDefaults.autoSave,
    autoSaveMaxSessions: autoSaveDefaults.autoSaveMaxSessions,
    autoSaveTimer: autoSaveDefaults.autoSaveTimer,
    tags: {},
    doNotAskForTitle: true,
    exportCompressed: true,
    excludePinned: true,
    sortMethod: "newest",
    tagsFilter: "__all__",
    updated: false,
  };

  const { subscribe, set, update } = writable(defaultSettings);

  init();

  storage.local.onChanged.addListener(onStorageChange);

  async function init() {
    if (loaded) {
      await loaded;
      return;
    }

    loaded = getStorage(defaultSettings);

    const stored = await loaded;

    const settings = { ...defaultSettings, ...stored };

    set(settings);

    applyTheme(settings.darkMode, false);

    filterOptions.set({
      sortMethod: settings.sortMethod,
      tagsFilter: settings.tagsFilter,
      query: "",
    });

    loaded = Promise.resolve({} as Settings);

    const updated = await getStorageItem("updated", false);

    if (updated) {
      notification.set({
        msg: `Tabitha was updated to v${__EXT_VER__}!`,
        type: "info",
      });

      setStorage({ updated: false });
    }
  }

  function onStorageChange(changes: Storage.StorageAreaOnChangedChangesType) {
    update((settings) => {
      for (const change in changes) {
        if (!change.startsWith(STORAGE_PREFIX)) continue;

        const key = change.slice(STORAGE_PREFIX.length);

        (settings[key as keyof Settings] as Settings[keyof Settings]) =
          (changes[change]?.newValue ??
            defaultSettings[key as keyof Settings]) as Settings[keyof Settings];

        if (key === "darkMode") applyTheme(settings[key], true);

        if (key === "sortMethod" || key === "tagsFilter")
          filterOptions.update((val) => {
            (val[
              key as keyof FilterOptions
            ] as FilterOptions[keyof FilterOptions]) = settings[key];

            return val;
          });
      }
      return settings;
    });
  }

  function clear() {
    return storage.local.clear();
  }

  return {
    subscribe,
    init,
    changeSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
      setStorage({ [key]: value } as Partial<Settings>).catch((error) =>
        log.error("storage set failed:", error),
      );

      update((settings: Settings) => {
        settings[key] = value;

        return settings;
      });
    },
    clear,
  };
})();
