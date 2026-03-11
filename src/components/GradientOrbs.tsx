'use client';

/**
 * GradientOrbs
 * - CSS only blurred gradient orbs (no canvas/JS animation)
 * - Each orb drifts on an independent keyframe path (20~30s cycle)
 * - Light: amber-300 / orange-200 계열 (opacity 0.3~0.4)
 * - Dark:  slate-700 / blue-950 계열 (opacity 0.2~0.3)
 * - prefers-reduced-motion: animation: none
 * - pointer-events: none, z-index: 0
 */
export default function GradientOrbs() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Orb 1 — top-left, large, amber/orange */}
      <div className="gradient-orb gradient-orb-1" />
      {/* Orb 2 — top-right, medium, orange/yellow */}
      <div className="gradient-orb gradient-orb-2" />
      {/* Orb 3 — bottom-center, small, amber/rose */}
      <div className="gradient-orb gradient-orb-3" />
    </div>
  );
}
