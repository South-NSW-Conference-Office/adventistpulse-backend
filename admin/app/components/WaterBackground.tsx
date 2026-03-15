"use client";

import { useRef, useEffect } from "react";

export default function WaterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // Half resolution — CSS scales it 2x; keeps the sim fast enough for 60fps
    let W = Math.floor(window.innerWidth  / 2);
    let H = Math.floor(window.innerHeight / 2);
    canvas.width  = W;
    canvas.height = H;

    let cur  = new Float32Array(W * H);
    let prev = new Float32Array(W * H);
    let animId: number;

    /* ── Source texture ──────────────────────────────────────────────────
       Looks like a plain light-gray background to the naked eye.
       The overlapping sine waves give each pixel a unique value so that
       even a 1-pixel refraction shift creates a visible ripple.          */
    const buildSrc = (w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          // Very low frequency waves — period >> screen size, so no repeating
          // crisscross is visible. Looks like a plain smooth gradient at rest
          // but provides enough gradient for refraction to show clear ripples.
          const v = 239
            + Math.sin(x * 0.007 + y * 0.004) * 13
            + Math.cos(x * 0.005 - y * 0.008) * 9;
          const c = Math.min(255, Math.max(210, Math.round(v)));
          data[i] = c; data[i+1] = c; data[i+2] = c; data[i+3] = 255;
        }
      }
      return data;
    };

    let src     = buildSrc(W, H);
    let outData = ctx.createImageData(W, H);
    const out   = outData.data;

    /* ── Disturb water under the cursor ─────────────────────────────── */
    const disturb = (mx: number, my: number) => {
      const cx = Math.floor(mx / 2);
      const cy = Math.floor(my / 2);
      const r  = 14;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const d2 = dx * dx + dy * dy;
          if (d2 <= r * r) {
            const nx = cx + dx, ny = cy + dy;
            if (nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1) {
              cur[ny * W + nx] += (1 - Math.sqrt(d2) / r) * 200;
            }
          }
        }
      }
    };

    /* ── Animation loop ─────────────────────────────────────────────── */
    const step = () => {
      // Propagate ripples
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          cur[i] = (prev[i-1] + prev[i+1] + prev[i-W] + prev[i+W]) / 2 - cur[i];
          cur[i] *= 0.969;   // damping — ripples fade naturally
        }
      }

      // Refract source texture
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i  = y * W + x;
          const dx = Math.round((cur[i-1] - cur[i+1]) * 0.8);
          const dy = Math.round((cur[i-W] - cur[i+W]) * 0.8);
          const sx = Math.min(W-1, Math.max(0, x + dx));
          const sy = Math.min(H-1, Math.max(0, y + dy));
          const si = (sy * W + sx) * 4;
          const di = i * 4;
          out[di]   = src[si];
          out[di+1] = src[si+1];
          out[di+2] = src[si+2];
          out[di+3] = 255;
        }
      }
      ctx.putImageData(outData, 0, 0);

      // Swap buffers
      const tmp = prev; prev = cur; cur = tmp;
      animId = requestAnimationFrame(step);
    };

    const onMove = (e: MouseEvent) => disturb(e.clientX, e.clientY);

    const onResize = () => {
      cancelAnimationFrame(animId);
      W = Math.floor(window.innerWidth  / 2);
      H = Math.floor(window.innerHeight / 2);
      canvas.width  = W;
      canvas.height = H;
      cur     = new Float32Array(W * H);
      prev    = new Float32Array(W * H);
      src     = buildSrc(W, H);
      outData = ctx.createImageData(W, H);
      animId  = requestAnimationFrame(step);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize",    onResize);
    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize",    onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position : "fixed",
        top      : 0,
        left     : 0,
        width    : "100vw",
        height   : "100vh",
        zIndex   : 0,
        pointerEvents: "none",
      }}
    />
  );
}
