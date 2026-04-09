<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let rayAngle = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width * 0.8;
    const cy = canvas.height * 0.15;
    const rayCount = 12;
    const maxRadius = Math.max(canvas.width, canvas.height) * 0.8;

    // Sun glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
    glow.addColorStop(0, "rgba(255, 220, 100, 0.3)");
    glow.addColorStop(1, "rgba(255, 220, 100, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rays
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + rayAngle;
      const spread = 0.08;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle - spread) * maxRadius, cy + Math.sin(angle - spread) * maxRadius);
      ctx.lineTo(cx + Math.cos(angle + spread) * maxRadius, cy + Math.sin(angle + spread) * maxRadius);
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 230, 130, 0.04)";
      ctx.fill();
    }

    // Warm wash
    const wash = ctx.createLinearGradient(0, 0, 0, canvas.height);
    wash.addColorStop(0, "rgba(255, 200, 50, 0.05)");
    wash.addColorStop(1, "rgba(255, 150, 50, 0.02)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function loop() {
    if (!animate) return;
    rayAngle += 0.002;
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
