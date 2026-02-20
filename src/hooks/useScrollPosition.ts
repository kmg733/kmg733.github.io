"use client";

import { useState, useEffect } from "react";

/**
 * 스크롤 위치를 감지하는 커스텀 훅.
 *
 * - window.scrollY가 threshold 이상이면 true 반환
 * - scroll 이벤트 리스너를 passive: true로 등록 (스크롤 성능 보장)
 * - 언마운트 시 리스너 정리
 *
 * @param threshold 스크롤 위치 임계값 (기본값: 300px)
 * @returns threshold 이상 스크롤했는지 여부
 */
export function useScrollPosition(threshold = 300): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY >= threshold);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return isScrolled;
}
