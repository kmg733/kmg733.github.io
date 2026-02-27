"use client";

import { useEffect, useRef } from "react";

interface ParticleConfig {
  size: number;
  /** initial position in % */
  x: number;
  y: number;
  /** sin/cos frequency multipliers for organic float */
  freqX: number;
  freqY: number;
  /** amplitude in px */
  ampX: number;
  ampY: number;
  /** phase offset so each particle moves differently */
  phase: number;
}

const PARTICLES: ParticleConfig[] = [
  // Original 7
  { size: 12, x: 10, y: 20, freqX: 0.3, freqY: 0.5, ampX: 12, ampY: 18, phase: 0 },
  { size: 16, x: 80, y: 15, freqX: 0.25, freqY: 0.35, ampX: 15, ampY: 10, phase: 1.2 },
  { size: 10, x: 25, y: 60, freqX: 0.4, freqY: 0.3, ampX: 8, ampY: 30, phase: 2.4 },
  { size: 20, x: 70, y: 50, freqX: 0.2, freqY: 0.4, ampX: 15, ampY: 12, phase: 0.8 },
  { size: 8, x: 50, y: 30, freqX: 0.35, freqY: 0.45, ampX: 18, ampY: 20, phase: 3.6 },
  { size: 14, x: 90, y: 70, freqX: 0.28, freqY: 0.38, ampX: 10, ampY: 15, phase: 1.6 },
  { size: 10, x: 35, y: 80, freqX: 0.45, freqY: 0.25, ampX: 12, ampY: 10, phase: 4.2 },
  // Added 8
  { size: 6, x: 5, y: 45, freqX: 0.38, freqY: 0.42, ampX: 10, ampY: 14, phase: 0.4 },
  { size: 18, x: 60, y: 8, freqX: 0.22, freqY: 0.32, ampX: 14, ampY: 20, phase: 5.0 },
  { size: 7, x: 45, y: 75, freqX: 0.42, freqY: 0.28, ampX: 16, ampY: 8, phase: 2.0 },
  { size: 22, x: 15, y: 90, freqX: 0.18, freqY: 0.36, ampX: 10, ampY: 22, phase: 3.2 },
  { size: 9, x: 95, y: 40, freqX: 0.36, freqY: 0.48, ampX: 8, ampY: 12, phase: 5.6 },
  { size: 11, x: 55, y: 55, freqX: 0.32, freqY: 0.26, ampX: 20, ampY: 16, phase: 1.0 },
  { size: 15, x: 40, y: 10, freqX: 0.26, freqY: 0.44, ampX: 12, ampY: 24, phase: 4.8 },
  { size: 8, x: 75, y: 85, freqX: 0.44, freqY: 0.3, ampX: 14, ampY: 10, phase: 5.8 },
];

const REPEL_RADIUS = 150;
const REPEL_STRENGTH = 60;
const LERP_FACTOR = 0.08;

export default function FloatingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const offsetsRef = useRef(PARTICLES.map(() => ({ x: 0, y: 0 })));
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let rafId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000; // seconds
      const container = containerRef.current;
      if (!container) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const rect = container.getBoundingClientRect();
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < PARTICLES.length; i++) {
        const p = PARTICLES[i];
        const t = elapsed + p.phase;

        // Base float offset (replaces CSS keyframes)
        let targetX = Math.sin(t * p.freqX) * p.ampX;
        let targetY = Math.cos(t * p.freqY) * p.ampY;

        // Particle center in viewport coords
        const px = rect.left + (p.x / 100) * rect.width + offsetsRef.current[i].x;
        const py = rect.top + (p.y / 100) * rect.height + offsetsRef.current[i].y;

        // Mouse repulsion
        const dx = px - mx;
        const dy = py - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          targetX += (dx / dist) * force;
          targetY += (dy / dist) * force;
        }

        // Lerp current toward target
        const prev = offsetsRef.current[i];
        const newX = prev.x + (targetX - prev.x) * LERP_FACTOR;
        const newY = prev.y + (targetY - prev.y) * LERP_FACTOR;

        offsetsRef.current[i] = { x: newX, y: newY };

        // Direct DOM manipulation — no React re-render
        const el = particleRefs.current[i];
        if (el) {
          el.style.transform = `translate(${newX}px, ${newY}px)`;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          ref={(el) => { particleRefs.current[i] = el; }}
          className="absolute rounded-full bg-amber-400/30 dark:bg-slate-400/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
