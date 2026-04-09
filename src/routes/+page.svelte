<script>
  import Clock from "$lib/components/Clock.svelte";
  import Background from "$lib/components/Background.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import { settings, loadSettings } from "$lib/stores/settings";
  import { onMount } from "svelte";

  onMount(() => {
    loadSettings();
  });
</script>

<div
  data-tauri-drag-region
  class="h-screen w-screen flex items-center justify-center relative overflow-hidden"
>
  <!-- Layer 1: Background -->
  <Background backgroundId={$settings.appearance.background} />

  <!-- Layer 2: Weather Overlay (added in Task 6) -->

  <!-- Layer 3: Dark Overlay -->
  <div
    class="absolute inset-0"
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
