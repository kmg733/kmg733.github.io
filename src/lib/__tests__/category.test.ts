import { buildCategoryTree } from "../category";
import type { PostMeta } from "@/types";

const createPost = (
  overrides: Partial<PostMeta> = {}
): PostMeta => ({
  slug: "test-post",
  title: "Test Post",
  date: "2026-01-01",
  description: "Test description",
  category: "개발",
  tags: [],
  readingTime: "5 min",
  ...overrides,
});

describe("buildCategoryTree", () => {
  it("빈 배열 입력 시 빈 트리를 반환한다", () => {
    const result = buildCategoryTree([]);
    expect(result).toEqual([]);
  });

  it("단일 카테고리, 서브카테고리 없는 포스트를 처리한다", () => {
    const posts = [createPost({ slug: "p1", category: "개발" })];
    const result = buildCategoryTree(posts);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "개발",
      count: 1,
      subcategories: [],
    });
  });

  it("동일 카테고리의 여러 서브카테고리를 처리한다", () => {
    const posts = [
      createPost({ slug: "p1", category: "개발", subcategory: "JavaScript" }),
      createPost({ slug: "p2", category: "개발", subcategory: "Next.js" }),
      createPost({ slug: "p3", category: "개발", subcategory: "JavaScript" }),
    ];
    const result = buildCategoryTree(posts);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("개발");
    expect(result[0].count).toBe(3);
    expect(result[0].subcategories).toHaveLength(2);

    const jsSub = result[0].subcategories.find((s) => s.name === "JavaScript");
    const nextSub = result[0].subcategories.find((s) => s.name === "Next.js");
    expect(jsSub?.count).toBe(2);
    expect(nextSub?.count).toBe(1);
  });

  it("서브카테고리가 있는 포스트와 없는 포스트를 혼합 처리한다", () => {
    const posts = [
      createPost({ slug: "p1", category: "개발", subcategory: "JavaScript" }),
      createPost({ slug: "p2", category: "개발" }),
    ];
    const result = buildCategoryTree(posts);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
    expect(result[0].subcategories).toHaveLength(1);
    expect(result[0].subcategories[0]).toEqual({
      name: "JavaScript",
      count: 1,
    });
  });

  it("여러 카테고리를 가나다순으로 정렬한다", () => {
    const posts = [
      createPost({ slug: "p1", category: "주식" }),
      createPost({ slug: "p2", category: "개발" }),
      createPost({ slug: "p3", category: "책" }),
      createPost({ slug: "p4", category: "일상" }),
    ];
    const result = buildCategoryTree(posts);

    expect(result.map((c) => c.name)).toEqual(["개발", "일상", "주식", "책"]);
  });

  it("서브카테고리를 가나다순으로 정렬한다", () => {
    const posts = [
      createPost({ slug: "p1", category: "개발", subcategory: "웹" }),
      createPost({ slug: "p2", category: "개발", subcategory: "Java" }),
      createPost({ slug: "p3", category: "개발", subcategory: "Next.js" }),
    ];
    const result = buildCategoryTree(posts);

    expect(result[0].subcategories.map((s) => s.name)).toEqual([
      "Java",
      "Next.js",
      "웹",
    ]);
  });

  it("각 카테고리의 count가 정확하다", () => {
    const posts = [
      createPost({ slug: "p1", category: "개발", subcategory: "JavaScript" }),
      createPost({ slug: "p2", category: "개발", subcategory: "Next.js" }),
      createPost({ slug: "p3", category: "주식", subcategory: "분석" }),
      createPost({ slug: "p4", category: "개발" }),
    ];
    const result = buildCategoryTree(posts);

    const dev = result.find((c) => c.name === "개발");
    const stock = result.find((c) => c.name === "주식");

    expect(dev?.count).toBe(3);
    expect(stock?.count).toBe(1);
  });
});
