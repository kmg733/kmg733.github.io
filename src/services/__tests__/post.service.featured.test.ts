import { PostService } from "../post.service";
import type { IPostRepository } from "@/interfaces";
import type { PostMeta } from "@/types";

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

describe("PostService.getFeaturedPosts", () => {
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

  it("각 서브카테고리에서 최신 1개씩 선별한다", () => {
    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "js-new", subcategory: "JavaScript", date: "2025-06-01" }),
      createPostMeta({ slug: "js-old", subcategory: "JavaScript", date: "2025-01-01" }),
      createPostMeta({ slug: "java-new", subcategory: "Java", date: "2025-05-01" }),
      createPostMeta({ slug: "java-old", subcategory: "Java", date: "2025-02-01" }),
    ];

    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getFeaturedPosts(5);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.slug)).toContain("js-new");
    expect(result.map((p) => p.slug)).toContain("java-new");
    expect(result.map((p) => p.slug)).not.toContain("js-old");
  });

  it("포스트 수가 많은 서브카테고리가 우선 선택된다", () => {
    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "java-1", subcategory: "Java", date: "2025-06-01" }),
      createPostMeta({ slug: "java-2", subcategory: "Java", date: "2025-05-01" }),
      createPostMeta({ slug: "java-3", subcategory: "Java", date: "2025-04-01" }),
      createPostMeta({ slug: "js-1", subcategory: "JavaScript", date: "2025-06-01" }),
      createPostMeta({ slug: "web-1", subcategory: "웹", date: "2025-06-01" }),
    ];

    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getFeaturedPosts(2);

    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("java-1");
  });

  it("count 이하로 반환한다", () => {
    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "js-1", subcategory: "JavaScript", date: "2025-06-01" }),
      createPostMeta({ slug: "java-1", subcategory: "Java", date: "2025-05-01" }),
      createPostMeta({ slug: "web-1", subcategory: "웹", date: "2025-04-01" }),
      createPostMeta({ slug: "db-1", subcategory: "Database", date: "2025-03-01" }),
    ];

    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getFeaturedPosts(2);

    expect(result).toHaveLength(2);
  });

  it("subcategory가 없는 포스트는 제외된다", () => {
    const allPosts: PostMeta[] = [
      createPostMeta({ slug: "no-sub", date: "2025-06-01" }),
      createPostMeta({ slug: "js-1", subcategory: "JavaScript", date: "2025-05-01" }),
    ];

    mockRepository.findAll.mockReturnValue(allPosts);

    const result = service.getFeaturedPosts(5);

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("js-1");
  });

  it("포스트가 없으면 빈 배열을 반환한다", () => {
    mockRepository.findAll.mockReturnValue([]);

    const result = service.getFeaturedPosts(5);

    expect(result).toEqual([]);
  });
});
