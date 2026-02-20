"use client";

import { useState } from "react";
import CategoryTree from "./CategoryTree";
import type { CategoryTree as CategoryTreeType } from "@/types";

interface CategoryMobileFilterProps {
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

export default function CategoryMobileFilter(
  props: CategoryMobileFilterProps
) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = props.selectedCategory
    ? props.selectedSubcategory
      ? `${props.selectedCategory} > ${props.selectedSubcategory}`
      : props.selectedCategory
    : "전체";

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="카테고리 필터 열기"
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-700"
      >
        <span className="text-zinc-600 dark:text-zinc-400">
          카테고리:{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {selectedLabel}
          </span>
        </span>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
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
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <CategoryTree
            {...props}
            onSelectCategory={(cat) => {
              props.onSelectCategory(cat);
              setIsOpen(false);
            }}
            onSelectSubcategory={(cat, sub) => {
              props.onSelectSubcategory(cat, sub);
              setIsOpen(false);
            }}
            onClearFilter={() => {
              props.onClearFilter();
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
