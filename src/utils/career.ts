import type {
  CareerCategory,
  CareerCategoryFilter,
  CareerItem,
} from "@/types";

/** 유형 필터 칩 표시용 집계 결과 */
export interface CategoryCount {
  category: CareerCategory;
  count: number;
}

/** 유형 칩의 고정 표시 우선순위 */
const CATEGORY_ORDER: readonly CareerCategory[] = [
  "성능",
  "보안",
  "아키텍처",
  "인프라",
];

/**
 * date("YYYY.MM") 내림차순(최신순)으로 정렬한다.
 * 원본을 변경하지 않으며, 같은 date는 입력 순서를 유지한다(안정 정렬).
 */
export function sortByDateDesc(items: CareerItem[]): CareerItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.date.localeCompare(a.item.date) || a.index - b.index)
    .map(({ item }) => item);
}

/**
 * 유형으로 항목을 필터링한다. "전체"는 모든 항목을 반환한다.
 */
export function filterByCategory(
  items: CareerItem[],
  filter: CareerCategoryFilter
): CareerItem[] {
  if (filter === "전체") return items;
  return items.filter((item) => item.category === filter);
}

/**
 * 항목 배열에서 존재하는 유형만 고정 우선순위 순으로 개수와 함께 추출한다.
 */
export function extractCategoriesWithCount(
  items: CareerItem[]
): CategoryCount[] {
  const countMap = new Map<CareerCategory, number>();

  for (const item of items) {
    countMap.set(item.category, (countMap.get(item.category) ?? 0) + 1);
  }

  return CATEGORY_ORDER.filter((category) => countMap.has(category)).map(
    (category) => ({ category, count: countMap.get(category)! })
  );
}
