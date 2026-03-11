"use client";

import { useEffect, useRef } from "react";

interface FloatingParticlesProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulsePhase: number;
  pulseSpeed: number;
}

const PARTICLE_COUNT = 70;
const CONNECTION_DISTANCE = 120;
const MOUSE_REPULSION_RADIUS = 150;
const MOUSE_REPULSION_FORCE = 0.3;
const MOUSE_CONNECTION_DISTANCE = 150;
const VELOCITY_DAMPING = 0.998;
const VELOCITY_MIN = 0.3;
const VELOCITY_MAX = 0.5;

function createParticle(width: number, height: number): Particle {
  const speed = VELOCITY_MIN + Math.random() * (VELOCITY_MAX - VELOCITY_MIN);
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 0.5 + Math.random() * 2,
    opacity: 0.1 + Math.random() * 0.4,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.5 + Math.random() * 1.5,
  };
}

export default function FloatingParticles({ className }: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    const mouse = { x: -9999, y: -9999 };
    let rafId: number;
    let isRunning = true;
    let time = 0;

    // ── 캔버스 크기 설정 ──────────────────────────────────────────
    function resize() {
      const rect = canvas!.parentElement?.getBoundingClientRect();
      if (!rect) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      ctx!.scale(dpr, dpr);
    }

    // ── 파티클 초기화 ─────────────────────────────────────────────
    function initParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(width, height)
      );
    }

    // ── 색상 결정 (rAF 루프 내에서 다크모드 체크) ──────────────────
    function getColors(): { particle: string; line: string } {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) {
        return {
          particle: "148, 163, 184", // slate-400
          line: "148, 163, 184",
        };
      }
      return {
        particle: "245, 158, 11", // amber-400
        line: "245, 158, 11",
      };
    }

    // ── reduced-motion 정적 렌더 ───────────────────────────────────
    function renderStatic() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const { particle: pc, line: lc } = getColors();

      // 파티클만 찍고, 연결선도 그린다 (이동 없음)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 연결선
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const lineOpacity = (1 - dist / CONNECTION_DISTANCE) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${lc}, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // 파티클
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pc}, ${p.opacity})`;
        ctx.fill();
      }
    }

    // ── 메인 rAF 루프 ─────────────────────────────────────────────
    function tick() {
      if (!isRunning || !ctx) return;

      time += 0.016; // ~60fps 기준 delta
      ctx.clearRect(0, 0, width, height);

      const { particle: pc, line: lc } = getColors();

      // 파티클 이동 업데이트
      for (const p of particles) {
        // 마우스 repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_REPULSION_RADIUS && dist > 0) {
          const force =
            ((MOUSE_REPULSION_RADIUS - dist) / MOUSE_REPULSION_RADIUS) *
            MOUSE_REPULSION_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // 감쇠
        p.vx *= VELOCITY_DAMPING;
        p.vy *= VELOCITY_DAMPING;

        // 이동
        p.x += p.vx;
        p.y += p.vy;

        // 경계 wrap-around
        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;
      }

      // 파티클 간 연결선
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            const lineOpacity = (1 - dist / CONNECTION_DISTANCE) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${lc}, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // 마우스까지의 연결선
      if (mouse.x > -9000) {
        for (const p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_CONNECTION_DISTANCE) {
            const lineOpacity = (1 - dist / MOUSE_CONNECTION_DISTANCE) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${lc}, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // 파티클 렌더
      for (const p of particles) {
        const pulse =
          Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.15 + 0.85;
        const finalOpacity = p.opacity * pulse;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pc}, ${finalOpacity})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    }

    // ── 이벤트 핸들러 ─────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(rafId);
      } else {
        isRunning = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    const onResize = () => {
      // ctx.scale이 누적되지 않도록 리셋
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resize();
      ctx.scale(dpr, dpr);
    };

    // ── 초기화 및 시작 ────────────────────────────────────────────
    resize();
    initParticles();

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    canvas.addEventListener("mouseleave", onMouseLeave, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (prefersReducedMotion.matches) {
      renderStatic();
    } else {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none${className ? ` ${className}` : ""}`}
    />
  );
}
