"use client";

import { useRef } from "react";

/**
 * useSwipe 훅 옵션
 */
export interface UseSwipeOptions {
  /** 왼쪽 스와이프(손가락 ←) 시 호출 — 보통 다음 항목 */
  onSwipeLeft?: () => void;
  /** 오른쪽 스와이프(손가락 →) 시 호출 — 보통 이전 항목 */
  onSwipeRight?: () => void;
  /** 스와이프로 인정할 최소 수평 이동 거리(px). 기본 50 */
  threshold?: number;
}

/**
 * 요소에 펼쳐 붙일 터치 핸들러
 */
export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: () => void;
}

const DEFAULT_THRESHOLD = 50;

/**
 * 수평 터치 스와이프 제스처를 감지하는 커스텀 훅.
 *
 * - 수평 이동이 임계값 이상이고 수직 이동보다 우세할 때만 스와이프로 인정
 * - 세로 스크롤과의 충돌을 방지하기 위해 수직 우세 제스처는 무시
 * - 반환된 핸들러를 대상 요소에 spread 하여 사용
 */
export function useSwipe(options: UseSwipeOptions): SwipeHandlers {
  const { onSwipeLeft, onSwipeRight, threshold = DEFAULT_THRESHOLD } = options;

  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    // 수직 우세 제스처는 스크롤로 간주하여 무시
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (Math.abs(deltaX) < threshold) return;

    if (deltaX < 0) {
      onSwipeLeft?.();
    } else {
      onSwipeRight?.();
    }
  };

  // 시스템 인터럽트(전화 수신, 멀티터치 전환 등)로 터치가 취소되면
  // 시작 좌표를 비워 다음 터치의 touchend와 섞이지 않도록 한다.
  const onTouchCancel = () => {
    startRef.current = null;
  };

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
