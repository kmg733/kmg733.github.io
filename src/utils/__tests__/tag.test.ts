import { extractTagsWithCount, type TagCount } from "../tag";
import type { PostMeta } from "@/types";

// 테스트용 포스트 팩토리
function createPost(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    slug: "test-post",
    title: "Test Post",
    date: "2025-01-01",
    description: "Test description",
    category: "개발",
    tags: [],
    readingTime: "5분",
    ...overrides,
  };
}

describe("extractTagsWithCount", () => {
  it("포스트 배열에서 고유 태그와 각 태그의 포스트 수를 추출한다", () => {
    const posts = [
      createPost({ slug: "a", tags: ["guide", "beginner"] }),
      createPost({ slug: "b", tags: ["guide", "tutorial"] }),
      createPost({ slug: "c", tags: ["beginner"] }),
    ];

    const result = extractTagsWithCount(posts);

    expect(result).toEqual<TagCount[]>([
      { name: "beginner", count: 2 },
      { name: "guide", count: 2 },
      { name: "tutorial", count: 1 },
    ]);
  });

  it("빈 배열 입력 시 빈 배열을 반환한다", () => {
    expect(extractTagsWithCount([])).toEqual([]);
  });

  it("태그가 없는 포스트는 무시한다", () => {
    const posts = [
      createPost({ slug: "a", tags: ["guide"] }),
      createPost({ slug: "b", tags: [] }),
    ];

    const result = extractTagsWithCount(posts);

    expect(result).toEqual<TagCount[]>([{ name: "guide", count: 1 }]);
  });

  it("태그 개수 내림차순, 같으면 이름 오름차순으로 정렬한다", () => {
    const posts = [
      createPost({ slug: "a", tags: ["zeta", "alpha"] }),
      createPost({ slug: "b", tags: ["alpha", "beta"] }),
      createPost({ slug: "c", tags: ["beta"] }),
    ];

    const result = extractTagsWithCount(posts);

    // alpha: 2, beta: 2, zeta: 1 → 개수 같으면 이름 오름차순
    expect(result).toEqual<TagCount[]>([
      { name: "alpha", count: 2 },
      { name: "beta", count: 2 },
      { name: "zeta", count: 1 },
    ]);
  });

  it("모든 포스트에 태그가 없으면 빈 배열을 반환한다", () => {
    const posts = [
      createPost({ slug: "a", tags: [] }),
      createPost({ slug: "b", tags: [] }),
    ];

    expect(extractTagsWithCount(posts)).toEqual([]);
  });
});
