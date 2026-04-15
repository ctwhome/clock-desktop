import { writable } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
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
  eyeCare: {
    enabled: false,
    intervalMinutes: 25,
    restDurationSeconds: 20,
    playSound: true,
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

  // Listen for settings changes from other windows
  await listen<AppSettings>('settings-changed', (event) => {
    settings.set(event.payload);
  });
}

export async function saveSettings(updated: AppSettings): Promise<void> {
  settings.set(updated);
  await invoke('save_settings', { settings: updated });
  // Notify all windows (including this one's siblings)
  await emit('settings-changed', updated);
}
