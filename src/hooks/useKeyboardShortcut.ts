"use client";

import { useEffect, useRef } from "react";

/**
 * 키보드 단축키를 감지하는 커스텀 훅.
 *
 * - Cmd(Mac) 또는 Ctrl(Win/Linux) + 지정 키 조합을 감지
 * - input, textarea, contentEditable 요소에 포커스 중이면 무시
 * - 브라우저 기본 동작 차단 (preventDefault)
 *
 * @param key 감지할 키 (소문자)
 * @param callback 단축키 감지 시 호출할 콜백
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // modifier 키 확인 (Cmd 또는 Ctrl)
      if (!event.metaKey && !event.ctrlKey) return;

      // 대소문자 무시 비교
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      // 입력 필드에 포커스 중이면 무시
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea") return;
        if (activeElement.getAttribute("contenteditable") === "true") return;
      }

      event.preventDefault();
      callbackRef.current();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [key]);
}
