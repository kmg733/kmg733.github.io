import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchModal from "../SearchModal";
import type { PostMeta } from "@/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

/** useKeyboardShortcut mock: 콜백을 캡처하여 테스트에서 직접 호출 */
let capturedShortcutCallback: (() => void) | null = null;
jest.mock("../../hooks/useKeyboardShortcut", () => ({
  useKeyboardShortcut: (_key: string, callback: () => void) => {
    capturedShortcutCallback = callback;
  },
}));

/** next/link mock */
jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

/** next/navigation mock */
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function createPostMeta(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    slug: "test-post",
    title: "Test Post",
    date: "2025-01-01",
    description: "Test description",
    category: "Dev",
    tags: ["test"],
    readingTime: "5 min read",
    ...overrides,
  };
}

const samplePosts: PostMeta[] = [
  createPostMeta({
    slug: "javascript-closure",
    title: "JavaScript Closure",
    description: "Understanding closures in JavaScript",
    category: "JavaScript",
    tags: ["javascript", "closure"],
  }),
  createPostMeta({
    slug: "react-hooks",
    title: "React Hooks Guide",
    description: "Complete guide to React hooks",
    category: "React",
    tags: ["react", "hooks"],
  }),
  createPostMeta({
    slug: "nextjs-routing",
    title: "Next.js Routing",
    description: "App router patterns in Next.js",
    category: "Next.js",
    tags: ["nextjs", "routing"],
  }),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 모달을 여는 헬퍼: useKeyboardShortcut에 캡처된 콜백 호출 */
function openModal() {
  act(() => {
    capturedShortcutCallback?.();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SearchModal", () => {
  beforeEach(() => {
    capturedShortcutCallback = null;
    mockPush.mockClear();
  });

  // ─────────────────────────────────────────────────────
  // 1. 초기 상태
  // ─────────────────────────────────────────────────────
  describe("초기 상태", () => {
    test("초기 렌더 시 모달이 보이지 않는다", () => {
      render(<SearchModal posts={samplePosts} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 모달 열기
  // ─────────────────────────────────────────────────────
  describe("모달 열기", () => {
    test("키보드 단축키로 모달이 열린다", () => {
      render(<SearchModal posts={samplePosts} />);

      openModal();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    test("모달 열림 시 검색 입력 필드가 존재한다", () => {
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      expect(searchInput).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 검색 동작
  // ─────────────────────────────────────────────────────
  describe("검색 동작", () => {
    test("검색어 입력 시 일치하는 결과가 표시된다", async () => {
      jest.useFakeTimers();
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "closure" } });
      });

      // useSearch 디바운스 대기 (300ms)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // highlightText가 mark 태그로 감싸므로 link로 검색
      expect(
        screen.getByRole("link", { name: /JavaScript Closure/i })
      ).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 결과 표시
  // ─────────────────────────────────────────────────────
  describe("결과 표시", () => {
    test("검색 결과에 제목, 설명, 카테고리가 표시된다", async () => {
      jest.useFakeTimers();
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "closure" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 제목 (link 내부, highlightText로 mark 태그 포함 가능)
      expect(
        screen.getByRole("link", { name: /JavaScript Closure/i })
      ).toBeInTheDocument();
      // 설명
      expect(
        screen.getByText("Understanding closures in JavaScript")
      ).toBeInTheDocument();
      // 카테고리 (search-modal-result-category 클래스 내)
      const categoryEl = document.querySelector(
        ".search-modal-result-category"
      );
      expect(categoryEl).toBeInTheDocument();
      expect(categoryEl).toHaveTextContent("JavaScript");

      jest.useRealTimers();
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 포스트 이동
  // ─────────────────────────────────────────────────────
  describe("포스트 이동", () => {
    test("검색 결과 클릭 시 올바른 URL 링크가 존재한다", async () => {
      jest.useFakeTimers();
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "closure" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      const link = screen.getByRole("link", { name: /JavaScript Closure/i });
      expect(link).toHaveAttribute("href", "/blog/javascript-closure");

      jest.useRealTimers();
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. ESC로 닫기
  // ─────────────────────────────────────────────────────
  describe("ESC로 닫기", () => {
    test("ESC 키를 누르면 모달이 닫힌다", () => {
      render(<SearchModal posts={samplePosts} />);

      openModal();

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 7. 오버레이 클릭으로 닫기
  // ─────────────────────────────────────────────────────
  describe("오버레이 클릭으로 닫기", () => {
    test("배경 오버레이 클릭 시 모달이 닫힌다", () => {
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const dialog = screen.getByRole("dialog");

      act(() => {
        fireEvent.click(dialog);
      });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("모달 콘텐츠 영역 클릭은 닫기를 트리거하지 않는다", () => {
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");

      act(() => {
        fireEvent.click(searchInput);
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 8. 결과 없음
  // ─────────────────────────────────────────────────────
  describe("결과 없음", () => {
    test("검색 결과가 없을 때 안내 메시지가 표시된다", async () => {
      jest.useFakeTimers();
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      await act(async () => {
        fireEvent.change(searchInput, {
          target: { value: "zzzznotexist" },
        });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByText(/검색 결과가 없습니다/)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  // ─────────────────────────────────────────────────────
  // 9. 키보드 네비게이션
  // ─────────────────────────────────────────────────────
  describe("키보드 네비게이션", () => {
    test("ArrowDown 키로 검색 결과 항목을 탐색할 수 있다", async () => {
      jest.useFakeTimers();
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      await act(async () => {
        // "React"와 "Next.js" 모두 매칭되는 넓은 검색어
        fireEvent.change(searchInput, { target: { value: "guide" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // ArrowDown으로 첫 번째 결과 항목 선택
      act(() => {
        fireEvent.keyDown(searchInput, { key: "ArrowDown" });
      });

      const resultItems = screen.getAllByRole("option");
      expect(resultItems[0]).toHaveAttribute("aria-selected", "true");

      jest.useRealTimers();
    });

    test("ArrowUp 키로 이전 결과 항목으로 이동할 수 있다", async () => {
      jest.useFakeTimers();
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "guide" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // ArrowDown 두 번 누른 후
      act(() => {
        fireEvent.keyDown(searchInput, { key: "ArrowDown" });
      });
      act(() => {
        fireEvent.keyDown(searchInput, { key: "ArrowDown" });
      });

      // ArrowUp으로 이전 항목으로
      act(() => {
        fireEvent.keyDown(searchInput, { key: "ArrowUp" });
      });

      const resultItems = screen.getAllByRole("option");
      expect(resultItems[0]).toHaveAttribute("aria-selected", "true");

      jest.useRealTimers();
    });

    test("Enter 키로 선택된 결과 항목의 페이지로 이동한다", async () => {
      jest.useFakeTimers();
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "React Hooks" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // ArrowDown으로 첫 번째 항목 선택 후 Enter
      act(() => {
        fireEvent.keyDown(searchInput, { key: "ArrowDown" });
      });
      act(() => {
        fireEvent.keyDown(searchInput, { key: "Enter" });
      });

      expect(mockPush).toHaveBeenCalledWith("/blog/react-hooks");

      jest.useRealTimers();
    });
  });

  // ─────────────────────────────────────────────────────
  // 10. 접근성
  // ─────────────────────────────────────────────────────
  describe("접근성", () => {
    test("모달에 role=dialog와 aria-modal=true가 설정된다", () => {
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    test("검색 입력 필드에 적절한 aria-label이 있다", () => {
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      expect(searchInput).toHaveAttribute("aria-label");
    });

    test("검색 결과 목록에 role=listbox가 설정된다", async () => {
      jest.useFakeTimers();
      render(<SearchModal posts={samplePosts} />);

      openModal();

      const searchInput = screen.getByRole("searchbox");
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "JavaScript" } });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByRole("listbox")).toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});
