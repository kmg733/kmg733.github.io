import { renderHook, act } from "@testing-library/react";
import { useScrollPosition } from "../useScrollPosition";

describe("useScrollPosition", () => {
  // ─────────────────────────────────────────────────────
  // 1. 초기 상태
  // ─────────────────────────────────────────────────────
  describe("초기 상태", () => {
    test("scrollY가 0이면 false를 반환한다", () => {
      Object.defineProperty(window, "scrollY", { value: 0, writable: true });

      const { result } = renderHook(() => useScrollPosition());

      expect(result.current).toBe(false);
    });

    test("초기 scrollY가 threshold 이상이면 true를 반환한다", () => {
      Object.defineProperty(window, "scrollY", { value: 500, writable: true });

      const { result } = renderHook(() => useScrollPosition());

      // 초기 렌더 시 scroll 이벤트가 발생하지 않으므로 false
      // scroll 이벤트가 발생해야 상태 반영
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 기본 threshold (300px)
  // ─────────────────────────────────────────────────────
  describe("기본 threshold (300px)", () => {
    test("scrollY가 300 미만이면 false를 반환한다", () => {
      Object.defineProperty(window, "scrollY", { value: 299, writable: true });

      const { result } = renderHook(() => useScrollPosition());

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(false);
    });

    test("scrollY가 정확히 300이면 true를 반환한다", () => {
      Object.defineProperty(window, "scrollY", { value: 300, writable: true });

      const { result } = renderHook(() => useScrollPosition());

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(true);
    });

    test("scrollY가 300 이상이면 true를 반환한다", () => {
      Object.defineProperty(window, "scrollY", { value: 500, writable: true });

      const { result } = renderHook(() => useScrollPosition());

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 커스텀 threshold
  // ─────────────────────────────────────────────────────
  describe("커스텀 threshold", () => {
    test("threshold 100px로 설정하면 scrollY 100에서 true를 반환한다", () => {
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });

      const { result } = renderHook(() => useScrollPosition(100));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(true);
    });

    test("threshold 100px로 설정하면 scrollY 99에서 false를 반환한다", () => {
      Object.defineProperty(window, "scrollY", { value: 99, writable: true });

      const { result } = renderHook(() => useScrollPosition(100));

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 스크롤 위치 변경 반응
  // ─────────────────────────────────────────────────────
  describe("스크롤 위치 변경 반응", () => {
    test("스크롤 다운하면 false에서 true로 변경된다", () => {
      Object.defineProperty(window, "scrollY", { value: 0, writable: true });

      const { result } = renderHook(() => useScrollPosition());

      expect(result.current).toBe(false);

      // 스크롤 다운
      Object.defineProperty(window, "scrollY", { value: 400, writable: true });
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(true);
    });

    test("스크롤 업하면 true에서 false로 변경된다", () => {
      Object.defineProperty(window, "scrollY", { value: 400, writable: true });

      const { result } = renderHook(() => useScrollPosition());

      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

      expect(result.current).toBe(true);

      // 스크롤 업
      Object.defineProperty(window, "scrollY", { value: 100, writable: true });
      act(() => {
        window.dispatchEvent(new Event("scroll"));
      });

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
  // 6. 클린업
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
