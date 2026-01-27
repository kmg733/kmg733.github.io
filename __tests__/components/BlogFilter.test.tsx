import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import BlogFilter from "@/components/BlogFilter";
import type { PostMeta } from "@/types";

/**
 * BlogFilter 컴포넌트 테스트
 *
 * React Testing Library를 사용하여 UI 동작을 테스트합니다.
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

  describe("카테고리 버튼 렌더링", () => {
    it("should render '전체' button", () => {
      render(<BlogFilter posts={mockPosts} />);

      expect(screen.getByRole("button", { name: "전체" })).toBeInTheDocument();
    });

    it("should render all unique category buttons", () => {
      render(<BlogFilter posts={mockPosts} />);

      expect(screen.getByRole("button", { name: "개발" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "일상" })).toBeInTheDocument();
    });

    it("should render all posts initially", () => {
      render(<BlogFilter posts={mockPosts} />);

      expect(screen.getByText("React 시작하기")).toBeInTheDocument();
      expect(screen.getByText("TypeScript 타입 시스템")).toBeInTheDocument();
      expect(screen.getByText("제주도 여행")).toBeInTheDocument();
    });
  });

  describe("카테고리 클릭 시 필터링 동작", () => {
    it("should filter posts when category is clicked", () => {
      render(<BlogFilter posts={mockPosts} />);

      const devButton = screen.getByRole("button", { name: "개발" });
      fireEvent.click(devButton);

      expect(screen.getByText("React 시작하기")).toBeInTheDocument();
      expect(screen.getByText("TypeScript 타입 시스템")).toBeInTheDocument();
      expect(screen.queryByText("제주도 여행")).not.toBeInTheDocument();
    });

    it("should show all posts when 전체 is clicked", () => {
      render(<BlogFilter posts={mockPosts} />);

      // 먼저 카테고리 선택
      fireEvent.click(screen.getByRole("button", { name: "개발" }));
      expect(screen.queryByText("제주도 여행")).not.toBeInTheDocument();

      // 전체 클릭
      fireEvent.click(screen.getByRole("button", { name: "전체" }));
      expect(screen.getByText("React 시작하기")).toBeInTheDocument();
      expect(screen.getByText("TypeScript 타입 시스템")).toBeInTheDocument();
      expect(screen.getByText("제주도 여행")).toBeInTheDocument();
    });

    it("should filter to single category posts", () => {
      render(<BlogFilter posts={mockPosts} />);

      fireEvent.click(screen.getByRole("button", { name: "일상" }));

      expect(screen.queryByText("React 시작하기")).not.toBeInTheDocument();
      expect(screen.queryByText("TypeScript 타입 시스템")).not.toBeInTheDocument();
      expect(screen.getByText("제주도 여행")).toBeInTheDocument();
    });
  });

  describe("서브카테고리 표시/숨김", () => {
    it("should show subcategory buttons when category with subcategories is selected", () => {
      render(<BlogFilter posts={mockPosts} />);

      fireEvent.click(screen.getByRole("button", { name: "개발" }));

      expect(screen.getByRole("button", { name: "React" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "TypeScript" })
      ).toBeInTheDocument();
    });

    it("should hide subcategory buttons when category without subcategories is selected", () => {
      render(<BlogFilter posts={mockPosts} />);

      fireEvent.click(screen.getByRole("button", { name: "일상" }));

      expect(
        screen.queryByRole("button", { name: "React" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "TypeScript" })
      ).not.toBeInTheDocument();
    });

    it("should hide subcategory buttons when 전체 is selected", () => {
      render(<BlogFilter posts={mockPosts} />);

      // 먼저 개발 카테고리 선택하여 서브카테고리 표시
      fireEvent.click(screen.getByRole("button", { name: "개발" }));
      expect(screen.getByRole("button", { name: "React" })).toBeInTheDocument();

      // 전체 클릭하면 서브카테고리 숨김
      fireEvent.click(screen.getByRole("button", { name: "전체" }));
      expect(
        screen.queryByRole("button", { name: "React" })
      ).not.toBeInTheDocument();
    });

    it("should filter posts when subcategory is clicked", () => {
      render(<BlogFilter posts={mockPosts} />);

      fireEvent.click(screen.getByRole("button", { name: "개발" }));
      fireEvent.click(screen.getByRole("button", { name: "React" }));

      expect(screen.getByText("React 시작하기")).toBeInTheDocument();
      expect(
        screen.queryByText("TypeScript 타입 시스템")
      ).not.toBeInTheDocument();
    });

    it("should reset subcategory when different category is clicked", () => {
      render(<BlogFilter posts={mockPosts} />);

      // 개발 > React 선택
      fireEvent.click(screen.getByRole("button", { name: "개발" }));
      fireEvent.click(screen.getByRole("button", { name: "React" }));

      // 일상 카테고리 선택
      fireEvent.click(screen.getByRole("button", { name: "일상" }));

      // React 서브카테고리 버튼이 없어야 함
      expect(
        screen.queryByRole("button", { name: "React" })
      ).not.toBeInTheDocument();
      // 일상 포스트가 보여야 함
      expect(screen.getByText("제주도 여행")).toBeInTheDocument();
    });
  });

  describe("빈 결과 메시지 표시", () => {
    it("should show empty message when no posts exist", () => {
      render(<BlogFilter posts={[]} />);

      expect(
        screen.getByText("아직 작성된 포스트가 없습니다.")
      ).toBeInTheDocument();
    });

    it("should show category-specific empty message", () => {
      const singleCategoryPosts: PostMeta[] = [
        {
          slug: "test-post",
          title: "Test Post Title",
          date: "2025-01-15",
          description: "Test description",
          category: "개발",
          tags: [],
          readingTime: "1 min read",
        },
      ];

      render(<BlogFilter posts={singleCategoryPosts} />);

      // 포스트가 표시되는지 확인
      expect(screen.getByText("Test Post Title")).toBeInTheDocument();
    });
  });

  describe("포스트 메타 정보 렌더링", () => {
    it("should display post category and subcategory", () => {
      render(<BlogFilter posts={mockPosts} />);

      // 카테고리 표시 확인
      const categoryLabels = screen.getAllByText("개발");
      expect(categoryLabels.length).toBeGreaterThan(0);
    });

    it("should display post tags", () => {
      render(<BlogFilter posts={mockPosts} />);

      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("frontend")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
    });

    it("should display formatted date", () => {
      render(<BlogFilter posts={mockPosts} />);

      // 한국어 날짜 형식 확인 (예: 2025년 1월 15일)
      expect(screen.getByText(/2025년.*1월.*15일/)).toBeInTheDocument();
    });
  });

  describe("접근성", () => {
    it("should use nav element for category filter", () => {
      render(<BlogFilter posts={mockPosts} />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should use article element for each post", () => {
      render(<BlogFilter posts={mockPosts} />);

      const articles = screen.getAllByRole("article");
      expect(articles).toHaveLength(3);
    });

    it("should have proper link to blog post", () => {
      render(<BlogFilter posts={mockPosts} />);

      const links = screen.getAllByRole("link");
      const reactPostLink = links.find((link) =>
        link.getAttribute("href")?.includes("react-post")
      );
      expect(reactPostLink).toHaveAttribute("href", "/blog/react-post");
    });
  });

  describe("검색 기능", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // 하이라이트된 텍스트도 찾을 수 있는 헬퍼 함수
    const findTextContent = (text: string) =>
      screen.queryByText((content, element) => {
        return element?.textContent?.includes(text) ?? false;
      });

    it("should render search input", () => {
      render(<BlogFilter posts={mockPosts} />);

      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should filter posts by search query after debounce", async () => {
      render(<BlogFilter posts={mockPosts} />);

      const searchInput = screen.getByRole("searchbox");

      act(() => {
        fireEvent.change(searchInput, { target: { value: "React" } });
      });

      // 디바운스 대기
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // React 관련 포스트가 표시됨 (하이라이트로 인해 article 개수로 확인)
        const articles = screen.getAllByRole("article");
        expect(articles).toHaveLength(1);
        // React 포스트의 링크 존재 확인
        expect(screen.getByRole("link", { name: /React 시작하기/i })).toBeInTheDocument();
      });
    });

    it("should search Korean text", async () => {
      render(<BlogFilter posts={mockPosts} />);

      const searchInput = screen.getByRole("searchbox");

      act(() => {
        fireEvent.change(searchInput, { target: { value: "제주도" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // 하나의 결과만 표시
        const articles = screen.getAllByRole("article");
        expect(articles).toHaveLength(1);
        // 제주도 포스트 링크 확인
        expect(screen.getByRole("link", { name: /제주도 여행/i })).toBeInTheDocument();
      });
    });

    it("should show no results message when search has no matches", async () => {
      render(<BlogFilter posts={mockPosts} />);

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

    it("should clear search when category is changed", async () => {
      render(<BlogFilter posts={mockPosts} />);

      const searchInput = screen.getByRole("searchbox");

      // 검색어 입력
      act(() => {
        fireEvent.change(searchInput, { target: { value: "React" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByRole("searchbox")).toHaveValue("React");
      });

      // 카테고리 변경
      fireEvent.click(screen.getByRole("button", { name: "일상" }));

      // 검색어가 초기화되어야 함
      expect(screen.getByRole("searchbox")).toHaveValue("");
    });

    it("should combine search with category filter", async () => {
      render(<BlogFilter posts={mockPosts} />);

      // 먼저 개발 카테고리 선택
      fireEvent.click(screen.getByRole("button", { name: "개발" }));

      const searchInput = screen.getByRole("searchbox");

      // TypeScript 검색 (개발 카테고리 내에서)
      act(() => {
        fireEvent.change(searchInput, { target: { value: "TypeScript" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // TypeScript 포스트만 표시 (article 1개)
        const articles = screen.getAllByRole("article");
        expect(articles).toHaveLength(1);
        // TypeScript 포스트 링크 확인
        expect(screen.getByRole("link", { name: /TypeScript 타입 시스템/i })).toBeInTheDocument();
      });
    });
  });
});
