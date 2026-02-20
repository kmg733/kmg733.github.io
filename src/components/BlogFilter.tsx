"use client";

import Link from "next/link";
import type { PostMeta } from "@/types";
import { useSearch } from "@/hooks/useSearch";
import SearchInput from "./SearchInput";
import HighlightedText from "./HighlightedText";

interface BlogFilterProps {
  posts: PostMeta[];
  selectedCategory: string | null;
  selectedSubcategory: string | null;
}

export default function BlogFilter({
  posts,
  selectedCategory,
  selectedSubcategory,
}: BlogFilterProps) {
  // 검색 훅 (필터링된 포스트에서 검색)
  const {
    query,
    setQuery,
    results,
    resultCount,
    isSearching,
    clearSearch,
  } = useSearch(posts);

  // 검색어가 최소 길이 이상인지 확인
  const isSearchActive = query.trim().length >= 2;

  // 최종 표시할 포스트
  const displayPosts = isSearchActive ? results.map((r) => r.post) : posts;

  // 검색 시 사용할 쿼리 (검색 비활성 시 빈 문자열)
  const highlightQuery = isSearchActive ? query : "";

  // 빈 결과 메시지 생성
  const getEmptyMessage = () => {
    if (isSearchActive) {
      const truncatedQuery =
        query.length > 50 ? `${query.slice(0, 50)}...` : query;
      return `'${truncatedQuery}'에 대한 검색 결과가 없습니다.`;
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
                      <span className="text-zinc-300 dark:text-zinc-600">
                        /
                      </span>
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
                <h2 className="mt-2 text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <HighlightedText
                    text={post.title}
                    query={highlightQuery}
                  />
                </h2>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  <HighlightedText
                    text={post.description}
                    query={highlightQuery}
                  />
                </p>
                {post.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        <HighlightedText
                          text={tag}
                          query={highlightQuery}
                        />
                      </span>
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
