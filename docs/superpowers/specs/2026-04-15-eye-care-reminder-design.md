# Eye Care Reminder — Design Spec

## Overview

A standalone, always-on recurring reminder system that encourages micro-rests for eye health. Independent from the existing Pomodoro timer — runs in the background regardless of timer state.

## User Flow

1. User enables "Eye Care" in settings (off by default)
2. A 25-minute countdown runs silently in the background
3. When it hits zero, the widget transforms into a full overlay: eye icon, "Rest your eyes" message, and a 20-second guided countdown
4. The subtitle reads "Look at something 20ft away"
5. When the 20 seconds finish, a soft sound plays (if enabled), the overlay fades out, and the 25-minute cycle restarts
6. User can click the overlay to dismiss early — the cycle restarts immediately

## Visual Design — Calm Ocean

The overlay covers the entire widget (365x170px) with a fade-in/fade-out animation (0.5s).

- **Background:** `linear-gradient(135deg, #0f2027, #203a43, #2c5364)`
- **Glow:** Radial gradient centered on the icon — `rgba(168, 230, 207, 0.08)` fading to transparent
- **Icon:** `👁️‍🗨️` at 2rem with `drop-shadow(0 0 8px rgba(168, 230, 207, 0.4))`
- **Title:** "Rest your eyes" in `#a8e6cf`, 1rem, weight 600, letter-spacing 0.5px
- **Countdown:** `#ffd93d`, 1.8rem, weight 700, monospace font
- **Subtitle:** "Look at something 20ft away" in `rgba(255, 255, 255, 0.4)`, 0.65rem

Layout: Flexbox column, centered vertically and horizontally, gap 6px.

## New Component: `EyeCare.svelte`

**Location:** `src/lib/components/EyeCare.svelte`

**Responsibilities:**
- Manages a background interval timer (resets on dismiss or rest completion)
- Renders a full-screen overlay (z-30, above all other layers) when the interval fires
- Runs a `requestAnimationFrame`-based countdown for the rest duration (consistent with existing Timer.svelte approach)
- Plays sound via HTML5 `Audio` API when rest starts and ends (using existing `/sounds/notification.mp3`)
- Reads `eyeCare` settings from the shared settings store
- Only active when `eyeCare.enabled` is true
- Click anywhere on overlay to dismiss early and restart the cycle

**Lifecycle:**
- On mount: if enabled, start the background interval
- On settings change: restart/stop interval as needed
- On unmount: clear all intervals and animation frames

## Settings Section: Eye Care

**New component:** `src/lib/components/settings/EyeCareSettings.svelte`

Added to the settings sidebar alongside existing sections (Weather, Clock, Timer, Appearance, Labels, Behavior). Uses an eye/health-related icon.

**Controls:**
| Control | Type | Default | Range |
|---------|------|---------|-------|
| Enable Eye Care | Toggle | `false` | — |
| Reminder interval | Slider | `25` min | 10–60 min |
| Rest duration | Slider | `20` sec | 10–60 sec |
| Play sound | Toggle | `true` | — |

Slider labels should show the current value (e.g., "25 min", "20 sec").

## Type Definitions

### `types.ts`

Add to `AppSettings`:

```typescript
interface EyeCareSettings {
  enabled: boolean;
  intervalMinutes: number;
  restDurationSeconds: number;
  playSound: boolean;
}
```

Add `eyeCare: EyeCareSettings` to `AppSettings`.

## Settings Store

### `stores/settings.ts`

Add defaults:

```typescript
eyeCare: {
  enabled: false,
  intervalMinutes: 25,
  restDurationSeconds: 20,
  playSound: true
}
```

## Rust Backend

### `src-tauri/src/settings.rs`

Add `eye_care: EyeCareSettings` to the `AppSettings` struct. Use `#[serde(default)]` so existing settings files without this field load without error.

```rust
#[derive(Serialize, Deserialize, Clone, Debug)]
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

## Files Changed

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `EyeCareSettings` interface, add to `AppSettings` |
| `src/lib/stores/settings.ts` | Add `eyeCare` defaults |
| `src/lib/components/EyeCare.svelte` | **New** — overlay + countdown logic |
| `src/lib/components/settings/EyeCareSettings.svelte` | **New** — settings UI |
| `src/lib/components/settings/SettingsLayout.svelte` | Add "Eye Care" to sidebar nav |
| `src/routes/settings/+page.svelte` | Wire up `EyeCareSettings` component |
| `src/routes/+page.svelte` | Mount `EyeCare` component |
| `src-tauri/src/settings.rs` | Add `EyeCareSettings` struct and field |

## Out of Scope

- Statistics/tracking of rest sessions
- Multiple reminder profiles
- Custom overlay themes (uses fixed Calm Ocean style)
- Integration with the Pomodoro timer
