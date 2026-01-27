"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PostMeta } from "@/types";
import { useSearch } from "@/hooks/useSearch";
import { highlightText } from "@/utils/search";
import SearchInput from "./SearchInput";

interface BlogFilterProps {
  posts: PostMeta[];
}

export default function BlogFilter({ posts }: BlogFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );

  // 카테고리 필터링된 포스트
  const categoryFilteredPosts = useMemo(() => {
    if (!selectedCategory) return posts;
    if (selectedSubcategory) {
      return posts.filter(
        (post) =>
          post.category === selectedCategory &&
          post.subcategory === selectedSubcategory
      );
    }
    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory, selectedSubcategory]);

  // 검색 훅 (카테고리 필터링된 포스트에서 검색)
  const {
    query,
    setQuery,
    results,
    resultCount,
    isSearching,
    clearSearch,
  } = useSearch(categoryFilteredPosts);

  // 카테고리 목록 추출 (정렬)
  const categories = useMemo(() => {
    const cats = posts.map((post) => post.category);
    return [...new Set(cats)].sort();
  }, [posts]);

  // 카테고리 활성화 상태 확인 헬퍼 함수
  const isCategoryActive = (category: string) =>
    selectedCategory === category && !selectedSubcategory;

  // 선택된 카테고리의 서브카테고리 목록 (정렬)
  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const subs = posts
      .filter((post) => post.category === selectedCategory && post.subcategory)
      .map((post) => post.subcategory as string);
    return [...new Set(subs)].sort();
  }, [posts, selectedCategory]);

  // 검색어가 최소 길이 이상인지 확인
  const isSearchActive = query.trim().length >= 2;

  // 최종 표시할 포스트 (검색어가 있으면 검색 결과, 아니면 카테고리 필터 결과)
  const displayPosts = isSearchActive
    ? results.map((r) => r.post)
    : categoryFilteredPosts;

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    // 카테고리 변경 시 검색어 초기화
    clearSearch();
  };

  // 검색 결과에서 하이라이트된 텍스트 생성
  const getHighlightedTitle = (post: PostMeta) => {
    if (!isSearchActive) return post.title;
    return highlightText(post.title, query);
  };

  const getHighlightedDescription = (post: PostMeta) => {
    if (!isSearchActive) return post.description;
    return highlightText(post.description, query);
  };

  // 빈 결과 메시지 생성
  const getEmptyMessage = () => {
    if (isSearchActive) {
      return `'${query}'에 대한 검색 결과가 없습니다.`;
    }
    if (selectedCategory) {
      return `'${selectedCategory}${selectedSubcategory ? ` > ${selectedSubcategory}` : ""}' 카테고리에 포스트가 없습니다.`;
    }
    return "아직 작성된 포스트가 없습니다.";
  };

  return (
    <>
      {/* 검색 입력 */}
      <div className="mb-6">
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          isSearching={isSearching}
          resultCount={isSearchActive ? resultCount : undefined}
          placeholder="제목, 내용, 태그 검색..."
        />
      </div>

      {/* 카테고리 필터 */}
      <nav className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              !selectedCategory
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                isCategoryActive(cat)
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 서브카테고리 필터 */}
        {subcategories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(sub)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  selectedSubcategory === sub
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* 포스트 목록 */}
      {displayPosts.length > 0 ? (
        <div className="grid gap-8">
          {displayPosts.map((post) => (
            <article
              key={post.slug}
              className="group border-b border-zinc-200 pb-8 last:border-0 dark:border-zinc-800"
            >
              <Link href={`/blog/${post.slug}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {post.category}
                  </span>
                  {post.subcategory && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-600">/</span>
                      <span className="text-xs text-zinc-500">
                        {post.subcategory}
                      </span>
                    </>
                  )}
                </div>
                <time
                  dateTime={post.date}
                  className="text-sm text-zinc-500 dark:text-zinc-500"
                >
                  {new Date(post.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h2
                  className="mt-2 text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  dangerouslySetInnerHTML={{ __html: getHighlightedTitle(post) }}
                />
                <p
                  className="mt-2 text-zinc-600 dark:text-zinc-400"
                  dangerouslySetInnerHTML={{
                    __html: getHighlightedDescription(post),
                  }}
                />
                {post.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        dangerouslySetInnerHTML={{
                          __html: isSearchActive
                            ? highlightText(tag, query)
                            : tag,
                        }}
                      />
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">{getEmptyMessage()}</p>
      )}
    </>
  );
}
