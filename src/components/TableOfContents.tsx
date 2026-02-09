"use client";

import { useEffect, useState, useRef } from "react";
import type { TocItem } from "@/lib/toc";

interface TableOfContentsProps {
  headings: TocItem[];
}

const TOC_STORAGE_KEY = "toc-is-open";

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const clickedRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // localStorage에서 초기 상태 로드 (hydration mismatch 방지)
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(TOC_STORAGE_KEY);
    if (stored !== null) {
      setIsOpen(stored === "true");
    }
  }, []);

  // 토글 상태 변경 시 localStorage 저장
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(TOC_STORAGE_KEY, String(isOpen));
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 클릭 후 일정 시간 동안은 IntersectionObserver 무시
        if (clickedRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
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
              className={`block py-1 transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400 ${
                activeId === slug
                  ? "font-medium text-blue-600 dark:text-blue-400"
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
                  }, 2000);

                  // 스크롤
                  element.scrollIntoView({ behavior: "smooth" });

                  // 헤딩 강조 애니메이션 추가
                  element.classList.add("heading-highlight");
                  setTimeout(() => {
                    element.classList.remove("heading-highlight");
                  }, 1500);
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
