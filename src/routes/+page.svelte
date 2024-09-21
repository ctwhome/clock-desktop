<script lang="ts">
  import Clock from "$lib/components/Clock.svelte";
  import { Window } from "@tauri-apps/api/window";
  import { onMount } from "svelte";

  let appWindow: Window;

  onMount(async () => {
    appWindow = new Window("main");
  });

  async function minimize() {
    await appWindow?.minimize();
  }

  async function toggleMaximize() {
    await appWindow?.toggleMaximize();
  }

  async function close() {
    await appWindow?.close();
  }

  function handleKeydown(event: KeyboardEvent, action: () => Promise<void>) {
    if (event.key === "Enter" || event.key === " ") {
      action();
    }
  }
</script>

<div class="container" data-tauri-drag-region>
  <!--   <div class="titlebar">
    <button
      class="titlebar-button"
      on:click={minimize}
      on:keydown={(e) => handleKeydown(e, minimize)}
      aria-label="Minimize"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"><path fill="currentColor" d="M20 14H4v-4h16" /></svg
      >
    </button>
    <button
      class="titlebar-button"
      on:click={toggleMaximize}
      on:keydown={(e) => handleKeydown(e, toggleMaximize)}
      aria-label="Maximize"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        ><path fill="currentColor" d="M4 4h16v16H4V4m2 4v10h12V8H6Z" /></svg
      >
    </button>
    <button
      class="titlebar-button"
      on:click={close}
      on:keydown={(e) => handleKeydown(e, close)}
      aria-label="Close"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
        /></svg
      >
    </button>
  </div> -->
  <div class="clock-container">
    <Clock />
  </div>
</div>

<style>
  .container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.3);

    &:hover {
      /* background-color: red; */
      cursor: pointer;
    }
  }

  .titlebar {
    height: 30px;
    background: #2f3241;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    user-select: none;
  }

  .titlebar-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    color: #ffffff;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .titlebar-button:hover {
    background: #3f4254;
  }

  .clock-container {
    pointer-events: none;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
