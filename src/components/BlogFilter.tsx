"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PostMeta } from "@/types";

interface BlogFilterProps {
  posts: PostMeta[];
}

export default function BlogFilter({ posts }: BlogFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );

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

  // 필터링된 포스트
  const filteredPosts = useMemo(() => {
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

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
  };

  return (
    <>
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
      {filteredPosts.length > 0 ? (
        <div className="grid gap-8">
          {filteredPosts.map((post) => (
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
                <h2 className="mt-2 text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {post.title}
                </h2>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {post.description}
                </p>
                {post.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">
          {selectedCategory
            ? `'${selectedCategory}${selectedSubcategory ? ` > ${selectedSubcategory}` : ""}' 카테고리에 포스트가 없습니다.`
            : "아직 작성된 포스트가 없습니다."}
        </p>
      )}
    </>
  );
}
