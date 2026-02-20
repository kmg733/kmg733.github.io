"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { PostMeta, CategoryTree } from "@/types";
import { buildCategoryTree } from "@/lib/category";

export function useCategoryFilter(posts: PostMeta[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL에서 초기값 읽기
  const initialCategory = searchParams.get("category");
  const initialSubcategory = searchParams.get("subcategory");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    initialSubcategory
  );
  const [collapsedSet, setCollapsedSet] = useState<Set<string>>(new Set());

  // 카테고리 트리 빌드
  const categoryTree: CategoryTree = useMemo(
    () => buildCategoryTree(posts),
    [posts]
  );

  // URL 업데이트
  const updateURL = useCallback(
    (category: string | null, subcategory: string | null) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (subcategory) params.set("subcategory", subcategory);
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  // 카테고리 선택/해제
  const selectCategory = useCallback(
    (category: string) => {
      if (selectedCategory === category) {
        // 같은 카테고리 재클릭 -> 해제
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        updateURL(null, null);
      } else {
        setSelectedCategory(category);
        setSelectedSubcategory(null);
        updateURL(category, null);
      }
    },
    [selectedCategory, updateURL]
  );

  // 서브카테고리 선택/해제
  const selectSubcategory = useCallback(
    (subcategory: string) => {
      if (selectedSubcategory === subcategory) {
        // 같은 서브카테고리 재클릭 -> 서브만 해제
        setSelectedSubcategory(null);
        updateURL(selectedCategory, null);
      } else {
        setSelectedSubcategory(subcategory);
        updateURL(selectedCategory, subcategory);
      }
    },
    [selectedCategory, selectedSubcategory, updateURL]
  );

  // 전체 필터 해제
  const clearFilter = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    updateURL(null, null);
  }, [updateURL]);

  // 트리 접기/펼치기
  const toggleExpanded = useCallback((categoryName: string) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (categoryName: string) => !collapsedSet.has(categoryName),
    [collapsedSet]
  );

  // 필터링된 포스트
  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return posts;
    if (selectedSubcategory) {
      return posts.filter(
        (p) =>
          p.category === selectedCategory &&
          p.subcategory === selectedSubcategory
      );
    }
    return posts.filter((p) => p.category === selectedCategory);
  }, [posts, selectedCategory, selectedSubcategory]);

  return {
    categoryTree,
    selectedCategory,
    selectedSubcategory,
    filteredPosts,
    selectCategory,
    selectSubcategory,
    clearFilter,
    toggleExpanded,
    isExpanded,
  };
}
