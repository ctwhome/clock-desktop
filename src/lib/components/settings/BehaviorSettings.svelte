<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  function toggleStartup() {
    settings.behavior.launchOnStartup = !settings.behavior.launchOnStartup;
    save();
  }

  function toggleAlwaysOnTop() {
    settings.behavior.alwaysOnTop = !settings.behavior.alwaysOnTop;
    save();
  }

  function toggleAllDesktops() {
    settings.behavior.visibleOnAllDesktops = !settings.behavior.visibleOnAllDesktops;
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Behavior</h2>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Launch on startup</p>
      <p class="text-xs text-gray-400">Open clock-desktop when you log in</p>
    </div>
    <button
      on:click={toggleStartup}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.behavior.launchOnStartup ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.behavior.launchOnStartup ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Always on top</p>
      <p class="text-xs text-gray-400">Keep the clock above other windows</p>
    </div>
    <button
      on:click={toggleAlwaysOnTop}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.behavior.alwaysOnTop ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.behavior.alwaysOnTop ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Visible on all desktops</p>
      <p class="text-xs text-gray-400">Show on all macOS Spaces</p>
    </div>
    <button
      on:click={toggleAllDesktops}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.behavior.visibleOnAllDesktops ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.behavior.visibleOnAllDesktops ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>
</div>

<p class="text-xs text-gray-500 mt-6">Note: "Launch on startup" preference is saved but OS-level registration is a future enhancement.</p>
