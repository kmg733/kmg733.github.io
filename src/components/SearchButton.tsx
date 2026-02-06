"use client";

import { useCallback } from "react";

/**
 * 헤더 검색 버튼.
 * 클릭 시 커스텀 이벤트를 발생시켜 SearchModal을 연다.
 */
export default function SearchButton() {
  const handleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-search-modal"));
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="포스트 검색 (Cmd+K)"
      className="rounded-md p-1.5 text-amber-700 hover:bg-zinc-100 hover:text-amber-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </button>
  );
}
