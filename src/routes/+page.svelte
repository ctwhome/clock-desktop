<script lang="ts">
  import "../app.css";
  import Clock from "$lib/components/Clock.svelte";
  import { onMount } from "svelte";
  import { Window } from "@tauri-apps/api/window";
  import { Webview } from "@tauri-apps/api/webview";

  let appWindow: any;

  onMount(async () => {
    appWindow = new Window("main");
  });

  async function openSettings() {
    try {
      // Create a new window with a unique label
      const appWindow = new Window("settings");

      // Create a new Webview for this window, either loading a local page or a remote URL
      const webview = new Webview(appWindow, "settings-webview", {
        url: "/settings", // Replace with your settings page URL
        x: 100,
        y: 100,
        width: 400,
        height: 300,
      });

      // Handle the creation and errors of the webview
      webview.once("tauri://created", function () {
        console.log("Webview successfully created");
      });

      webview.once("tauri://error", function (e) {
        console.error("Error creating webview:", e);
      });

      // Optionally, you can emit or listen for events on this webview
      // Emit an event to the backend (if necessary)
      await webview.emit("settings-opened", { opened: true });

      // Listen to an event from the backend (if necessary)
      const unlisten = await webview.listen("settings-event", (e) => {
        console.log("Event received from backend:", e);
      });

      // To unlisten from events when no longer needed
      unlisten();
    } catch (error) {
      console.error("Failed to open settings window:", error);
    }
  }
</script>

<div class="" data-tauri-drag-region>
  <div class="pointer-events-none">
    <Clock />
  </div>
  <button
    class="fixed top-2 right-2 bg-white bg-opacity-10 text-white p-1.5 rounded-full transition-all duration-300 ease-in-out hover:bg-opacity-20
    hover:scale-110 active:bg-opacity-30 active:scale-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
    on:click={openSettings}
    aria-label="Open Settings"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      class="fill-current"
    >
      <path
        d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65c-.04-.24-.25-.42-.5-.42h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49-.01.61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
      />
    </svg>
  </button>
</div>
