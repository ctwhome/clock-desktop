<script lang="ts">
  import "../app.css";
  import Clock from "$lib/components/Clock.svelte";
  // import Settings from "$lib/components/Settings.svelte";

  function playTestSound() {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play();
  }
</script>

<div
  class="h-screen w-screen overflow-hidden bg-black bg-opacity-50 flex items-center justify-center"
  data-tauri-drag-region
>
  <div
    class="absolute inset-0 bg-cover bg-center opacity-50 pointer-events-none"
    style="background-image: url('https://images.unsplash.com/photo-1720728659925-9ca9a38afb2c?q=80&w=2075&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');"
  ></div>
  <div class="pointer-events-none">
    <Clock />
  </div>
  <div class="fixed top-2 right-2 flex gap-2">
    <!-- <button
      class="bg-white bg-opacity-10 text-white p-1.5 rounded-full transition-all duration-300 ease-in-out hover:bg-opacity-20
      hover:scale-110 active:bg-opacity-30 active:scale-90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      on:click={playTestSound}
      aria-label="Test Sound"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        class="fill-current"
      >
        <path
          d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
        />
      </svg>
    </button> -->
    <!-- <Settings /> -->
  </div>
</div>
