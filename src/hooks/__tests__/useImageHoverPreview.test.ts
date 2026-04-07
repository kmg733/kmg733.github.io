import { renderHook, act } from "@testing-library/react";
import { useImageHoverPreview } from "../useImageHoverPreview";

describe("useImageHoverPreview", () => {
  // ─────────────────────────────────────────────────────
  // 1. 초기 상태
  // ─────────────────────────────────────────────────────
  describe("초기 상태", () => {
    test("초기 상태에서 프리뷰가 보이지 않는다", () => {
      const { result } = renderHook(() => useImageHoverPreview());

      expect(result.current.isVisible).toBe(false);
      expect(result.current.imageSrc).toBeNull();
      expect(result.current.imageAlt).toBe("");
      expect(result.current.position).toEqual({ x: 0, y: 0 });
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. showPreview 호출
  // ─────────────────────────────────────────────────────
  describe("showPreview", () => {
    test("showPreview 호출 시 프리뷰 상태가 업데이트된다", () => {
      const { result } = renderHook(() => useImageHoverPreview());

      act(() => {
        result.current.showPreview("/test.png", "테스트 이미지", 200, 300);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.imageSrc).toBe("/test.png");
      expect(result.current.imageAlt).toBe("테스트 이미지");
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. hidePreview 호출
  // ─────────────────────────────────────────────────────
  describe("hidePreview", () => {
    test("hidePreview 호출 시 초기 상태로 돌아간다", () => {
      const { result } = renderHook(() => useImageHoverPreview());

      act(() => {
        result.current.showPreview("/test.png", "테스트", 200, 300);
      });

      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.hidePreview();
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.imageSrc).toBeNull();
      expect(result.current.imageAlt).toBe("");
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 뷰포트 경계 위치 계산
  // ─────────────────────────────────────────────────────
  describe("위치 계산", () => {
    test("마우스 위치 기준으로 프리뷰 위치가 계산된다", () => {
      const { result } = renderHook(() => useImageHoverPreview());

      act(() => {
        result.current.showPreview("/test.png", "테스트", 400, 300);
      });

      // 위치가 설정됨 (정확한 offset은 구현에 따라 다를 수 있음)
      expect(result.current.position.x).toBeGreaterThan(0);
      expect(result.current.position.y).toBeGreaterThan(0);
    });

    test("마우스가 뷰포트 오른쪽 경계 근처일 때 왼쪽에 프리뷰가 표시된다", () => {
      // jsdom 기본 window.innerWidth = 1024
      const { result } = renderHook(() => useImageHoverPreview());

      act(() => {
        // 오른쪽 끝 근처에서 hover
        result.current.showPreview("/test.png", "테스트", 950, 300);
      });

      // 프리뷰가 마우스 왼쪽에 위치해야 함
      expect(result.current.position.x).toBeLessThan(950);
    });

    test("마우스가 뷰포트 하단 경계 근처일 때 위쪽에 프리뷰가 표시된다", () => {
      // jsdom 기본 window.innerHeight = 768
      const { result } = renderHook(() => useImageHoverPreview());

      act(() => {
        // 하단 끝 근처에서 hover
        result.current.showPreview("/test.png", "테스트", 400, 700);
      });

      // 프리뷰가 마우스 위쪽에 위치해야 함
      expect(result.current.position.y).toBeLessThan(700);
    });
  });
});
