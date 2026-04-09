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
