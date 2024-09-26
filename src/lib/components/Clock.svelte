<script lang="ts">
  import { onMount } from "svelte";
  import Calendar from "./Calendar.svelte";
  import Timer from "./Timer.svelte";

  let time: string;
  let date: string;

  // Timer state
  let timer1 = { duration: 0, remaining: 0, active: false };
  let timer2 = { duration: 0, remaining: 0, active: false };

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

  function handleTimerToggle(
    event: CustomEvent<{ id: number; active: boolean }>,
  ): void {
    const { id, active } = event.detail;
    if (id === 1) {
      timer1.active = active;
      if (active && timer1.remaining === 0) {
        timer1.remaining = timer1.duration * 60; // Convert minutes to seconds when starting
      }
    } else {
      timer2.active = active;
      if (active && timer2.remaining === 0) {
        timer2.remaining = timer2.duration * 60; // Convert minutes to seconds when starting
      }
    }
  }

  function handleTimerReset(event: CustomEvent<{ id: number }>): void {
    const { id } = event.detail;
    if (id === 1) {
      timer1.remaining = timer1.duration * 60; // Convert minutes to seconds
    } else {
      timer2.remaining = timer2.duration * 60; // Convert minutes to seconds
    }
  }

  onMount(() => {
    updateTime();
    updateDate();
    const interval = setInterval(() => {
      updateTime();
      if (timer1.active && timer1.remaining > 0) {
        timer1.remaining--;
      }
      if (timer2.active && timer2.remaining > 0) {
        timer2.remaining--;
      }
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
    <Calendar />

    <!-- TIME AND TIMER -->
    <div class="flex flex-col items-center">
      <!-- <div class="text-[max(60vmin,60vh)] select-none"> -->
      <div class="text-[max(20vmin,35vh)] select-none">
        {time}
      </div>
      <div class="text-[max(7vmin,7vh)] select-none -mt-5">
        {date}
      </div>

      <div class="flex flex-col gap-2 z-10 mt-5">
        <!-- <Timer
          id={1}
          bind:duration={timer1.duration}
          bind:remaining={timer1.remaining}
          bind:active={timer1.active}
          on:toggle={handleTimerToggle}
          on:reset={handleTimerReset}
        /> -->
        <Timer
          id={2}
          bind:duration={timer2.duration}
          bind:remaining={timer2.remaining}
          bind:active={timer2.active}
          on:toggle={handleTimerToggle}
          on:reset={handleTimerReset}
        />
      </div>
    </div>
  </div>
</div>
