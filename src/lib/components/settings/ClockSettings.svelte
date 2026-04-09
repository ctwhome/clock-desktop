<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  function toggleFormat() {
    settings.clock.format24h = !settings.clock.format24h;
    save();
  }

  function toggleSeconds() {
    settings.clock.showSeconds = !settings.clock.showSeconds;
    save();
  }

  function updateLocale(event: Event) {
    settings.clock.dateLocale = (event.target as HTMLSelectElement).value;
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Clock</h2>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">24-hour format</p>
      <p class="text-xs text-gray-400">Use 24-hour time (14:30) instead of 12-hour (2:30 PM)</p>
    </div>
    <button
      on:click={toggleFormat}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.clock.format24h ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.clock.format24h ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Show seconds</p>
      <p class="text-xs text-gray-400">Display seconds in the main clock</p>
    </div>
    <button
      on:click={toggleSeconds}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.clock.showSeconds ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.clock.showSeconds ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Date Language</label>
    <select
      value={settings.clock.dateLocale}
      on:change={updateLocale}
      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
    >
      <option value="en-US">English</option>
      <option value="nl-NL">Dutch</option>
      <option value="es-ES">Spanish</option>
      <option value="fr-FR">French</option>
      <option value="de-DE">German</option>
      <option value="pt-BR">Portuguese</option>
      <option value="ja-JP">Japanese</option>
      <option value="zh-CN">Chinese</option>
    </select>
  </div>
</div>
