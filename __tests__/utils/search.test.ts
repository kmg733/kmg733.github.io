import { searchPosts, highlightText, findMatchIndices } from "@/utils/search";
import type { PostMeta } from "@/types";

/**
 * 검색 유틸리티 테스트
 *
 * TDD: RED → GREEN → REFACTOR
 */

describe("searchPosts", () => {
  const mockPosts: PostMeta[] = [
    {
      slug: "react-post",
      title: "React 시작하기",
      date: "2025-01-15",
      description: "React 기초 가이드입니다",
      category: "개발",
      subcategory: "React",
      tags: ["react", "frontend", "javascript"],
      readingTime: "5 min read",
    },
    {
      slug: "typescript-post",
      title: "TypeScript 타입 시스템",
      date: "2025-01-14",
      description: "TypeScript 타입을 이해하기",
      category: "개발",
      subcategory: "TypeScript",
      tags: ["typescript", "frontend"],
      readingTime: "7 min read",
    },
    {
      slug: "travel-post",
      title: "제주도 여행",
      date: "2025-01-13",
      description: "제주도 여행 후기입니다",
      category: "일상",
      tags: ["여행", "제주"],
      readingTime: "3 min read",
    },
  ];

  describe("기본 검색 동작", () => {
    it("should return empty array for empty query", () => {
      const results = searchPosts(mockPosts, "");
      expect(results).toEqual([]);
    });

    it("should return empty array for query shorter than minQueryLength", () => {
      const results = searchPosts(mockPosts, "R");
      expect(results).toEqual([]);
    });

    it("should search with minQueryLength 1 when option is set", () => {
      const results = searchPosts(mockPosts, "R", { minQueryLength: 1 });
      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array when no matches found", () => {
      const results = searchPosts(mockPosts, "notexist");
      expect(results).toEqual([]);
    });
  });

  describe("제목 검색", () => {
    it("should find posts by title", () => {
      const results = searchPosts(mockPosts, "React");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("react-post");
    });

    it("should be case insensitive by default", () => {
      const results = searchPosts(mockPosts, "react");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("react-post");
    });

    it("should find Korean title", () => {
      const results = searchPosts(mockPosts, "제주도");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("travel-post");
    });

    it("should include match information for title", () => {
      const results = searchPosts(mockPosts, "React");
      const titleMatch = results[0].matches.find((m) => m.field === "title");
      expect(titleMatch).toBeDefined();
      expect(titleMatch?.indices.length).toBeGreaterThan(0);
    });
  });

  describe("설명(description) 검색", () => {
    it("should find posts by description", () => {
      const results = searchPosts(mockPosts, "기초");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("react-post");
    });

    it("should find Korean description", () => {
      const results = searchPosts(mockPosts, "후기");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("travel-post");
    });
  });

  describe("태그 검색", () => {
    it("should find posts by tag", () => {
      const results = searchPosts(mockPosts, "javascript");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("react-post");
    });

    it("should find posts with common tag", () => {
      const results = searchPosts(mockPosts, "frontend");
      expect(results.length).toBe(2);
    });

    it("should find Korean tag", () => {
      const results = searchPosts(mockPosts, "여행");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("travel-post");
    });
  });

  describe("복합 검색 및 점수", () => {
    it("should return results sorted by score (highest first)", () => {
      // 'typescript'는 제목, 설명, 태그에 모두 있음
      const results = searchPosts(mockPosts, "typescript");
      expect(results.length).toBeGreaterThan(0);
      // 결과가 점수 순으로 정렬되어 있는지 확인
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it("should give higher score to title matches", () => {
      // 'React'는 제목에 있는 포스트가 높은 점수
      const results = searchPosts(mockPosts, "React");
      expect(results[0].post.slug).toBe("react-post");
      expect(results[0].score).toBeGreaterThan(0);
    });

    it("should find posts matching multiple fields", () => {
      const results = searchPosts(mockPosts, "React");
      const match = results[0];
      // 제목과 태그 모두에서 매치
      expect(match.matches.some((m) => m.field === "title")).toBe(true);
      expect(match.matches.some((m) => m.field === "tags")).toBe(true);
    });
  });

  describe("부분 문자열 매칭", () => {
    it("should match partial strings", () => {
      const results = searchPosts(mockPosts, "Type");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("typescript-post");
    });

    it("should match Korean partial strings", () => {
      const results = searchPosts(mockPosts, "시작");
      expect(results.length).toBe(1);
      expect(results[0].post.slug).toBe("react-post");
    });
  });
});

describe("findMatchIndices", () => {
  it("should return empty array for no match", () => {
    const indices = findMatchIndices("hello world", "xyz");
    expect(indices).toEqual([]);
  });

  it("should find single match", () => {
    const indices = findMatchIndices("hello world", "world");
    expect(indices).toEqual([[6, 11]]);
  });

  it("should find multiple matches", () => {
    const indices = findMatchIndices("hello hello hello", "hello");
    expect(indices).toEqual([
      [0, 5],
      [6, 11],
      [12, 17],
    ]);
  });

  it("should be case insensitive", () => {
    const indices = findMatchIndices("Hello HELLO hello", "hello");
    expect(indices.length).toBe(3);
  });

  it("should find Korean matches", () => {
    const indices = findMatchIndices("제주도 여행 후기", "여행");
    expect(indices).toEqual([[4, 6]]);
  });
});

describe("highlightText", () => {
  it("should return original text when no query", () => {
    const result = highlightText("hello world", "");
    expect(result).toBe("hello world");
  });

  it("should return original text when no match", () => {
    const result = highlightText("hello world", "xyz");
    expect(result).toBe("hello world");
  });

  it("should wrap matched text with mark tag", () => {
    const result = highlightText("hello world", "world");
    expect(result).toBe('hello <mark class="search-highlight">world</mark>');
  });

  it("should highlight multiple matches", () => {
    const result = highlightText("hello hello", "hello");
    expect(result).toBe(
      '<mark class="search-highlight">hello</mark> <mark class="search-highlight">hello</mark>'
    );
  });

  it("should be case insensitive but preserve original case", () => {
    const result = highlightText("Hello WORLD", "hello");
    expect(result).toBe('<mark class="search-highlight">Hello</mark> WORLD');
  });

  it("should highlight Korean text", () => {
    const result = highlightText("제주도 여행", "여행");
    expect(result).toBe('제주도 <mark class="search-highlight">여행</mark>');
  });

  it("should handle special regex characters safely", () => {
    const result = highlightText("hello (world)", "(world)");
    expect(result).toBe('hello <mark class="search-highlight">(world)</mark>');
  });

  describe("XSS 방지", () => {
    it("should escape HTML characters in text", () => {
      const result = highlightText("<script>alert('xss')</script>", "test");
      expect(result).toBe("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    });

    it("should escape HTML characters in text even when matching", () => {
      const result = highlightText("<script>alert</script>", "alert");
      expect(result).toBe(
        '&lt;script&gt;<mark class="search-highlight">alert</mark>&lt;/script&gt;'
      );
    });

    it("should escape HTML characters in query", () => {
      const result = highlightText("test <b>bold</b> text", "<b>");
      expect(result).toBe(
        'test <mark class="search-highlight">&lt;b&gt;</mark>bold&lt;/b&gt; text'
      );
    });

    it("should escape ampersand in text", () => {
      const result = highlightText("Tom & Jerry", "Tom");
      expect(result).toBe(
        '<mark class="search-highlight">Tom</mark> &amp; Jerry'
      );
    });

    it("should escape quotes in text", () => {
      const result = highlightText('Say "hello"', "hello");
      expect(result).toBe(
        'Say &quot;<mark class="search-highlight">hello</mark>&quot;'
      );
    });

    it("should escape HTML when no query provided", () => {
      const result = highlightText("<div>test</div>", "");
      expect(result).toBe("&lt;div&gt;test&lt;/div&gt;");
    });

    it("should prevent onclick attribute injection", () => {
      const result = highlightText('Click <a onclick="evil()">here</a>', "here");
      // onclick 속성이 실행되지 않도록 < > " 가 이스케이프되어야 함
      expect(result).toContain("&lt;a");
      expect(result).toContain('onclick=&quot;');
      expect(result).not.toContain('<a onclick');
    });
  });
});
