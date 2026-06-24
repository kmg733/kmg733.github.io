import {
  sortByDateDesc,
  filterByCategory,
  extractCategoriesWithCount,
  type CategoryCount,
} from "../career";
import type { CareerItem } from "@/types";

function createItem(overrides: Partial<CareerItem> = {}): CareerItem {
  return {
    id: "test",
    title: "Test Item",
    summary: "Test summary",
    category: "성능",
    date: "2025.01",
    ...overrides,
  };
}

describe("sortByDateDesc", () => {
  it("date 내림차순(최신순)으로 정렬한다", () => {
    const items = [
      createItem({ id: "a", date: "2024.03" }),
      createItem({ id: "b", date: "2026.05" }),
      createItem({ id: "c", date: "2025.07" }),
    ];

    const result = sortByDateDesc(items);

    expect(result.map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("같은 date면 입력 순서를 유지한다 (안정 정렬)", () => {
    const items = [
      createItem({ id: "a", date: "2026.04" }),
      createItem({ id: "b", date: "2026.04" }),
    ];

    const result = sortByDateDesc(items);

    expect(result.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("원본 배열을 변경하지 않는다 (불변)", () => {
    const items = [
      createItem({ id: "a", date: "2024.03" }),
      createItem({ id: "b", date: "2026.05" }),
    ];

    sortByDateDesc(items);

    expect(items.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("빈 배열 입력 시 빈 배열을 반환한다", () => {
    expect(sortByDateDesc([])).toEqual([]);
  });
});

describe("filterByCategory", () => {
  const items = [
    createItem({ id: "a", category: "성능" }),
    createItem({ id: "b", category: "보안" }),
    createItem({ id: "c", category: "성능" }),
    createItem({ id: "d", category: "인프라" }),
  ];

  it('"전체" 필터는 모든 항목을 반환한다', () => {
    expect(filterByCategory(items, "전체")).toHaveLength(4);
  });

  it("특정 유형 필터는 해당 유형 항목만 반환한다", () => {
    const result = filterByCategory(items, "성능");

    expect(result.map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("일치하는 항목이 없으면 빈 배열을 반환한다", () => {
    expect(filterByCategory(items, "아키텍처")).toEqual([]);
  });
});

describe("extractCategoriesWithCount", () => {
  it("고정 우선순위(성능→보안→아키텍처→인프라)로 유형별 개수를 반환한다", () => {
    const items = [
      createItem({ category: "인프라" }),
      createItem({ category: "성능" }),
      createItem({ category: "보안" }),
      createItem({ category: "성능" }),
      createItem({ category: "아키텍처" }),
    ];

    const result = extractCategoriesWithCount(items);

    expect(result).toEqual<CategoryCount[]>([
      { category: "성능", count: 2 },
      { category: "보안", count: 1 },
      { category: "아키텍처", count: 1 },
      { category: "인프라", count: 1 },
    ]);
  });

  it("존재하지 않는 유형은 결과에서 제외한다", () => {
    const items = [
      createItem({ category: "성능" }),
      createItem({ category: "보안" }),
    ];

    const result = extractCategoriesWithCount(items);

    expect(result.map((c) => c.category)).toEqual(["성능", "보안"]);
  });

  it("빈 배열 입력 시 빈 배열을 반환한다", () => {
    expect(extractCategoriesWithCount([])).toEqual([]);
  });
});
