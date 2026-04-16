<script lang="ts">
  export let backgroundId: string = 'gradient-deep-sea';

  const gradients: Record<string, string> = {
    'gradient-sunset': 'linear-gradient(135deg, #ff6b35, #f7c59f)',
    'gradient-deep-sea': 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    'gradient-emerald': 'linear-gradient(135deg, #11998e, #38ef7d)',
    'gradient-lavender': 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    'gradient-midnight': 'linear-gradient(135deg, #0c0c0c, #1a1a1a)',
    'gradient-peach': 'linear-gradient(135deg, #ffecd2, #fcb69f)',
  };

  const photos: string[] = [
    'forest', 'ocean', 'mountain', 'city-night', 'desert', 'space',
  ];

  $: isNone = backgroundId === 'none';
  $: isGradient = backgroundId.startsWith('gradient-');
  $: style = isNone
    ? 'background: transparent;'
    : isGradient
      ? `background: ${gradients[backgroundId] || gradients['gradient-deep-sea']};`
      : `background-image: url('/backgrounds/${backgroundId}.jpg'); background-size: cover; background-position: center;`;
</script>

<div class="absolute inset-0 pointer-events-none" {style}></div>
