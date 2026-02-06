import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcut } from "../useKeyboardShortcut";

describe("useKeyboardShortcut", () => {
  // ─────────────────────────────────────────────────────
  // 1. 기본 단축키 감지
  // ─────────────────────────────────────────────────────
  describe("단축키 감지", () => {
    test("Cmd+K (Mac) 누르면 콜백이 호출된다", () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut("k", callback));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test("Ctrl+K (Windows/Linux) 누르면 콜백이 호출된다", () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut("k", callback));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            ctrlKey: true,
            bubbles: true,
          })
        );
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test("modifier 없이 K키만 누르면 콜백이 호출되지 않는다", () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut("k", callback));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            bubbles: true,
          })
        );
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. input/textarea 포커스 시 무시
  // ─────────────────────────────────────────────────────
  describe("입력 필드 포커스 시 무시", () => {
    test("input에 포커스가 있으면 단축키가 무시된다", () => {
      const callback = jest.fn();
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      renderHook(() => useKeyboardShortcut("k", callback));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(callback).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    test("textarea에 포커스가 있으면 단축키가 무시된다", () => {
      const callback = jest.fn();
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();

      renderHook(() => useKeyboardShortcut("k", callback));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(callback).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });

    test("contentEditable 요소에 포커스가 있으면 단축키가 무시된다", () => {
      const callback = jest.fn();
      const div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      document.body.appendChild(div);
      div.focus();

      renderHook(() => useKeyboardShortcut("k", callback));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(callback).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 브라우저 기본 동작 차단
  // ─────────────────────────────────────────────────────
  describe("기본 동작 차단", () => {
    test("단축키 감지 시 preventDefault가 호출된다", () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut("k", callback));

      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(event, "preventDefault");

      act(() => {
        document.dispatchEvent(event);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 언마운트 시 정리
  // ─────────────────────────────────────────────────────
  describe("클린업", () => {
    test("언마운트 후 이벤트 리스너가 제거된다", () => {
      const callback = jest.fn();
      const { unmount } = renderHook(() =>
        useKeyboardShortcut("k", callback)
      );

      unmount();

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 대소문자 무시
  // ─────────────────────────────────────────────────────
  describe("대소문자 무시", () => {
    test("대문자 K를 눌러도 콜백이 호출된다", () => {
      const callback = jest.fn();
      renderHook(() => useKeyboardShortcut("k", callback));

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "K",
            metaKey: true,
            bubbles: true,
          })
        );
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
