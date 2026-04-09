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
