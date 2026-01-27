"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { PostMeta, SearchResult } from "@/types";
import { searchPosts } from "@/utils/search";

/**
 * useSearch 훅 옵션
 */
export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

/**
 * useSearch 훅 반환 타입
 */
export interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  resultCount: number;
  isSearching: boolean;
  hasActiveSearch: boolean;
  clearSearch: () => void;
}

/**
 * 디바운스 검색 커스텀 훅
 *
 * @param posts 검색 대상 포스트 배열
 * @param options 검색 옵션
 * @returns 검색 상태 및 제어 함수
 */
export function useSearch(
  posts: PostMeta[],
  options: UseSearchOptions = {}
): UseSearchReturn {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 검색어 설정 (디바운스 적용)
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setIsSearching(true);
  }, []);

  // 검색 클리어
  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQueryState("");
    setResults([]);
    setIsSearching(false);
  }, []);

  // 디바운스 검색 실행
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query || query.trim().length < minQueryLength) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const searchResults = searchPosts(posts, query, { minQueryLength });
      setResults(searchResults);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, posts, debounceMs, minQueryLength]);

  // 결과 개수
  const resultCount = useMemo(() => results.length, [results]);

  // 활성 검색 상태
  const hasActiveSearch = useMemo(
    () => query.trim().length >= minQueryLength && results.length > 0,
    [query, results, minQueryLength]
  );

  return {
    query,
    setQuery,
    results,
    resultCount,
    isSearching,
    hasActiveSearch,
    clearSearch,
  };
}
