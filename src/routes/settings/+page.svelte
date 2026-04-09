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
