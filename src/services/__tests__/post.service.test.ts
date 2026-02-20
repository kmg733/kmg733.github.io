import { PostService } from "../post.service";
import type { IPostRepository } from "@/interfaces";
import type { Post, PostMeta } from "@/types";

function createPostMeta(overrides: Partial<PostMeta> = {}): PostMeta {
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

function createPost(overrides: Partial<Post> = {}): Post {
  return {
    ...createPostMeta(overrides),
    content: "test content",
    ...overrides,
  };
}

describe("PostService.getAdjacentPosts", () => {
  let mockRepository: jest.Mocked<IPostRepository>;
  let service: PostService;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      findAllSlugs: jest.fn(),
    };
    service = new PostService(mockRepository);
  });

  it("같은 시리즈의 이전/다음 포스트를 반환한다", () => {
    const currentPost = createPost({
      slug: "js-this",
      series: "javascript-core",
      seriesOrder: 2,
      category: "dev",
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "js-closure", series: "javascript-core", seriesOrder: 1, category: "dev" }),
      createPostMeta({ slug: "js-this", series: "javascript-core", seriesOrder: 2, category: "dev" }),
      createPostMeta({ slug: "js-prototype", series: "javascript-core", seriesOrder: 3, category: "dev" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getAdjacentPosts("js-this");

    expect(result.prev?.slug).toBe("js-closure");
    expect(result.next?.slug).toBe("js-prototype");
  });

  it("첫 번째 글이면 prev가 null이다", () => {
    const currentPost = createPost({
      slug: "js-closure",
      series: "javascript-core",
      seriesOrder: 1,
      category: "dev",
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "js-closure", series: "javascript-core", seriesOrder: 1, category: "dev" }),
      createPostMeta({ slug: "js-this", series: "javascript-core", seriesOrder: 2, category: "dev" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getAdjacentPosts("js-closure");

    expect(result.prev).toBeNull();
    expect(result.next?.slug).toBe("js-this");
  });

  it("마지막 글이면 next가 null이다", () => {
    const currentPost = createPost({
      slug: "js-this",
      series: "javascript-core",
      seriesOrder: 2,
      category: "dev",
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "js-closure", series: "javascript-core", seriesOrder: 1, category: "dev" }),
      createPostMeta({ slug: "js-this", series: "javascript-core", seriesOrder: 2, category: "dev" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getAdjacentPosts("js-this");

    expect(result.prev?.slug).toBe("js-closure");
    expect(result.next).toBeNull();
  });

  it("시리즈가 없는 포스트는 prev/next 모두 null이다", () => {
    const currentPost = createPost({
      slug: "random-post",
      category: "dev",
    });

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue([]);

    const result = service.getAdjacentPosts("random-post");

    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it("존재하지 않는 slug일 때 prev/next 모두 null이다", () => {
    mockRepository.findBySlug.mockReturnValue(null);

    const result = service.getAdjacentPosts("nonexistent");

    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it("다른 시리즈의 포스트는 포함하지 않는다", () => {
    const currentPost = createPost({
      slug: "js-this",
      series: "javascript-core",
      seriesOrder: 2,
      category: "dev",
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "js-closure", series: "javascript-core", seriesOrder: 1, category: "dev" }),
      createPostMeta({ slug: "js-this", series: "javascript-core", seriesOrder: 2, category: "dev" }),
      createPostMeta({ slug: "react-intro", series: "react-basics", seriesOrder: 3, category: "dev" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getAdjacentPosts("js-this");

    expect(result.prev?.slug).toBe("js-closure");
    expect(result.next).toBeNull();
  });

  it("seriesOrder 순서대로 정렬하여 인접 포스트를 찾는다", () => {
    const currentPost = createPost({
      slug: "js-this",
      series: "javascript-core",
      seriesOrder: 2,
      category: "dev",
    });

    // findAll 반환 순서가 seriesOrder와 다른 경우
    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "js-prototype", series: "javascript-core", seriesOrder: 3, category: "dev" }),
      createPostMeta({ slug: "js-closure", series: "javascript-core", seriesOrder: 1, category: "dev" }),
      createPostMeta({ slug: "js-this", series: "javascript-core", seriesOrder: 2, category: "dev" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getAdjacentPosts("js-this");

    expect(result.prev?.slug).toBe("js-closure");
    expect(result.next?.slug).toBe("js-prototype");
  });
});

describe("PostService.getRelatedPosts", () => {
  let mockRepository: jest.Mocked<IPostRepository>;
  let service: PostService;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      findAllSlugs: jest.fn(),
    };
    service = new PostService(mockRepository);
  });

  it("같은 subcategory의 관련 글만 점수 내림차순으로 반환한다", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      subcategory: "frontend",
      tags: ["react", "nextjs"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", subcategory: "frontend", tags: ["react", "nextjs"] }),
      createPostMeta({ slug: "high-score", category: "dev", subcategory: "frontend", tags: ["react", "nextjs"], date: "2025-01-03" }),  // tag(2) = 2
      createPostMeta({ slug: "mid-score", category: "dev", subcategory: "frontend", tags: ["react"], date: "2025-01-02" }),              // tag(1) = 1
      createPostMeta({ slug: "diff-sub", category: "dev", subcategory: "backend", tags: ["react"], date: "2025-01-01" }),                // 다른 subcategory → 제외
      createPostMeta({ slug: "diff-cat", category: "life", tags: ["react"], date: "2025-01-01" }),                                        // 다른 카테고리 → 제외
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 3);

    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("high-score");
    expect(result[1].slug).toBe("mid-score");
    expect(result.every((p) => p.subcategory === "frontend")).toBe(true);
  });

  it("현재 글은 결과에서 제외된다", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      subcategory: "frontend",
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", subcategory: "frontend", tags: ["react"] }),
      createPostMeta({ slug: "other", category: "dev", subcategory: "frontend", tags: ["react"] }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 5);

    expect(result.every((p) => p.slug !== "current")).toBe(true);
    expect(result).toHaveLength(1);
  });

  it("maxCount 이하로 반환한다", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      subcategory: "frontend",
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", subcategory: "frontend", tags: ["react"] }),
      createPostMeta({ slug: "a", category: "dev", subcategory: "frontend", tags: ["react"], date: "2025-01-03" }),
      createPostMeta({ slug: "b", category: "dev", subcategory: "frontend", tags: ["react"], date: "2025-01-02" }),
      createPostMeta({ slug: "c", category: "dev", subcategory: "frontend", tags: ["react"], date: "2025-01-01" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 2);

    expect(result).toHaveLength(2);
  });

  it("점수가 동일하면 날짜 내림차순(최신 우선)으로 정렬한다", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      subcategory: "frontend",
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", subcategory: "frontend", tags: ["react"] }),
      createPostMeta({ slug: "older", category: "dev", subcategory: "frontend", tags: ["react"], date: "2025-01-01" }),
      createPostMeta({ slug: "newer", category: "dev", subcategory: "frontend", tags: ["react"], date: "2025-06-01" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 5);

    expect(result[0].slug).toBe("newer");
    expect(result[1].slug).toBe("older");
  });

  it("같은 subcategory에 관련 tag 없으면 같은 subcategory 최신 글 fallback", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      subcategory: "frontend",
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", subcategory: "frontend", tags: ["react"] }),
      createPostMeta({ slug: "fe-new", category: "dev", subcategory: "frontend", tags: ["svelte"], date: "2025-06-01" }),
      createPostMeta({ slug: "fe-old", category: "dev", subcategory: "frontend", tags: ["angular"], date: "2025-01-01" }),
      createPostMeta({ slug: "be-post", category: "dev", subcategory: "backend", tags: ["react"], date: "2025-07-01" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 3);

    // fallback: 같은 subcategory 최신 글 순서 (backend 제외)
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("fe-new");
    expect(result[1].slug).toBe("fe-old");
    expect(result.every((p) => p.subcategory === "frontend")).toBe(true);
  });

  it("같은 subcategory 글이 없으면 빈 배열 반환", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      subcategory: "frontend",
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", subcategory: "frontend", tags: ["react"] }),
      createPostMeta({ slug: "be-1", category: "dev", subcategory: "backend", tags: ["react"], date: "2025-06-01" }),
      createPostMeta({ slug: "life-1", category: "life", tags: ["travel"], date: "2025-01-01" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 3);

    expect(result).toEqual([]);
  });

  it("존재하지 않는 slug일 때 빈 배열 반환", () => {
    mockRepository.findBySlug.mockReturnValue(null);

    const result = service.getRelatedPosts("nonexistent", 3);

    expect(result).toEqual([]);
  });

  it("포스트가 현재 글 1개뿐이면 빈 배열 반환", () => {
    const currentPost = createPost({
      slug: "only-post",
      category: "dev",
      subcategory: "frontend",
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "only-post", category: "dev", subcategory: "frontend", tags: ["react"] }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("only-post", 3);

    expect(result).toEqual([]);
  });

  it("currentPost에 subcategory가 없으면 빈 배열 반환", () => {
    const currentPost = createPost({
      slug: "no-sub",
      category: "dev",
      subcategory: undefined,
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "no-sub", category: "dev", tags: ["react"] }),
      createPostMeta({ slug: "other", category: "dev", subcategory: "frontend", tags: ["react"] }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("no-sub", 3);

    expect(result).toEqual([]);
  });
});
