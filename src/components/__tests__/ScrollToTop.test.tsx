import { render, screen, act, fireEvent } from "@testing-library/react";
import ScrollToTop from "../ScrollToTop";

/**
 * ScrollToTop 컴포넌트 테스트.
 *
 * - useScrollPosition 훅을 사용하여 스크롤 위치에 따라 버튼 표시/숨김
 * - SSR hydration mismatch 방지를 위한 mounted 상태 관리
 * - 클릭 시 window.scrollTo({ top: 0, behavior: 'smooth' }) 호출
 * - 접근성: aria-label, aria-hidden, tabIndex, focus-visible 스타일
 */

// window.scrollTo 모킹
const scrollToMock = jest.fn();
Object.defineProperty(window, "scrollTo", {
  value: scrollToMock,
  writable: true,
});

/**
 * 숨김 상태(aria-hidden="true")에서는 getByRole의 name 매칭이 동작하지 않으므로
 * getByLabelText를 사용하여 버튼을 조회한다.
 * 표시 상태(aria-hidden="false")에서는 getByRole을 사용한다.
 */

/** 스크롤 이벤트 디스패치 + rAF 콜백 실행 */
function dispatchScroll(scrollY: number) {
  Object.defineProperty(window, "scrollY", { value: scrollY, writable: true });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    jest.advanceTimersByTime(16);
  });
}

describe("ScrollToTop", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    scrollToMock.mockClear();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ─────────────────────────────────────────────────────
  // 1. SSR hydration 안전성
  // ─────────────────────────────────────────────────────
  describe("SSR hydration 안전성", () => {
    test("마운트 후 스크롤 위치가 0이면 버튼이 숨겨진 상태로 렌더링된다", () => {
      render(<ScrollToTop />);

      const button = screen.getByLabelText("맨 위로 이동");
      expect(button).toHaveClass("opacity-0");
      expect(button).toHaveClass("pointer-events-none");
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 버튼 표시/숨김
  // ─────────────────────────────────────────────────────
  describe("버튼 표시/숨김", () => {
    test("스크롤 위치가 threshold 미만이면 버튼이 숨겨진다", () => {
      render(<ScrollToTop />);

      dispatchScroll(100);

      const button = screen.getByLabelText("맨 위로 이동");
      expect(button).toHaveClass("opacity-0");
    });

    test("스크롤 위치가 threshold 이상이면 버튼이 표시된다", () => {
      render(<ScrollToTop />);

      dispatchScroll(400);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("opacity-100");
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 클릭 동작
  // ─────────────────────────────────────────────────────
  describe("클릭 동작", () => {
    test("버튼 클릭 시 window.scrollTo가 호출된다", () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });

      act(() => {
        fireEvent.click(button);
      });

      expect(scrollToMock).toHaveBeenCalledWith({
        top: 0,
        behavior: "smooth",
      });
    });

    test("버튼 클릭 시 scrollTo가 정확히 1회 호출된다", () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });

      act(() => {
        fireEvent.click(button);
      });

      expect(scrollToMock).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 접근성
  // ─────────────────────────────────────────────────────
  describe("접근성", () => {
    test('aria-label이 "맨 위로 이동"으로 설정된다', () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveAttribute("aria-label", "맨 위로 이동");
    });

    test("위쪽 화살표 SVG 아이콘이 포함된다", () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    test("숨김 상태에서 aria-hidden='true'이고 tabIndex=-1이다", () => {
      render(<ScrollToTop />);

      const button = screen.getByLabelText("맨 위로 이동");
      expect(button).toHaveAttribute("aria-hidden", "true");
      expect(button).toHaveAttribute("tabindex", "-1");
    });

    test("표시 상태에서 aria-hidden='false'이고 tabIndex=0이다", () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveAttribute("aria-hidden", "false");
      expect(button).toHaveAttribute("tabindex", "0");
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 스타일 및 위치
  // ─────────────────────────────────────────────────────
  describe("스타일 및 위치", () => {
    test("fixed 포지션으로 렌더링된다", () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("fixed");
    });

    test("z-40으로 설정된다 (header z-50보다 낮게)", () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("z-40");
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. 애니메이션 전환
  // ─────────────────────────────────────────────────────
  describe("애니메이션 전환", () => {
    test("표시 시 opacity-100과 translate-y-0 클래스가 적용된다", () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("opacity-100");
      expect(button).toHaveClass("translate-y-0");
    });

    test("숨김 시 opacity-0과 translate-y-4 클래스가 적용된다", () => {
      render(<ScrollToTop />);

      dispatchScroll(0);

      const button = screen.getByLabelText("맨 위로 이동");
      expect(button).toHaveClass("opacity-0");
      expect(button).toHaveClass("translate-y-4");
    });

    test("duration-300 전환 클래스가 적용된다", () => {
      render(<ScrollToTop />);

      dispatchScroll(500);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("duration-300");
    });
  });
});
