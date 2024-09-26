<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
  } from "@tauri-apps/plugin-notification";

  export let id: number;
  export let duration = 30;
  export let remaining = 0;
  export let active = false;

  const dispatch = createEventDispatcher<{
    toggle: { id: number; active: boolean };
    reset: { id: number };
  }>();

  let animationFrameId: number | null = null;
  let lastTimestamp: number | null = null;

  onMount(async () => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }
    remaining = duration * 60; // Initialize remaining time
  });

  function toggleTimer(): void {
    if (!active) {
      if (remaining === 0) {
        remaining = duration * 60; // Reset only if timer has finished
      }
      startTimer();
    } else {
      stopTimer();
    }
    active = !active;
    dispatch("toggle", { id, active });
  }

  function resetTimer(): void {
    stopTimer();
    active = false;
    remaining = duration * 60; // Convert minutes to seconds
    dispatch("reset", { id });
  }

  function startTimer(): void {
    editingTimer = false;
    stopTimer(); // Ensure any existing animation frame is cancelled before starting a new one
    lastTimestamp = performance.now();
    tick(lastTimestamp);
  }

  function tick(timestamp: number): void {
    if (!active) return;

    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }

    const elapsed = timestamp - lastTimestamp;

    if (elapsed >= 1000) {
      if (remaining > 0) {
        remaining--;
        lastTimestamp = timestamp;
      } else {
        stopTimer();
        // Wrap sendNotification in a Promise
        new Promise<void>((resolve) => {
          sendNotification({
            title: "Timer Finished",
            body: `Timer ${id} has finished!`,
          });
          resolve();
        }).catch((error: unknown) => {
          console.error("Failed to send notification:", error);
        });
        return;
      }
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  function stopTimer(): void {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    lastTimestamp = null;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!active) {
        toggleTimer();
      }
    }
  }

  function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  let editingTimer = false;
</script>

<div class="flex items-center pointer-events-auto">
  <div class="w-20">
    <input
      type="number"
      bind:value={duration}
      min="0"
      class="w-20 bg-white bg-opacity-20 text-white p-2 rounded mb-2"
      placeholder="Timer {id} (minutes)"
      class:hidden={!editingTimer}
      on:keydown={handleKeydown}
    />
    <button
      on:click={() => {
        editingTimer = true;
        toggleTimer();
      }}
      class="text-2xl mb-2"
      class:hidden={editingTimer}
    >
      {formatTime(remaining)}
    </button>
  </div>

  <div class="flex space-x-2">
    <button
      on:click={toggleTimer}
      class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold p-2 rounded"
      aria-label={active ? "Pause" : "Play"}
    >
      {#if active}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      {/if}
    </button>
    <button
      on:click={resetTimer}
      class="hover:bg-red-700 text-white font-bold p-2 rounded"
      aria-label="Reset"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 2v6h6"></path>
        <path d="M3 13a9 9 0 1 0 3-7.7L3 8"></path>
      </svg>
    </button>
  </div>
</div>
