# Visual Polish & Settings — Design Spec

**Date:** 2026-04-09
**Scope:** Weather-driven animated overlays, background gallery, settings window, activity labels

---

## Overview

Extend the clock-desktop app with two complementary features:

1. **Visual Polish (C)** — Weather-aware animated overlays rendered on top of user-selected backgrounds, powered by real weather data from OpenWeatherMap.
2. **Settings & Personalization (D)** — A separate macOS preferences window with sidebar navigation, covering weather, clock, timer, appearance, labels, and behavior settings.

---

## Layered Visual Architecture

The app's visual system is composed of four independent layers, rendered bottom to top:

| Layer | Name | Description | Implementation |
|-------|------|-------------|----------------|
| 1 | **Background** | User-selected photo or gradient from the curated gallery | CSS `background-image` |
| 2 | **Weather Overlay** | Transparent animated weather effects based on real weather data | Canvas or CSS animations |
| 3 | **Dark Overlay** | Semi-transparent dark layer ensuring text readability | CSS (already exists, opacity becomes configurable) |
| 4 | **UI** | Clock, date, timer, calendar, labels | Svelte components (existing) |

The background and weather are fully independent — any background works with any weather condition.

---

## Weather Overlay System

### Data Source

- **API:** OpenWeatherMap free tier (Current Weather API)
- **Rate limit:** 60 calls/min (free), app uses ~48/day (every 30 min)
- **Location:** Auto-detect via IP geolocation on first launch, with manual city override in settings
- **Refresh interval:** Every 30 minutes
- **Data consumed:** Weather condition code, temperature (future use), sunrise/sunset times
- **API key:** User provides their own free OpenWeatherMap API key in Settings > Weather (free tier signup takes 30 seconds). Weather overlay is disabled until a key is configured, with a friendly prompt in settings.

### Weather Conditions

Each condition maps to a transparent overlay animation:

| Condition | API Codes | Overlay Effect |
|-----------|-----------|----------------|
| **Clear** | 800 | Radiating sun rays, warm light wash, subtle lens flare |
| **Cloudy** | 801-804 | Semi-transparent clouds drifting across the screen |
| **Rain** | 300-321, 500-531 | Falling raindrops with subtle ripple effects |
| **Thunderstorm** | 200-232 | Heavy rain + periodic lightning flash across screen |
| **Snow** | 600-622 | Falling snowflakes of varying sizes, cold blue tint |
| **Fog/Mist** | 701-771 | Hazy semi-transparent layers drifting horizontally |

### Night Modifier

After sunset (using sunrise/sunset from API response), a night overlay is added on top of any weather condition:
- Star field with subtle twinkle
- Moon glow effect
- Slightly cooler/darker color temperature

### Animation Behavior

- **On launch:** Rich, immersive animation plays for ~5 seconds
- **After settling:** Animation stops completely (static frame) to conserve CPU
- **On weather change:** Brief animation plays when weather data updates with a new condition, then settles again

### Implementation Approach

Each weather condition is a standalone Svelte component (`WeatherClear.svelte`, `WeatherRain.svelte`, etc.) that:
- Renders on a `<canvas>` element (or CSS animations for simpler effects like fog)
- Accepts an `animate` prop: when `true`, runs the full animation; when `false`, renders a static final frame
- Is positioned absolutely to fill the window
- Uses `pointer-events: none` so it doesn't interfere with UI interaction

A parent `WeatherOverlay.svelte` component:
- Fetches weather data on mount and every 30 minutes
- Maps the API condition code to the appropriate weather component
- Manages the animate → settle lifecycle (5-second timer)
- Adds the night modifier when current time is after sunset

---

## Background Gallery

### Curated Backgrounds

Shipped with the app in `static/backgrounds/`. Two categories:

**Photos (~6):**
- Forest
- Ocean
- Mountain
- City Night
- Desert
- Space

**Gradients (~6):**
- Sunset (warm oranges)
- Deep Sea (dark teals)
- Emerald (greens)
- Lavender (purples)
- Midnight (near-black)
- Peach (soft warm)

Photos should be optimized for the small window size (no need for 4K images). Target ~200-400KB each, JPEG format. Gradients are defined in CSS (no file needed).

### Selection

- User picks a background in Settings > Appearance
- Selection is persisted in the settings JSON file
- Default: the current Unsplash image behavior is replaced with a curated default (e.g., "Deep Sea" gradient)

---

## Settings Window

### Architecture

- Opens as a **separate Tauri window** via `new Window()` / `new Webview()` API
- Accessible from the settings gear icon on the main clock widget
- Route: `/settings` (already exists as a placeholder)
- Window size: ~600x450px, not resizable, not always-on-top
- Standard macOS window decorations

### Layout

Sidebar navigation on the left, content panel on the right. Six sections:

### 1. Weather

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Location | Text + auto-detect button | Auto-detect (IP) | City name or coordinates |
| Update frequency | Select | 30 min | Options: 15 / 30 / 60 min |
| Weather animations | Toggle | On | Enable/disable weather overlay entirely |
| API key | Text (required for weather) | None | User's free OpenWeatherMap key, with signup link |

### 2. Clock

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Time format | Toggle | 24h | 12-hour or 24-hour |
| Show seconds | Toggle | Off | Display seconds in the main clock |
| Date locale | Select | en-US | Language for date display |

### 3. Timer

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Default duration | Number input | 30 min | Default timer length |
| Presets | Editable list | Current presets | Add/remove/reorder preset durations |
| Start sound | Sound picker | ticking.mp3 | Select from bundled sounds with preview button |
| Finish sound | Sound picker | notification.mp3 | Select from bundled sounds with preview button |

### 4. Appearance

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Background | Gallery picker | Deep Sea gradient | Thumbnail grid of photos + gradients |
| Overlay opacity | Slider | 50% | Dark overlay transparency (0-100%) |

### 5. Labels

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Activity labels | Editable list | Working, Studying, Reading, Leisure | Add/remove/rename labels with emoji picker |

Default labels ship with emojis: Working, Studying, Reading, Leisure. User can fully customize.

### 6. Behavior

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Launch on startup | Toggle | Off | Register/unregister login item |
| Always on top | Toggle | On | Window stays above all others |
| Visible on all desktops | Toggle | On | Show on all macOS Spaces |

---

## Activity Labels in Main App

### Behavior

- Labels appear as a row of small pills near the timer controls
- **Zero friction:** Timer starts normally without requiring a label
- Tapping a label tags the current (or most recent) timer session
- Selected label is visually highlighted (filled background)
- Tapping again deselects
- Labels are only shown when a timer is active or was recently completed

### Data Model

Labels are stored in the settings JSON:

```json
{
  "labels": [
    { "id": "work", "name": "Working", "emoji": "briefcase" },
    { "id": "study", "name": "Studying", "emoji": "books" },
    { "id": "read", "name": "Reading", "emoji": "open_book" },
    { "id": "leisure", "name": "Leisure", "emoji": "video_game" }
  ]
}
```

Timer sessions are not persisted yet (that's the future Stats feature). For now, labels are purely visual — they tag the current session in memory only.

---

## Settings Storage

### Approach

- JSON file in Tauri's `app_data_dir` (e.g., `~/Library/Application Support/clock-desktop/settings.json`)
- Read on app launch, written on any settings change
- All settings have sensible defaults — the app works with no config file

### Schema

```json
{
  "weather": {
    "location": "auto",
    "locationName": null,
    "updateFrequencyMin": 30,
    "enabled": true,
    "apiKey": null
  },
  "clock": {
    "format24h": true,
    "showSeconds": false,
    "dateLocale": "en-US"
  },
  "timer": {
    "defaultDurationMin": 30,
    "presets": [5, 10, 15, 20, 25, 30, 45, 55, 60, 80],
    "startSound": "ticking.mp3",
    "finishSound": "notification.mp3"
  },
  "appearance": {
    "background": "gradient-deep-sea",
    "overlayOpacity": 0.5
  },
  "labels": [
    { "id": "work", "name": "Working", "emoji": "briefcase" },
    { "id": "study", "name": "Studying", "emoji": "books" },
    { "id": "read", "name": "Reading", "emoji": "open_book" },
    { "id": "leisure", "name": "Leisure", "emoji": "video_game" }
  ],
  "behavior": {
    "launchOnStartup": false,
    "alwaysOnTop": true,
    "visibleOnAllDesktops": true
  }
}
```

### Rust Backend

A small Rust module to handle reading/writing the settings JSON:
- `get_settings` command — reads and returns settings, creating defaults if no file exists
- `save_settings` command — writes settings to disk
- Both exposed as Tauri commands invokable from the Svelte frontend

---

## New Files and Components

### Svelte Components (src/lib/components/)

| Component | Purpose |
|-----------|---------|
| `WeatherOverlay.svelte` | Parent: fetches weather, selects condition component, manages animation lifecycle |
| `weather/Clear.svelte` | Clear sky overlay (sun rays, warm light) |
| `weather/Cloudy.svelte` | Cloud overlay (drifting clouds) |
| `weather/Rain.svelte` | Rain overlay (falling drops, ripples) |
| `weather/Thunderstorm.svelte` | Thunderstorm overlay (rain + lightning) |
| `weather/Snow.svelte` | Snow overlay (falling snowflakes) |
| `weather/Fog.svelte` | Fog overlay (drifting haze layers) |
| `weather/Night.svelte` | Night modifier (stars, moon glow) |
| `Background.svelte` | Renders the selected background (photo or gradient) |
| `Labels.svelte` | Activity label pill row for the timer |
| `settings/SettingsLayout.svelte` | Sidebar + content panel layout for settings window |
| `settings/WeatherSettings.svelte` | Weather settings section |
| `settings/ClockSettings.svelte` | Clock settings section |
| `settings/TimerSettings.svelte` | Timer settings section |
| `settings/AppearanceSettings.svelte` | Background gallery + opacity slider |
| `settings/LabelsSettings.svelte` | Label management (add/remove/rename) |
| `settings/BehaviorSettings.svelte` | Startup, always-on-top, all-desktops toggles |

### Rust (src-tauri/src/)

| File | Purpose |
|------|---------|
| `settings.rs` | Settings struct, read/write JSON, Tauri commands |

### Static Assets

| Path | Purpose |
|------|---------|
| `static/backgrounds/*.jpg` | 6 curated background photos |

---

## Out of Scope

- Session history / stats tracking (future feature B)
- Multiple concurrent timers (future feature F)
- System tray / menu bar integration (future feature E)
- Custom background upload (can add later)
- Analog clock mode
- Progress ring around timer
