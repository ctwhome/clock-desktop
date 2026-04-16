<script lang="ts">
  import Clock from "$lib/components/Clock.svelte";
  import Background from "$lib/components/Background.svelte";
  import WeatherOverlay from "$lib/components/WeatherOverlay.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import EyeCare from "$lib/components/EyeCare.svelte";
  import { settings, loadSettings } from "$lib/stores/settings";
  import { onMount } from "svelte";

  // Design resolution: the size at which the UI is authored at scale 1.0
  const DESIGN_W = 550;
  const DESIGN_H = 260;

  let scale = 1;
  let temperature: number | null = null;

  function recalcScale() {
    scale = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
  }

  onMount(() => {
    loadSettings();
    recalcScale();
    window.addEventListener("resize", recalcScale);
    return () => window.removeEventListener("resize", recalcScale);
  });
</script>

<div
  data-tauri-drag-region
  class="h-screen w-screen relative overflow-hidden {$settings.appearance.background !== 'none' ? 'bg-black/10' : 'bg-black/50'}"
>
  <!-- Layer 1: Background -->
  <div class="absolute inset-0 pointer-events-none" style="opacity: {$settings.appearance.background !== 'none' ? $settings.appearance.overlayOpacity : 0};">
    <Background backgroundId={$settings.appearance.background} />
  </div>

  <!-- Layer 2: Weather Overlay -->
  <WeatherOverlay
    location={$settings.weather.location}
    updateFrequencyMin={$settings.weather.updateFrequencyMin}
    enabled={$settings.weather.enabled}
    bind:temperature
  />

  <!-- Layer 4: Scaled UI -->
  <div
    data-tauri-drag-region
    class="absolute inset-0 flex items-center justify-center"
  >
    <div class="relative z-10 pointer-events-none" style="width: {DESIGN_W}px; height: {DESIGN_H}px; zoom: {scale};">
      <Clock />
      <!-- Temperature & Settings (inside scaled container) -->
      <div class="absolute top-1 right-1 z-20 pointer-events-auto text-white flex items-center gap-1">
        {#if temperature !== null}
          <span class="text-base font-bold" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.6);">
            {Math.round(temperature)}°C
          </span>
        {/if}
        <Settings />
      </div>
    </div>
  </div>

  <!-- Eye Care Overlay -->
  <EyeCare />
</div>
