<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let drops: Array<{ x: number; y: number; speed: number; length: number; opacity: number }> = [];
  let flashOpacity = 0;
  let nextFlash = 0;
  let frame = 0;

  function initDrops() {
    drops = [];
    for (let i = 0; i < 250; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 6 + Math.random() * 10,
        length: 15 + Math.random() * 25,
        opacity: 0.15 + Math.random() * 0.35,
      });
    }
    nextFlash = 120 + Math.random() * 300;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (flashOpacity > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    for (const drop of drops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + 2, drop.y + drop.length);
      ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function update() {
    frame++;
    for (const drop of drops) {
      drop.y += drop.speed;
      if (drop.y > canvas.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * canvas.width;
      }
    }
    if (frame >= nextFlash) {
      flashOpacity = 0.6;
      nextFlash = frame + 180 + Math.random() * 400;
    }
    if (flashOpacity > 0) {
      flashOpacity -= 0.05;
      if (flashOpacity < 0) flashOpacity = 0;
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
    initDrops();
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
