import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import BlogFilter from "@/components/BlogFilter";
import type { PostMeta } from "@/types";

/**
 * BlogFilter 컴포넌트 테스트
 *
 * 카테고리 필터링은 useCategoryFilter 훅과 CategoryTree 컴포넌트에서 처리.
 * BlogFilter는 검색 + 포스트 목록 렌더링만 담당.
 */

// Next.js Link 컴포넌트 모킹
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe("BlogFilter", () => {
  const mockPosts: PostMeta[] = [
    {
      slug: "react-post",
      title: "React 시작하기",
      date: "2025-01-15",
      description: "React 기초 가이드",
      category: "개발",
      subcategory: "React",
      tags: ["react", "frontend"],
      readingTime: "5 min read",
    },
    {
      slug: "typescript-post",
      title: "TypeScript 타입 시스템",
      date: "2025-01-14",
      description: "TypeScript 타입 이해하기",
      category: "개발",
      subcategory: "TypeScript",
      tags: ["typescript"],
      readingTime: "7 min read",
    },
    {
      slug: "travel-post",
      title: "제주도 여행",
      date: "2025-01-13",
      description: "제주도 여행 후기",
      category: "일상",
      tags: ["여행", "제주"],
      readingTime: "3 min read",
    },
  ];

  const defaultProps = {
    posts: mockPosts,
    selectedCategory: null as string | null,
    selectedSubcategory: null as string | null,
  };

  describe("포스트 목록 렌더링", () => {
    it("should render all posts", () => {
      render(<BlogFilter {...defaultProps} />);

      expect(screen.getByText("React 시작하기")).toBeInTheDocument();
      expect(screen.getByText("TypeScript 타입 시스템")).toBeInTheDocument();
      expect(screen.getByText("제주도 여행")).toBeInTheDocument();
    });

    it("should show empty message when no posts exist", () => {
      render(<BlogFilter {...defaultProps} posts={[]} />);

      expect(
        screen.getByText("아직 작성된 포스트가 없습니다.")
      ).toBeInTheDocument();
    });

    it("should show category-specific empty message when category selected", () => {
      render(
        <BlogFilter
          posts={[]}
          selectedCategory="개발"
          selectedSubcategory={null}
        />
      );

      expect(
        screen.getByText("'개발' 카테고리에 포스트가 없습니다.")
      ).toBeInTheDocument();
    });

    it("should show subcategory empty message", () => {
      render(
        <BlogFilter
          posts={[]}
          selectedCategory="개발"
          selectedSubcategory="React"
        />
      );

      expect(
        screen.getByText("'개발 > React' 카테고리에 포스트가 없습니다.")
      ).toBeInTheDocument();
    });
  });

  describe("포스트 메타 정보 렌더링", () => {
    it("should display post category and subcategory", () => {
      render(<BlogFilter {...defaultProps} />);

      const categoryLabels = screen.getAllByText("개발");
      expect(categoryLabels.length).toBeGreaterThan(0);
    });

    it("should display post tags", () => {
      render(<BlogFilter {...defaultProps} />);

      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("frontend")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
    });

    it("should display formatted date", () => {
      render(<BlogFilter {...defaultProps} />);

      expect(screen.getByText(/2025년.*1월.*15일/)).toBeInTheDocument();
    });

    it("should have proper link to blog post", () => {
      render(<BlogFilter {...defaultProps} />);

      const links = screen.getAllByRole("link");
      const reactPostLink = links.find((link) =>
        link.getAttribute("href")?.includes("react-post")
      );
      expect(reactPostLink).toHaveAttribute("href", "/blog/react-post");
    });
  });

  describe("접근성", () => {
    it("should use article element for each post", () => {
      render(<BlogFilter {...defaultProps} />);

      const articles = screen.getAllByRole("article");
      expect(articles).toHaveLength(3);
    });
  });

  describe("검색 기능", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should render search input", () => {
      render(<BlogFilter {...defaultProps} />);

      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should filter posts by search query after debounce", async () => {
      render(<BlogFilter {...defaultProps} />);

      const searchInput = screen.getByRole("searchbox");

      act(() => {
        fireEvent.change(searchInput, { target: { value: "React" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const articles = screen.getAllByRole("article");
        expect(articles).toHaveLength(1);
        expect(
          screen.getByRole("link", { name: /React 시작하기/i })
        ).toBeInTheDocument();
      });
    });

    it("should search Korean text", async () => {
      render(<BlogFilter {...defaultProps} />);

      const searchInput = screen.getByRole("searchbox");

      act(() => {
        fireEvent.change(searchInput, { target: { value: "제주도" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        const articles = screen.getAllByRole("article");
        expect(articles).toHaveLength(1);
        expect(
          screen.getByRole("link", { name: /제주도 여행/i })
        ).toBeInTheDocument();
      });
    });

    it("should show no results message when search has no matches", async () => {
      render(<BlogFilter {...defaultProps} />);

      const searchInput = screen.getByRole("searchbox");

      act(() => {
        fireEvent.change(searchInput, { target: { value: "notexist" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(
          screen.getByText("'notexist'에 대한 검색 결과가 없습니다.")
        ).toBeInTheDocument();
      });
    });
  });
});
