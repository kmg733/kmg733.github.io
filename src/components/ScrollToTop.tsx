"use client";

import { useState, useEffect } from "react";
import { useScrollPosition } from "@/hooks/useScrollPosition";

/**
 * 페이지 최상단으로 스크롤하는 플로팅 버튼 컴포넌트.
 *
 * - 스크롤 위치가 300px 이상이면 표시
 * - SSR hydration mismatch 방지를 위해 mounted 상태 관리
 * - 클릭 시 smooth scroll로 최상단 이동
 * - 라이트/다크 모드 대응
 * - 접근성: aria-label, aria-hidden, tabIndex, focus-visible 스타일
 */
export default function ScrollToTop() {
  const [mounted, setMounted] = useState(false);
  const isScrolled = useScrollPosition(300);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // SSR hydration mismatch 방지: 서버에서는 렌더링하지 않음
  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="맨 위로 이동"
      aria-hidden={!isScrolled}
      tabIndex={isScrolled ? 0 : -1}
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40
        w-10 h-10 sm:w-12 sm:h-12
        flex items-center justify-center
        rounded-full
        bg-amber-500/90 hover:bg-amber-600
        dark:bg-zinc-700/90 dark:hover:bg-zinc-600
        text-white dark:text-zinc-100
        shadow-lg shadow-amber-500/25 dark:shadow-black/25
        transition-all duration-300 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
        dark:focus-visible:ring-zinc-400 dark:focus-visible:ring-offset-zinc-900
        cursor-pointer
        ${
          isScrolled
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5 sm:w-6 sm:h-6"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
