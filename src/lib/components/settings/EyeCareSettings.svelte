<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  function toggleEnabled() {
    settings.eyeCare.enabled = !settings.eyeCare.enabled;
    save();
  }

  function toggleSound() {
    settings.eyeCare.playSound = !settings.eyeCare.playSound;
    save();
  }

  function handleIntervalChange(e: Event) {
    settings.eyeCare.intervalMinutes = parseInt((e.target as HTMLInputElement).value);
    save();
  }

  function handleDurationChange(e: Event) {
    settings.eyeCare.restDurationSeconds = parseInt((e.target as HTMLInputElement).value);
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Eye Care</h2>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Enable eye care reminders</p>
      <p class="text-xs text-gray-400">Periodic reminders to rest your eyes</p>
    </div>
    <button
      on:click={toggleEnabled}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.eyeCare.enabled ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.eyeCare.enabled ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div>
    <div class="flex items-center justify-between mb-2">
      <p class="text-sm">Reminder interval</p>
      <p class="text-xs text-gray-400">{settings.eyeCare.intervalMinutes} min</p>
    </div>
    <input
      type="range"
      min="10"
      max="60"
      step="5"
      value={settings.eyeCare.intervalMinutes}
      on:input={handleIntervalChange}
      class="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
    />
    <div class="flex justify-between text-xs text-gray-500 mt-1">
      <span>10 min</span>
      <span>60 min</span>
    </div>
  </div>

  <div>
    <div class="flex items-center justify-between mb-2">
      <p class="text-sm">Rest duration</p>
      <p class="text-xs text-gray-400">{settings.eyeCare.restDurationSeconds} sec</p>
    </div>
    <input
      type="range"
      min="10"
      max="60"
      step="5"
      value={settings.eyeCare.restDurationSeconds}
      on:input={handleDurationChange}
      class="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
    />
    <div class="flex justify-between text-xs text-gray-500 mt-1">
      <span>10 sec</span>
      <span>60 sec</span>
    </div>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Play sound</p>
      <p class="text-xs text-gray-400">Soft sound when rest starts and ends</p>
    </div>
    <button
      on:click={toggleSound}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.eyeCare.playSound ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.eyeCare.playSound ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>
</div>
