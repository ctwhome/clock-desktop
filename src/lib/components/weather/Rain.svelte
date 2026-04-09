<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let animate: boolean = true;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let drops: Array<{ x: number; y: number; speed: number; length: number; opacity: number }> = [];

  function initDrops() {
    drops = [];
    const count = 150;
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 4 + Math.random() * 6,
        length: 10 + Math.random() * 20,
        opacity: 0.1 + Math.random() * 0.3,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const drop of drops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + 1, drop.y + drop.length);
      ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function update() {
    for (const drop of drops) {
      drop.y += drop.speed;
      if (drop.y > canvas.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * canvas.width;
      }
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

  $: if (canvas && ctx) {
    if (animate) {
      loop();
    } else {
      if (animationId) cancelAnimationFrame(animationId);
      draw();
    }
  }
</script>

<canvas bind:this={canvas} class="absolute inset-0 pointer-events-none"></canvas>
