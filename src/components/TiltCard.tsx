"use client";

import { useEffect, useRef, useState } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 12,
  perspective = 800,
  scale = 1.02,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const reducedMotion = useRef(false);

  const [spotX, setSpotX] = useState(50);
  const [spotY, setSpotY] = useState(50);
  const [isHovered, setIsHovered] = useState(false);

  const transformRef = useRef({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mq.matches;

    const onChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const applyTransform = (
    rotateX: number,
    rotateY: number,
    scaleVal: number,
    transition: string,
  ) => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleVal})`;
    transformRef.current = { rotateX, rotateY, scale: scaleVal };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion.current) return;

    const el = cardRef.current;
    if (!el) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const { width, height } = rect;

      const rotateX = (0.5 - mouseY / height) * maxTilt * 2;
      const rotateY = (mouseX / width - 0.5) * maxTilt * 2;

      const pctX = (mouseX / width) * 100;
      const pctY = (mouseY / height) * 100;

      setSpotX(pctX);
      setSpotY(pctY);

      applyTransform(rotateX, rotateY, scale, "none");
      rafRef.current = null;
    });
  };

  const handleMouseEnter = () => {
    if (reducedMotion.current) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsHovered(false);
    applyTransform(0, 0, 1, "transform 0.4s ease");
  };

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      style={{ willChange: "transform" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Spotlight overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.3s ease",
          background: `radial-gradient(circle at ${spotX}% ${spotY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
        }}
      />
    </div>
  );
}
