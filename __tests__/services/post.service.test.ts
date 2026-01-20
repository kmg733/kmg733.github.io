import { PostService } from "@/services/post.service";
import type { IPostRepository } from "@/interfaces";
import type { Post, PostMeta } from "@/types";

/**
 * PostService 단위 테스트
 *
 * Mock Repository를 주입하여 Service 로직만 테스트합니다.
 * (Dependency Inversion 원칙 적용)
 */
describe("PostService", () => {
  // Mock 데이터
  const mockPosts: PostMeta[] = [
    {
      slug: "first-post",
      title: "First Post",
      date: "2025-01-10",
      description: "First description",
      category: "개발",
      subcategory: "React",
      tags: ["tag1", "tag2"],
      readingTime: "2 min read",
    },
    {
      slug: "second-post",
      title: "Second Post",
      date: "2025-01-12",
      description: "Second description",
      category: "개발",
      subcategory: "TypeScript",
      tags: ["tag2", "tag3"],
      readingTime: "3 min read",
    },
    {
      slug: "third-post",
      title: "Third Post",
      date: "2025-01-14",
      description: "Third description",
      category: "일상",
      tags: ["tag4"],
      readingTime: "1 min read",
    },
  ];

  const mockPost: Post = {
    ...mockPosts[0],
    content: "# First Post Content",
  };

  // Mock Repository
  const mockRepository: IPostRepository = {
    findAll: jest.fn(() => mockPosts),
    findBySlug: jest.fn((slug: string) =>
      slug === "first-post" ? mockPost : null
    ),
    findAllSlugs: jest.fn(() => mockPosts.map((p) => p.slug)),
  };

  let postService: PostService;

  beforeEach(() => {
    postService = new PostService(mockRepository);
    jest.clearAllMocks();
  });

  describe("getAllPosts", () => {
    it("should return all posts from repository", () => {
      const result = postService.getAllPosts();

      expect(result).toEqual(mockPosts);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("getRecentPosts", () => {
    it("should return specified number of recent posts", () => {
      const result = postService.getRecentPosts(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPosts[0]);
    });

    it("should return all posts if count exceeds total", () => {
      const result = postService.getRecentPosts(10);

      expect(result).toHaveLength(3);
    });
  });

  describe("getPostBySlug", () => {
    it("should return post when slug exists", () => {
      const result = postService.getPostBySlug("first-post");

      expect(result).toEqual(mockPost);
      expect(mockRepository.findBySlug).toHaveBeenCalledWith("first-post");
    });

    it("should return null when slug does not exist", () => {
      const result = postService.getPostBySlug("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getAllSlugs", () => {
    it("should return all slugs from repository", () => {
      const result = postService.getAllSlugs();

      expect(result).toEqual(["first-post", "second-post", "third-post"]);
      expect(mockRepository.findAllSlugs).toHaveBeenCalledTimes(1);
    });
  });

  describe("getPostsByTag", () => {
    it("should return posts filtered by tag", () => {
      const result = postService.getPostsByTag("tag2");

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no posts have the tag", () => {
      const result = postService.getPostsByTag("non-existent-tag");

      expect(result).toHaveLength(0);
    });
  });

  describe("getAllTags", () => {
    it("should return unique tags from all posts", () => {
      const result = postService.getAllTags();

      expect(result).toEqual(["tag1", "tag2", "tag3", "tag4"]);
    });
  });
});
