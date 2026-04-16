<script lang="ts">
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
  import IconSettings from "~icons/lucide/settings";

  async function openSettings() {
    const existing = await WebviewWindow.getByLabel('settings');
    if (existing) {
      await existing.setFocus();
      return;
    }

    new WebviewWindow('settings', {
      url: '/settings',
      title: 'Preferences',
      width: 600,
      height: 450,
      resizable: true,
      alwaysOnTop: false,
      decorations: true,
    });
  }
</script>

<button
  on:click={openSettings}
  class="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors duration-200"
  aria-label="Settings"
>
  <IconSettings width="20" height="20" />
</button>
