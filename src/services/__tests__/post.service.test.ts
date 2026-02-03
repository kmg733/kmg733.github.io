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

  it("관련 글이 있을 때 점수 내림차순으로 반환한다", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      subcategory: "frontend",
      tags: ["react", "nextjs"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", subcategory: "frontend", tags: ["react", "nextjs"] }),
      createPostMeta({ slug: "high-score", category: "dev", subcategory: "frontend", tags: ["react"], date: "2025-01-03" }),  // sub(3) + cat(2) + tag(1) = 6
      createPostMeta({ slug: "mid-score", category: "dev", subcategory: "backend", tags: ["nextjs"], date: "2025-01-02" }),   // cat(2) + tag(1) = 3
      createPostMeta({ slug: "low-score", category: "life", tags: ["react"], date: "2025-01-01" }),                            // tag(1) = 1
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 3);

    expect(result).toHaveLength(3);
    expect(result[0].slug).toBe("high-score");
    expect(result[1].slug).toBe("mid-score");
    expect(result[2].slug).toBe("low-score");
  });

  it("현재 글은 결과에서 제외된다", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", tags: ["react"] }),
      createPostMeta({ slug: "other", category: "dev", tags: ["react"] }),
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
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", tags: ["react"] }),
      createPostMeta({ slug: "a", category: "dev", tags: ["react"], date: "2025-01-03" }),
      createPostMeta({ slug: "b", category: "dev", tags: ["react"], date: "2025-01-02" }),
      createPostMeta({ slug: "c", category: "dev", tags: ["react"], date: "2025-01-01" }),
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
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", tags: ["react"] }),
      createPostMeta({ slug: "older", category: "dev", tags: ["react"], date: "2025-01-01" }),
      createPostMeta({ slug: "newer", category: "dev", tags: ["react"], date: "2025-06-01" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 5);

    expect(result[0].slug).toBe("newer");
    expect(result[1].slug).toBe("older");
  });

  it("관련 글이 없을 때(점수 0점만) 최신 글 fallback", () => {
    const currentPost = createPost({
      slug: "current",
      category: "dev",
      subcategory: "frontend",
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "current", category: "dev", subcategory: "frontend", tags: ["react"] }),
      createPostMeta({ slug: "unrelated-new", category: "life", tags: ["travel"], date: "2025-06-01" }),
      createPostMeta({ slug: "unrelated-old", category: "life", tags: ["food"], date: "2025-01-01" }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("current", 3);

    // fallback: 최신 글 순서
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("unrelated-new");
    expect(result[1].slug).toBe("unrelated-old");
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
      tags: ["react"],
    });

    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "only-post", category: "dev", tags: ["react"] }),
    ];

    mockRepository.findBySlug.mockReturnValue(currentPost);
    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getRelatedPosts("only-post", 3);

    expect(result).toEqual([]);
  });
});
