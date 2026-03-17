'use client';

import { useEffect, useRef } from 'react';

export default function MatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const FONT_SIZE = 13;
    // Slower on mobile — scale speed to viewport height
    const BASE_SPEED = typeof window !== 'undefined' && window.innerWidth < 768 ? 0.18 : 0.35;

    let cols: number;
    let drops: number[];
    let speeds: number[];
    let animId: number;
    let lastFrame = 0;
    // Throttle to ~30fps so mobile doesn't burn battery or look frantic
    const FRAME_MS = typeof window !== 'undefined' && window.innerWidth < 768 ? 50 : 33;

    function init() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.floor(canvas.width / FONT_SIZE);
      drops = Array.from({ length: cols }, () => Math.random() * -100);
      // Each column gets a slightly randomised speed for organic feel
      speeds = Array.from({ length: cols }, () => BASE_SPEED * (0.6 + Math.random() * 0.8));
    }

    function draw(ts: number) {
      animId = requestAnimationFrame(draw);
      if (ts - lastFrame < FRAME_MS) return;
      lastFrame = ts;

      if (!canvas || !ctx) return;

      // Fade trail
      ctx.fillStyle = 'rgba(13, 17, 23, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px 'JetBrains Mono', 'Courier New', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * FONT_SIZE;
        if (y < 0) { drops[i] += speeds[i]; continue; }

        // Head — bright white
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * FONT_SIZE, y);

        // Trailing indigo chars
        const fadeSteps = 8;
        for (let f = 1; f <= fadeSteps; f++) {
          const fy = y - f * FONT_SIZE;
          if (fy < 0) continue;
          const alpha = ((fadeSteps - f) / fadeSteps) * 0.7;
          ctx.fillStyle = `rgba(99, 102, 241, ${alpha.toFixed(2)})`;
          ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * FONT_SIZE, fy);
        }

        // Reset drop when it exits bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speeds[i];
      }
    }

    init();
    animId = requestAnimationFrame(draw);

    const onResize = () => { init(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.18, zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
