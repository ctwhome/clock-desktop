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
  class="h-screen w-screen bg-black bg-opacity-50 relative overflow-hidden"
>
  <!-- Layer 1: Background -->
  <div class="absolute inset-0 pointer-events-none">
    <Background backgroundId={$settings.appearance.background} />
  </div>

  <!-- Layer 2: Weather Overlay -->
  <WeatherOverlay
    location={$settings.weather.location}
    updateFrequencyMin={$settings.weather.updateFrequencyMin}
    enabled={$settings.weather.enabled}
  />

  <!-- Layer 3: Dark Overlay -->
  <div
    class="absolute inset-0 pointer-events-none"
    style="background-color: rgba(0, 0, 0, {$settings.appearance.overlayOpacity});"
  ></div>

  <!-- Layer 4: Scaled UI -->
  <div
    class="absolute inset-0 flex items-center justify-center"
    style="transform: scale({scale}); transform-origin: center center;"
  >
    <div class="relative z-10 pointer-events-none" style="width: {DESIGN_W}px; height: {DESIGN_H}px;">
      <Clock />
      <!-- Settings button (inside scaled container) -->
      <div class="absolute top-1 right-1 z-20 pointer-events-auto text-white">
        <Settings />
      </div>
    </div>
  </div>

  <!-- Eye Care Overlay -->
  <EyeCare />
</div>
