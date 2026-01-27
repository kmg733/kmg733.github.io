"use client";

import { useCallback } from "react";

/**
 * SearchInput 컴포넌트 Props
 */
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isSearching?: boolean;
  resultCount?: number;
  className?: string;
}

/**
 * 검색 아이콘 SVG
 */
function SearchIcon() {
  return (
    <svg
      data-testid="search-icon"
      className="h-5 w-5 text-zinc-400"
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
  );
}

/**
 * 클리어 아이콘 SVG
 */
function ClearIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * 로딩 스피너 SVG
 */
function LoadingSpinner() {
  return (
    <svg
      data-testid="loading-indicator"
      className="h-4 w-4 animate-spin text-zinc-400"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * 검색 입력 컴포넌트
 *
 * 검색 아이콘, 클리어 버튼, 로딩 상태, 결과 개수 표시 지원
 */
export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "포스트 검색...",
  isSearching = false,
  resultCount,
  className = "",
}: SearchInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  const showClearButton = value.length > 0 && onClear;
  const showResultCount = value.length > 0 && resultCount !== undefined && resultCount > 0;

  return (
    <div
      data-testid="search-container"
      className={`relative ${className}`}
    >
      {/* 숨겨진 라벨 (접근성) */}
      <label htmlFor="search-input" className="sr-only">
        포스트 검색
      </label>

      {/* 검색 아이콘 */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <SearchIcon />
      </div>

      {/* 검색 입력 */}
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-24 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
      />

      {/* 오른쪽 영역: 로딩/결과 개수/클리어 버튼 */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
        {/* 로딩 표시 */}
        {isSearching && <LoadingSpinner />}

        {/* 결과 개수 */}
        {showResultCount && !isSearching && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {resultCount}개
          </span>
        )}

        {/* 클리어 버튼 */}
        {showClearButton && (
          <button
            type="button"
            data-testid="clear-button"
            onClick={handleClear}
            aria-label="검색어 지우기"
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <ClearIcon />
          </button>
        )}
      </div>
    </div>
  );
}
