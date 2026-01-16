import { FilePostRepository } from "@/repositories/file-post.repository";
import fs from "fs";
import path from "path";

/**
 * FilePostRepository 단위 테스트
 *
 * 파일 시스템을 모킹하여 Repository 로직을 테스트합니다.
 */

jest.mock("fs");
jest.mock("reading-time", () => ({
  __esModule: true,
  default: jest.fn(() => ({ text: "3 min read" })),
}));

const mockedFs = jest.mocked(fs);

describe("FilePostRepository", () => {
  const testPostsDirectory = "/test/content/posts";
  let repository: FilePostRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FilePostRepository(testPostsDirectory);
  });

  describe("findAll - category/subcategory parsing", () => {
    it("should parse category and subcategory from frontmatter", () => {
      const mockFileContent = `---
title: Test Post
date: 2025-01-15
description: Test description
category: 개발
subcategory: React
tags:
  - react
  - typescript
---
# Test Content
`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(["test-post.md"] as unknown as fs.Dirent[]);
      mockedFs.readFileSync.mockReturnValue(mockFileContent);

      const posts = repository.findAll();

      expect(posts).toHaveLength(1);
      expect(posts[0].category).toBe("개발");
      expect(posts[0].subcategory).toBe("React");
    });

    it("should apply default category when category is missing", () => {
      const mockFileContent = `---
title: Test Post Without Category
date: 2025-01-15
description: Test description
tags:
  - test
---
# Test Content
`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(["no-category.md"] as unknown as fs.Dirent[]);
      mockedFs.readFileSync.mockReturnValue(mockFileContent);

      const posts = repository.findAll();

      expect(posts).toHaveLength(1);
      expect(posts[0].category).toBe("미분류");
      expect(posts[0].subcategory).toBeUndefined();
    });

    it("should handle post with category but no subcategory", () => {
      const mockFileContent = `---
title: Test Post
date: 2025-01-15
description: Test description
category: 일상
tags: []
---
# Test Content
`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(["daily-post.md"] as unknown as fs.Dirent[]);
      mockedFs.readFileSync.mockReturnValue(mockFileContent);

      const posts = repository.findAll();

      expect(posts).toHaveLength(1);
      expect(posts[0].category).toBe("일상");
      expect(posts[0].subcategory).toBeUndefined();
    });

    it("should handle multiple posts with different categories", () => {
      const devPost = `---
title: Dev Post
date: 2025-01-15
category: 개발
subcategory: TypeScript
tags: []
---
Content`;

      const dailyPost = `---
title: Daily Post
date: 2025-01-14
category: 일상
tags: []
---
Content`;

      const uncategorizedPost = `---
title: Uncategorized Post
date: 2025-01-13
tags: []
---
Content`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([
        "dev.md",
        "daily.md",
        "uncategorized.md",
      ] as unknown as fs.Dirent[]);
      mockedFs.readFileSync.mockImplementation((filePath) => {
        const fileName = path.basename(filePath as string);
        if (fileName === "dev.md") return devPost;
        if (fileName === "daily.md") return dailyPost;
        return uncategorizedPost;
      });

      const posts = repository.findAll();

      expect(posts).toHaveLength(3);

      const devPostResult = posts.find((p) => p.title === "Dev Post");
      const dailyPostResult = posts.find((p) => p.title === "Daily Post");
      const uncategorizedResult = posts.find(
        (p) => p.title === "Uncategorized Post"
      );

      expect(devPostResult?.category).toBe("개발");
      expect(devPostResult?.subcategory).toBe("TypeScript");
      expect(dailyPostResult?.category).toBe("일상");
      expect(dailyPostResult?.subcategory).toBeUndefined();
      expect(uncategorizedResult?.category).toBe("미분류");
      expect(uncategorizedResult?.subcategory).toBeUndefined();
    });
  });

  describe("findBySlug - category/subcategory parsing", () => {
    it("should parse category and subcategory when finding by slug", () => {
      const mockFileContent = `---
title: Specific Post
date: 2025-01-15
description: Specific description
category: 기술
subcategory: JavaScript
tags:
  - js
---
# Specific Content
`;

      mockedFs.existsSync.mockImplementation((filePath) => {
        return (filePath as string).endsWith("specific-post.md");
      });
      mockedFs.readFileSync.mockReturnValue(mockFileContent);

      const post = repository.findBySlug("specific-post");

      expect(post).not.toBeNull();
      expect(post?.category).toBe("기술");
      expect(post?.subcategory).toBe("JavaScript");
    });

    it("should apply default category when finding by slug with missing category", () => {
      const mockFileContent = `---
title: No Category Post
date: 2025-01-15
tags: []
---
# Content
`;

      mockedFs.existsSync.mockImplementation((filePath) => {
        return (filePath as string).endsWith("no-cat.md");
      });
      mockedFs.readFileSync.mockReturnValue(mockFileContent);

      const post = repository.findBySlug("no-cat");

      expect(post).not.toBeNull();
      expect(post?.category).toBe("미분류");
      expect(post?.subcategory).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should return empty array when directory does not exist", () => {
      mockedFs.existsSync.mockReturnValue(false);

      const posts = repository.findAll();

      expect(posts).toEqual([]);
    });

    it("should handle empty frontmatter gracefully", () => {
      const mockFileContent = `---
---
# Just Content
`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(["empty-frontmatter.md"] as unknown as fs.Dirent[]);
      mockedFs.readFileSync.mockReturnValue(mockFileContent);

      const posts = repository.findAll();

      expect(posts).toHaveLength(1);
      expect(posts[0].category).toBe("미분류");
      expect(posts[0].subcategory).toBeUndefined();
      expect(posts[0].tags).toEqual([]);
    });

    it("should filter only markdown files", () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue([
        "post.md",
        "post.mdx",
        "image.png",
        "data.json",
      ] as unknown as fs.Dirent[]);
      mockedFs.readFileSync.mockReturnValue(`---
title: Test
date: 2025-01-15
---
Content`);

      const posts = repository.findAll();

      expect(posts).toHaveLength(2);
    });
  });
});
