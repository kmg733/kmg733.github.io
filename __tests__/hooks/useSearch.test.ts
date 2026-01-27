import { renderHook, act, waitFor } from "@testing-library/react";
import { useSearch } from "@/hooks/useSearch";
import type { PostMeta } from "@/types";

/**
 * useSearch 훅 테스트
 *
 * TDD: RED → GREEN → REFACTOR
 */

describe("useSearch", () => {
  const mockPosts: PostMeta[] = [
    {
      slug: "react-post",
      title: "React 시작하기",
      date: "2025-01-15",
      description: "React 기초 가이드입니다",
      category: "개발",
      subcategory: "React",
      tags: ["react", "frontend"],
      readingTime: "5 min read",
    },
    {
      slug: "typescript-post",
      title: "TypeScript 타입 시스템",
      date: "2025-01-14",
      description: "TypeScript 타입을 이해하기",
      category: "개발",
      subcategory: "TypeScript",
      tags: ["typescript"],
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

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("초기 상태", () => {
    it("should initialize with empty query", () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      expect(result.current.query).toBe("");
    });

    it("should initialize with empty results", () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      expect(result.current.results).toEqual([]);
    });

    it("should not be searching initially", () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      expect(result.current.isSearching).toBe(false);
    });
  });

  describe("검색어 변경", () => {
    it("should update query when setQuery is called", () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      act(() => {
        result.current.setQuery("React");
      });

      expect(result.current.query).toBe("React");
    });

    it("should set isSearching to true when query changes", () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      act(() => {
        result.current.setQuery("React");
      });

      expect(result.current.isSearching).toBe(true);
    });
  });

  describe("디바운스 동작", () => {
    it("should debounce search by default (300ms)", async () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      act(() => {
        result.current.setQuery("React");
      });

      // 디바운스 전에는 결과가 비어있어야 함
      expect(result.current.results).toEqual([]);

      // 디바운스 시간 경과
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(1);
        expect(result.current.isSearching).toBe(false);
      });
    });

    it("should reset debounce timer on rapid input", () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      act(() => {
        result.current.setQuery("R");
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.setQuery("Re");
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // 아직 디바운스 완료 전
      expect(result.current.results).toEqual([]);

      act(() => {
        result.current.setQuery("React");
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 마지막 검색어로 검색됨
      expect(result.current.results.length).toBe(1);
      expect(result.current.results[0].post.slug).toBe("react-post");
    });

    it("should use custom debounce delay", async () => {
      const { result } = renderHook(() =>
        useSearch(mockPosts, { debounceMs: 500 })
      );

      act(() => {
        result.current.setQuery("React");
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 500ms 전이라 아직 검색 안됨
      expect(result.current.results).toEqual([]);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(1);
      });
    });
  });

  describe("검색 결과", () => {
    it("should return matching posts after debounce", async () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      act(() => {
        result.current.setQuery("React");
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(1);
        expect(result.current.results[0].post.slug).toBe("react-post");
      });
    });

    it("should return empty array for short query", async () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      act(() => {
        result.current.setQuery("R");
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.results).toEqual([]);
        expect(result.current.isSearching).toBe(false);
      });
    });

    it("should clear results when query is cleared", async () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      // 먼저 검색
      act(() => {
        result.current.setQuery("React");
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(1);
      });

      // 검색어 클리어
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.query).toBe("");
      expect(result.current.results).toEqual([]);
    });
  });

  describe("포스트 목록 변경", () => {
    it("should re-search when posts change", async () => {
      const { result, rerender } = renderHook(
        ({ posts }) => useSearch(posts),
        { initialProps: { posts: mockPosts } }
      );

      act(() => {
        result.current.setQuery("React");
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(1);
      });

      // 포스트 목록 변경 (React 포스트 제거)
      const newPosts = mockPosts.filter((p) => p.slug !== "react-post");
      rerender({ posts: newPosts });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.results.length).toBe(0);
      });
    });
  });

  describe("결과 개수", () => {
    it("should return result count", async () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      act(() => {
        result.current.setQuery("frontend");
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.resultCount).toBe(1);
      });
    });

    it("should return 0 when no results", () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      expect(result.current.resultCount).toBe(0);
    });
  });

  describe("활성 검색 상태", () => {
    it("should indicate active search when query exists", async () => {
      const { result } = renderHook(() => useSearch(mockPosts));

      expect(result.current.hasActiveSearch).toBe(false);

      act(() => {
        result.current.setQuery("React");
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.hasActiveSearch).toBe(true);
      });
    });
  });
});
