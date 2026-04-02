import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../useTheme";

describe("useTheme", () => {
  let mockObserverInstance: {
    observe: jest.Mock;
    disconnect: jest.Mock;
    callback: MutationCallback | null;
  };

  beforeEach(() => {
    mockObserverInstance = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      callback: null,
    };

    global.MutationObserver = jest.fn((callback: MutationCallback) => {
      mockObserverInstance.callback = callback;
      return mockObserverInstance as unknown as MutationObserver;
    });

    // 기본: light 모드
    document.documentElement.classList.remove("dark");
  });

  // ─────────────────────────────────────────────────────
  // 1. 초기 상태
  // ─────────────────────────────────────────────────────
  describe("초기 상태", () => {
    test("dark 클래스가 없으면 'light'를 반환한다", () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current).toBe("light");
    });

    test("dark 클래스가 있으면 'dark'를 반환한다", () => {
      document.documentElement.classList.add("dark");

      const { result } = renderHook(() => useTheme());

      expect(result.current).toBe("dark");
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 테마 변경 감지
  // ─────────────────────────────────────────────────────
  describe("테마 변경 감지", () => {
    test("dark 클래스가 추가되면 'dark'로 변경된다", () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current).toBe("light");

      act(() => {
        document.documentElement.classList.add("dark");
        mockObserverInstance.callback?.([], {} as MutationObserver);
      });

      expect(result.current).toBe("dark");
    });

    test("dark 클래스가 제거되면 'light'로 변경된다", () => {
      document.documentElement.classList.add("dark");

      const { result } = renderHook(() => useTheme());

      expect(result.current).toBe("dark");

      act(() => {
        document.documentElement.classList.remove("dark");
        mockObserverInstance.callback?.([], {} as MutationObserver);
      });

      expect(result.current).toBe("light");
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. MutationObserver 설정
  // ─────────────────────────────────────────────────────
  describe("MutationObserver 설정", () => {
    test("document.documentElement를 관찰한다", () => {
      renderHook(() => useTheme());

      expect(mockObserverInstance.observe).toHaveBeenCalledWith(
        document.documentElement,
        { attributes: true, attributeFilter: ["class"] }
      );
    });

    test("언마운트 시 observer를 disconnect한다", () => {
      const { unmount } = renderHook(() => useTheme());

      unmount();

      expect(mockObserverInstance.disconnect).toHaveBeenCalled();
    });
  });
});
