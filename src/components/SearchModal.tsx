"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostMeta } from "@/types";
import { useSearch } from "@/hooks/useSearch";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { highlightText } from "@/utils/search";

interface SearchModalProps {
  posts: PostMeta[];
}

export default function SearchModal({ posts }: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { query, setQuery, results, isSearching, clearSearch } = useSearch(
    posts,
    { debounceMs: 300, minQueryLength: 2 }
  );

  const open = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(-1);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    clearSearch();
    setSelectedIndex(-1);
  }, [clearSearch]);

  // Cmd+K / Ctrl+K 단축키로 열기
  useKeyboardShortcut("k", open);

  // 외부에서 커스텀 이벤트로 열기 (헤더 검색 버튼 등)
  useEffect(() => {
    function handleOpenSearch() {
      open();
    }
    window.addEventListener("open-search-modal", handleOpenSearch);
    return () =>
      window.removeEventListener("open-search-modal", handleOpenSearch);
  }, [open]);

  // 모달 열릴 때 input에 포커스
  useEffect(() => {
    if (isOpen) {
      // requestAnimationFrame으로 렌더 후 포커스
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // 결과 변경 시 선택 인덱스 초기화
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // 오버레이 클릭 핸들러
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // 클릭 대상이 dialog (오버레이) 자체일 때만 닫기
      if (e.target === e.currentTarget) {
        close();
      }
    },
    [close]
  );

  // 키보드 네비게이션
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          router.push(`/blog/${selected.post.slug}`);
          close();
        }
      }
    },
    [results, selectedIndex, router, close]
  );

  // 검색어 변경 핸들러
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [setQuery]
  );

  // 결과 항목 클릭 시 모달 닫기
  const handleResultClick = useCallback(() => {
    close();
  }, [close]);

  if (!isOpen) return null;

  const hasQuery = query.trim().length >= 2;
  const noResults = hasQuery && !isSearching && results.length === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="포스트 검색"
      className="search-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className="search-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 검색 입력 */}
        <div className="search-modal-input-wrapper">
          <svg
            className="search-modal-input-icon"
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
          <input
            ref={inputRef}
            type="search"
            role="searchbox"
            aria-label="포스트 검색"
            aria-autocomplete="list"
            aria-controls={results.length > 0 ? "search-results" : undefined}
            aria-activedescendant={
              selectedIndex >= 0
                ? `search-result-${selectedIndex}`
                : undefined
            }
            placeholder="포스트 검색..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="search-modal-input"
          />
          <kbd className="search-modal-kbd">ESC</kbd>
        </div>

        {/* 검색 결과 */}
        {results.length > 0 && (
          <ul
            id="search-results"
            role="listbox"
            aria-label="검색 결과"
            className="search-modal-results"
          >
            {results.map((result, index) => (
              <li
                key={result.post.slug}
                id={`search-result-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className={`search-modal-result-item ${
                  index === selectedIndex ? "active" : ""
                }`}
              >
                <Link
                  href={`/blog/${result.post.slug}`}
                  onClick={handleResultClick}
                  className="search-modal-result-link"
                >
                  <span
                    className="search-modal-result-title"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(result.post.title, query),
                    }}
                  />
                  <span className="search-modal-result-description">
                    {result.post.description}
                  </span>
                  <span className="search-modal-result-meta">
                    <span className="search-modal-result-category">
                      {result.post.category}
                    </span>
                    {result.post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="search-modal-result-tag">
                        {tag}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* 결과 없음 */}
        {noResults && (
          <div className="search-modal-empty">
            <p>검색 결과가 없습니다</p>
          </div>
        )}

        {/* 하단 안내 */}
        <div className="search-modal-footer">
          <span>
            <kbd>↑↓</kbd> 탐색
          </span>
          <span>
            <kbd>↵</kbd> 이동
          </span>
          <span>
            <kbd>esc</kbd> 닫기
          </span>
        </div>
      </div>
    </div>
  );
}
