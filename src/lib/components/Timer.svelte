<script lang="ts">
  import { onMount, tick } from "svelte";
  import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
  } from "@tauri-apps/plugin-notification";

  export let id: number;
  let duration = 30; // Default duration in minutes
  let remaining = duration * 60; // Initialize in seconds
  let active = false;
  let isFlashing = false;

  let animationFrameId: number | null = null;
  let lastTimestamp: number | null = null;
  let inputElement: HTMLInputElement;
  let presetMenuElement: HTMLDivElement;

  // Preset timer values in minutes
  const presetTimers = [
    { label: "5m", value: 5 },
    { label: "10m", value: 10 },
    { label: "15m", value: 15 },
    { label: "20m", value: 20 },
    { label: "25m", value: 25 },
    { label: "30m", value: 30 },
    { label: "45m", value: 45 },
    { label: "55m", value: 55 },
    { label: "60m", value: 60 },
    { label: "1h20m", value: 80 },
  ];

  onMount(async () => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }
  });

  function toggleTimer(): void {
    if (!active) {
      // Update remaining time to current duration when starting
      remaining = duration * 60;
      active = true;
      startTimer();
    } else {
      active = false;
      stopTimer();
    }
  }

  function resetTimer(): void {
    stopTimer();
    active = false;
    remaining = duration * 60;
  }

  function startTimer(): void {
    editingTimer = false;
    startSound();
    lastTimestamp = performance.now();
    updateTimer();
  }

  async function startSound() {
    const audio = new Audio("/sounds/ticking.mp3");
    audio.play();
  }

  async function finishSound() {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play();
  }

  function triggerFlash() {
    isFlashing = true;
    // Reset flash after animation completes
    setTimeout(() => {
      isFlashing = false;
    }, 1500); // 1.5s matches the total animation duration
  }

  function updateTimer(): void {
    if (!active) return;

    const currentTime = performance.now();

    if (lastTimestamp === null) {
      lastTimestamp = currentTime;
    }

    const elapsed = currentTime - lastTimestamp;

    if (elapsed >= 1000) {
      if (remaining > 0) {
        remaining -= 1;
        lastTimestamp = currentTime;
      } else {
        stopTimer();
        active = false;
        finishSound();
        triggerFlash();

        // Send notification when timer finishes
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

    animationFrameId = requestAnimationFrame(updateTimer);
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
      // Stop any existing timer
      if (active) {
        stopTimer();
        active = false;
      }
      // Update remaining time and start the timer
      remaining = duration * 60;
      editingTimer = false;
      toggleTimer();
    } else if (event.key === "Escape") {
      editingTimer = false;
    }
  }

  function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }

  let editingTimer = false;

  // Update remaining time when duration changes and timer is not active
  function handleDurationChange() {
    if (!active) {
      remaining = duration * 60;
    }
  }

  // Handle clicking outside
  // TODO: This does not work

  // Handle showing the input and selecting text
  async function showInput() {
    editingTimer = true;
    await tick(); // Wait for DOM update
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  }

  // Handle preset timer selection
  function selectPreset(value: number) {
    duration = value;
    remaining = duration * 60;
    editingTimer = false;
    toggleTimer();
  }

  // Prevent menu from closing when clicking inside it
  function handleMenuClick(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

{#if isFlashing}
  <div class="flash-overlay" />
{/if}

<div class="flex items-center pointer-events-auto relative gap-3">
  <div class="">
    {#if editingTimer}
      <!-- {#if true} -->
      <div
        class="absolute bottom-full left-2/2 z-50 mb-2 transform -translate-x-1/2"
      >
        <div
          bind:this={presetMenuElement}
          on:mousedown={handleMenuClick}
          class="preset-menu bg-black/20 rounded-lg shadow-xl border border-base-content/10 p-2 flex flex-wrap gap-2 justify-center w-[350px]"
          role="menu"
        >
          {#each presetTimers as preset}
            <button
              class="px-3 py-1.5 hover:bg-base-100 transition-colors duration-200 rounded-lg text-base-content/80 hover:text-base-content text-sm"
              on:click={() => selectPreset(preset.value)}
            >
              {preset.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <input
      bind:this={inputElement}
      type="number"
      bind:value={duration}
      min="0"
      class="w-20 bg-white bg-opacity-20 text-white p-2 rounded mb-2"
      placeholder="Timer {id} (minutes)"
      class:hidden={!editingTimer}
      on:keydown={handleKeydown}
      on:input={handleDurationChange}
    />
    <!-- on:blur={handleInputBlur} -->
    <button
      on:click={showInput}
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

<style>
  @keyframes flash {
    0%,
    100% {
      background-color: transparent;
    }
    25% {
      background-color: rgba(255, 255, 255, 0.9);
    }
    50% {
      background-color: transparent;
    }
    75% {
      background-color: rgba(255, 255, 255, 0.9);
    }
  }

  .flash-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9999;
    animation: flash 1.5s ease-in-out;
  }

  .preset-menu {
    backdrop-filter: blur(8px);
    animation: fadeIn 0.2s ease-out;
    max-width: max-content;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .preset-menu button {
    position: relative;
    overflow: hidden;
  }

  .preset-menu button:hover::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    animation: shimmer 1s ease-out;
  }

  @keyframes shimmer {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }
</style>
