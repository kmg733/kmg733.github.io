import { render, screen, act, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TableOfContents from "../TableOfContents";
import type { TocItem } from "@/lib/toc";

/**
 * TableOfContents 컴포넌트 테스트.
 *
 * 핵심 이슈: 빠른 스크롤 시 IntersectionObserver Last-Write-Wins 문제
 * - 다수의 entry가 동시에 isIntersecting=true → 마지막이 승리 (부정확)
 * - 수정 방향: Observer는 트리거 역할만, getBoundingClientRect로 실제 active 결정
 */

// ─────────────────────────────────────────────────────
// IntersectionObserver 모킹 인프라
// ─────────────────────────────────────────────────────

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

let observerCallback: ObserverCallback | null = null;
let observedElements: Element[] = [];

const mockObserve = jest.fn((el: Element) => {
  observedElements.push(el);
});
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn(() => {
  observedElements = [];
});

class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }
  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// ─────────────────────────────────────────────────────
// scrollAndHighlight 모킹 (사이드이펙트 제거)
// ─────────────────────────────────────────────────────

jest.mock("@/lib/scrollHighlight", () => ({
  scrollAndHighlight: jest.fn(),
}));

// ─────────────────────────────────────────────────────
// localStorage 모킹
// ─────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// ─────────────────────────────────────────────────────
// 테스트 픽스처
// ─────────────────────────────────────────────────────

const headings: TocItem[] = [
  { slug: "intro", text: "소개", level: 2 },
  { slug: "setup", text: "설치", level: 2 },
  { slug: "usage", text: "사용법", level: 2 },
  { slug: "advanced", text: "고급", level: 3 },
];

/**
 * document.getElementById를 모킹하여 각 heading에 getBoundingClientRect를 설정한다.
 * tops: { slug → clientRect.top } 형태로 전달.
 */
function mockHeadingRects(tops: Record<string, number>) {
  jest.spyOn(document, "getElementById").mockImplementation((id: string) => {
    if (tops[id] !== undefined) {
      return {
        id,
        getBoundingClientRect: () => ({ top: tops[id] }),
        scrollIntoView: jest.fn(),
      } as unknown as HTMLElement;
    }
    return null;
  });
}

/**
 * IntersectionObserver 콜백을 강제 트리거한다.
 * entries: 교차 상태가 변경된 heading entry 목록.
 */
function triggerObserver(
  entries: Array<{ slug: string; isIntersecting: boolean }>
) {
  if (!observerCallback) return;
  act(() => {
    observerCallback!(
      entries.map(({ slug, isIntersecting }) => ({
        target: { id: slug } as Element,
        isIntersecting,
      })) as unknown as IntersectionObserverEntry[]
    );
  });
}

// ─────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────

describe("TableOfContents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    observerCallback = null;
    observedElements = [];
    localStorageMock.clear();
    jest.spyOn(document, "getElementById").mockRestore?.();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────
  // 1. 렌더링
  // ─────────────────────────────────────────────────────
  describe("렌더링", () => {
    test("headings 배열의 모든 항목이 렌더링된다", () => {
      render(<TableOfContents headings={headings} />);

      expect(screen.getByText("소개")).toBeInTheDocument();
      expect(screen.getByText("설치")).toBeInTheDocument();
      expect(screen.getByText("사용법")).toBeInTheDocument();
      expect(screen.getByText("고급")).toBeInTheDocument();
    });

    test("headings가 빈 배열이면 null을 반환한다", () => {
      const { container } = render(<TableOfContents headings={[]} />);
      expect(container.firstChild).toBeNull();
    });

    test("level 3 heading은 padding-left가 적용된다", () => {
      render(<TableOfContents headings={headings} />);

      const advancedLink = screen.getByText("고급").closest("li");
      expect(advancedLink).toHaveStyle({ paddingLeft: "1rem" });
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 빠른 스크롤 - active heading 정확도 (핵심 버그 수정)
  // ─────────────────────────────────────────────────────
  describe("빠른 스크롤 시 active heading 정확도", () => {
    test("여러 entry가 동시에 isIntersecting=true일 때, viewport 상단에 가장 가까운 heading이 active가 된다", () => {
      /**
       * 빠른 스크롤로 intro(top=10), setup(top=50) 둘 다 교차 상태
       * → 80px 이하이며 가장 큰 top 값인 setup이 active여야 한다
       * (Last-Write-Wins 버그: 기존 코드는 마지막 entry인 setup이 우연히 맞을 수도 있으나,
       *  entries 순서가 바뀌면 틀린다. 새 구현은 getBoundingClientRect 기반으로 정확히 결정)
       */
      mockHeadingRects({ intro: 10, setup: 50, usage: 200, advanced: 400 });

      render(<TableOfContents headings={headings} />);

      // intro, setup 두 개 동시에 intersecting (빠른 스크롤 시뮬레이션)
      triggerObserver([
        { slug: "intro", isIntersecting: true },
        { slug: "setup", isIntersecting: true },
      ]);

      // viewport 상단 기준 (top <= 80), 가장 아래에 있는 것 = setup
      const setupLink = screen.getByText("설치").closest("a");
      expect(setupLink).toHaveClass("toc-item-active");
    });

    test("setup이 먼저, intro가 나중에 entries 배열에 있어도 동일하게 setup이 active가 된다", () => {
      /**
       * entries 순서를 뒤집어도 결과가 동일해야 한다.
       * 기존 Last-Write-Wins 구현은 마지막 entry(intro)를 active로 설정하지만,
       * 새 구현은 getBoundingClientRect 기반이므로 setup을 정확히 선택한다.
       */
      mockHeadingRects({ intro: 10, setup: 50, usage: 200, advanced: 400 });

      render(<TableOfContents headings={headings} />);

      // 순서 뒤집기: setup 먼저, intro 나중
      triggerObserver([
        { slug: "setup", isIntersecting: true },
        { slug: "intro", isIntersecting: true },
      ]);

      // 기존 코드는 intro가 active (Last-Write-Wins → 마지막 entry)
      // 새 코드는 setup이 active (getBoundingClientRect 기반)
      const setupLink = screen.getByText("설치").closest("a");
      expect(setupLink).toHaveClass("toc-item-active");
    });

    test("위로 빠르게 스크롤 시 현재 viewport에 표시되는 heading이 active가 된다", () => {
      /**
       * 아래에서 위로 빠르게 스크롤: setup(top=20)만 80px 이하에 있음
       * intro는 화면 위로 사라짐 (top=-100), usage는 아직 아래 (top=300)
       */
      mockHeadingRects({ intro: -100, setup: 20, usage: 300, advanced: 600 });

      render(<TableOfContents headings={headings} />);

      triggerObserver([{ slug: "setup", isIntersecting: true }]);

      const setupLink = screen.getByText("설치").closest("a");
      expect(setupLink).toHaveClass("toc-item-active");

      const introLink = screen.getByText("소개").closest("a");
      expect(introLink).not.toHaveClass("toc-item-active");
    });

    test("페이지 최상단(모든 heading이 viewport 아래)이면 첫 번째 heading이 active가 된다", () => {
      /**
       * 페이지 최상단에서는 모든 heading이 viewport 아래에 있다 (top > 80)
       * → 첫 번째 heading을 active로 설정해야 한다
       */
      mockHeadingRects({ intro: 200, setup: 400, usage: 600, advanced: 800 });

      render(<TableOfContents headings={headings} />);

      // 첫 번째 heading이 교차 감지됨
      triggerObserver([{ slug: "intro", isIntersecting: true }]);

      const introLink = screen.getByText("소개").closest("a");
      expect(introLink).toHaveClass("toc-item-active");
    });

    test("모든 heading이 viewport 위로 사라진 경우(페이지 하단) 마지막으로 통과한 heading이 active로 유지된다", () => {
      /**
       * 페이지 최하단에서는 모든 heading이 viewport 위에 있다 (top < 0)
       * → top <= 80 중 가장 큰 값(=가장 마지막으로 지나친 heading)이 active
       */
      mockHeadingRects({
        intro: -300,
        setup: -200,
        usage: -100,
        advanced: -50,
      });

      render(<TableOfContents headings={headings} />);

      triggerObserver([{ slug: "advanced", isIntersecting: true }]);

      const advancedLink = screen.getByText("고급").closest("a");
      expect(advancedLink).toHaveClass("toc-item-active");
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 클릭 후 Observer 비활성화 로직 유지
  // ─────────────────────────────────────────────────────
  describe("클릭 후 Observer 비활성화 로직", () => {
    test("TOC 링크 클릭 시 클릭한 heading이 active로 설정된다", () => {
      mockHeadingRects({ intro: 10, setup: 50, usage: 200, advanced: 400 });

      render(<TableOfContents headings={headings} />);

      const usageLink = screen.getByText("사용법").closest("a")!;
      act(() => {
        fireEvent.click(usageLink);
      });

      expect(usageLink).toHaveClass("toc-item-active");
    });

    test("클릭 후 2초 이내에는 Observer 트리거가 active를 변경하지 않는다", () => {
      mockHeadingRects({ intro: 10, setup: 50, usage: 200, advanced: 400 });

      render(<TableOfContents headings={headings} />);

      // usage 클릭
      const usageLink = screen.getByText("사용법").closest("a")!;
      act(() => {
        fireEvent.click(usageLink);
      });

      // 클릭 직후 Observer 트리거 발생 (1초 이내)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      triggerObserver([
        { slug: "intro", isIntersecting: true },
        { slug: "setup", isIntersecting: true },
      ]);

      // usage가 여전히 active여야 한다
      expect(usageLink).toHaveClass("toc-item-active");
    });

    test("클릭 후 2초가 지나면 Observer가 다시 active를 제어한다", () => {
      mockHeadingRects({ intro: 10, setup: 50, usage: 200, advanced: 400 });

      render(<TableOfContents headings={headings} />);

      // usage 클릭
      const usageLink = screen.getByText("사용법").closest("a")!;
      act(() => {
        fireEvent.click(usageLink);
      });

      // 2초 경과 (Observer 재활성화)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Observer가 setup을 active로 트리거
      triggerObserver([{ slug: "setup", isIntersecting: true }]);

      const setupLink = screen.getByText("설치").closest("a")!;
      expect(setupLink).toHaveClass("toc-item-active");
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. TOC 토글 (열기/닫기)
  // ─────────────────────────────────────────────────────
  describe("TOC 토글", () => {
    test("초기 상태에서 목차가 열려 있다", () => {
      render(<TableOfContents headings={headings} />);

      const list = screen.getByRole("list");
      expect(list).toHaveClass("toc-list-open");
    });

    test("토글 버튼 클릭 시 목차가 닫힌다", () => {
      render(<TableOfContents headings={headings} />);

      const toggleButton = screen.getByRole("button", {
        name: "목차 접기/펼치기",
      });
      act(() => {
        fireEvent.click(toggleButton);
      });

      const list = screen.getByRole("list");
      expect(list).toHaveClass("toc-list-closed");
    });

    test("토글 버튼을 두 번 클릭하면 다시 열린다", () => {
      render(<TableOfContents headings={headings} />);

      const toggleButton = screen.getByRole("button", {
        name: "목차 접기/펼치기",
      });

      act(() => {
        fireEvent.click(toggleButton);
        fireEvent.click(toggleButton);
      });

      const list = screen.getByRole("list");
      expect(list).toHaveClass("toc-list-open");
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. IntersectionObserver 등록
  // ─────────────────────────────────────────────────────
  describe("IntersectionObserver 등록", () => {
    test("모든 heading에 대해 observe가 호출된다", () => {
      mockHeadingRects({
        intro: 100,
        setup: 200,
        usage: 300,
        advanced: 400,
      });

      render(<TableOfContents headings={headings} />);

      expect(mockObserve).toHaveBeenCalledTimes(headings.length);
    });

    test("언마운트 시 disconnect가 호출된다", () => {
      mockHeadingRects({
        intro: 100,
        setup: 200,
        usage: 300,
        advanced: 400,
      });

      const { unmount } = render(<TableOfContents headings={headings} />);
      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
