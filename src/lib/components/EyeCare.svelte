<script lang="ts">
  import { onDestroy } from "svelte";
  import { settings } from "$lib/stores/settings";

  let showing = false;
  let restRemaining = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let animationFrameId: number | null = null;
  let lastTimestamp: number | null = null;

  function formatSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function playSound() {
    if ($settings.eyeCare.playSound) {
      const audio = new Audio("/sounds/notification.mp3");
      audio.play();
    }
  }

  function startRestCountdown() {
    showing = true;
    restRemaining = $settings.eyeCare.restDurationSeconds;
    playSound();
    lastTimestamp = performance.now();
    tickCountdown();
  }

  function tickCountdown() {
    if (!showing) return;

    const now = performance.now();
    if (lastTimestamp === null) {
      lastTimestamp = now;
    }

    const elapsed = now - lastTimestamp;
    if (elapsed >= 1000) {
      restRemaining -= 1;
      lastTimestamp = now;

      if (restRemaining <= 0) {
        dismiss();
        return;
      }
    }

    animationFrameId = requestAnimationFrame(tickCountdown);
  }

  function dismiss() {
    showing = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    lastTimestamp = null;
    playSound();
    restartInterval();
  }

  function startInterval() {
    stopInterval();
    if ($settings.eyeCare.enabled) {
      intervalId = setInterval(
        startRestCountdown,
        $settings.eyeCare.intervalMinutes * 60 * 1000
      );
    }
  }

  function stopInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function restartInterval() {
    stopInterval();
    startInterval();
  }

  // React to settings changes
  $: if ($settings.eyeCare.enabled) {
    startInterval();
  } else {
    stopInterval();
    if (showing) {
      showing = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  }

  onDestroy(() => {
    stopInterval();
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  });
</script>

{#if showing}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="eye-care-overlay" on:click={dismiss}>
    <div class="eye-care-glow"></div>
    <div class="eye-care-content">
      <div class="eye-care-icon">👁️‍🗨️</div>
      <div class="eye-care-title">Rest your eyes</div>
      <div class="eye-care-countdown">{formatSeconds(restRemaining)}</div>
      <div class="eye-care-subtitle">Look at something 20ft away</div>
    </div>
  </div>
{/if}

<style>
  .eye-care-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
    cursor: pointer;
    animation: eyeCareIn 0.5s ease-out;
  }

  .eye-care-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(168, 230, 207, 0.08) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  .eye-care-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    z-index: 1;
  }

  .eye-care-icon {
    font-size: 2rem;
    filter: drop-shadow(0 0 8px rgba(168, 230, 207, 0.4));
  }

  .eye-care-title {
    color: #a8e6cf;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .eye-care-countdown {
    color: #ffd93d;
    font-size: 1.8rem;
    font-weight: 700;
    font-family: monospace;
    font-variant-numeric: tabular-nums;
  }

  .eye-care-subtitle {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.65rem;
  }

  @keyframes eyeCareIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
