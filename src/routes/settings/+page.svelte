<script lang="ts">
  import { onMount } from "svelte";
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { emit } from "@tauri-apps/api/event";
  // import { Store } from "@tauri-apps/plugin-store";
  import { Window } from "@tauri-apps/api/window";

  let currentWindow: WebviewWindow | Window | null = null;
  let use24HourFormat = true;
  let showSeconds = true;

  // const store = new Store(".settings.dat");

  onMount(async () => {
    console.log("Settings component mounted");
    try {
      currentWindow = WebviewWindow.getCurrent();
      console.log("Current window:", currentWindow);
    } catch (error) {
      console.error("Error getting current window:", error);
      console.error(
        "Error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
      try {
        // Fallback to creating a new Window instance if WebviewWindow.getCurrent() fails
        currentWindow = new Window("settings");
        console.log("Created new Window instance as fallback");
      } catch (fallbackError) {
        console.error("Error creating fallback window:", fallbackError);
        console.error(
          "Fallback error details:",
          JSON.stringify(
            fallbackError,
            Object.getOwnPropertyNames(fallbackError),
          ),
        );
      }
    }

    try {
      // Load saved settings
      const use24HourFormatSetting = await store.get("use24HourFormat");
      const showSecondsSetting = await store.get("showSeconds");
      console.log("Raw settings:", {
        use24HourFormatSetting,
        showSecondsSetting,
      });

      use24HourFormat =
        typeof use24HourFormatSetting === "boolean"
          ? use24HourFormatSetting
          : true;
      showSeconds =
        typeof showSecondsSetting === "boolean" ? showSecondsSetting : true;
      console.log("Settings loaded:", { use24HourFormat, showSeconds });
    } catch (error) {
      console.error("Error loading settings:", error);
      console.error(
        "Error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    }
  });

  async function closeSettings() {
    console.log("closeSettings function called");
    try {
      await saveSettings();
      console.log("Settings saved");
      if (currentWindow) {
        await currentWindow.close();
        console.log("Window close command sent");
      } else {
        console.error("currentWindow is null, unable to close");
      }
    } catch (error) {
      console.error("Error closing settings window:", error);
      console.error(
        "Error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    }
  }

  async function updateSettings() {
    try {
      await saveSettings();
      await emit("settings-updated", { use24HourFormat, showSeconds });
      console.log("Settings updated and event emitted");
    } catch (error) {
      console.error("Error updating settings:", error);
      console.error(
        "Error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    }
  }

  async function saveSettings() {
    try {
      await store.set("use24HourFormat", use24HourFormat);
      await store.set("showSeconds", showSeconds);
      await store.save();
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      console.error(
        "Error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error)),
      );
    }
  }
</script>

<div class="settings-container">
  <h1>Clock Settings</h1>

  <div class="setting">
    <label>
      <input
        type="checkbox"
        bind:checked={use24HourFormat}
        on:change={updateSettings}
      />
      Use 24-hour format
    </label>
  </div>

  <div class="setting">
    <label>
      <input
        type="checkbox"
        bind:checked={showSeconds}
        on:change={updateSettings}
      />
      Show seconds
    </label>
  </div>

  <button on:click={closeSettings}>Close Settings</button>
</div>

<style>
  .settings-container {
    padding: 20px;
    font-family: Arial, sans-serif;
    color: #333;
    max-width: 300px;
    margin: 0 auto;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 20px;
  }

  .setting {
    margin-bottom: 15px;
  }

  label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  input[type="checkbox"] {
    margin-right: 10px;
  }

  button {
    margin-top: 20px;
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: #0056b3;
  }
</style>
