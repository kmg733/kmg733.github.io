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
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. showPreview 호출
  // ─────────────────────────────────────────────────────
  describe("showPreview", () => {
    test("showPreview 호출 시 프리뷰 상태가 업데이트된다", () => {
      const { result } = renderHook(() => useImageHoverPreview());

      act(() => {
        result.current.showPreview("/test.png", "테스트 이미지");
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
        result.current.showPreview("/test.png", "테스트");
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
});
