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

  it("같은 subcategory여도 subcategory 점수는 부여하지 않는다 (tag만 평가)", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "other",
      subcategory: "frontend",
      tags: [],
    });

    // subcategory 점수 제거됨: tag 공통 0개 = 0점
    expect(calculateRelevanceScore(currentPost, candidate)).toBe(0);
  });

  it("같은 category지만 subcategory 다르고 tag 없으면 0점", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "dev",
      subcategory: "backend",
      tags: [],
    });

    expect(calculateRelevanceScore(currentPost, candidate)).toBe(0);
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

  it("같은 subcategory + 공통 tag 2개 = 2점 (subcategory 점수 없음, tag만 평가)", () => {
    const candidate = createPostMeta({
      slug: "candidate",
      category: "dev",
      subcategory: "frontend",
      tags: ["javascript", "react", "typescript"],
    });

    // subcategory 점수 제거됨: 공통 tag(javascript, react) = 2점
    expect(calculateRelevanceScore(currentPost, candidate)).toBe(2);
  });

  it("tag가 모두 동일하면 공통 tag 수만큼 점수를 부여한다", () => {
    const post1 = createPostMeta({
      slug: "a",
      tags: ["javascript", "react", "nextjs"],
    });
    const post2 = createPostMeta({
      slug: "b",
      tags: ["javascript", "react", "nextjs"],
    });

    expect(calculateRelevanceScore(post1, post2)).toBe(3);
  });

  it("양쪽 모두 tag가 비어있으면 0점", () => {
    const post1 = createPostMeta({ slug: "a", tags: [] });
    const post2 = createPostMeta({ slug: "b", tags: [] });

    expect(calculateRelevanceScore(post1, post2)).toBe(0);
  });
});
