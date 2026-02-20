"use client";

import { Suspense } from "react";
import type { PostMeta } from "@/types";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import CategoryTree from "./CategoryTree";
import CategoryMobileFilter from "./CategoryMobileFilter";
import BlogFilter from "./BlogFilter";

interface BlogPageClientProps {
  posts: PostMeta[];
}

function BlogPageContent({ posts }: BlogPageClientProps) {
  const {
    categoryTree,
    selectedCategory,
    selectedSubcategory,
    filteredPosts,
    selectCategory,
    selectSubcategory,
    clearFilter,
    toggleExpanded,
    isExpanded,
  } = useCategoryFilter(posts);

  const categoryProps = {
    tree: categoryTree,
    selectedCategory,
    selectedSubcategory,
    onSelectCategory: selectCategory,
    onSelectSubcategory: selectSubcategory,
    onClearFilter: clearFilter,
    toggleExpanded,
    isExpanded,
    totalCount: posts.length,
  };

  return (
    <div className="flex gap-8">
      {/* 좌측 사이드바 - 데스크톱 전용 */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24">
          <CategoryTree {...categoryProps} />
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="min-w-0 flex-1">
        {/* 모바일 카테고리 필터 */}
        <div className="mb-6">
          <CategoryMobileFilter {...categoryProps} />
        </div>

        <BlogFilter
          posts={filteredPosts}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
        />
      </div>
    </div>
  );
}

export default function BlogPageClient({ posts }: BlogPageClientProps) {
  return (
    <Suspense fallback={null}>
      <BlogPageContent posts={posts} />
    </Suspense>
  );
}
