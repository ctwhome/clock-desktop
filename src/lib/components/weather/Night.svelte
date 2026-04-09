<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let stars: Array<{ x: number; y: number; radius: number; baseOpacity: number; phase: number }> = [];
  let frame = 0;

  function initStars() {
    stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        radius: 0.5 + Math.random() * 1.5,
        baseOpacity: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(10, 15, 40, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const mx = canvas.width * 0.85;
    const my = canvas.height * 0.12;
    const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
    moonGlow.addColorStop(0, "rgba(200, 210, 255, 0.15)");
    moonGlow.addColorStop(1, "rgba(200, 210, 255, 0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(mx, my, 12, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220, 230, 255, 0.6)";
    ctx.fill();

    for (const star of stars) {
      const twinkle = animate
        ? star.baseOpacity + Math.sin(frame * 0.02 + star.phase) * 0.15
        : star.baseOpacity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, twinkle)})`;
      ctx.fill();
    }
  }

  function loop() {
    if (!animate) return;
    frame++;
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
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
