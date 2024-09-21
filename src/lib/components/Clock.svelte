<script>
  import { onMount } from "svelte";

  let time;
  let date;

  function updateTime() {
    time = new Date().toLocaleTimeString("nl-NL", {
      hour: "numeric",
      minute: "numeric",
    });
  }

  function updateDate() {
    date = new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  onMount(() => {
    updateTime();
    updateDate();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  });
</script>

<div
  class="relative w-full h-full flex flex-col justify-center items-center bg-black bg-opacity-50 text-white font-sans font-bold select-none overflow-hidden"
  style="text-shadow: 3px 3px 0.1em rgba(0, 0, 0, 0.22);"
>
  <div
    class="absolute inset-0 bg-cover bg-center opacity-50 z-0"
    style="background-image: url('https://images.unsplash.com/photo-1720728659925-9ca9a38afb2c?q=80&w=2075&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');"
  ></div>

  <div class="z-10 text-[max(60vmin,60vh)] select-none">
    {time}
  </div>
  <div class="z-10 text-[max(15vmin,15vh)] select-none -mt-10">
    {date}
  </div>
</div>
