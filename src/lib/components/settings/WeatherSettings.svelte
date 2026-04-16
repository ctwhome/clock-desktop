<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  function toggleEnabled() {
    settings.weather.enabled = !settings.weather.enabled;
    save();
  }

  function updateFrequency(event: Event) {
    settings.weather.updateFrequencyMin = parseInt((event.target as HTMLSelectElement).value);
    save();
  }

  function updateLocation(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    settings.weather.location = value || "auto";
    settings.weather.locationName = value || null;
    save();
  }

  function resetLocation() {
    settings.weather.location = "auto";
    settings.weather.locationName = null;
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Weather</h2>

<div class="space-y-5">
  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Location</label>
    <div class="flex gap-2">
      <input
        type="text"
        value={settings.weather.locationName || ""}
        on:change={updateLocation}
        placeholder="Auto-detect (IP based)"
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
      <button
        on:click={resetLocation}
        class="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      >Auto</button>
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Update Frequency</label>
    <select
      value={settings.weather.updateFrequencyMin}
      on:change={updateFrequency}
      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
    >
      <option value={15}>Every 15 minutes</option>
      <option value={30}>Every 30 minutes</option>
      <option value={60}>Every 60 minutes</option>
    </select>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Weather animations</p>
      <p class="text-xs text-gray-400">Show animated weather overlays on the clock</p>
    </div>
    <button
      on:click={toggleEnabled}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.weather.enabled ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.weather.enabled ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>
</div>
