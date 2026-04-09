<script lang="ts">
  export let animate: boolean = true;
</script>

<div class="absolute inset-0 pointer-events-none overflow-hidden">
  <div class="fog-layer fog-1" class:fog-animate={animate}></div>
  <div class="fog-layer fog-2" class:fog-animate={animate}></div>
</div>

<style>
  .fog-layer {
    position: absolute;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(200, 200, 210, 0.08) 20%,
      rgba(200, 200, 210, 0.12) 50%,
      rgba(200, 200, 210, 0.08) 80%,
      transparent 100%
    );
  }
  .fog-1 { top: 10%; left: -50%; }
  .fog-2 { top: 40%; left: -80%; opacity: 0.7; }
  .fog-animate.fog-1 { animation: drift 20s linear infinite; }
  .fog-animate.fog-2 { animation: drift 28s linear infinite reverse; }
  @keyframes drift {
    from { transform: translateX(0); }
    to { transform: translateX(50%); }
  }
</style>
