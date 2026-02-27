"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

/* ─── Types ─── */

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface BounceRipple {
  id: number;
  x: number;
  y: number;
  delay: number;
}

/* ─── Constants ─── */

const MAX_SAFETY = 20; // defensive cap — should never hit this
const OUTERMOST_RADIUS = 60;

const RINGS = [
  { delay: "0s", size: 80, duration: 0.6 },
  { delay: "0.1s", size: 120, duration: 0.7 },
];

const BOUNCE_SELECTORS =
  "header, footer, pre, figure, img, button, [role='button'], .code-block-wrapper, .toc-nav, .category-tree-nav, .glossary-section";

/* ─── Bounce detection (pure function, no state) ─── */

function detectBouncePoints(
  cx: number,
  cy: number,
): Omit<BounceRipple, "id">[] {
  const els = document.querySelectorAll(BOUNCE_SELECTORS);
  const points: Omit<BounceRipple, "id">[] = [];

  for (let i = 0; i < els.length; i++) {
    const rect = els[i].getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) continue;
    if (
      cx >= rect.left &&
      cx <= rect.right &&
      cy >= rect.top &&
      cy <= rect.bottom
    )
      continue;

    const nx = Math.max(rect.left, Math.min(cx, rect.right));
    const ny = Math.max(rect.top, Math.min(cy, rect.bottom));
    const dist = Math.hypot(nx - cx, ny - cy);

    if (dist > 0 && dist <= OUTERMOST_RADIUS) {
      points.push({
        x: nx,
        y: ny,
        delay: 0.1 + (dist / OUTERMOST_RADIUS) * 0.5,
      });
    }
  }

  return points.slice(0, 6);
}

/* ─── Memoized sub-components (prevent re-render → prevent animation restart) ─── */

const RippleRings = memo(function RippleRings({
  ripple,
  onEnd,
}: {
  ripple: Ripple;
  onEnd: (id: number) => void;
}) {
  return (
    <>
      {RINGS.map((ring, i) => (
        <span
          key={i}
          className="ripple-circle absolute rounded-full border-2 border-amber-400/40 dark:border-slate-400/30"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            transform: "translate(-50%, -50%)",
            animation: `ripple-ring ${ring.duration}s ease-out ${ring.delay} forwards`,
            ["--ripple-size" as string]: `${ring.size}px`,
          }}
          onAnimationEnd={
            i === RINGS.length - 1 ? () => onEnd(ripple.id) : undefined
          }
        />
      ))}
    </>
  );
});

const BounceRing = memo(function BounceRing({
  bounce,
  onEnd,
}: {
  bounce: BounceRipple;
  onEnd: (id: number) => void;
}) {
  return (
    <span
      className="ripple-circle absolute rounded-full border border-amber-400/30 dark:border-slate-400/20"
      style={{
        left: bounce.x,
        top: bounce.y,
        width: 0,
        height: 0,
        transform: "translate(-50%, -50%)",
        animation: `ripple-bounce 0.4s ease-out ${bounce.delay}s forwards`,
        ["--bounce-size" as string]: "50px",
      }}
      onAnimationEnd={() => onEnd(bounce.id)}
    />
  );
});

/* ─── Main component ─── */

export default function MouseRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [bounces, setBounces] = useState<BounceRipple[]>([]);
  const nextId = useRef(0);
  const reducedMotion = useRef(false);

  const addRipple = useCallback((x: number, y: number) => {
    const id = nextId.current++;

    // No slice — each ripple is removed only by its own onAnimationEnd
    setRipples((prev) => {
      if (prev.length >= MAX_SAFETY) return prev; // defensive guard
      return [...prev, { id, x, y }];
    });

    const bouncePoints = detectBouncePoints(x, y);
    if (bouncePoints.length > 0) {
      setBounces((prev) => {
        if (prev.length >= MAX_SAFETY) return prev;
        return [
          ...prev,
          ...bouncePoints.map((bp) => ({ ...bp, id: nextId.current++ })),
        ];
      });
    }
  }, []);

  const handleRippleEnd = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleBounceEnd = useCallback((id: number) => {
    setBounces((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
    };
    mq.addEventListener("change", onMqChange);

    const onMouseDown = (e: MouseEvent) => {
      if (reducedMotion.current) return;
      if (e.button !== 0) return;
      addRipple(e.clientX, e.clientY);
    };

    window.addEventListener("mousedown", onMouseDown, { passive: true });

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      mq.removeEventListener("change", onMqChange);
    };
  }, [addRipple]);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {ripples.map((r) => (
        <RippleRings key={r.id} ripple={r} onEnd={handleRippleEnd} />
      ))}
      {bounces.map((b) => (
        <BounceRing key={b.id} bounce={b} onEnd={handleBounceEnd} />
      ))}
    </div>
  );
}
