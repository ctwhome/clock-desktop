<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }
</script>

<h2 class="text-lg font-semibold mb-4">Clock</h2>
<p class="text-gray-400 text-sm">Clock settings coming soon.</p>
