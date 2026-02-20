"use client";

import { useState, useEffect } from "react";

/**
 * 스크롤 위치를 감지하는 커스텀 훅.
 *
 * - window.scrollY가 threshold 이상이면 true 반환
 * - requestAnimationFrame으로 스로틀 적용 (불필요한 리렌더링 방지)
 * - scroll 이벤트 리스너를 passive: true로 등록 (스크롤 성능 보장)
 * - 언마운트 시 리스너 및 예약된 rAF 정리
 *
 * @param threshold 스크롤 위치 임계값 (기본값: 300px)
 * @returns threshold 이상 스크롤했는지 여부
 */
export function useScrollPosition(threshold = 300): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;

    function handleScroll() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY >= threshold);
        rafId = null;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [threshold]);

  return isScrolled;
}
