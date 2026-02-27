"use client";

import { useInView } from "@/hooks/useInView";

type Direction = "up" | "down" | "left" | "right" | "fade";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  index?: number;
  staggerDelay?: number;
  className?: string;
}

const directionStyles: Record<Direction, { transform: string }> = {
  up: { transform: "translateY(24px)" },
  down: { transform: "translateY(-24px)" },
  left: { transform: "translateX(24px)" },
  right: { transform: "translateX(-24px)" },
  fade: { transform: "none" },
};

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 600,
  index = 0,
  staggerDelay = 100,
  className = "",
}: ScrollRevealProps) {
  const { ref, isInView } = useInView();

  const totalDelay = delay + index * staggerDelay;
  const initial = directionStyles[direction];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "none" : initial.transform,
        transition: `opacity ${duration}ms ease-out ${totalDelay}ms, transform ${duration}ms ease-out ${totalDelay}ms`,
        willChange: isInView ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
