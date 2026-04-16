<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  const gradients = [
    { id: "gradient-sunset", label: "Sunset", css: "linear-gradient(135deg, #ff6b35, #f7c59f)" },
    { id: "gradient-deep-sea", label: "Deep Sea", css: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" },
    { id: "gradient-emerald", label: "Emerald", css: "linear-gradient(135deg, #11998e, #38ef7d)" },
    { id: "gradient-lavender", label: "Lavender", css: "linear-gradient(135deg, #4e54c8, #8f94fb)" },
    { id: "gradient-midnight", label: "Midnight", css: "linear-gradient(135deg, #0c0c0c, #1a1a1a)" },
    { id: "gradient-peach", label: "Peach", css: "linear-gradient(135deg, #ffecd2, #fcb69f)" },
  ];

  const photos = [
    { id: "forest", label: "Forest" },
    { id: "ocean", label: "Ocean" },
    { id: "mountain", label: "Mountain" },
    { id: "city-night", label: "City Night" },
    { id: "desert", label: "Desert" },
    { id: "space", label: "Space" },
  ];

  function selectBackground(id: string) {
    // Toggle off if already selected (back to no background)
    settings.appearance.background = settings.appearance.background === id ? 'none' : id;
    save();
  }

  function updateOpacity(event: Event) {
    settings.appearance.overlayOpacity = parseFloat((event.target as HTMLInputElement).value);
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Appearance</h2>

<div class="space-y-6">
  <div>
    <div class="flex items-center justify-between mb-2">
      <label class="block text-xs uppercase text-gray-400">Gradients</label>
      {#if settings.appearance.background !== 'none'}
        <button
          on:click={() => selectBackground(settings.appearance.background)}
          class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >Clear</button>
      {/if}
    </div>
    <div class="grid grid-cols-3 gap-3">
      {#each gradients as gradient}
        <button
          on:click={() => selectBackground(gradient.id)}
          class="group relative rounded-lg overflow-hidden h-16 border-2 transition-colors {settings.appearance.background === gradient.id ? 'border-indigo-500' : 'border-transparent hover:border-white/20'}"
        >
          <div class="absolute inset-0" style="background: {gradient.css};"></div>
          <span class="absolute bottom-1 left-2 text-xs text-white/70">{gradient.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-2">Photos</label>
    <div class="grid grid-cols-3 gap-3">
      {#each photos as photo}
        <button
          on:click={() => selectBackground(photo.id)}
          class="group relative rounded-lg overflow-hidden h-16 border-2 transition-colors {settings.appearance.background === photo.id ? 'border-indigo-500' : 'border-transparent hover:border-white/20'}"
        >
          <div
            class="absolute inset-0 bg-cover bg-center"
            style="background-image: url('/backgrounds/{photo.id}.jpg');"
          ></div>
          <span class="absolute bottom-1 left-2 text-xs text-white/70 drop-shadow">{photo.label}</span>
        </button>
      {/each}
    </div>
  </div>

  {#if settings.appearance.background !== 'none'}
    <div>
      <label class="block text-xs uppercase text-gray-400 mb-2">Background Opacity</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={settings.appearance.overlayOpacity}
        on:input={updateOpacity}
        class="w-full accent-indigo-500"
      />
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>None</span>
        <span>Opaque</span>
      </div>
    </div>
  {/if}
</div>
