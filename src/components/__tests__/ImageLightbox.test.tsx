import { render, screen, act, fireEvent } from "@testing-library/react";
import ImageLightbox from "../ImageLightbox";

/**
 * ImageLightbox + useFocusTrap 포커스 트랩 통합 테스트.
 *
 * ImageLightbox는 document 레벨 클릭 이벤트 위임으로 .prose 내 img를 감지하고,
 * createPortal로 document.body에 라이트박스를 렌더한다.
 * useFocusTrap 훅이 포커스 자동 이동, Tab 순환, ESC 닫기를 담당한다.
 */

/** .prose 래퍼 안에 이미지가 있는 페이지를 렌더한다. */
function renderWithProseImage(alt = "sample image") {
  const result = render(
    <div>
      <div className="prose">
        <img src="/test.png" alt={alt} data-testid="prose-image" />
      </div>
      <button data-testid="outside-button">외부 버튼</button>
      <ImageLightbox />
    </div>
  );
  return result;
}

/** 라이트박스를 열기 위해 .prose 내 이미지를 클릭한다. */
function openLightbox() {
  const image = screen.getByTestId("prose-image");
  // ImageLightbox는 document 레벨 click 이벤트 위임을 사용한다.
  // fireEvent.click은 실제 DOM 이벤트를 발생시켜 document까지 버블링된다.
  act(() => {
    fireEvent.click(image);
  });
}

/** 닫기 애니메이션을 완료시킨다. */
function finishCloseAnimation() {
  const overlay = document.querySelector(".lightbox-overlay");
  if (overlay) {
    act(() => {
      // jsdom에는 AnimationEvent가 없으므로 Event를 확장하여 animationName을 설정한다.
      // React의 onAnimationEnd 핸들러는 네이티브 이벤트의 animationName을 읽는다.
      const animationEndEvent = new Event("animationend", {
        bubbles: true,
      });
      Object.defineProperty(animationEndEvent, "animationName", {
        value: "lightbox-fade-out",
      });
      overlay.dispatchEvent(animationEndEvent);
    });
  }
}

describe("ImageLightbox 포커스 트랩 통합 테스트", () => {
  // ─────────────────────────────────────────────────────
  // 1. 이미지 클릭 시 라이트박스 열림
  // ─────────────────────────────────────────────────────
  describe("라이트박스 열림", () => {
    test("prose 내 이미지 클릭 시 라이트박스가 열린다", () => {
      renderWithProseImage();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      openLightbox();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "aria-modal",
        "true"
      );
    });

    test("라이트박스 열림 시 확대된 이미지가 표시된다", () => {
      renderWithProseImage("테스트 이미지");

      openLightbox();

      const lightboxImage = document.querySelector(".lightbox-image");
      expect(lightboxImage).toBeInTheDocument();
      expect(lightboxImage).toHaveAttribute("alt", "테스트 이미지");
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 라이트박스 열림 시 닫기 버튼에 자동 포커스
  // ─────────────────────────────────────────────────────
  describe("자동 포커스", () => {
    test("라이트박스 열림 시 닫기 버튼에 포커스가 이동한다", () => {
      renderWithProseImage();

      openLightbox();

      const closeButton = screen.getByRole("button", {
        name: "이미지 닫기",
      });
      expect(document.activeElement).toBe(closeButton);
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. Tab 키 포커스 트랩
  // ─────────────────────────────────────────────────────
  describe("Tab 키 포커스 트랩", () => {
    test("Tab 키로 라이트박스 외부 요소에 포커스가 이동하지 않는다", () => {
      renderWithProseImage();

      openLightbox();

      const dialog = screen.getByRole("dialog");
      const closeButton = screen.getByRole("button", {
        name: "이미지 닫기",
      });

      // 닫기 버튼에 포커스된 상태
      expect(document.activeElement).toBe(closeButton);

      // Tab 키 발생 - 라이트박스 내부에는 닫기 버튼 1개만 포커스 가능하므로
      // Tab을 눌러도 닫기 버튼에 머물러야 한다 (순환)
      act(() => {
        fireEvent.keyDown(dialog, { key: "Tab", shiftKey: false });
      });

      // 외부 버튼으로 이동하지 않고 닫기 버튼에 머무름
      expect(document.activeElement).toBe(closeButton);
    });

    test("Shift+Tab 키로도 라이트박스 외부로 포커스가 이동하지 않는다", () => {
      renderWithProseImage();

      openLightbox();

      const dialog = screen.getByRole("dialog");
      const closeButton = screen.getByRole("button", {
        name: "이미지 닫기",
      });

      expect(document.activeElement).toBe(closeButton);

      act(() => {
        fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
      });

      expect(document.activeElement).toBe(closeButton);
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. ESC 키로 닫기 동작
  // ─────────────────────────────────────────────────────
  describe("ESC 키 닫기", () => {
    test("ESC 키를 누르면 닫기 애니메이션이 시작된다", () => {
      renderWithProseImage();

      openLightbox();

      const dialog = screen.getByRole("dialog");

      // ESC 키 발생
      act(() => {
        fireEvent.keyDown(dialog, { key: "Escape" });
      });

      // closing 클래스 추가 (애니메이션 시작)
      expect(dialog).toHaveClass("closing");
    });

    test("ESC 키 후 애니메이션 완료 시 라이트박스가 닫힌다", () => {
      renderWithProseImage();

      openLightbox();

      const dialog = screen.getByRole("dialog");

      // ESC 키 발생
      act(() => {
        fireEvent.keyDown(dialog, { key: "Escape" });
      });

      // 애니메이션 완료
      finishCloseAnimation();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 닫기 버튼 클릭으로 닫기 동작
  // ─────────────────────────────────────────────────────
  describe("닫기 버튼 클릭", () => {
    test("닫기 버튼 클릭 시 닫기 애니메이션이 시작된다", () => {
      renderWithProseImage();

      openLightbox();

      const closeButton = screen.getByRole("button", {
        name: "이미지 닫기",
      });
      const dialog = screen.getByRole("dialog");

      act(() => {
        fireEvent.click(closeButton);
      });

      expect(dialog).toHaveClass("closing");
    });

    test("닫기 버튼 클릭 후 애니메이션 완료 시 라이트박스가 닫힌다", () => {
      renderWithProseImage();

      openLightbox();

      const closeButton = screen.getByRole("button", {
        name: "이미지 닫기",
      });

      act(() => {
        fireEvent.click(closeButton);
      });

      finishCloseAnimation();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 6. 오버레이 클릭으로 닫기 동작
  // ─────────────────────────────────────────────────────
  describe("오버레이 클릭 닫기", () => {
    test("오버레이(배경) 클릭 시 닫기 애니메이션이 시작된다", () => {
      renderWithProseImage();

      openLightbox();

      const dialog = screen.getByRole("dialog");

      // 오버레이(dialog 자체) 클릭
      act(() => {
        fireEvent.click(dialog);
      });

      expect(dialog).toHaveClass("closing");
    });

    test("오버레이 클릭 후 애니메이션 완료 시 라이트박스가 닫힌다", () => {
      renderWithProseImage();

      openLightbox();

      const dialog = screen.getByRole("dialog");

      act(() => {
        fireEvent.click(dialog);
      });

      finishCloseAnimation();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("라이트박스 콘텐츠 영역 클릭은 닫기를 트리거하지 않는다", () => {
      renderWithProseImage();

      openLightbox();

      const content = document.querySelector(".lightbox-content");
      expect(content).toBeInTheDocument();

      act(() => {
        fireEvent.click(content!);
      });

      // stopPropagation으로 닫기 방지
      const dialog = screen.getByRole("dialog");
      expect(dialog).not.toHaveClass("closing");
    });
  });

  // ─────────────────────────────────────────────────────
  // 7. 포커스 복원
  // ─────────────────────────────────────────────────────
  describe("포커스 복원", () => {
    test("라이트박스 닫힘 후 원래 이미지에 포커스가 복원된다", () => {
      renderWithProseImage();

      const image = screen.getByTestId("prose-image");

      openLightbox();

      // 닫기 버튼에 포커스됨
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "이미지 닫기" })
      );

      // ESC로 닫기
      const dialog = screen.getByRole("dialog");
      act(() => {
        fireEvent.keyDown(dialog, { key: "Escape" });
      });

      finishCloseAnimation();

      // 이미지에 포커스 복원 (ImageLightbox가 클릭 시 img에 tabIndex=0과 focus()를 설정)
      expect(document.activeElement).toBe(image);
    });
  });
});
