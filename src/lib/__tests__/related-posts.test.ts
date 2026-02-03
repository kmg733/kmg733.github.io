import { calculateRelevanceScore } from "../related-posts";
import type { PostMeta } from "@/types";

function createPostMeta(
  overrides: Partial<PostMeta> = {}
): PostMeta {
  return {
    slug: "test-post",
    title: "Test Post",
    date: "2025-01-01",
    description: "Test description",
    category: "dev",
    tags: ["javascript"],
    readingTime: "5 min read",
    ...overrides,
  };
}

describe("calculateRelevanceScore", () => {
  const currentPost = createPostMeta({
    slug: "current",
    category: "dev",
    subcategory: "frontend",
    tags: ["javascript", "react", "nextjs"],
  });

  it("같은 subcategory일 때 +3점", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "other",
      subcategory: "frontend",
      tags: [],
    });

    expect(calculateRelevanceScore(currentPost, candidate)).toBe(3);
  });

  it("같은 category일 때 +2점", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "dev",
      subcategory: "backend",
      tags: [],
    });

    expect(calculateRelevanceScore(currentPost, candidate)).toBe(2);
  });

  it("공통 tag 1개당 +1점", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "other",
      tags: ["javascript", "react"],
    });

    expect(calculateRelevanceScore(currentPost, candidate)).toBe(2);
  });

  it("모든 조건이 다를 때 0점", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "life",
      subcategory: "travel",
      tags: ["python"],
    });

    expect(calculateRelevanceScore(currentPost, candidate)).toBe(0);
  });

  it("복합 조건: 같은 category(+2) + 같은 subcategory(+3) + 공통 tag 2개(+2) = 7점", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "dev",
      subcategory: "frontend",
      tags: ["javascript", "react", "typescript"],
    });

    expect(calculateRelevanceScore(currentPost, candidate)).toBe(7);
  });

  it("currentPost의 subcategory가 undefined이면 subcategory 점수 0점", () => {
    const noSubcategoryCurrent = createPostMeta({
      slug: "current",
      category: "dev",
      subcategory: undefined,
      tags: [],
    });
    const candidate = createPostMeta({
      slug: "candidate",
      category: "dev",
      subcategory: "frontend",
      tags: [],
    });

    expect(calculateRelevanceScore(noSubcategoryCurrent, candidate)).toBe(2);
  });

  it("candidate의 subcategory가 undefined이면 subcategory 점수 0점", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "dev",
      subcategory: undefined,
      tags: [],
    });

    expect(calculateRelevanceScore(currentPost, candidate)).toBe(2);
  });

  it("양쪽 subcategory가 undefined이면 subcategory 매칭 안 함", () => {
    const noSub1 = createPostMeta({
      slug: "a",
      category: "other",
      subcategory: undefined,
      tags: [],
    });
    const noSub2 = createPostMeta({
      slug: "b",
      category: "other",
      subcategory: undefined,
      tags: [],
    });

    // category만 일치 = 2점, undefined끼리 매칭하면 안 됨
    expect(calculateRelevanceScore(noSub1, noSub2)).toBe(2);
  });
});
