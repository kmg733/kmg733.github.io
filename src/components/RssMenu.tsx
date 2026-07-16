"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 헤더 피드 구독 메뉴.
 * RSS 아이콘 클릭 시 RSS(/feed.xml) / Atom(/atom.xml) 선택 드롭다운을 연다.
 * 바깥 클릭·Escape로 닫힌다.
 */
export default function RssMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus(); // 닫힘 후 포커스를 트리거로 복귀 (WCAG 2.4.3)
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="피드 구독 (RSS/Atom)"
        aria-expanded={isOpen}
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
            d="M4 11a9 9 0 0 1 9 9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4a16 16 0 0 1 16 16"
          />
          <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-28 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <a
            href="/feed.xml"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            RSS 2.0
          </a>
          <a
            href="/atom.xml"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Atom 1.0
          </a>
        </div>
      )}
    </div>
  );
}
