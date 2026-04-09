<script lang="ts">
  import Clock from "$lib/components/Clock.svelte";
  import Background from "$lib/components/Background.svelte";
  import WeatherOverlay from "$lib/components/WeatherOverlay.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import { settings, loadSettings } from "$lib/stores/settings";
  import { onMount } from "svelte";

  onMount(() => {
    loadSettings();
  });
</script>

<div
  data-tauri-drag-region
  class="h-screen w-screen bg-black bg-opacity-50 flex items-center justify-center relative overflow-hidden"
>
  <!-- Layer 1: Background -->
  <div class="absolute inset-0 pointer-events-none">
    <Background backgroundId={$settings.appearance.background} />
  </div>

  <!-- Layer 2: Weather Overlay -->
  <WeatherOverlay
    apiKey={$settings.weather.apiKey}
    location={$settings.weather.location}
    updateFrequencyMin={$settings.weather.updateFrequencyMin}
    enabled={$settings.weather.enabled}
  />

  <!-- Layer 3: Dark Overlay -->
  <div
    class="absolute inset-0 pointer-events-none"
    style="background-color: rgba(0, 0, 0, {$settings.appearance.overlayOpacity});"
  ></div>

  <!-- Layer 4: UI -->
  <div class="relative z-10 pointer-events-none">
    <Clock />
  </div>

  <!-- Settings button -->
  <div class="fixed top-2 right-2 z-20 pointer-events-auto text-white">
    <Settings />
  </div>
</div>
