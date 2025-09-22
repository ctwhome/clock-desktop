<script lang="ts">
  import { onMount } from "svelte";
  import Calendar from "./Calendar.svelte";
  import Timer from "./Timer.svelte";

  let time: string;
  let date: string;

  // Timer component bindings
  let timerComponent: Timer;
  let timerActive = false;
  let timerRemaining = 0;
  let timerFormatTime: (seconds: number) => string;

  function updateTime(): void {
    time = new Date().toLocaleTimeString("nl-NL", {
      hour: "numeric",
      minute: "numeric",
    });
  }

  function updateDate(): void {
    date = new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  onMount(() => {
    updateTime();
    updateDate();

    const interval = setInterval(() => {
      updateTime();
    }, 1000);
    return () => clearInterval(interval);
  });
</script>

<div
  class="relative w-full h-full flex flex-col justify-center items-center text-white font-sans font-bold select-none"
  style="text-shadow: 3px 3px 0.1em rgba(0, 0, 0, 0.22);"
>
  <div class="flex items-center justify-center z-10 gap-5">
    <!-- CALENDAR -->
    <div class="mt-4">
      <Calendar />
    </div>

    <!-- TIME AND TIMER -->
    <div class="flex flex-col items-center">
      <!-- Large display: Timer countdown when active, current time when inactive -->
      <div class="text-[max(20vmin,35vh)] select-none">
        {#if timerActive && timerFormatTime}
          {timerFormatTime(timerRemaining)}
        {:else}
          {time}
        {/if}
      </div>

      <!-- Date always stays in the same position -->
      <div class="text-[max(7vmin,7vh)] select-none -mt-3">
        {date}
      </div>

      <!-- Timer with swapped display when active -->
      <div class="flex flex-col gap-2 z-10 mt-5">
        <Timer
          id={1}
          displayOverride={timerActive ? time : null}
          bind:this={timerComponent}
          bind:active={timerActive}
          bind:remaining={timerRemaining}
          bind:formatTime={timerFormatTime}
        />
      </div>
    </div>
  </div>
</div>
