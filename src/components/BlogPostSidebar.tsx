"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PostMeta } from "@/types";
import { buildCategoryTree } from "@/lib/category";

interface BlogPostSidebarProps {
  posts: PostMeta[];
  currentSlug: string;
}

export default function BlogPostSidebar({
  posts,
  currentSlug,
}: BlogPostSidebarProps) {
  const categoryTree = useMemo(() => buildCategoryTree(posts), [posts]);

  const currentPost = useMemo(
    () => posts.find((p) => p.slug === currentSlug),
    [posts, currentSlug]
  );

  // 글을 카테고리 → 서브카테고리로 그룹핑
  const postGroups = useMemo(() => {
    const groups = new Map<string, Map<string, PostMeta[]>>();
    for (const post of posts) {
      if (!groups.has(post.category)) {
        groups.set(post.category, new Map());
      }
      const subMap = groups.get(post.category)!;
      const subKey = post.subcategory || "";
      if (!subMap.has(subKey)) {
        subMap.set(subKey, []);
      }
      subMap.get(subKey)!.push(post);
    }
    return groups;
  }, [posts]);

  // 현재 글이 속한 카테고리만 펼침, 나머지는 접힘
  const [collapsedSet, setCollapsedSet] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const category of categoryTree) {
      if (category.name !== currentPost?.category) {
        initial.add(category.name);
      }
    }
    return initial;
  });

  const toggleCategory = (name: string) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <nav aria-label="카테고리 네비게이션" className="category-tree-nav">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        카테고리
      </h2>

      <ul className="space-y-1">
        {categoryTree.map((category) => {
          const isExpanded = !collapsedSet.has(category.name);
          const isCurrent = currentPost?.category === category.name;
          const hasSubcategories = category.subcategories.length > 0;
          const subGroups = postGroups.get(category.name);

          return (
            <li key={category.name}>
              <div className="flex items-center">
                {/* 접기/펼치기 토글 */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  aria-expanded={isExpanded}
                  aria-label={`${category.name} ${isExpanded ? "접기" : "펼치기"}`}
                  className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : "rotate-0"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* 카테고리 이름 */}
                <span
                  className={`flex flex-1 items-center justify-between rounded-md px-2 py-2 text-sm ${
                    isCurrent
                      ? "font-medium text-amber-700 dark:text-blue-400"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <span>{category.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isCurrent
                        ? "bg-amber-100 text-amber-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                    }`}
                  >
                    {category.count}
                  </span>
                </span>
              </div>

              {/* 서브카테고리 + 글 목록 */}
              {isExpanded && (
                <ul className="ml-6 mt-1 space-y-2 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                  {/* 서브카테고리가 없는 글 */}
                  {subGroups?.has("") && (
                    <li>
                      <ul className="space-y-0.5">
                        {subGroups.get("")!.map((post) => (
                          <li key={post.slug}>
                            <Link
                              href={`/blog/${post.slug}`}
                              className={`block truncate rounded-md px-2 py-1 text-xs transition-colors ${
                                post.slug === currentSlug
                                  ? "category-item-active font-medium text-amber-700 dark:text-blue-400"
                                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                              }`}
                            >
                              {post.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )}

                  {/* 서브카테고리별 글 */}
                  {hasSubcategories &&
                    category.subcategories.map((sub) => {
                      const postsInSub = subGroups?.get(sub.name) || [];
                      const isCurrentSub =
                        isCurrent &&
                        currentPost?.subcategory === sub.name;

                      return (
                        <li key={sub.name}>
                          <span
                            className={`flex items-center justify-between px-2 py-1 text-sm ${
                              isCurrentSub
                                ? "font-medium text-amber-700 dark:text-blue-400"
                                : "text-zinc-500 dark:text-zinc-500"
                            }`}
                          >
                            <span>{sub.name}</span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-600">
                              {sub.count}
                            </span>
                          </span>

                          {/* 글 링크 목록 */}
                          <ul className="mt-0.5 space-y-0.5">
                            {postsInSub.map((post) => (
                              <li key={post.slug}>
                                <Link
                                  href={`/blog/${post.slug}`}
                                  className={`block truncate rounded-md px-2 py-1 text-xs transition-colors ${
                                    post.slug === currentSlug
                                      ? "category-item-active font-medium text-amber-700 dark:text-blue-400"
                                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                                  }`}
                                >
                                  {post.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
