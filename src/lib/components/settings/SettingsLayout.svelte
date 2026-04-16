<script lang="ts">
  import IconCloudSun from "~icons/lucide/cloud-sun";
  import IconClock from "~icons/lucide/clock";
  import IconTimer from "~icons/lucide/timer";
  import IconPalette from "~icons/lucide/palette";
  import IconTag from "~icons/lucide/tag";
  import IconZap from "~icons/lucide/zap";
  import IconEye from "~icons/lucide/eye";

  const sections = [
    { id: 'weather', label: 'Weather', icon: IconCloudSun },
    { id: 'clock', label: 'Clock', icon: IconClock },
    { id: 'timer', label: 'Timer', icon: IconTimer },
    { id: 'appearance', label: 'Appearance', icon: IconPalette },
    { id: 'labels', label: 'Labels', icon: IconTag },
    { id: 'behavior', label: 'Behavior', icon: IconZap },
    { id: 'eyeCare', label: 'Eye Care', icon: IconEye },
  ];

  let activeSection = 'weather';
</script>

<div class="flex h-screen bg-gray-900 text-white">
  <!-- Sidebar -->
  <nav class="w-40 bg-gray-950 border-r border-white/10 py-4">
    {#each sections as section}
      <button
        class="w-full text-left px-4 py-2 text-sm transition-colors duration-150 flex items-center gap-2
          {activeSection === section.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
        on:click={() => (activeSection = section.id)}
      >
        <svelte:component this={section.icon} width="16" height="16" />
        {section.label}
      </button>
    {/each}
  </nav>

  <!-- Content -->
  <main class="flex-1 p-6 overflow-y-auto">
    <slot {activeSection} />
  </main>
</div>
