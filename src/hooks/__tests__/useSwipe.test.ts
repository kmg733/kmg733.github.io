import { renderHook } from "@testing-library/react";
import { useSwipe } from "../useSwipe";

/**
 * useSwipe 훅 단위 테스트.
 *
 * 수평 스와이프 제스처를 감지한다.
 * - 왼쪽 스와이프(손가락 ←) → onSwipeLeft (다음 이미지)
 * - 오른쪽 스와이프(손가락 →) → onSwipeRight (이전 이미지)
 * - 임계값 미만 또는 수직 우세 제스처는 무시 (스크롤 보호)
 */

type Pt = { clientX: number; clientY: number };

/** TouchEvent 유사 객체 생성 */
function start(pt: Pt) {
  return { touches: [pt] } as unknown as React.TouchEvent;
}
function end(pt: Pt) {
  return { changedTouches: [pt] } as unknown as React.TouchEvent;
}

describe("useSwipe", () => {
  it("왼쪽으로 충분히 스와이프하면 onSwipeLeft를 호출한다", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight })
    );

    result.current.onTouchStart(start({ clientX: 200, clientY: 100 }));
    result.current.onTouchEnd(end({ clientX: 100, clientY: 110 }));

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("오른쪽으로 충분히 스와이프하면 onSwipeRight를 호출한다", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight })
    );

    result.current.onTouchStart(start({ clientX: 100, clientY: 100 }));
    result.current.onTouchEnd(end({ clientX: 200, clientY: 110 }));

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("이동 거리가 임계값(기본 50px) 미만이면 무시한다", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight })
    );

    result.current.onTouchStart(start({ clientX: 100, clientY: 100 }));
    result.current.onTouchEnd(end({ clientX: 130, clientY: 100 }));

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("수직 이동이 더 크면 무시한다 (세로 스크롤 보호)", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight })
    );

    // deltaX=-60 (임계값 초과)이지만 deltaY=200으로 수직 우세
    result.current.onTouchStart(start({ clientX: 200, clientY: 50 }));
    result.current.onTouchEnd(end({ clientX: 140, clientY: 250 }));

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("커스텀 임계값을 적용한다", () => {
    const onSwipeLeft = jest.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, threshold: 100 })
    );

    // 60px 이동 - 기본값이면 동작하지만 임계값 100이면 무시
    result.current.onTouchStart(start({ clientX: 200, clientY: 100 }));
    result.current.onTouchEnd(end({ clientX: 140, clientY: 100 }));

    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("touchStart 없이 touchEnd만 발생하면 무시한다", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight })
    );

    result.current.onTouchEnd(end({ clientX: 100, clientY: 100 }));

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("touchCancel 후 touchEnd는 무시한다 (인터럽트 보호)", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeRight = jest.fn();
    const { result } = renderHook(() =>
      useSwipe({ onSwipeLeft, onSwipeRight })
    );

    result.current.onTouchStart(start({ clientX: 200, clientY: 100 }));
    result.current.onTouchCancel(); // 시스템 인터럽트로 터치 취소
    result.current.onTouchEnd(end({ clientX: 100, clientY: 100 }));

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
