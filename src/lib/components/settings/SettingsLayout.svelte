<script lang="ts">
  const sections = [
    { id: 'weather', label: '🌤 Weather' },
    { id: 'clock', label: '🕐 Clock' },
    { id: 'timer', label: '⏱ Timer' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'labels', label: '🏷 Labels' },
    { id: 'behavior', label: '⚡ Behavior' },
    { id: 'eyeCare', label: '👁 Eye Care' },
  ];

  let activeSection = 'weather';
</script>

<div class="flex h-screen bg-gray-900 text-white">
  <!-- Sidebar -->
  <nav class="w-40 bg-gray-950 border-r border-white/10 py-4">
    {#each sections as section}
      <button
        class="w-full text-left px-4 py-2 text-sm transition-colors duration-150
          {activeSection === section.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
        on:click={() => (activeSection = section.id)}
      >
        {section.label}
      </button>
    {/each}
  </nav>

  <!-- Content -->
  <main class="flex-1 p-6 overflow-y-auto">
    <slot {activeSection} />
  </main>
</div>
