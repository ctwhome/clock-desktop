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
