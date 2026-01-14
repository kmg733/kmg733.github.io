"use client";

import { useEffect, useState, useRef } from "react";
import type { TocItem } from "@/lib/toc";

interface TableOfContentsProps {
  headings: TocItem[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const clickedRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  if (headings.length === 0) return null;

  return (
    <nav className="toc-nav">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        목차
      </h2>
      <ul className="space-y-2 text-sm">
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
