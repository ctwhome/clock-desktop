<script lang="ts">
  import type { LabelItem } from "$lib/types";

  export let labels: LabelItem[] = [];
  export let visible: boolean = false;

  let selectedId: string | null = null;

  function toggle(id: string) {
    selectedId = selectedId === id ? null : id;
  }
</script>

{#if visible && labels.length > 0}
  <div class="flex gap-1.5 flex-wrap justify-center pointer-events-auto">
    {#each labels as label (label.id)}
      <button
        on:click={() => toggle(label.id)}
        class="px-2.5 py-1 rounded-full text-xs transition-all duration-200
          {selectedId === label.id
            ? 'bg-indigo-500/30 border border-indigo-500/50 text-white'
            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white/80 hover:bg-white/10'}"
      >
        {label.emoji} {label.name}
      </button>
    {/each}
  </div>
{/if}
