"use client";

import { useEffect, useState, useRef } from "react";
import type { TocItem } from "@/lib/toc";
import { scrollAndHighlight } from "@/lib/scrollHighlight";

interface TableOfContentsProps {
  headings: TocItem[];
}

const TOC_STORAGE_KEY = "toc-is-open";
const HEADER_HEIGHT = 80;
const CLICK_DEBOUNCE_MS = 2000;

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const clickedRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // localStorage에서 초기 상태 로드 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(TOC_STORAGE_KEY);
      if (stored !== null) {
        setIsOpen(stored === "true");
      }
    } catch {
      // localStorage 접근 불가 시 기본값(true) 유지
    }
  }, []);

  // 토글 상태 변경 시 localStorage 저장
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(TOC_STORAGE_KEY, String(isOpen));
      } catch {
        // 저장 실패 시 무시
      }
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    if (headings.length === 0) return;

    /**
     * getBoundingClientRect 기반으로 현재 active heading을 계산한다.
     *
     * 알고리즘:
     * 1. 모든 heading의 top 값을 수집한다.
     * 2. top <= HEADER_HEIGHT 인 heading들 중 가장 큰 top 값을 가진 것이 active.
     *    (viewport 상단에 가장 가까운, 즉 마지막으로 통과한 heading)
     * 3. 해당 없으면 (모든 heading이 아직 viewport 아래) 첫 번째 heading이 active.
     */
    function computeActiveId(): string {
      let bestId = headings[0]?.slug ?? "";
      let bestTop = -Infinity;

      for (const { slug } of headings) {
        const el = document.getElementById(slug);
        if (!el) continue;

        const top = el.getBoundingClientRect().top;

        if (top <= HEADER_HEIGHT && top > bestTop) {
          bestTop = top;
          bestId = slug;
        }
      }

      return bestId;
    }

    const observer = new IntersectionObserver(
      () => {
        // 클릭 후 일정 시간 동안은 IntersectionObserver 무시
        if (clickedRef.current) return;

        // Observer는 "트리거" 역할만 수행하고,
        // 실제 active는 getBoundingClientRect 기반으로 결정한다.
        setActiveId(computeActiveId());
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    headings.forEach(({ slug }) => {
      const element = document.getElementById(slug);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [headings]);

  const toggleToc = () => {
    setIsOpen((prev) => !prev);
  };

  if (headings.length === 0) return null;

  return (
    <nav className="toc-nav">
      <button
        onClick={toggleToc}
        aria-expanded={isOpen}
        aria-label="목차 접기/펼치기"
        className="toc-toggle-button mb-4 flex w-full items-center justify-between text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100"
      >
        <span>목차</span>
        <svg
          className={`toc-toggle-icon h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <ul
        className={`toc-list space-y-2 text-sm transition-all duration-200 ${
          isOpen ? "toc-list-open" : "toc-list-closed"
        }`}
      >
        {headings.map(({ slug, text, level }) => (
          <li
            key={slug}
            style={{ paddingLeft: level === 3 ? "1rem" : "0" }}
          >
            <a
              href={`#${slug}`}
              className={`block py-1 transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 ${
                activeId === slug
                  ? "font-medium text-blue-600 dark:text-blue-400 toc-item-active"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(slug);
                if (element) {
                  // 강제로 활성 상태 설정 (마지막 항목 문제 해결)
                  setActiveId(slug);

                  // IntersectionObserver 일시 비활성화 (2초)
                  clickedRef.current = true;
                  if (clickTimeoutRef.current) {
                    clearTimeout(clickTimeoutRef.current);
                  }
                  clickTimeoutRef.current = setTimeout(() => {
                    clickedRef.current = false;
                  }, CLICK_DEBOUNCE_MS);

                  // 스크롤 + 헤딩 강조 애니메이션
                  scrollAndHighlight(element, "heading-highlight");
                }
              }}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
