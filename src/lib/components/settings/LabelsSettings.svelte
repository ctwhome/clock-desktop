<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  let newName = "";
  let newEmoji = "🏷";

  function addLabel() {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (settings.labels.some((l) => l.id === id)) return;
    settings.labels = [
      ...settings.labels,
      { id, name: newName.trim(), emoji: newEmoji },
    ];
    newName = "";
    newEmoji = "🏷";
    save();
  }

  function removeLabel(id: string) {
    settings.labels = settings.labels.filter((l) => l.id !== id);
    save();
  }

  function updateLabelName(id: string, event: Event) {
    const name = (event.target as HTMLInputElement).value;
    settings.labels = settings.labels.map((l) =>
      l.id === id ? { ...l, name } : l
    );
    save();
  }

  function updateLabelEmoji(id: string, event: Event) {
    const emoji = (event.target as HTMLInputElement).value;
    settings.labels = settings.labels.map((l) =>
      l.id === id ? { ...l, emoji } : l
    );
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Labels</h2>
<p class="text-sm text-gray-400 mb-4">Activity labels you can optionally tag your timer sessions with.</p>

<div class="space-y-3 mb-6">
  {#each settings.labels as label (label.id)}
    <div class="flex items-center gap-2">
      <input
        type="text"
        value={label.emoji}
        on:change={(e) => updateLabelEmoji(label.id, e)}
        class="w-12 text-center bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500"
      />
      <input
        type="text"
        value={label.name}
        on:change={(e) => updateLabelName(label.id, e)}
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      />
      <button
        on:click={() => removeLabel(label.id)}
        class="p-2 text-gray-400 hover:text-red-400 transition-colors"
      >&times;</button>
    </div>
  {/each}
</div>

<div class="flex items-center gap-2">
  <input
    type="text"
    bind:value={newEmoji}
    class="w-12 text-center bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500"
    placeholder="🏷"
  />
  <input
    type="text"
    bind:value={newName}
    placeholder="New label name"
    class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
    on:keydown={(e) => e.key === "Enter" && addLabel()}
  />
  <button
    on:click={addLabel}
    class="px-3 py-2 text-sm bg-indigo-500/20 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
  >Add</button>
</div>
