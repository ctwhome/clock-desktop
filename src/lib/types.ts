export interface WeatherSettings {
  location: string;
  locationName: string | null;
  updateFrequencyMin: number;
  enabled: boolean;
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

export interface EyeCareSettings {
  enabled: boolean;
  intervalMinutes: number;
  restDurationSeconds: number;
  playSound: boolean;
}

export interface AppSettings {
  weather: WeatherSettings;
  clock: ClockSettings;
  timer: TimerSettings;
  appearance: AppearanceSettings;
  labels: LabelItem[];
  behavior: BehaviorSettings;
  eyeCare: EyeCareSettings;
}

export interface WeatherData {
  conditionCode: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'thunderstorm' | 'snow' | 'fog';
  temperature: number;
  sunrise: number;
  sunset: number;
  isNight: boolean;
}
