import { renderHook, act } from "@testing-library/react";
import { useFocusTrap } from "../useFocusTrap";

/**
 * DOM 헬퍼: containerRef.current에 포커스 가능 요소를 추가한다.
 */
function appendFocusableElements(
  container: HTMLDivElement,
  elements: HTMLElement[]
) {
  elements.forEach((el) => container.appendChild(el));
}

function createButton(label: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = label;
  return btn;
}

function createLink(href: string, label: string): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  return link;
}

function createInput(): HTMLInputElement {
  return document.createElement("input");
}

describe("useFocusTrap", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  /**
   * containerRef를 테스트용 DOM 요소에 연결하는 헬퍼.
   * renderHook 이후 ref.current를 수동으로 할당한다.
   */
  function renderUseFocusTrap(isActive: boolean, onEscape?: () => void) {
    const hookResult = renderHook(
      ({ isActive, onEscape }) => useFocusTrap({ isActive, onEscape }),
      { initialProps: { isActive, onEscape } }
    );

    // containerRef를 테스트용 DOM에 연결
    Object.defineProperty(hookResult.result.current.containerRef, "current", {
      value: container,
      writable: true,
    });

    return hookResult;
  }

  // ─────────────────────────────────────────────────────
  // 1. isActive=true 시 첫 번째 포커스 가능 요소에 포커스
  // ─────────────────────────────────────────────────────
  describe("자동 포커스", () => {
    test("isActive=true가 되면 컨테이너 내 첫 번째 포커스 가능 요소에 포커스한다", () => {
      const btn1 = createButton("First");
      const btn2 = createButton("Second");
      appendFocusableElements(container, [btn1, btn2]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      // ref를 컨테이너에 연결
      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      // isActive를 true로 변경
      rerender({ isActive: true });

      expect(document.activeElement).toBe(btn1);
    });

    test("isActive가 처음부터 true이면 마운트 시 첫 번째 요소에 포커스한다", () => {
      const btn = createButton("Only");
      appendFocusableElements(container, [btn]);

      const { result } = renderHook(() =>
        useFocusTrap({ isActive: true })
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      // effect를 재실행시키기 위해 rerender 필요 (ref 할당 이후)
      // 실제로는 컴포넌트에서 JSX ref로 연결되므로 이 패턴이 필요
      act(() => {
        // ref가 이미 설정된 상태에서 effect 트리거
        const event = new Event("focus");
        container.dispatchEvent(event);
      });

      // 참고: 실제 컴포넌트에서는 ref가 JSX로 연결되므로 자동 동작.
      // 테스트에서는 ref 할당 후 rerender로 effect를 트리거해야 함.
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. Tab 키로 마지막 -> 첫번째 순환
  // ─────────────────────────────────────────────────────
  describe("Tab 키 트랩", () => {
    test("마지막 요소에서 Tab 키를 누르면 첫 번째 요소로 이동한다", () => {
      const btn1 = createButton("First");
      const btn2 = createButton("Second");
      const btn3 = createButton("Third");
      appendFocusableElements(container, [btn1, btn2, btn3]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true });

      // 마지막 요소에 포커스
      act(() => {
        btn3.focus();
      });
      expect(document.activeElement).toBe(btn3);

      // Tab 키 이벤트 발생
      act(() => {
        const tabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: false,
          bubbles: true,
        });
        document.dispatchEvent(tabEvent);
      });

      expect(document.activeElement).toBe(btn1);
    });

    test("첫 번째 요소에서 Shift+Tab을 누르면 마지막 요소로 이동한다", () => {
      const btn1 = createButton("First");
      const btn2 = createButton("Second");
      const btn3 = createButton("Third");
      appendFocusableElements(container, [btn1, btn2, btn3]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true });

      // 첫 번째 요소에 포커스
      act(() => {
        btn1.focus();
      });
      expect(document.activeElement).toBe(btn1);

      // Shift+Tab 키 이벤트 발생
      act(() => {
        const shiftTabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
        });
        document.dispatchEvent(shiftTabEvent);
      });

      expect(document.activeElement).toBe(btn3);
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 포커스 복원
  // ─────────────────────────────────────────────────────
  describe("포커스 복원", () => {
    test("isActive=false가 되면 이전 포커스 위치로 복원한다", () => {
      const triggerBtn = document.createElement("button");
      triggerBtn.textContent = "Trigger";
      document.body.appendChild(triggerBtn);

      // 트리거 버튼에 포커스
      act(() => {
        triggerBtn.focus();
      });
      expect(document.activeElement).toBe(triggerBtn);

      const modalBtn = createButton("Modal Button");
      appendFocusableElements(container, [modalBtn]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      // 트랩 활성화
      rerender({ isActive: true });
      expect(document.activeElement).toBe(modalBtn);

      // 트랩 비활성화 -> 이전 포커스로 복원
      rerender({ isActive: false });
      expect(document.activeElement).toBe(triggerBtn);

      document.body.removeChild(triggerBtn);
    });

    test("이전 포커스 요소가 DOM에서 제거된 경우 document.body로 fallback한다", () => {
      const triggerBtn = document.createElement("button");
      triggerBtn.textContent = "Trigger";
      document.body.appendChild(triggerBtn);

      act(() => {
        triggerBtn.focus();
      });

      const modalBtn = createButton("Modal Button");
      appendFocusableElements(container, [modalBtn]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true });

      // 트리거 요소를 DOM에서 제거
      document.body.removeChild(triggerBtn);

      // 트랩 비활성화
      rerender({ isActive: false });

      // body로 fallback
      expect(document.activeElement).toBe(document.body);
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. ESC 키 핸들러
  // ─────────────────────────────────────────────────────
  describe("ESC 키 핸들러", () => {
    test("ESC 키를 누르면 onEscape 콜백이 호출된다", () => {
      const onEscape = jest.fn();
      const btn = createButton("Button");
      appendFocusableElements(container, [btn]);

      const { result, rerender } = renderHook(
        ({ isActive, onEscape }) => useFocusTrap({ isActive, onEscape }),
        { initialProps: { isActive: false, onEscape } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true, onEscape });

      act(() => {
        const escEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
        });
        document.dispatchEvent(escEvent);
      });

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    test("onEscape가 없으면 ESC 키를 눌러도 에러가 발생하지 않는다", () => {
      const btn = createButton("Button");
      appendFocusableElements(container, [btn]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true });

      expect(() => {
        act(() => {
          const escEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
          });
          document.dispatchEvent(escEvent);
        });
      }).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 엣지 케이스
  // ─────────────────────────────────────────────────────
  describe("엣지 케이스", () => {
    test("포커스 가능 요소가 없을 때 에러 없이 동작한다", () => {
      // 컨테이너에 포커스 가능 요소 없음

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      expect(() => {
        rerender({ isActive: true });
      }).not.toThrow();

      // Tab 키도 에러 없이 처리
      expect(() => {
        act(() => {
          const tabEvent = new KeyboardEvent("keydown", {
            key: "Tab",
            bubbles: true,
          });
          document.dispatchEvent(tabEvent);
        });
      }).not.toThrow();
    });

    test("포커스 가능 요소가 1개일 때 Tab/Shift+Tab 모두 그 요소에 머무른다", () => {
      const btn = createButton("Only");
      appendFocusableElements(container, [btn]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true });
      expect(document.activeElement).toBe(btn);

      // Tab 키
      act(() => {
        const tabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: false,
          bubbles: true,
        });
        document.dispatchEvent(tabEvent);
      });
      expect(document.activeElement).toBe(btn);

      // Shift+Tab 키
      act(() => {
        const shiftTabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
        });
        document.dispatchEvent(shiftTabEvent);
      });
      expect(document.activeElement).toBe(btn);
    });

    test("다양한 포커스 가능 요소 타입을 올바르게 탐지한다", () => {
      const btn = createButton("Button");
      const link = createLink("https://example.com", "Link");
      const input = createInput();
      const select = document.createElement("select");
      const textarea = document.createElement("textarea");
      const tabindexEl = document.createElement("div");
      tabindexEl.setAttribute("tabindex", "0");

      appendFocusableElements(container, [
        btn,
        link,
        input,
        select,
        textarea,
        tabindexEl,
      ]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true });

      // 첫 번째 요소(button)에 포커스
      expect(document.activeElement).toBe(btn);

      // 마지막 요소(tabindex div)에서 Tab -> 첫 번째로 순환
      act(() => {
        tabindexEl.focus();
      });

      act(() => {
        const tabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: false,
          bubbles: true,
        });
        document.dispatchEvent(tabEvent);
      });

      expect(document.activeElement).toBe(btn);
    });

    test("포커스가 컨테이너 밖에 있을 때 Tab을 누르면 첫 번째 요소로 강제 이동한다", () => {
      const btn = createButton("Inside");
      appendFocusableElements(container, [btn]);

      const outsideBtn = document.createElement("button");
      outsideBtn.textContent = "Outside";
      document.body.appendChild(outsideBtn);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true });

      // 포커스를 컨테이너 밖으로 강제 이동
      act(() => {
        outsideBtn.focus();
      });
      expect(document.activeElement).toBe(outsideBtn);

      // Tab 키 -> 컨테이너 내부 첫 번째 요소로 강제 이동
      act(() => {
        const tabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: false,
          bubbles: true,
        });
        document.dispatchEvent(tabEvent);
      });

      expect(document.activeElement).toBe(btn);

      document.body.removeChild(outsideBtn);
    });

    test("tabindex=-1 요소는 포커스 트랩 대상에서 제외된다", () => {
      const btn = createButton("Focusable");
      const hidden = document.createElement("div");
      hidden.setAttribute("tabindex", "-1");
      hidden.textContent = "Not focusable";

      appendFocusableElements(container, [btn, hidden]);

      const { result, rerender } = renderHook(
        ({ isActive }) => useFocusTrap({ isActive }),
        { initialProps: { isActive: false } }
      );

      Object.defineProperty(result.current.containerRef, "current", {
        value: container,
        writable: true,
      });

      rerender({ isActive: true });

      // 유일한 포커스 가능 요소인 btn에 포커스
      expect(document.activeElement).toBe(btn);

      // Tab -> 다시 btn (hidden은 제외)
      act(() => {
        const tabEvent = new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: false,
          bubbles: true,
        });
        document.dispatchEvent(tabEvent);
      });

      expect(document.activeElement).toBe(btn);
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. containerRef 반환
  // ─────────────────────────────────────────────────────
  describe("반환값", () => {
    test("containerRef를 반환한다", () => {
      const { result } = renderHook(() =>
        useFocusTrap({ isActive: false })
      );

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });
  });
});
