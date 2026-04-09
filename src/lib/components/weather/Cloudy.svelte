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
    const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
    gradient.addColorStop(0, `rgba(200, 210, 220, ${cloud.opacity})`);
    gradient.addColorStop(1, "rgba(200, 210, 220, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.radius * 1.5, cloud.radius, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const cloud of clouds) drawCloud(cloud);
  }

  function update() {
    for (const cloud of clouds) {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.radius * 1.5 > canvas.width) cloud.x = -cloud.radius * 1.5;
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
