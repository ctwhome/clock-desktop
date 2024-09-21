<script lang="ts">
  import { onMount } from "svelte";

  let currentDate = new Date();
  let daysInMonth: number[] = [];
  let monthName: string = "";
  let currentYear: number = 0;
  let firstDayOffset: number = 0;

  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function updateCalendar(): void {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = getDaysInMonth(year, month);

    daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);
    monthName = currentDate.toLocaleString("default", { month: "long" });
    currentYear = year;

    // Calculate the offset for the first day of the month (Monday as start of week)
    firstDayOffset = new Date(year, month, 1).getDay();
    firstDayOffset = firstDayOffset === 0 ? 6 : firstDayOffset - 1;
  }

  function previousMonth(): void {
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1,
    );
    updateCalendar();
  }

  function nextMonth(): void {
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1,
    );
    updateCalendar();
  }

  function goToCurrentMonth(): void {
    currentDate = new Date();
    updateCalendar();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      goToCurrentMonth();
    }
  }

  function isWeekend(year: number, month: number, day: number): boolean {
    const date = new Date(year, month, day);
    return date.getDay() === 0 || date.getDay() === 6;
  }

  onMount(() => {
    updateCalendar();
  });
</script>

<div class="calendar text-white text-xs bg-black bg-opacity-50 p-2 rounded">
  <div
    class="month-year mb-1 text-center font-bold flex justify-between items-center"
  >
    <button
      on:click={previousMonth}
      class="text-white hover:text-gray-300 pointer-events-auto">&lt;</button
    >
    <button
      on:click={goToCurrentMonth}
      on:keydown={handleKeydown}
      class="cursor-pointer pointer-events-auto bg-transparent border-none text-white"
      >{monthName} {currentYear}</button
    >
    <button
      on:click={nextMonth}
      class="text-white hover:text-gray-300 pointer-events-auto">&gt;</button
    >
  </div>
  <div class="grid grid-cols-7 gap-1">
    {#each ["M", "T", "W", "T", "F", "S", "S"] as day, index}
      <div
        class="day-header w-6 h-6 flex items-center justify-center {index > 4
          ? 'weekend'
          : ''}"
      >
        {day}
      </div>
    {/each}
    {#each Array(firstDayOffset) as _}
      <div class="w-6 h-6"></div>
    {/each}
    {#each daysInMonth as day}
      <div
        class="day w-6 h-6 flex items-center justify-center {isWeekend(
          currentYear,
          currentDate.getMonth(),
          day,
        )
          ? 'weekend'
          : ''} {day === currentDate.getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear()
          ? 'bg-white text-black rounded-full'
          : ''}"
      >
        {day}
      </div>
    {/each}
  </div>
</div>

<style>
  .weekend {
    opacity: 0.6;
  }
</style>
