"use client";

import { useEffect, useState, useRef } from "react";
import type { TocItem } from "@/lib/toc";
import { scrollAndHighlight } from "@/lib/scrollHighlight";
import { TOC_SYNC_EVENT, findSectionHeading } from "@/lib/tocSync";

interface TableOfContentsProps {
  headings: TocItem[];
}

const TOC_STORAGE_KEY = "toc-is-open";
// 제목·각주 링크는 대상을 화면 위 96px(scroll-margin-top: 6rem)에 멈춘다. 그 위치의 제목도 active가 되도록 조금 여유를 둔다.
const ACTIVE_LINE = 100;
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

  // 클릭·동기화 직후에는 부드러운 스크롤 중간 위치로 active가 바뀌지 않게 잠시 계산을 멈춘다.
  const pauseScrollTracking = () => {
    clickedRef.current = true;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      clickedRef.current = false;
    }, CLICK_DEBOUNCE_MS);
  };

  useEffect(() => {
    if (headings.length === 0) return;

    /**
     * getBoundingClientRect 기반으로 현재 active heading을 계산한다.
     *
     * 알고리즘:
     * 1. 모든 heading의 top 값을 수집한다.
     * 2. top <= ACTIVE_LINE 인 heading들 중 가장 큰 top 값을 가진 것이 active.
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

        if (top <= ACTIVE_LINE && top > bestTop) {
          bestTop = top;
          bestId = slug;
        }
      }

      return bestId;
    }

    // IntersectionObserver는 스크롤바를 빠르게 끌어 제목이 감시 영역을 한 프레임에 건너뛰면
    // 콜백이 오지 않아 목차가 멈췄다. scroll 이벤트마다(rAF 1회로 묶어) 다시 계산한다.
    let rafId: number | null = null;

    function handleScroll() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (clickedRef.current) return;
        setActiveId(computeActiveId());
      });
    }

    function handleSync(event: Event) {
      const target = (event as CustomEvent<HTMLElement>).detail;
      const slugs = headings.map(({ slug }) => slug);
      setActiveId(findSectionHeading(target, slugs) ?? headings[0].slug);
      pauseScrollTracking();
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener(TOC_SYNC_EVENT, handleSync);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(TOC_SYNC_EVENT, handleSync);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
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

                  // 스크롤 기반 계산 일시 중지 (2초)
                  pauseScrollTracking();

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
