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

  export let location: string = "auto";
  export let updateFrequencyMin: number = 30;
  export let enabled: boolean = true;
  export let temperature: number | null = null;

  let weather: WeatherData | null = null;
  let animate = true;
  let mounted = false;
  let settleTimeout: ReturnType<typeof setTimeout>;
  let fetchInterval: ReturnType<typeof setInterval>;

  // WMO Weather interpretation codes → condition
  function mapWmoCode(code: number): WeatherData["condition"] {
    if (code <= 1) return "clear";
    if (code <= 3) return "cloudy";
    if (code === 45 || code === 48) return "fog";
    if (code >= 51 && code <= 67) return "rain";
    if (code >= 71 && code <= 77) return "snow";
    if (code >= 80 && code <= 82) return "rain";
    if (code >= 85 && code <= 86) return "snow";
    if (code >= 95) return "thunderstorm";
    return "cloudy";
  }

  async function getCoordinates(): Promise<{ latitude: number; longitude: number }> {
    if (location !== "auto") {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
      );
      const data = await res.json();
      if (!data.results?.length) throw new Error(`Location not found: ${location}`);
      return { latitude: data.results[0].latitude, longitude: data.results[0].longitude };
    }
    const res = await fetch("https://ipapi.co/json/");
    const geo = await res.json();
    return { latitude: geo.latitude, longitude: geo.longitude };
  }

  async function fetchWeather() {
    try {
      const { latitude, longitude } = await getCoordinates();

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto`
      );
      const data = await res.json();

      const sunriseUnix = Math.floor(new Date(data.daily.sunrise[0]).getTime() / 1000);
      const sunsetUnix = Math.floor(new Date(data.daily.sunset[0]).getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);

      weather = {
        conditionCode: data.current.weather_code,
        condition: mapWmoCode(data.current.weather_code),
        temperature: data.current.temperature_2m,
        sunrise: sunriseUnix,
        sunset: sunsetUnix,
        isNight: now < sunriseUnix || now > sunsetUnix,
      };
      temperature = weather.temperature;

      animate = true;
      clearTimeout(settleTimeout);
      settleTimeout = setTimeout(() => {
        animate = false;
      }, 5000);
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    }
  }

  function startPolling() {
    if (!mounted) return;

    clearInterval(fetchInterval);
    clearTimeout(settleTimeout);

    if (!enabled) {
      weather = null;
      return;
    }

    settleTimeout = setTimeout(() => {
      animate = false;
    }, 5000);

    fetchWeather();
    fetchInterval = setInterval(fetchWeather, updateFrequencyMin * 60 * 1000);
  }

  // Re-run when enabled, location, or frequency changes
  $: enabled, location, updateFrequencyMin, startPolling();

  onMount(() => {
    mounted = true;
    startPolling();
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
