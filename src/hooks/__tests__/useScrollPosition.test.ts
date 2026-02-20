import { renderHook, act } from "@testing-library/react";
import { useScrollPosition } from "../useScrollPosition";

describe("useScrollPosition", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /** 스크롤 이벤트 디스패치 + rAF 콜백 실행 */
  function dispatchScroll(scrollY: number) {
    Object.defineProperty(window, "scrollY", { value: scrollY, writable: true });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      jest.advanceTimersByTime(16);
    });
  }

  // ─────────────────────────────────────────────────────
  // 1. 초기 상태
  // ─────────────────────────────────────────────────────
  describe("초기 상태", () => {
    test("scrollY가 0이면 false를 반환한다", () => {
      const { result } = renderHook(() => useScrollPosition());

      expect(result.current).toBe(false);
    });

    test("초기 scrollY가 threshold 이상이면 scroll 이벤트 후 true를 반환한다", () => {
      const { result } = renderHook(() => useScrollPosition());

      dispatchScroll(500);

      expect(result.current).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 기본 threshold (300px)
  // ─────────────────────────────────────────────────────
  describe("기본 threshold (300px)", () => {
    test("scrollY가 300 미만이면 false를 반환한다", () => {
      const { result } = renderHook(() => useScrollPosition());

      dispatchScroll(299);

      expect(result.current).toBe(false);
    });

    test("scrollY가 정확히 300이면 true를 반환한다", () => {
      const { result } = renderHook(() => useScrollPosition());

      dispatchScroll(300);

      expect(result.current).toBe(true);
    });

    test("scrollY가 300 이상이면 true를 반환한다", () => {
      const { result } = renderHook(() => useScrollPosition());

      dispatchScroll(500);

      expect(result.current).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 커스텀 threshold
  // ─────────────────────────────────────────────────────
  describe("커스텀 threshold", () => {
    test("threshold 100px로 설정하면 scrollY 100에서 true를 반환한다", () => {
      const { result } = renderHook(() => useScrollPosition(100));

      dispatchScroll(100);

      expect(result.current).toBe(true);
    });

    test("threshold 100px로 설정하면 scrollY 99에서 false를 반환한다", () => {
      const { result } = renderHook(() => useScrollPosition(100));

      dispatchScroll(99);

      expect(result.current).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 스크롤 위치 변경 반응
  // ─────────────────────────────────────────────────────
  describe("스크롤 위치 변경 반응", () => {
    test("스크롤 다운하면 false에서 true로 변경된다", () => {
      const { result } = renderHook(() => useScrollPosition());

      expect(result.current).toBe(false);

      dispatchScroll(400);

      expect(result.current).toBe(true);
    });

    test("스크롤 업하면 true에서 false로 변경된다", () => {
      const { result } = renderHook(() => useScrollPosition());

      dispatchScroll(400);
      expect(result.current).toBe(true);

      dispatchScroll(100);
      expect(result.current).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 이벤트 리스너 등록 옵션
  // ─────────────────────────────────────────────────────
  describe("이벤트 리스너 등록", () => {
    test("scroll 이벤트 리스너가 passive: true로 등록된다", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");

      renderHook(() => useScrollPosition());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        { passive: true }
      );

      addEventListenerSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. rAF 스로틀
  // ─────────────────────────────────────────────────────
  describe("rAF 스로틀", () => {
    test("언마운트 시 예약된 rAF가 취소된다", () => {
      const cancelSpy = jest.spyOn(window, "cancelAnimationFrame");

      const { unmount } = renderHook(() => useScrollPosition());

      // 스크롤 이벤트로 rAF 예약 (타이머 진행하지 않음)
      Object.defineProperty(window, "scrollY", { value: 400, writable: true });
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      // 언마운트 시 cancelAnimationFrame 호출
      unmount();
      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────
  // 7. 클린업
  // ─────────────────────────────────────────────────────
  describe("클린업", () => {
    test("언마운트 시 scroll 이벤트 리스너가 제거된다", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useScrollPosition());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
