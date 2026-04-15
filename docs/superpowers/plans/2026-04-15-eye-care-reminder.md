# Eye Care Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone recurring eye rest reminder that overlays the widget with a guided countdown every 25 minutes.

**Architecture:** New `EyeCare.svelte` component mounted in the main page, reading from the settings store. A new `EyeCareSettings.svelte` component wired into the existing settings page. Types and defaults added to the shared settings system (TypeScript + Rust).

**Tech Stack:** Svelte 4, TypeScript, Tailwind CSS, Tauri 2 (Rust backend)

---

### Task 1: Add EyeCare types and defaults

**Files:**
- Modify: `src/lib/types.ts:31-46`
- Modify: `src/lib/stores/settings.ts:6-40`
- Modify: `src-tauri/src/settings.rs:46-62`

- [ ] **Step 1: Add `EyeCareSettings` interface to `types.ts`**

Add before the `AppSettings` interface:

```typescript
export interface EyeCareSettings {
  enabled: boolean;
  intervalMinutes: number;
  restDurationSeconds: number;
  playSound: boolean;
}
```

Add `eyeCare: EyeCareSettings;` to `AppSettings`, after the `behavior` field:

```typescript
export interface AppSettings {
  weather: WeatherSettings;
  clock: ClockSettings;
  timer: TimerSettings;
  appearance: AppearanceSettings;
  labels: LabelItem[];
  behavior: BehaviorSettings;
  eyeCare: EyeCareSettings;
}
```

- [ ] **Step 2: Add defaults to `stores/settings.ts`**

Add the `eyeCare` block to `DEFAULT_SETTINGS`, after `behavior`:

```typescript
eyeCare: {
  enabled: false,
  intervalMinutes: 25,
  restDurationSeconds: 20,
  playSound: true,
},
```

- [ ] **Step 3: Add Rust struct to `settings.rs`**

Add after the `BehaviorSettings` struct:

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EyeCareSettings {
    pub enabled: bool,
    pub interval_minutes: u32,
    pub rest_duration_seconds: u32,
    pub play_sound: bool,
}

impl Default for EyeCareSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            interval_minutes: 25,
            rest_duration_seconds: 20,
            play_sound: true,
        }
    }
}
```

Add the field to `AppSettings` struct with a serde default so existing settings files don't break:

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub weather: WeatherSettings,
    pub clock: ClockSettings,
    pub timer: TimerSettings,
    pub appearance: AppearanceSettings,
    pub labels: Vec<LabelItem>,
    pub behavior: BehaviorSettings,
    #[serde(default)]
    pub eye_care: EyeCareSettings,
}
```

- [ ] **Step 4: Verify the Rust backend compiles**

Run: `cd src-tauri && cargo check`
Expected: compiles with no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/stores/settings.ts src-tauri/src/settings.rs
git commit -m "feat(eye-care): add EyeCareSettings types and defaults"
```

---

### Task 2: Create EyeCareSettings component

**Files:**
- Create: `src/lib/components/settings/EyeCareSettings.svelte`
- Modify: `src/lib/components/settings/SettingsLayout.svelte:2-9`
- Modify: `src/routes/settings/+page.svelte:7-31`

- [ ] **Step 1: Create `EyeCareSettings.svelte`**

Create `src/lib/components/settings/EyeCareSettings.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  function toggleEnabled() {
    settings.eyeCare.enabled = !settings.eyeCare.enabled;
    save();
  }

  function toggleSound() {
    settings.eyeCare.playSound = !settings.eyeCare.playSound;
    save();
  }

  function handleIntervalChange(e: Event) {
    settings.eyeCare.intervalMinutes = parseInt((e.target as HTMLInputElement).value);
    save();
  }

  function handleDurationChange(e: Event) {
    settings.eyeCare.restDurationSeconds = parseInt((e.target as HTMLInputElement).value);
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Eye Care</h2>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Enable eye care reminders</p>
      <p class="text-xs text-gray-400">Periodic reminders to rest your eyes</p>
    </div>
    <button
      on:click={toggleEnabled}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.eyeCare.enabled ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.eyeCare.enabled ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div>
    <div class="flex items-center justify-between mb-2">
      <p class="text-sm">Reminder interval</p>
      <p class="text-xs text-gray-400">{settings.eyeCare.intervalMinutes} min</p>
    </div>
    <input
      type="range"
      min="10"
      max="60"
      step="5"
      value={settings.eyeCare.intervalMinutes}
      on:input={handleIntervalChange}
      class="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
    />
    <div class="flex justify-between text-xs text-gray-500 mt-1">
      <span>10 min</span>
      <span>60 min</span>
    </div>
  </div>

  <div>
    <div class="flex items-center justify-between mb-2">
      <p class="text-sm">Rest duration</p>
      <p class="text-xs text-gray-400">{settings.eyeCare.restDurationSeconds} sec</p>
    </div>
    <input
      type="range"
      min="10"
      max="60"
      step="5"
      value={settings.eyeCare.restDurationSeconds}
      on:input={handleDurationChange}
      class="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
    />
    <div class="flex justify-between text-xs text-gray-500 mt-1">
      <span>10 sec</span>
      <span>60 sec</span>
    </div>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Play sound</p>
      <p class="text-xs text-gray-400">Soft sound when rest starts and ends</p>
    </div>
    <button
      on:click={toggleSound}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.eyeCare.playSound ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.eyeCare.playSound ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>
</div>
```

- [ ] **Step 2: Add "Eye Care" to SettingsLayout sidebar**

In `src/lib/components/settings/SettingsLayout.svelte`, add to the `sections` array:

```typescript
const sections = [
  { id: 'weather', label: '🌤 Weather' },
  { id: 'clock', label: '🕐 Clock' },
  { id: 'timer', label: '⏱ Timer' },
  { id: 'appearance', label: '🎨 Appearance' },
  { id: 'labels', label: '🏷 Labels' },
  { id: 'behavior', label: '⚡ Behavior' },
  { id: 'eyeCare', label: '👁 Eye Care' },
];
```

- [ ] **Step 3: Wire up EyeCareSettings in settings page**

In `src/routes/settings/+page.svelte`, add the import:

```typescript
import EyeCareSettings from "$lib/components/settings/EyeCareSettings.svelte";
```

Add the conditional block after the `behavior` block:

```svelte
{:else if activeSection === 'eyeCare'}
  <EyeCareSettings bind:settings={$settings} on:save={() => saveSettings($settings)} />
```

- [ ] **Step 4: Verify the settings page renders**

Run: `bun run dev`
Open the settings window and confirm the "Eye Care" section appears in the sidebar and all controls render correctly.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/settings/EyeCareSettings.svelte src/lib/components/settings/SettingsLayout.svelte src/routes/settings/+page.svelte
git commit -m "feat(eye-care): add Eye Care settings section with controls"
```

---

### Task 3: Create EyeCare overlay component

**Files:**
- Create: `src/lib/components/EyeCare.svelte`
- Modify: `src/routes/+page.svelte:1-46`

- [ ] **Step 1: Create `EyeCare.svelte`**

Create `src/lib/components/EyeCare.svelte`:

```svelte
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
```

- [ ] **Step 2: Mount EyeCare in the main page**

In `src/routes/+page.svelte`, add the import alongside the other component imports:

```typescript
import EyeCare from "$lib/components/EyeCare.svelte";
```

Add the component after the Settings button div (before the closing `</div>`):

```svelte
  <!-- Eye Care Overlay -->
  <EyeCare />
</div>
```

- [ ] **Step 3: Test the full flow**

Run: `bun run dev` (with `bun run tauri dev` if needed)

1. Open settings, go to "Eye Care" section
2. Enable eye care reminders
3. Set interval to 10 min (lowest) for quicker testing — or temporarily change the interval constant in the code to 5 seconds
4. Verify the overlay appears with the countdown
5. Verify clicking the overlay dismisses it
6. Verify the sound plays (if enabled)
7. Verify the cycle restarts after dismiss

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/EyeCare.svelte src/routes/+page.svelte
git commit -m "feat(eye-care): add eye rest overlay with guided countdown"
```
