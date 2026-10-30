import { render, screen, act, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TableOfContents from "../TableOfContents";
import type { TocItem } from "@/lib/toc";

/**
 * TableOfContents 컴포넌트 테스트.
 *
 * active heading은 scroll 이벤트마다 getBoundingClientRect로 다시 계산한다.
 * (IntersectionObserver는 제목이 감시 띠를 한 프레임에 건너뛰면 콜백이 오지 않아,
 *  스크롤바를 빠르게 끌면 목차가 이전 위치에 멈췄다.)
 */

import { TOC_SYNC_EVENT } from "@/lib/tocSync";

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
 * scroll 이벤트를 보내고 rAF(16ms)까지 진행한다.
 */
function triggerScroll() {
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    jest.advanceTimersByTime(16);
  });
}

// ─────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────

describe("TableOfContents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      triggerScroll();

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
      triggerScroll();

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

      triggerScroll();

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
      triggerScroll();

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

      triggerScroll();

      const advancedLink = screen.getByText("고급").closest("a");
      expect(advancedLink).toHaveClass("toc-item-active");
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 클릭 후 스크롤 계산 잠시 중지
  // ─────────────────────────────────────────────────────
  describe("클릭 후 스크롤 계산 잠시 중지", () => {
    test("TOC 링크 클릭 시 클릭한 heading이 active로 설정된다", () => {
      mockHeadingRects({ intro: 10, setup: 50, usage: 200, advanced: 400 });

      render(<TableOfContents headings={headings} />);

      const usageLink = screen.getByText("사용법").closest("a")!;
      act(() => {
        fireEvent.click(usageLink);
      });

      expect(usageLink).toHaveClass("toc-item-active");
    });

    test("클릭 후 2초 이내에는 스크롤이 active를 변경하지 않는다", () => {
      mockHeadingRects({ intro: 10, setup: 50, usage: 200, advanced: 400 });

      render(<TableOfContents headings={headings} />);

      // usage 클릭
      const usageLink = screen.getByText("사용법").closest("a")!;
      act(() => {
        fireEvent.click(usageLink);
      });

      // 클릭 직후 스크롤 발생 (1초 이내)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      triggerScroll();

      // usage가 여전히 active여야 한다
      expect(usageLink).toHaveClass("toc-item-active");
    });

    test("클릭 후 2초가 지나면 스크롤이 다시 active를 제어한다", () => {
      mockHeadingRects({ intro: 10, setup: 50, usage: 200, advanced: 400 });

      render(<TableOfContents headings={headings} />);

      // usage 클릭
      const usageLink = screen.getByText("사용법").closest("a")!;
      act(() => {
        fireEvent.click(usageLink);
      });

      // 2초 경과 (스크롤 계산 재개)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // 스크롤 계산 결과 setup이 active
      triggerScroll();

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
  // 5. 스크롤 리스너
  // ─────────────────────────────────────────────────────
  describe("스크롤 리스너", () => {
    test("스크롤바로 단번에 건너뛰어도 스크롤이 끝난 위치의 heading이 active가 된다", () => {
      // 처음엔 맨 위
      mockHeadingRects({ intro: 200, setup: 400, usage: 600, advanced: 800 });
      render(<TableOfContents headings={headings} />);
      act(() => {
        jest.advanceTimersByTime(16);
      });
      expect(screen.getByText("소개").closest("a")).toHaveClass("toc-item-active");

      // 한 프레임 만에 usage 구간으로 이동 (제목들이 감시 띠 안에 머문 프레임이 없음)
      mockHeadingRects({ intro: -2000, setup: -1200, usage: -300, advanced: 900 });
      triggerScroll();

      expect(screen.getByText("사용법").closest("a")).toHaveClass("toc-item-active");
    });

    test("scroll-margin(96px) 위치에 멈춘 heading도 active가 된다", () => {
      // 제목 링크·각주 이동은 대상 요소를 화면 위 96px에 멈춘다
      mockHeadingRects({ intro: -500, setup: 96, usage: 600, advanced: 800 });
      render(<TableOfContents headings={headings} />);
      act(() => {
        jest.advanceTimersByTime(16);
      });

      expect(screen.getByText("설치").closest("a")).toHaveClass("toc-item-active");
    });

    test("한 프레임 안의 여러 scroll 이벤트는 한 번만 계산한다", () => {
      mockHeadingRects({ intro: 10, setup: 400, usage: 600, advanced: 800 });
      render(<TableOfContents headings={headings} />);
      const spy = document.getElementById as jest.Mock;
      spy.mockClear();

      act(() => {
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(new Event("scroll"));
        jest.advanceTimersByTime(16);
      });

      expect(spy).toHaveBeenCalledTimes(headings.length);
    });

    test("언마운트 후에는 스크롤에 반응하지 않고 예약된 계산도 취소한다", () => {
      mockHeadingRects({ intro: 10, setup: 400, usage: 600, advanced: 800 });
      const cancelSpy = jest.spyOn(window, "cancelAnimationFrame");
      const { unmount } = render(<TableOfContents headings={headings} />);
      const spy = document.getElementById as jest.Mock;

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });
      unmount();
      spy.mockClear();
      act(() => {
        jest.advanceTimersByTime(16);
        window.dispatchEvent(new Event("scroll"));
        jest.advanceTimersByTime(16);
      });

      expect(cancelSpy).toHaveBeenCalled();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. 본문에서 요청한 목차 동기화 (각주 이동 등)
  // ─────────────────────────────────────────────────────
  describe("목차 동기화 이벤트", () => {
    function dispatchSync(target: Element) {
      act(() => {
        window.dispatchEvent(new CustomEvent(TOC_SYNC_EVENT, { detail: target }));
      });
    }

    beforeEach(() => {
      document.body.innerHTML = `
        <p id="lead">도입<a id="ref-lead">1</a></p>
        <h2 id="intro">소개</h2>
        <h2 id="setup">설치</h2>
        <p><a id="ref-setup">2</a></p>
        <h2 id="usage">사용법</h2>
        <h3 id="advanced">고급</h3>
        <ol><li id="fn-1">출처</li></ol>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    test("이동할 요소가 속한 구간의 heading이 active가 된다", () => {
      render(<TableOfContents headings={headings} />);

      dispatchSync(document.getElementById("ref-setup")!);

      expect(screen.getByRole("link", { name: "설치" })).toHaveClass("toc-item-active");
    });

    test("모든 제목 뒤의 각주 목록으로 가면 마지막 heading이 active가 된다", () => {
      render(<TableOfContents headings={headings} />);

      dispatchSync(document.getElementById("fn-1")!);

      expect(screen.getByRole("link", { name: "고급" })).toHaveClass("toc-item-active");
    });

    test("첫 제목보다 앞이면 첫 heading이 active가 된다", () => {
      render(<TableOfContents headings={headings} />);
      dispatchSync(document.getElementById("fn-1")!);

      dispatchSync(document.getElementById("ref-lead")!);

      expect(screen.getByRole("link", { name: "소개" })).toHaveClass("toc-item-active");
    });

    test("동기화 후 2초 동안은 부드러운 스크롤 중간 위치로 active가 바뀌지 않는다", () => {
      render(<TableOfContents headings={headings} />);
      dispatchSync(document.getElementById("fn-1")!);

      // 스크롤 도중: 아직 setup 구간을 지나는 중
      mockHeadingRects({ intro: -400, setup: 20, usage: 500, advanced: 700 });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      triggerScroll();
      expect(screen.getByRole("link", { name: "고급" })).toHaveClass("toc-item-active");

      act(() => {
        jest.advanceTimersByTime(1500);
      });
      triggerScroll();
      expect(screen.getByRole("link", { name: "설치" })).toHaveClass("toc-item-active");
    });

    test("언마운트 후에는 동기화 이벤트를 듣지 않는다", () => {
      const removeSpy = jest.spyOn(window, "removeEventListener");
      const { unmount } = render(<TableOfContents headings={headings} />);

      unmount();

      expect(removeSpy).toHaveBeenCalledWith(TOC_SYNC_EVENT, expect.any(Function));
    });
  });
});
