"use client";

import type { CategoryTree as CategoryTreeType } from "@/types";

interface CategoryTreeProps {
  tree: CategoryTreeType;
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onSelectCategory: (category: string) => void;
  onSelectSubcategory: (category: string, subcategory: string) => void;
  onClearFilter: () => void;
  toggleExpanded: (categoryName: string) => void;
  isExpanded: (categoryName: string) => boolean;
  totalCount: number;
}

export default function CategoryTree({
  tree,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  onClearFilter,
  toggleExpanded,
  isExpanded,
  totalCount,
}: CategoryTreeProps) {
  return (
    <nav aria-label="카테고리 필터" className="category-tree-nav">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        카테고리
      </h2>

      <ul className="space-y-1">
        {/* 전체 */}
        <li>
          <button
            onClick={onClearFilter}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
              !selectedCategory
                ? "category-item-active font-medium text-amber-700 dark:text-blue-400"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <span>전체</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                !selectedCategory
                  ? "bg-amber-100 text-amber-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
              }`}
            >
              {totalCount}
            </span>
          </button>
        </li>

        {/* 카테고리 트리 */}
        {tree.map((category) => {
          const isCatActive =
            selectedCategory === category.name && !selectedSubcategory;
          const isCatSelected = selectedCategory === category.name;
          const expanded = isExpanded(category.name);
          const hasSubcategories = category.subcategories.length > 0;

          return (
            <li key={category.name}>
              <div className="flex items-center">
                {/* 접기/펼치기 토글 */}
                {hasSubcategories ? (
                  <button
                    onClick={() => toggleExpanded(category.name)}
                    aria-expanded={expanded}
                    aria-label={`${category.name} ${expanded ? "접기" : "펼치기"}`}
                    className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    <svg
                      className={`h-3 w-3 transition-transform duration-200 ${
                        expanded ? "rotate-90" : "rotate-0"
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
                ) : (
                  <span className="mr-1 w-5 shrink-0" />
                )}

                {/* 카테고리 버튼 */}
                <button
                  onClick={() => onSelectCategory(category.name)}
                  className={`flex flex-1 items-center justify-between rounded-md px-2 py-2 text-sm transition-colors ${
                    isCatActive
                      ? "category-item-active font-medium text-amber-700 dark:text-blue-400"
                      : isCatSelected
                        ? "font-medium text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{category.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isCatActive
                        ? "bg-amber-100 text-amber-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                    }`}
                  >
                    {category.count}
                  </span>
                </button>
              </div>

              {/* 서브카테고리 */}
              {hasSubcategories && expanded && (
                <ul className="ml-6 mt-1 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                  {category.subcategories.map((sub) => {
                    const isSubActive =
                      isCatSelected && selectedSubcategory === sub.name;

                    return (
                      <li key={sub.name}>
                        <button
                          onClick={() => onSelectSubcategory(category.name, sub.name)}
                          className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                            isSubActive
                              ? "category-item-active font-medium text-amber-700 dark:text-blue-400"
                              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          }`}
                        >
                          <span>{sub.name}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-xs ${
                              isSubActive
                                ? "bg-amber-100 text-amber-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-zinc-400 dark:text-zinc-600"
                            }`}
                          >
                            {sub.count}
                          </span>
                        </button>
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
