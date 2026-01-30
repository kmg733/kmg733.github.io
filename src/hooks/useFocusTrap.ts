"use client";

import { useRef, useEffect } from "react";

/**
 * useFocusTrap 훅 옵션
 */
export interface UseFocusTrapOptions {
  /** 트랩 활성화 여부 */
  isActive: boolean;
  /** ESC 키 핸들러 (선택) */
  onEscape?: () => void;
}

/**
 * useFocusTrap 훅 반환 타입
 */
export interface UseFocusTrapReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/** 포커스 가능 요소 선택자 */
const FOCUSABLE_SELECTOR = [
  "button",
  "[href]",
  "input",
  "select",
  "textarea",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * 컨테이너 내 포커스 가능 요소 목록을 반환한다.
 */
function queryFocusableElements(
  container: HTMLDivElement | null
): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );
}

/**
 * 이전 포커스 위치로 복원한다.
 * DOM에서 제거된 요소인 경우 현재 포커스를 해제하여 body로 fallback한다.
 */
function restoreFocus(previousElement: Element | null): void {
  if (!(previousElement instanceof HTMLElement)) return;

  if (document.body.contains(previousElement)) {
    previousElement.focus();
  } else if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

/**
 * 컨테이너 내부에서 포커스를 가두는 커스텀 훅.
 *
 * - isActive=true 시 첫 번째 포커스 가능 요소에 자동 포커스
 * - Tab/Shift+Tab 으로 컨테이너 내부만 순환
 * - isActive=false 시 이전 포커스 위치로 복원
 * - ESC 키로 onEscape 콜백 호출
 */
export function useFocusTrap(
  options: UseFocusTrapOptions
): UseFocusTrapReturn {
  const { isActive, onEscape } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  // 안정적인 onEscape 참조 (useEffect 의존성에 포함하지 않기 위함)
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  // 활성화/비활성화 시 포커스 관리
  useEffect(() => {
    if (isActive) {
      previousActiveElementRef.current = document.activeElement;

      const focusableElements = queryFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    } else {
      restoreFocus(previousActiveElementRef.current);
      previousActiveElementRef.current = null;
    }
  }, [isActive]);

  // 키보드 이벤트 리스너 (document 레벨에서 감지하여 포커스 탈출 방지)
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscapeRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = queryFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // 포커스 가능 요소가 1개뿐이면 항상 Tab 차단
      if (focusableElements.length === 1) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      // 포커스가 컨테이너 밖에 있으면 첫 번째 요소로 강제 이동
      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isActive]);

  return { containerRef };
}
