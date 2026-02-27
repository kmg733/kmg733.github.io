"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

interface BlogStatsProps {
  stats: StatItem[];
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    // prefers-reduced-motion은 useInView에서 이미 처리 (즉시 isInView=true)
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      // ease-out 곡선
      const progress = 1 - Math.pow(1 - currentStep / steps, 3);
      setCount(Math.round(target * progress));

      if (currentStep >= steps) {
        setCount(target);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export default function BlogStats({ stats }: BlogStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-zinc-200 bg-white/60 p-4 text-center backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <div className="text-2xl font-bold text-amber-600 sm:text-3xl dark:text-slate-300">
            <CountUp target={stat.value} suffix={stat.suffix} />
          </div>
          <div className="mt-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
