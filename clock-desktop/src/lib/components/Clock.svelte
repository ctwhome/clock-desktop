<script>
  import { onMount } from "svelte";
  import { getCurrent, Window } from "@tauri-apps/plugin-window";

  let time;
  let date;

  function updateTime() {
    // only hour and minute
    time = new Date().toLocaleTimeString("nl-NL", {
      hour: "numeric",
      minute: "numeric",
    });
  }
  function updateDate() {
    // only hour and minute
    date = new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Function to apply or remove window decorations
  async function toggleDecorations(enable) {
    if (enable) {
      await appWindow.setDecorations(true);
    } else {
      await appWindow.setDecorations(false);
    }
  }

  onMount(() => {
    updateTime();
    updateDate();
    // Listen for focus and blur events
    // appWindow.onFocusChanged(({ payload: focused }) =>
    //   toggleDecorations(focused),
    // );

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval); // Clean up on component destroy
  });
</script>

<div class="window">
  <div class="clock">
    {time}
  </div>
  <!-- dsate with format  15 Jul, 2024-->
  <div class="date">
    {date}
  </div>
</div>

<style>
  :global(body) {
    overflow: hidden;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;

    font-family: sans-serif;
    font-weight: bold;
    text-shadow: 3px 3px 0.1em #00000037;

    /* background: rgba(0, 0, 0, 0.5); */
    color: white;
  }
  .window {
    /* fit cover the screen */
    background-size: cover;
    background-image: url("https://images.unsplash.com/photo-1720728659925-9ca9a38afb2c?q=80&w=2075&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
    -webkit-app-region: drag; /* Make the entire window area draggable */
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    background-color: #141414;
    display: flex;
    flex-direction: column;
  }

  .clock {
    /* grow the font with the window */
    font-size: max(60vmin, 60vh);

    /* pointer-events: none; Make the clock text non-clickable */
    /* -webkit-app-region: no-drag; Make the clock text non-draggable */
    user-select: none; /* Make the clock text non-selectable */
  }
  .date {
    font-size: max(15vmin, 15vh);
    /* pointer-events: none; Make the clock text non-clickable */
    /* -webkit-app-region: no-drag; Make the clock text non-draggable */
    user-select: none; /* Make the clock text non-selectable */
  }
</style>
