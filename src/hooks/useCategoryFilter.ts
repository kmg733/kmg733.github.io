"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { PostMeta, CategoryTree } from "@/types";
import { buildCategoryTree } from "@/lib/category";
import { toggleSetItem } from "@/utils/set";

/**
 * URL 파라미터에서 카테고리/서브카테고리를 읽고 유효성을 검증한다.
 */
function validateURLParams(
  searchParams: URLSearchParams,
  tree: CategoryTree
): { category: string | null; subcategory: string | null } {
  const rawCategory = searchParams.get("category");
  const rawSubcategory = searchParams.get("subcategory");

  // 카테고리가 없거나 트리에 존재하지 않으면 무시
  if (!rawCategory) return { category: null, subcategory: null };

  const categoryNode = tree.find((c) => c.name === rawCategory);
  if (!categoryNode) return { category: null, subcategory: null };

  // 서브카테고리가 해당 카테고리에 속하는지 검증
  if (rawSubcategory) {
    const hasSubcategory = categoryNode.subcategories?.some(
      (s) => s.name === rawSubcategory
    );
    if (!hasSubcategory) return { category: rawCategory, subcategory: null };
  }

  return { category: rawCategory, subcategory: rawSubcategory };
}

export function useCategoryFilter(posts: PostMeta[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 카테고리 트리 빌드
  const categoryTree: CategoryTree = useMemo(
    () => buildCategoryTree(posts),
    [posts]
  );

  // URL에서 초기값 읽기 (유효성 검증 포함)
  const validatedParams = useMemo(
    () => validateURLParams(searchParams, categoryTree),
    [searchParams, categoryTree]
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    validatedParams.category
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    validatedParams.subcategory
  );
  const [collapsedSet, setCollapsedSet] = useState<Set<string>>(new Set());

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

  // 서브카테고리 선택/해제 (부모 카테고리도 함께 설정)
  const selectSubcategory = useCallback(
    (category: string, subcategory: string) => {
      if (selectedCategory === category && selectedSubcategory === subcategory) {
        setSelectedSubcategory(null);
        updateURL(category, null);
      } else {
        setSelectedCategory(category);
        setSelectedSubcategory(subcategory);
        updateURL(category, subcategory);
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

  // 트리 접기/펼치기 (toggleSetItem 유틸리티 사용)
  const toggleExpanded = useCallback((categoryName: string) => {
    setCollapsedSet((prev) => toggleSetItem(prev, categoryName));
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
