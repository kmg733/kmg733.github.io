"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useInView({
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px",
  once = true,
}: UseInViewOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    // prefers-reduced-motion: 즉시 visible 처리 + 실시간 반영
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mq.matches) {
      setIsInView(true);
      return;
    }

    const onMqChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInView(true);
    };
    mq.addEventListener("change", onMqChange);

    const element = ref.current;
    if (!element) {
      return () => mq.removeEventListener("change", onMqChange);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      mq.removeEventListener("change", onMqChange);
    };
  }, [threshold, rootMargin, once]);

  return { ref, isInView };
}
