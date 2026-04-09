# Visual Polish & Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add weather-driven animated overlays on user-selected backgrounds, a macOS settings window, and optional activity labels for timer sessions.

**Architecture:** Four-layer visual system (background → weather overlay → dark overlay → UI) with settings persisted as JSON via Tauri's app_data_dir. Weather data fetched from OpenWeatherMap API on the frontend. Settings window opens as a separate Tauri window routed to `/settings`.

**Tech Stack:** Svelte 4, SvelteKit (static), TypeScript, Tailwind CSS, Tauri 2 RC, Rust (serde/serde_json for settings), Canvas API (weather animations)

---

## File Structure

### New Files

```
src/lib/
├── types.ts                         # TypeScript interfaces for settings, weather, labels
├── stores/
│   └── settings.ts                  # Svelte writable store for settings + Tauri IPC
├── components/
│   ├── Background.svelte            # Renders selected background (photo or CSS gradient)
│   ├── WeatherOverlay.svelte        # Parent: fetches weather, selects condition, manages lifecycle
│   ├── Labels.svelte                # Activity label pills near timer
│   ├── weather/
│   │   ├── Clear.svelte             # Sun rays overlay (canvas)
│   │   ├── Cloudy.svelte            # Drifting clouds overlay (canvas)
│   │   ├── Rain.svelte              # Raindrops overlay (canvas)
│   │   ├── Thunderstorm.svelte      # Rain + lightning overlay (canvas)
│   │   ├── Snow.svelte              # Snowflakes overlay (canvas)
│   │   ├── Fog.svelte               # Drifting haze overlay (CSS)
│   │   └── Night.svelte             # Stars + moon glow overlay (canvas)
│   └── settings/
│       ├── SettingsLayout.svelte     # Sidebar + content panel layout
│       ├── WeatherSettings.svelte    # Weather section
│       ├── ClockSettings.svelte      # Clock section
│       ├── TimerSettings.svelte      # Timer section
│       ├── AppearanceSettings.svelte # Background gallery + opacity
│       ├── LabelsSettings.svelte     # Label management
│       └── BehaviorSettings.svelte   # Startup/always-on-top toggles

src-tauri/src/
├── settings.rs                       # Settings struct, read/write, Tauri commands

static/backgrounds/
├── forest.jpg                        # ~300KB curated photos
├── ocean.jpg
├── mountain.jpg
├── city-night.jpg
├── desert.jpg
└── space.jpg
```

### Modified Files

```
src/routes/+page.svelte               # Replace hardcoded bg with Background + WeatherOverlay layers
src/routes/settings/+page.svelte      # Implement settings page with SettingsLayout
src/lib/components/Clock.svelte       # Read clock settings (format, locale), add Labels
src/lib/components/Timer.svelte       # Read timer settings (sounds, presets), accept label selection
src/lib/components/Settings.svelte    # Wire up button to open settings Tauri window
src-tauri/src/main.rs                 # Add settings module, register commands
src-tauri/Cargo.toml                  # Add serde_json (already present, confirm)
src-tauri/tauri.conf.json             # Add settings window config if needed
```

---

## Task 1: TypeScript Types & Settings Store

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/stores/settings.ts`

- [ ] **Step 1: Create TypeScript interfaces**

Create `src/lib/types.ts`:

```typescript
export interface WeatherSettings {
  location: string;
  locationName: string | null;
  updateFrequencyMin: number;
  enabled: boolean;
  apiKey: string | null;
}

export interface ClockSettings {
  format24h: boolean;
  showSeconds: boolean;
  dateLocale: string;
}

export interface TimerSettings {
  defaultDurationMin: number;
  presets: number[];
  startSound: string;
  finishSound: string;
}

export interface AppearanceSettings {
  background: string;
  overlayOpacity: number;
}

export interface LabelItem {
  id: string;
  name: string;
  emoji: string;
}

export interface BehaviorSettings {
  launchOnStartup: boolean;
  alwaysOnTop: boolean;
  visibleOnAllDesktops: boolean;
}

export interface AppSettings {
  weather: WeatherSettings;
  clock: ClockSettings;
  timer: TimerSettings;
  appearance: AppearanceSettings;
  labels: LabelItem[];
  behavior: BehaviorSettings;
}

export interface WeatherData {
  conditionCode: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'thunderstorm' | 'snow' | 'fog';
  temperature: number;
  sunrise: number;
  sunset: number;
  isNight: boolean;
}
```

- [ ] **Step 2: Create settings store with defaults**

Create `src/lib/stores/settings.ts`:

```typescript
import { writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  weather: {
    location: 'auto',
    locationName: null,
    updateFrequencyMin: 30,
    enabled: true,
    apiKey: null,
  },
  clock: {
    format24h: true,
    showSeconds: false,
    dateLocale: 'en-US',
  },
  timer: {
    defaultDurationMin: 30,
    presets: [5, 10, 15, 20, 25, 30, 45, 55, 60, 80],
    startSound: 'ticking.mp3',
    finishSound: 'notification.mp3',
  },
  appearance: {
    background: 'gradient-deep-sea',
    overlayOpacity: 0.5,
  },
  labels: [
    { id: 'work', name: 'Working', emoji: '💼' },
    { id: 'study', name: 'Studying', emoji: '📚' },
    { id: 'read', name: 'Reading', emoji: '📖' },
    { id: 'leisure', name: 'Leisure', emoji: '🎮' },
  ],
  behavior: {
    launchOnStartup: false,
    alwaysOnTop: true,
    visibleOnAllDesktops: true,
  },
};

export const settings = writable<AppSettings>(DEFAULT_SETTINGS);

export async function loadSettings(): Promise<void> {
  try {
    const saved = await invoke<AppSettings>('get_settings');
    settings.set({ ...DEFAULT_SETTINGS, ...saved });
  } catch {
    settings.set(DEFAULT_SETTINGS);
  }
}

export async function saveSettings(updated: AppSettings): Promise<void> {
  settings.set(updated);
  await invoke('save_settings', { settings: updated });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/stores/settings.ts
git commit -m "feat: add TypeScript types and settings store"
```

---

## Task 2: Rust Settings Backend

**Files:**
- Create: `src-tauri/src/settings.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Create settings.rs with read/write commands**

Create `src-tauri/src/settings.rs`:

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WeatherSettings {
    pub location: String,
    pub location_name: Option<String>,
    pub update_frequency_min: u32,
    pub enabled: bool,
    pub api_key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClockSettings {
    pub format24h: bool,
    pub show_seconds: bool,
    pub date_locale: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TimerSettings {
    pub default_duration_min: u32,
    pub presets: Vec<u32>,
    pub start_sound: String,
    pub finish_sound: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub background: String,
    pub overlay_opacity: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LabelItem {
    pub id: String,
    pub name: String,
    pub emoji: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BehaviorSettings {
    pub launch_on_startup: bool,
    pub always_on_top: bool,
    pub visible_on_all_desktops: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub weather: WeatherSettings,
    pub clock: ClockSettings,
    pub timer: TimerSettings,
    pub appearance: AppearanceSettings,
    pub labels: Vec<LabelItem>,
    pub behavior: BehaviorSettings,
}

fn settings_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    let data_dir = app.path().app_data_dir().expect("failed to get app data dir");
    fs::create_dir_all(&data_dir).ok();
    data_dir.join("settings.json")
}

#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(&app);
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let settings: AppSettings = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(settings)
    } else {
        Err("no settings file".to_string())
    }
}

#[tauri::command]
pub fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = settings_path(&app);
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 2: Register commands in main.rs**

Replace the contents of `src-tauri/src/main.rs` with:

```rust
mod settings;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            settings::get_settings,
            settings::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd src-tauri && cargo check`
Expected: Compiles without errors

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/settings.rs src-tauri/src/main.rs
git commit -m "feat: add Rust settings backend with read/write commands"
```

---

## Task 3: Background Component & Gallery

**Files:**
- Create: `src/lib/components/Background.svelte`
- Create: `static/backgrounds/` (6 photos — source from Unsplash or similar)

- [ ] **Step 1: Define background options**

The background data will live directly in the component. Create `src/lib/components/Background.svelte`:

```svelte
<script lang="ts">
  export let backgroundId: string = 'gradient-deep-sea';

  const gradients: Record<string, string> = {
    'gradient-sunset': 'linear-gradient(135deg, #ff6b35, #f7c59f)',
    'gradient-deep-sea': 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    'gradient-emerald': 'linear-gradient(135deg, #11998e, #38ef7d)',
    'gradient-lavender': 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    'gradient-midnight': 'linear-gradient(135deg, #0c0c0c, #1a1a1a)',
    'gradient-peach': 'linear-gradient(135deg, #ffecd2, #fcb69f)',
  };

  const photos: string[] = [
    'forest', 'ocean', 'mountain', 'city-night', 'desert', 'space',
  ];

  $: isGradient = backgroundId.startsWith('gradient-');
  $: style = isGradient
    ? `background: ${gradients[backgroundId] || gradients['gradient-deep-sea']};`
    : `background-image: url('/backgrounds/${backgroundId}.jpg'); background-size: cover; background-position: center;`;
</script>

<div class="absolute inset-0" {style}></div>
```

- [ ] **Step 2: Source and add 6 background photos**

Download 6 landscape photos optimized to ~800x500px, JPEG, ~200-400KB each. Save to:
- `static/backgrounds/forest.jpg`
- `static/backgrounds/ocean.jpg`
- `static/backgrounds/mountain.jpg`
- `static/backgrounds/city-night.jpg`
- `static/backgrounds/desert.jpg`
- `static/backgrounds/space.jpg`

Use royalty-free sources (Unsplash, Pexels). Optimize with: `sips -Z 800 *.jpg` on macOS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Background.svelte static/backgrounds/
git commit -m "feat: add Background component with curated photos and gradients"
```

---

## Task 4: Integrate Background into Main Page

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Replace hardcoded background with Background component**

Replace the full contents of `src/routes/+page.svelte` with:

```svelte
<script>
  import Clock from "$lib/components/Clock.svelte";
  import Background from "$lib/components/Background.svelte";
  import { settings, loadSettings } from "$lib/stores/settings";
  import { onMount } from "svelte";

  onMount(() => {
    loadSettings();
  });
</script>

<div
  data-tauri-drag-region
  class="h-screen w-screen flex items-center justify-center relative overflow-hidden"
>
  <!-- Layer 1: Background -->
  <Background backgroundId={$settings.appearance.background} />

  <!-- Layer 2: Weather Overlay (added in Task 6) -->

  <!-- Layer 3: Dark Overlay -->
  <div
    class="absolute inset-0"
    style="background-color: rgba(0, 0, 0, {$settings.appearance.overlayOpacity});"
  ></div>

  <!-- Layer 4: UI -->
  <div class="relative z-10 pointer-events-none">
    <Clock />
  </div>
</div>
```

- [ ] **Step 2: Verify the app renders with the default gradient**

Run: `bun run tauri dev`
Expected: App shows the Deep Sea gradient background instead of the Unsplash photo. Clock and timer still work.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: integrate layered background system into main page"
```

---

## Task 5: Settings Window & Layout

**Files:**
- Modify: `src/lib/components/Settings.svelte`
- Create: `src/lib/components/settings/SettingsLayout.svelte`
- Modify: `src/routes/settings/+page.svelte`
- Modify: `src-tauri/tauri.conf.json` (if needed for window permissions)

- [ ] **Step 1: Wire up Settings button to open a Tauri window**

Replace the contents of `src/lib/components/Settings.svelte` with:

```svelte
<script lang="ts">
  import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

  async function openSettings() {
    const existing = await WebviewWindow.getByLabel('settings');
    if (existing) {
      await existing.setFocus();
      return;
    }

    new WebviewWindow('settings', {
      url: '/settings',
      title: 'Preferences',
      width: 600,
      height: 450,
      resizable: false,
      alwaysOnTop: false,
      decorations: true,
    });
  }
</script>

<button
  on:click={openSettings}
  class="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors duration-200"
  aria-label="Settings"
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
    <circle cx="12" cy="12" r="3"></circle>
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
    ></path>
  </svg>
</button>
```

- [ ] **Step 2: Uncomment the Settings button in +page.svelte**

Add the Settings import and button to `src/routes/+page.svelte`. After the `<Clock />` div, add:

```svelte
  <!-- Settings button -->
  <div class="fixed top-2 right-2 z-20 pointer-events-auto text-white">
    <Settings />
  </div>
```

And add the import at the top of the `<script>` tag:

```svelte
  import Settings from "$lib/components/Settings.svelte";
```

- [ ] **Step 3: Create SettingsLayout component**

Create `src/lib/components/settings/SettingsLayout.svelte`:

```svelte
<script lang="ts">
  const sections = [
    { id: 'weather', label: '🌤 Weather' },
    { id: 'clock', label: '🕐 Clock' },
    { id: 'timer', label: '⏱ Timer' },
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'labels', label: '🏷 Labels' },
    { id: 'behavior', label: '⚡ Behavior' },
  ];

  let activeSection = 'weather';
</script>

<div class="flex h-screen bg-gray-900 text-white">
  <!-- Sidebar -->
  <nav class="w-40 bg-gray-950 border-r border-white/10 py-4">
    {#each sections as section}
      <button
        class="w-full text-left px-4 py-2 text-sm transition-colors duration-150
          {activeSection === section.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
        on:click={() => (activeSection = section.id)}
      >
        {section.label}
      </button>
    {/each}
  </nav>

  <!-- Content -->
  <main class="flex-1 p-6 overflow-y-auto">
    <slot {activeSection} />
  </main>
</div>
```

- [ ] **Step 4: Implement the settings page**

Replace the contents of `src/routes/settings/+page.svelte` with:

```svelte
<script>
  import SettingsLayout from "$lib/components/settings/SettingsLayout.svelte";
  import WeatherSettings from "$lib/components/settings/WeatherSettings.svelte";
  import ClockSettings from "$lib/components/settings/ClockSettings.svelte";
  import TimerSettings from "$lib/components/settings/TimerSettings.svelte";
  import AppearanceSettings from "$lib/components/settings/AppearanceSettings.svelte";
  import LabelsSettings from "$lib/components/settings/LabelsSettings.svelte";
  import BehaviorSettings from "$lib/components/settings/BehaviorSettings.svelte";
  import { settings, loadSettings, saveSettings } from "$lib/stores/settings";
  import { onMount } from "svelte";

  onMount(() => {
    loadSettings();
  });
</script>

<SettingsLayout let:activeSection>
  {#if activeSection === 'weather'}
    <WeatherSettings bind:settings={$settings} on:save={() => saveSettings($settings)} />
  {:else if activeSection === 'clock'}
    <ClockSettings bind:settings={$settings} on:save={() => saveSettings($settings)} />
  {:else if activeSection === 'timer'}
    <TimerSettings bind:settings={$settings} on:save={() => saveSettings($settings)} />
  {:else if activeSection === 'appearance'}
    <AppearanceSettings bind:settings={$settings} on:save={() => saveSettings($settings)} />
  {:else if activeSection === 'labels'}
    <LabelsSettings bind:settings={$settings} on:save={() => saveSettings($settings)} />
  {:else if activeSection === 'behavior'}
    <BehaviorSettings bind:settings={$settings} on:save={() => saveSettings($settings)} />
  {/if}
</SettingsLayout>
```

- [ ] **Step 5: Create placeholder settings section components**

Create each settings section as a minimal working component. These will be fleshed out in Tasks 7-12.

Create `src/lib/components/settings/WeatherSettings.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }
</script>

<h2 class="text-lg font-semibold mb-4">Weather</h2>
<p class="text-gray-400 text-sm">Weather settings coming soon.</p>
```

Create `src/lib/components/settings/ClockSettings.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }
</script>

<h2 class="text-lg font-semibold mb-4">Clock</h2>
<p class="text-gray-400 text-sm">Clock settings coming soon.</p>
```

Create `src/lib/components/settings/TimerSettings.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }
</script>

<h2 class="text-lg font-semibold mb-4">Timer</h2>
<p class="text-gray-400 text-sm">Timer settings coming soon.</p>
```

Create `src/lib/components/settings/AppearanceSettings.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }
</script>

<h2 class="text-lg font-semibold mb-4">Appearance</h2>
<p class="text-gray-400 text-sm">Appearance settings coming soon.</p>
```

Create `src/lib/components/settings/LabelsSettings.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }
</script>

<h2 class="text-lg font-semibold mb-4">Labels</h2>
<p class="text-gray-400 text-sm">Label settings coming soon.</p>
```

Create `src/lib/components/settings/BehaviorSettings.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }
</script>

<h2 class="text-lg font-semibold mb-4">Behavior</h2>
<p class="text-gray-400 text-sm">Behavior settings coming soon.</p>
```

- [ ] **Step 6: Verify settings window opens**

Run: `bun run tauri dev`
Expected: Clicking the gear icon opens a separate Preferences window with sidebar navigation. Clicking sidebar items switches the content panel (all showing placeholder text).

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/Settings.svelte src/lib/components/settings/ src/routes/settings/+page.svelte src/routes/+page.svelte
git commit -m "feat: add settings window with sidebar layout and placeholder sections"
```

---

## Task 6: Weather Overlay System

**Files:**
- Create: `src/lib/components/WeatherOverlay.svelte`
- Create: `src/lib/components/weather/Clear.svelte`
- Create: `src/lib/components/weather/Cloudy.svelte`
- Create: `src/lib/components/weather/Rain.svelte`
- Create: `src/lib/components/weather/Thunderstorm.svelte`
- Create: `src/lib/components/weather/Snow.svelte`
- Create: `src/lib/components/weather/Fog.svelte`
- Create: `src/lib/components/weather/Night.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create the Rain overlay component**

Start with Rain as it's the most recognizable weather effect. Create `src/lib/components/weather/Rain.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let drops: Array<{ x: number; y: number; speed: number; length: number; opacity: number }> = [];

  function initDrops() {
    drops = [];
    const count = 150;
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 4 + Math.random() * 6,
        length: 10 + Math.random() * 20,
        opacity: 0.1 + Math.random() * 0.3,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const drop of drops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + 1, drop.y + drop.length);
      ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function update() {
    for (const drop of drops) {
      drop.y += drop.speed;
      if (drop.y > canvas.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * canvas.width;
      }
    }
  }

  function loop() {
    if (!animate) return;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDrops();
    if (!animate) draw();
  }

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    resize();
    if (animate) loop();
    else draw();
    window.addEventListener("resize", resize);
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
  });

  $: if (canvas && ctx) {
    if (animate) {
      loop();
    } else {
      if (animationId) cancelAnimationFrame(animationId);
      draw();
    }
  }
</script>

<canvas bind:this={canvas} class="absolute inset-0 pointer-events-none"></canvas>
```

- [ ] **Step 2: Create the Clear (sunny) overlay component**

Create `src/lib/components/weather/Clear.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let rayAngle = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width * 0.8;
    const cy = canvas.height * 0.15;
    const rayCount = 12;
    const maxRadius = Math.max(canvas.width, canvas.height) * 0.8;

    // Sun glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
    glow.addColorStop(0, "rgba(255, 220, 100, 0.3)");
    glow.addColorStop(1, "rgba(255, 220, 100, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rays
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + rayAngle;
      const spread = 0.08;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(angle - spread) * maxRadius,
        cy + Math.sin(angle - spread) * maxRadius
      );
      ctx.lineTo(
        cx + Math.cos(angle + spread) * maxRadius,
        cy + Math.sin(angle + spread) * maxRadius
      );
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 230, 130, 0.04)";
      ctx.fill();
    }

    // Warm wash
    const wash = ctx.createLinearGradient(0, 0, 0, canvas.height);
    wash.addColorStop(0, "rgba(255, 200, 50, 0.05)");
    wash.addColorStop(1, "rgba(255, 150, 50, 0.02)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function loop() {
    if (!animate) return;
    rayAngle += 0.002;
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  }

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    resize();
    if (animate) loop();
    window.addEventListener("resize", resize);
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 pointer-events-none"></canvas>
```

- [ ] **Step 3: Create the Cloudy overlay component**

Create `src/lib/components/weather/Cloudy.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let clouds: Array<{ x: number; y: number; radius: number; speed: number; opacity: number }> = [];

  function initClouds() {
    clouds = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.6,
        radius: 60 + Math.random() * 100,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.05 + Math.random() * 0.1,
      });
    }
  }

  function drawCloud(cloud: typeof clouds[0]) {
    const gradient = ctx.createRadialGradient(
      cloud.x, cloud.y, 0,
      cloud.x, cloud.y, cloud.radius
    );
    gradient.addColorStop(0, `rgba(200, 210, 220, ${cloud.opacity})`);
    gradient.addColorStop(1, "rgba(200, 210, 220, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.radius * 1.5, cloud.radius, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const cloud of clouds) {
      drawCloud(cloud);
    }
  }

  function update() {
    for (const cloud of clouds) {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.radius * 1.5 > canvas.width) {
        cloud.x = -cloud.radius * 1.5;
      }
    }
  }

  function loop() {
    if (!animate) return;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initClouds();
    draw();
  }

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    resize();
    if (animate) loop();
    window.addEventListener("resize", resize);
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 pointer-events-none"></canvas>
```

- [ ] **Step 4: Create the Thunderstorm overlay component**

Create `src/lib/components/weather/Thunderstorm.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let drops: Array<{ x: number; y: number; speed: number; length: number; opacity: number }> = [];
  let flashOpacity = 0;
  let nextFlash = 0;
  let frame = 0;

  function initDrops() {
    drops = [];
    for (let i = 0; i < 250; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 6 + Math.random() * 10,
        length: 15 + Math.random() * 25,
        opacity: 0.15 + Math.random() * 0.35,
      });
    }
    nextFlash = 120 + Math.random() * 300;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Lightning flash
    if (flashOpacity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Heavy rain
    for (const drop of drops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + 2, drop.y + drop.length);
      ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function update() {
    frame++;
    for (const drop of drops) {
      drop.y += drop.speed;
      if (drop.y > canvas.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * canvas.width;
      }
    }

    // Lightning timing
    if (frame >= nextFlash) {
      flashOpacity = 0.6;
      nextFlash = frame + 180 + Math.random() * 400;
    }
    if (flashOpacity > 0) {
      flashOpacity -= 0.05;
      if (flashOpacity < 0) flashOpacity = 0;
    }
  }

  function loop() {
    if (!animate) return;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDrops();
    if (!animate) draw();
  }

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    resize();
    if (animate) loop();
    else draw();
    window.addEventListener("resize", resize);
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 pointer-events-none"></canvas>
```

- [ ] **Step 5: Create the Snow overlay component**

Create `src/lib/components/weather/Snow.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let flakes: Array<{ x: number; y: number; radius: number; speed: number; drift: number; opacity: number }> = [];

  function initFlakes() {
    flakes = [];
    for (let i = 0; i < 100; i++) {
      flakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 1 + Math.random() * 3,
        speed: 0.5 + Math.random() * 1.5,
        drift: (Math.random() - 0.5) * 0.5,
        opacity: 0.3 + Math.random() * 0.5,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cold blue tint
    ctx.fillStyle = "rgba(100, 150, 220, 0.03)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const flake of flakes) {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      ctx.fill();
    }
  }

  function update() {
    for (const flake of flakes) {
      flake.y += flake.speed;
      flake.x += flake.drift;
      if (flake.y > canvas.height) {
        flake.y = -flake.radius;
        flake.x = Math.random() * canvas.width;
      }
      if (flake.x > canvas.width) flake.x = 0;
      if (flake.x < 0) flake.x = canvas.width;
    }
  }

  function loop() {
    if (!animate) return;
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initFlakes();
    if (!animate) draw();
  }

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    resize();
    if (animate) loop();
    else draw();
    window.addEventListener("resize", resize);
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 pointer-events-none"></canvas>
```

- [ ] **Step 6: Create the Fog overlay component**

Create `src/lib/components/weather/Fog.svelte`:

```svelte
<script lang="ts">
  export let animate: boolean = true;
</script>

<div class="absolute inset-0 pointer-events-none overflow-hidden">
  <div
    class="fog-layer fog-1"
    class:fog-animate={animate}
  ></div>
  <div
    class="fog-layer fog-2"
    class:fog-animate={animate}
  ></div>
</div>

<style>
  .fog-layer {
    position: absolute;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(200, 200, 210, 0.08) 20%,
      rgba(200, 200, 210, 0.12) 50%,
      rgba(200, 200, 210, 0.08) 80%,
      transparent 100%
    );
  }

  .fog-1 {
    top: 10%;
    left: -50%;
  }

  .fog-2 {
    top: 40%;
    left: -80%;
    opacity: 0.7;
  }

  .fog-animate .fog-1 {
    animation: drift 20s linear infinite;
  }

  .fog-animate .fog-2 {
    animation: drift 28s linear infinite reverse;
  }

  @keyframes drift {
    from { transform: translateX(0); }
    to { transform: translateX(50%); }
  }
</style>
```

- [ ] **Step 7: Create the Night overlay component**

Create `src/lib/components/weather/Night.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let stars: Array<{ x: number; y: number; radius: number; baseOpacity: number; phase: number }> = [];
  let frame = 0;

  function initStars() {
    stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        radius: 0.5 + Math.random() * 1.5,
        baseOpacity: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark blue wash
    ctx.fillStyle = "rgba(10, 15, 40, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Moon glow (top right area)
    const mx = canvas.width * 0.85;
    const my = canvas.height * 0.12;
    const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
    moonGlow.addColorStop(0, "rgba(200, 210, 255, 0.15)");
    moonGlow.addColorStop(1, "rgba(200, 210, 255, 0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Moon disc
    ctx.beginPath();
    ctx.arc(mx, my, 12, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220, 230, 255, 0.6)";
    ctx.fill();

    // Stars
    for (const star of stars) {
      const twinkle = animate
        ? star.baseOpacity + Math.sin(frame * 0.02 + star.phase) * 0.15
        : star.baseOpacity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, twinkle)})`;
      ctx.fill();
    }
  }

  function loop() {
    if (!animate) return;
    frame++;
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
    draw();
  }

  onMount(() => {
    ctx = canvas.getContext("2d")!;
    resize();
    if (animate) loop();
    window.addEventListener("resize", resize);
  });

  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", resize);
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 pointer-events-none"></canvas>
```

- [ ] **Step 8: Create the WeatherOverlay parent component**

Create `src/lib/components/WeatherOverlay.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { WeatherData } from "$lib/types";
  import Clear from "./weather/Clear.svelte";
  import Cloudy from "./weather/Cloudy.svelte";
  import Rain from "./weather/Rain.svelte";
  import Thunderstorm from "./weather/Thunderstorm.svelte";
  import Snow from "./weather/Snow.svelte";
  import Fog from "./weather/Fog.svelte";
  import Night from "./weather/Night.svelte";

  export let apiKey: string | null = null;
  export let location: string = "auto";
  export let updateFrequencyMin: number = 30;
  export let enabled: boolean = true;

  let weather: WeatherData | null = null;
  let animate = true;
  let settleTimeout: ReturnType<typeof setTimeout>;
  let fetchInterval: ReturnType<typeof setInterval>;

  function mapConditionCode(code: number): WeatherData["condition"] {
    if (code >= 200 && code < 300) return "thunderstorm";
    if (code >= 300 && code < 600) return "rain";
    if (code >= 600 && code < 700) return "snow";
    if (code >= 700 && code < 800) return "fog";
    if (code === 800) return "clear";
    return "cloudy";
  }

  async function fetchWeather() {
    if (!apiKey) return;

    try {
      let url: string;
      if (location === "auto") {
        // Use IP-based geolocation first
        const geoRes = await fetch("https://ipapi.co/json/");
        const geo = await geoRes.json();
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${geo.latitude}&lon=${geo.longitude}&appid=${apiKey}&units=metric`;
      } else {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
      }

      const res = await fetch(url);
      const data = await res.json();

      const now = Math.floor(Date.now() / 1000);
      weather = {
        conditionCode: data.weather[0].id,
        condition: mapConditionCode(data.weather[0].id),
        temperature: data.main.temp,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        isNight: now < data.sys.sunrise || now > data.sys.sunset,
      };

      // Trigger animation on weather change
      animate = true;
      clearTimeout(settleTimeout);
      settleTimeout = setTimeout(() => {
        animate = false;
      }, 5000);
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    }
  }

  onMount(() => {
    if (!enabled || !apiKey) return;

    // Initial animation settle
    settleTimeout = setTimeout(() => {
      animate = false;
    }, 5000);

    fetchWeather();
    fetchInterval = setInterval(fetchWeather, updateFrequencyMin * 60 * 1000);
  });

  onDestroy(() => {
    clearTimeout(settleTimeout);
    clearInterval(fetchInterval);
  });
</script>

{#if enabled && weather}
  <div class="absolute inset-0 pointer-events-none">
    {#if weather.condition === "clear"}
      <Clear {animate} />
    {:else if weather.condition === "cloudy"}
      <Cloudy {animate} />
    {:else if weather.condition === "rain"}
      <Rain {animate} />
    {:else if weather.condition === "thunderstorm"}
      <Thunderstorm {animate} />
    {:else if weather.condition === "snow"}
      <Snow {animate} />
    {:else if weather.condition === "fog"}
      <Fog {animate} />
    {/if}

    {#if weather.isNight}
      <Night {animate} />
    {/if}
  </div>
{/if}
```

- [ ] **Step 9: Integrate WeatherOverlay into +page.svelte**

In `src/routes/+page.svelte`, add the WeatherOverlay between the Background and Dark Overlay layers:

Add import at top of `<script>`:

```svelte
  import WeatherOverlay from "$lib/components/WeatherOverlay.svelte";
```

Add between Background and dark overlay div:

```svelte
  <!-- Layer 2: Weather Overlay -->
  <WeatherOverlay
    apiKey={$settings.weather.apiKey}
    location={$settings.weather.location}
    updateFrequencyMin={$settings.weather.updateFrequencyMin}
    enabled={$settings.weather.enabled}
  />
```

- [ ] **Step 10: Verify weather overlays render**

Run: `bun run tauri dev`

To test without an API key, temporarily hardcode a weather condition in `WeatherOverlay.svelte` by setting `weather` directly in `onMount`:

```typescript
weather = { conditionCode: 500, condition: "rain", temperature: 15, sunrise: 0, sunset: 0, isNight: false };
```

Expected: Rain animation plays for 5 seconds then freezes. Remove the hardcode after testing.

- [ ] **Step 11: Commit**

```bash
git add src/lib/components/WeatherOverlay.svelte src/lib/components/weather/ src/routes/+page.svelte
git commit -m "feat: add weather overlay system with 7 animated conditions"
```

---

## Task 7: Weather Settings Section

**Files:**
- Modify: `src/lib/components/settings/WeatherSettings.svelte`

- [ ] **Step 1: Implement the Weather settings UI**

Replace `src/lib/components/settings/WeatherSettings.svelte` with:

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
    settings.weather.enabled = !settings.weather.enabled;
    save();
  }

  function updateFrequency(event: Event) {
    settings.weather.updateFrequencyMin = parseInt((event.target as HTMLSelectElement).value);
    save();
  }

  function updateApiKey(event: Event) {
    settings.weather.apiKey = (event.target as HTMLInputElement).value || null;
    save();
  }

  function updateLocation(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    settings.weather.location = value || "auto";
    settings.weather.locationName = value || null;
    save();
  }

  function resetLocation() {
    settings.weather.location = "auto";
    settings.weather.locationName = null;
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Weather</h2>

{#if !settings.weather.apiKey}
  <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
    <p class="text-sm text-yellow-200 mb-2">Weather overlays require a free OpenWeatherMap API key.</p>
    <p class="text-xs text-gray-400">Sign up at openweathermap.org/api — it takes 30 seconds and the free tier is more than enough.</p>
  </div>
{/if}

<div class="space-y-5">
  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">API Key</label>
    <input
      type="text"
      value={settings.weather.apiKey || ""}
      on:change={updateApiKey}
      placeholder="Enter your OpenWeatherMap API key"
      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
    />
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Location</label>
    <div class="flex gap-2">
      <input
        type="text"
        value={settings.weather.locationName || ""}
        on:change={updateLocation}
        placeholder="Auto-detect (IP based)"
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
      <button
        on:click={resetLocation}
        class="px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      >Auto</button>
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Update Frequency</label>
    <select
      value={settings.weather.updateFrequencyMin}
      on:change={updateFrequency}
      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
    >
      <option value={15}>Every 15 minutes</option>
      <option value={30}>Every 30 minutes</option>
      <option value={60}>Every 60 minutes</option>
    </select>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Weather animations</p>
      <p class="text-xs text-gray-400">Show animated weather overlays on the clock</p>
    </div>
    <button
      on:click={toggleEnabled}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.weather.enabled ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.weather.enabled ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/settings/WeatherSettings.svelte
git commit -m "feat: implement weather settings section"
```

---

## Task 8: Clock Settings Section

**Files:**
- Modify: `src/lib/components/settings/ClockSettings.svelte`
- Modify: `src/lib/components/Clock.svelte`

- [ ] **Step 1: Implement Clock settings UI**

Replace `src/lib/components/settings/ClockSettings.svelte` with:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  function toggleFormat() {
    settings.clock.format24h = !settings.clock.format24h;
    save();
  }

  function toggleSeconds() {
    settings.clock.showSeconds = !settings.clock.showSeconds;
    save();
  }

  function updateLocale(event: Event) {
    settings.clock.dateLocale = (event.target as HTMLSelectElement).value;
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Clock</h2>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">24-hour format</p>
      <p class="text-xs text-gray-400">Use 24-hour time (14:30) instead of 12-hour (2:30 PM)</p>
    </div>
    <button
      on:click={toggleFormat}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.clock.format24h ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.clock.format24h ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Show seconds</p>
      <p class="text-xs text-gray-400">Display seconds in the main clock</p>
    </div>
    <button
      on:click={toggleSeconds}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.clock.showSeconds ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.clock.showSeconds ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Date Language</label>
    <select
      value={settings.clock.dateLocale}
      on:change={updateLocale}
      class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
    >
      <option value="en-US">English</option>
      <option value="nl-NL">Dutch</option>
      <option value="es-ES">Spanish</option>
      <option value="fr-FR">French</option>
      <option value="de-DE">German</option>
      <option value="pt-BR">Portuguese</option>
      <option value="ja-JP">Japanese</option>
      <option value="zh-CN">Chinese</option>
    </select>
  </div>
</div>
```

- [ ] **Step 2: Update Clock.svelte to use settings**

Modify `src/lib/components/Clock.svelte` to accept and use clock settings. Add these props and update the time/date formatting:

Add to the `<script>` tag:

```typescript
  import { settings } from "$lib/stores/settings";

  // Replace the existing setInterval block with:
  setInterval(() => {
    const opts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !$settings.clock.format24h,
    };
    if ($settings.clock.showSeconds) {
      opts.second = "2-digit";
    }
    time = new Date().toLocaleTimeString(
      $settings.clock.format24h ? "nl-NL" : "en-US",
      opts
    );
    date = new Date().toLocaleDateString($settings.clock.dateLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, 1000);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/settings/ClockSettings.svelte src/lib/components/Clock.svelte
git commit -m "feat: implement clock settings with format and locale options"
```

---

## Task 9: Timer Settings Section

**Files:**
- Modify: `src/lib/components/settings/TimerSettings.svelte`
- Modify: `src/lib/components/Timer.svelte`

- [ ] **Step 1: Implement Timer settings UI**

Replace `src/lib/components/settings/TimerSettings.svelte` with:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  const availableSounds = [
    { file: "ticking.mp3", label: "Ticking" },
    { file: "start.mp3", label: "Start" },
    { file: "countdown.mp3", label: "Countdown" },
    { file: "notification.mp3", label: "Notification" },
    { file: "notification-finished.mp3", label: "Notification (alt)" },
    { file: "classical.mp3", label: "Classical" },
    { file: "waker.mp3", label: "Waker" },
    { file: "winsquare-6993.mp3", label: "Win Square" },
    { file: "8-bit-beeping-computer-sounds-90005.mp3", label: "8-bit Beep" },
    { file: "biohazard-alarm-143105.mp3", label: "Biohazard Alarm" },
    { file: "star-dust-alarm-clock-114194.mp3", label: "Star Dust" },
    { file: "sound_notif2-132674.mp3", label: "Notification 2" },
  ];

  function previewSound(file: string) {
    const audio = new Audio(`/sounds/${file}`);
    audio.play();
  }

  function updateStartSound(event: Event) {
    settings.timer.startSound = (event.target as HTMLSelectElement).value;
    save();
  }

  function updateFinishSound(event: Event) {
    settings.timer.finishSound = (event.target as HTMLSelectElement).value;
    save();
  }

  function updateDefaultDuration(event: Event) {
    settings.timer.defaultDurationMin = parseInt((event.target as HTMLInputElement).value) || 30;
    save();
  }

  let newPreset = "";

  function addPreset() {
    const val = parseInt(newPreset);
    if (val > 0 && !settings.timer.presets.includes(val)) {
      settings.timer.presets = [...settings.timer.presets, val].sort((a, b) => a - b);
      newPreset = "";
      save();
    }
  }

  function removePreset(val: number) {
    settings.timer.presets = settings.timer.presets.filter((p) => p !== val);
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Timer</h2>

<div class="space-y-5">
  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Default Duration (minutes)</label>
    <input
      type="number"
      value={settings.timer.defaultDurationMin}
      on:change={updateDefaultDuration}
      min="1"
      class="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
    />
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Presets</label>
    <div class="flex flex-wrap gap-2 mb-2">
      {#each settings.timer.presets as preset}
        <span class="inline-flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm">
          {preset}m
          <button
            on:click={() => removePreset(preset)}
            class="text-gray-400 hover:text-red-400 ml-1"
          >&times;</button>
        </span>
      {/each}
    </div>
    <div class="flex gap-2">
      <input
        type="number"
        bind:value={newPreset}
        placeholder="Minutes"
        min="1"
        class="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        on:keydown={(e) => e.key === "Enter" && addPreset()}
      />
      <button
        on:click={addPreset}
        class="px-3 py-2 text-sm bg-indigo-500/20 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
      >Add</button>
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Start Sound</label>
    <div class="flex gap-2">
      <select
        value={settings.timer.startSound}
        on:change={updateStartSound}
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {#each availableSounds as sound}
          <option value={sound.file}>{sound.label}</option>
        {/each}
      </select>
      <button
        on:click={() => previewSound(settings.timer.startSound)}
        class="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      >&#9654;</button>
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-1">Finish Sound</label>
    <div class="flex gap-2">
      <select
        value={settings.timer.finishSound}
        on:change={updateFinishSound}
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {#each availableSounds as sound}
          <option value={sound.file}>{sound.label}</option>
        {/each}
      </select>
      <button
        on:click={() => previewSound(settings.timer.finishSound)}
        class="px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      >&#9654;</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Update Timer.svelte to use settings**

In `src/lib/components/Timer.svelte`, import the settings store and use it for sounds and presets:

Add to `<script>`:

```typescript
  import { settings } from "$lib/stores/settings";
```

Replace the hardcoded `presetTimers` array with a reactive declaration:

```typescript
  $: presetTimers = $settings.timer.presets.map(v => ({
    label: v >= 60 ? `${Math.floor(v/60)}h${v%60 ? v%60 + 'm' : ''}` : `${v}m`,
    value: v
  }));
```

Replace the hardcoded `duration = 30` with:

```typescript
  let duration = $settings.timer.defaultDurationMin;
```

Update `startSound()`:

```typescript
  async function startSound() {
    const audio = new Audio(`/sounds/${$settings.timer.startSound}`);
    audio.play();
  }
```

Update `finishSound()`:

```typescript
  async function finishSound() {
    const audio = new Audio(`/sounds/${$settings.timer.finishSound}`);
    audio.play();
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/settings/TimerSettings.svelte src/lib/components/Timer.svelte
git commit -m "feat: implement timer settings with sound picker and custom presets"
```

---

## Task 10: Appearance Settings Section

**Files:**
- Modify: `src/lib/components/settings/AppearanceSettings.svelte`

- [ ] **Step 1: Implement Appearance settings with background gallery**

Replace `src/lib/components/settings/AppearanceSettings.svelte` with:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  const gradients = [
    { id: "gradient-sunset", label: "Sunset", css: "linear-gradient(135deg, #ff6b35, #f7c59f)" },
    { id: "gradient-deep-sea", label: "Deep Sea", css: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" },
    { id: "gradient-emerald", label: "Emerald", css: "linear-gradient(135deg, #11998e, #38ef7d)" },
    { id: "gradient-lavender", label: "Lavender", css: "linear-gradient(135deg, #4e54c8, #8f94fb)" },
    { id: "gradient-midnight", label: "Midnight", css: "linear-gradient(135deg, #0c0c0c, #1a1a1a)" },
    { id: "gradient-peach", label: "Peach", css: "linear-gradient(135deg, #ffecd2, #fcb69f)" },
  ];

  const photos = [
    { id: "forest", label: "Forest" },
    { id: "ocean", label: "Ocean" },
    { id: "mountain", label: "Mountain" },
    { id: "city-night", label: "City Night" },
    { id: "desert", label: "Desert" },
    { id: "space", label: "Space" },
  ];

  function selectBackground(id: string) {
    settings.appearance.background = id;
    save();
  }

  function updateOpacity(event: Event) {
    settings.appearance.overlayOpacity = parseFloat((event.target as HTMLInputElement).value);
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Appearance</h2>

<div class="space-y-6">
  <div>
    <label class="block text-xs uppercase text-gray-400 mb-2">Gradients</label>
    <div class="grid grid-cols-3 gap-3">
      {#each gradients as gradient}
        <button
          on:click={() => selectBackground(gradient.id)}
          class="group relative rounded-lg overflow-hidden h-16 border-2 transition-colors {settings.appearance.background === gradient.id ? 'border-indigo-500' : 'border-transparent hover:border-white/20'}"
        >
          <div class="absolute inset-0" style="background: {gradient.css};"></div>
          <span class="absolute bottom-1 left-2 text-xs text-white/70">{gradient.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-2">Photos</label>
    <div class="grid grid-cols-3 gap-3">
      {#each photos as photo}
        <button
          on:click={() => selectBackground(photo.id)}
          class="group relative rounded-lg overflow-hidden h-16 border-2 transition-colors {settings.appearance.background === photo.id ? 'border-indigo-500' : 'border-transparent hover:border-white/20'}"
        >
          <div
            class="absolute inset-0 bg-cover bg-center"
            style="background-image: url('/backgrounds/{photo.id}.jpg');"
          ></div>
          <span class="absolute bottom-1 left-2 text-xs text-white/70 drop-shadow">{photo.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div>
    <label class="block text-xs uppercase text-gray-400 mb-2">Overlay Opacity</label>
    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={settings.appearance.overlayOpacity}
      on:input={updateOpacity}
      class="w-full accent-indigo-500"
    />
    <div class="flex justify-between text-xs text-gray-400 mt-1">
      <span>Transparent</span>
      <span>Dark</span>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/settings/AppearanceSettings.svelte
git commit -m "feat: implement appearance settings with background gallery and opacity slider"
```

---

## Task 11: Labels Settings Section & Main App Labels

**Files:**
- Modify: `src/lib/components/settings/LabelsSettings.svelte`
- Create: `src/lib/components/Labels.svelte`
- Modify: `src/lib/components/Clock.svelte`

- [ ] **Step 1: Implement Labels settings UI**

Replace `src/lib/components/settings/LabelsSettings.svelte` with:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  let newName = "";
  let newEmoji = "🏷";

  function addLabel() {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (settings.labels.some((l) => l.id === id)) return;
    settings.labels = [
      ...settings.labels,
      { id, name: newName.trim(), emoji: newEmoji },
    ];
    newName = "";
    newEmoji = "🏷";
    save();
  }

  function removeLabel(id: string) {
    settings.labels = settings.labels.filter((l) => l.id !== id);
    save();
  }

  function updateLabelName(id: string, event: Event) {
    const name = (event.target as HTMLInputElement).value;
    settings.labels = settings.labels.map((l) =>
      l.id === id ? { ...l, name } : l
    );
    save();
  }

  function updateLabelEmoji(id: string, event: Event) {
    const emoji = (event.target as HTMLInputElement).value;
    settings.labels = settings.labels.map((l) =>
      l.id === id ? { ...l, emoji } : l
    );
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Labels</h2>
<p class="text-sm text-gray-400 mb-4">Activity labels you can optionally tag your timer sessions with.</p>

<div class="space-y-3 mb-6">
  {#each settings.labels as label (label.id)}
    <div class="flex items-center gap-2">
      <input
        type="text"
        value={label.emoji}
        on:change={(e) => updateLabelEmoji(label.id, e)}
        class="w-12 text-center bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500"
      />
      <input
        type="text"
        value={label.name}
        on:change={(e) => updateLabelName(label.id, e)}
        class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      />
      <button
        on:click={() => removeLabel(label.id)}
        class="p-2 text-gray-400 hover:text-red-400 transition-colors"
      >&times;</button>
    </div>
  {/each}
</div>

<div class="flex items-center gap-2">
  <input
    type="text"
    bind:value={newEmoji}
    class="w-12 text-center bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500"
    placeholder="🏷"
  />
  <input
    type="text"
    bind:value={newName}
    placeholder="New label name"
    class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
    on:keydown={(e) => e.key === "Enter" && addLabel()}
  />
  <button
    on:click={addLabel}
    class="px-3 py-2 text-sm bg-indigo-500/20 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
  >Add</button>
</div>
```

- [ ] **Step 2: Create Labels component for the main app**

Create `src/lib/components/Labels.svelte`:

```svelte
<script lang="ts">
  import type { LabelItem } from "$lib/types";

  export let labels: LabelItem[] = [];
  export let visible: boolean = false;

  let selectedId: string | null = null;

  function toggle(id: string) {
    selectedId = selectedId === id ? null : id;
  }
</script>

{#if visible && labels.length > 0}
  <div class="flex gap-1.5 flex-wrap justify-center pointer-events-auto">
    {#each labels as label (label.id)}
      <button
        on:click={() => toggle(label.id)}
        class="px-2.5 py-1 rounded-full text-xs transition-all duration-200
          {selectedId === label.id
            ? 'bg-indigo-500/30 border border-indigo-500/50 text-white'
            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white/80 hover:bg-white/10'}"
      >
        {label.emoji} {label.name}
      </button>
    {/each}
  </div>
{/if}
```

- [ ] **Step 3: Add Labels to Clock.svelte**

In `src/lib/components/Clock.svelte`, add the Labels component below the Timer:

Add import:

```typescript
  import Labels from "./Labels.svelte";
```

Add after the Timer component div:

```svelte
        <!-- Activity Labels -->
        <Labels labels={$settings.labels} visible={timerActive || remaining !== duration * 60} />
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/settings/LabelsSettings.svelte src/lib/components/Labels.svelte src/lib/components/Clock.svelte
git commit -m "feat: add activity labels with settings management and main app display"
```

---

## Task 12: Behavior Settings Section

**Files:**
- Modify: `src/lib/components/settings/BehaviorSettings.svelte`

- [ ] **Step 1: Implement Behavior settings UI**

Replace `src/lib/components/settings/BehaviorSettings.svelte` with:

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { AppSettings } from "$lib/types";

  export let settings: AppSettings;
  const dispatch = createEventDispatcher();

  function save() {
    dispatch("save");
  }

  function toggleStartup() {
    settings.behavior.launchOnStartup = !settings.behavior.launchOnStartup;
    save();
    // Note: actual login item registration requires Tauri plugin or native API
    // For now, this saves the preference. OS-level registration is a future enhancement.
  }

  function toggleAlwaysOnTop() {
    settings.behavior.alwaysOnTop = !settings.behavior.alwaysOnTop;
    save();
  }

  function toggleAllDesktops() {
    settings.behavior.visibleOnAllDesktops = !settings.behavior.visibleOnAllDesktops;
    save();
  }
</script>

<h2 class="text-lg font-semibold mb-6">Behavior</h2>

<div class="space-y-5">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Launch on startup</p>
      <p class="text-xs text-gray-400">Open clock-desktop when you log in</p>
    </div>
    <button
      on:click={toggleStartup}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.behavior.launchOnStartup ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.behavior.launchOnStartup ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Always on top</p>
      <p class="text-xs text-gray-400">Keep the clock above other windows</p>
    </div>
    <button
      on:click={toggleAlwaysOnTop}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.behavior.alwaysOnTop ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.behavior.alwaysOnTop ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm">Visible on all desktops</p>
      <p class="text-xs text-gray-400">Show on all macOS Spaces</p>
    </div>
    <button
      on:click={toggleAllDesktops}
      class="w-11 h-6 rounded-full transition-colors duration-200 {settings.behavior.visibleOnAllDesktops ? 'bg-indigo-500' : 'bg-white/10'}"
    >
      <div
        class="w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 {settings.behavior.visibleOnAllDesktops ? 'translate-x-5' : 'translate-x-0.5'}"
      ></div>
    </button>
  </div>
</div>

<p class="text-xs text-gray-500 mt-6">Note: "Launch on startup" preference is saved but OS-level registration is a future enhancement.</p>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/settings/BehaviorSettings.svelte
git commit -m "feat: implement behavior settings with toggle controls"
```

---

## Task 13: Integration & Final Verification

**Files:**
- Modify: `src/routes/+page.svelte` (ensure all layers are wired)
- Verify all components compile and render

- [ ] **Step 1: Verify the complete +page.svelte**

The final `src/routes/+page.svelte` should look like:

```svelte
<script>
  import Clock from "$lib/components/Clock.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import Background from "$lib/components/Background.svelte";
  import WeatherOverlay from "$lib/components/WeatherOverlay.svelte";
  import { settings, loadSettings } from "$lib/stores/settings";
  import { onMount } from "svelte";

  onMount(() => {
    loadSettings();
  });
</script>

<div
  data-tauri-drag-region
  class="h-screen w-screen flex items-center justify-center relative overflow-hidden"
>
  <!-- Layer 1: Background -->
  <Background backgroundId={$settings.appearance.background} />

  <!-- Layer 2: Weather Overlay -->
  <WeatherOverlay
    apiKey={$settings.weather.apiKey}
    location={$settings.weather.location}
    updateFrequencyMin={$settings.weather.updateFrequencyMin}
    enabled={$settings.weather.enabled}
  />

  <!-- Layer 3: Dark Overlay -->
  <div
    class="absolute inset-0"
    style="background-color: rgba(0, 0, 0, {$settings.appearance.overlayOpacity});"
  ></div>

  <!-- Layer 4: UI -->
  <div class="relative z-10 pointer-events-none">
    <Clock />
  </div>

  <!-- Settings button -->
  <div class="fixed top-2 right-2 z-20 pointer-events-auto text-white">
    <Settings />
  </div>
</div>
```

- [ ] **Step 2: Run the full app**

Run: `bun run tauri dev`

Verify:
1. App launches with Deep Sea gradient background
2. Dark overlay is visible at 50% opacity
3. Settings gear icon appears in top-right
4. Clicking gear opens Preferences window
5. All 6 settings sections are navigable
6. Changing background in Appearance immediately updates the clock widget
7. Changing overlay opacity works
8. Clock format toggle (24h/12h) works
9. Timer preset changes reflect in the main app
10. Sound picker plays preview sounds
11. Labels appear near timer when timer is active
12. Weather section shows API key prompt

- [ ] **Step 3: Build the production app**

Run: `bun run tauri build`
Expected: Build completes, `.app` and `.dmg` generated.

- [ ] **Step 4: Commit any final adjustments**

```bash
git add -A
git commit -m "feat: complete visual polish and settings integration"
```
