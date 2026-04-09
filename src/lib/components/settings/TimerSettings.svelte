<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  const availableSounds = [
    { file: "ticking.mp3", label: "Ticking" },
    { file: "start.mp3", label: "Start" },
    { file: "countdown.mp3", label: "Countdown" },
    { file: "notification.mp3", label: "Notification" },
    { file: "notification-finished.mp3", label: "Notification (alt)" },
    { file: "classical.mp3", label: "Classical" },
    { file: "waker.mp3", label: "Waker" },
    { file: "winsquare-6993.mp3", label: "Win Square" },
    { file: "8-bit-beeping-computer-sounds-90005.mp3", label: "8-bit Beep" },
    { file: "biohazard-alarm-143105.mp3", label: "Biohazard Alarm" },
    { file: "star-dust-alarm-clock-114194.mp3", label: "Star Dust" },
    { file: "sound_notif2-132674.mp3", label: "Notification 2" },
  ];

  function previewSound(file: string) {
    const audio = new Audio(`/sounds/${file}`);
    audio.play();
  }

  function updateStartSound(event: Event) {
    settings.timer.startSound = (event.target as HTMLSelectElement).value;
    save();
  }

  function updateFinishSound(event: Event) {
    settings.timer.finishSound = (event.target as HTMLSelectElement).value;
    save();
  }

  function updateDefaultDuration(event: Event) {
    settings.timer.defaultDurationMin = parseInt((event.target as HTMLInputElement).value) || 30;
    save();
  }

  let newPreset = "";

  function addPreset() {
    const val = parseInt(newPreset);
    if (val > 0 && !settings.timer.presets.includes(val)) {
      settings.timer.presets = [...settings.timer.presets, val].sort((a, b) => a - b);
      newPreset = "";
      save();
    }
  }

  function removePreset(val: number) {
    settings.timer.presets = settings.timer.presets.filter((p) => p !== val);
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Timer</h2>

<div class="space-y-5">
  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Default Duration (minutes)</label>
    <input
      type="number"
      value={settings.timer.defaultDurationMin}
      on:change={updateDefaultDuration}
      min="1"
      class="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
    />
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Presets</label>
    <div class="flex flex-wrap gap-2 mb-2">
      {#each settings.timer.presets as preset}
        <span class="inline-flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm">
          {preset}m
          <button on:click={() => removePreset(preset)} class="text-gray-400 hover:text-red-400 ml-1">&times;</button>
        </span>
      {/each}
    </div>
    <div class="flex gap-2">
      <input
        type="number"
        bind:value={newPreset}
        placeholder="Minutes"
        min="1"
        class="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        on:keydown={(e) => e.key === "Enter" && addPreset()}
      />
      <button
        on:click={addPreset}
        class="px-3 py-2 text-sm bg-indigo-500/20 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
      >Add</button>
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Start Sound</label>
    <div class="flex gap-2">
      <select
        value={settings.timer.startSound}
        on:change={updateStartSound}
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {#each availableSounds as sound}
          <option value={sound.file}>{sound.label}</option>
        {/each}
      </select>
      <button
        on:click={() => previewSound(settings.timer.startSound)}
        class="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      >&#9654;</button>
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Finish Sound</label>
    <div class="flex gap-2">
      <select
        value={settings.timer.finishSound}
        on:change={updateFinishSound}
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {#each availableSounds as sound}
          <option value={sound.file}>{sound.label}</option>
        {/each}
      </select>
      <button
        on:click={() => previewSound(settings.timer.finishSound)}
        class="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      >&#9654;</button>
    </div>
  </div>
</div>
