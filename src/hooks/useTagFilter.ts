"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { PostMeta } from "@/types";
import { extractTagsWithCount, type TagCount } from "@/utils/tag";

export interface UseTagFilterReturn {
  availableTags: TagCount[];
  selectedTag: string | null;
  filteredPosts: PostMeta[];
  selectTag: (tag: string) => void;
  clearTag: () => void;
}

/**
 * 태그 기반 포스트 필터링 훅.
 * URL ?tag= 파라미터와 동기화하며, 기존 파라미터(category 등)를 보존한다.
 */
export function useTagFilter(posts: PostMeta[]): UseTagFilterReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 사용 가능한 태그 추출
  const availableTags = useMemo(() => extractTagsWithCount(posts), [posts]);

  // 태그 유효성 검증: 존재하는 태그만 허용
  const validTagNames = useMemo(
    () => new Set(availableTags.map((t) => t.name)),
    [availableTags]
  );

  // URL에서 태그 읽기 + 유효성 검증 (useCategoryFilter 패턴 일치)
  const validatedTag = useMemo(() => {
    const urlTag = searchParams.get("tag");
    return urlTag && validTagNames.has(urlTag) ? urlTag : null;
  }, [searchParams, validTagNames]);

  const [selectedTag, setSelectedTag] = useState<string | null>(validatedTag);

  // URL 파라미터 변경 시 state 동기화 (브라우저 뒤로가기 대응)
  useEffect(() => {
    setSelectedTag(validatedTag);
  }, [validatedTag]);

  // 선택된 태그가 포스트 변경으로 사라지면 자동 해제
  useEffect(() => {
    if (selectedTag && !validTagNames.has(selectedTag)) {
      setSelectedTag(null);
    }
  }, [selectedTag, validTagNames]);

  // searchParams를 ref로 보관하여 updateURL의 불필요한 재생성 방지
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // URL 업데이트 (기존 파라미터 보존)
  const updateURL = useCallback(
    (tag: string | null) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (tag) {
        params.set("tag", tag);
      } else {
        params.delete("tag");
      }
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  // 태그 선택/토글
  const selectTag = useCallback(
    (tag: string) => {
      const newTag = selectedTag === tag ? null : tag;
      setSelectedTag(newTag);
      updateURL(newTag);
    },
    [selectedTag, updateURL]
  );

  // 태그 클리어
  const clearTag = useCallback(() => {
    setSelectedTag(null);
    updateURL(null);
  }, [updateURL]);

  // 필터링된 포스트
  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter((p) => p.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  return {
    availableTags,
    selectedTag,
    filteredPosts,
    selectTag,
    clearTag,
  };
}
