import { render, screen, act, fireEvent } from "@testing-library/react";
import ScrollToTop from "../ScrollToTop";

/**
 * ScrollToTop 컴포넌트 테스트.
 *
 * - useScrollPosition 훅을 사용하여 스크롤 위치에 따라 버튼 표시/숨김
 * - SSR hydration mismatch 방지를 위한 mounted 상태 관리
 * - 클릭 시 window.scrollTo({ top: 0, behavior: 'smooth' }) 호출
 * - 접근성: aria-label, focus-visible 스타일
 */

// window.scrollTo 모킹
const scrollToMock = jest.fn();
Object.defineProperty(window, "scrollTo", {
  value: scrollToMock,
  writable: true,
});

describe("ScrollToTop", () => {
  beforeEach(() => {
    scrollToMock.mockClear();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  // ─────────────────────────────────────────────────────
  // 1. SSR hydration 안전성
  // ─────────────────────────────────────────────────────
  describe("SSR hydration 안전성", () => {
    test("마운트 후 스크롤 위치가 0이면 버튼이 숨겨진 상태로 렌더링된다", () => {
      // jsdom에서 useEffect는 render 시 동기 실행되므로 mounted=true가 즉시 적용됨.
      // 실제 SSR에서는 useEffect가 실행되지 않아 mounted=false → null 반환.
      // 여기서는 마운트 후 scrollY=0일 때 버튼이 숨겨진(opacity-0, pointer-events-none) 상태인지 검증.
      render(<ScrollToTop />);

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("opacity-0");
      expect(button).toHaveClass("pointer-events-none");
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 버튼 표시/숨김
  // ─────────────────────────────────────────────────────
  describe("버튼 표시/숨김", () => {
    test("스크롤 위치가 threshold 미만이면 버튼이 숨겨진다", () => {
      Object.defineProperty(window, "scrollY", {
        value: 100,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      // 버튼이 없거나 숨겨진 상태
      const button = screen.queryByRole("button", { name: "맨 위로 이동" });
      if (button) {
        // 버튼이 DOM에 있더라도 opacity-0으로 숨겨진 상태
        expect(button).toHaveClass("opacity-0");
      }
    });

    test("스크롤 위치가 threshold 이상이면 버튼이 표시된다", () => {
      Object.defineProperty(window, "scrollY", {
        value: 400,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

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
      Object.defineProperty(window, "scrollY", {
        value: 500,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

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
      Object.defineProperty(window, "scrollY", {
        value: 500,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

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
      Object.defineProperty(window, "scrollY", {
        value: 500,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveAttribute("aria-label", "맨 위로 이동");
    });

    test("위쪽 화살표 SVG 아이콘이 포함된다", () => {
      Object.defineProperty(window, "scrollY", {
        value: 500,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 스타일 및 위치
  // ─────────────────────────────────────────────────────
  describe("스타일 및 위치", () => {
    test("fixed 포지션으로 렌더링된다", () => {
      Object.defineProperty(window, "scrollY", {
        value: 500,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("fixed");
    });

    test("z-40으로 설정된다 (header z-50보다 낮게)", () => {
      Object.defineProperty(window, "scrollY", {
        value: 500,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("z-40");
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. 애니메이션 전환
  // ─────────────────────────────────────────────────────
  describe("애니메이션 전환", () => {
    test("표시 시 opacity-100과 translate-y-0 클래스가 적용된다", () => {
      Object.defineProperty(window, "scrollY", {
        value: 500,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("opacity-100");
      expect(button).toHaveClass("translate-y-0");
    });

    test("숨김 시 opacity-0과 translate-y-4 클래스가 적용된다", () => {
      Object.defineProperty(window, "scrollY", {
        value: 0,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.queryByRole("button", { name: "맨 위로 이동" });
      if (button) {
        expect(button).toHaveClass("opacity-0");
        expect(button).toHaveClass("translate-y-4");
      }
    });

    test("duration-300 전환 클래스가 적용된다", () => {
      Object.defineProperty(window, "scrollY", {
        value: 500,
        writable: true,
      });

      render(<ScrollToTop />);

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      const button = screen.getByRole("button", { name: "맨 위로 이동" });
      expect(button).toHaveClass("duration-300");
    });
  });
});
