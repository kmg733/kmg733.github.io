import { render, screen, act, fireEvent } from "@testing-library/react";
import ImageHoverPreview from "../ImageHoverPreview";

/**
 * ImageHoverPreview 통합 테스트.
 *
 * document 레벨 mouseover/mouseout 이벤트 위임으로 .prose 내 img를 감지하고,
 * createPortal로 document.body에 확대 프리뷰를 렌더한다.
 */

/** .prose 래퍼 안에 이미지가 있는 페이지를 렌더한다. */
function renderWithProseImage(alt = "sample image") {
  return render(
    <div>
      <div className="prose">
        <img src="/test.png" alt={alt} data-testid="prose-image" />
      </div>
      <div>
        <img src="/outside.png" alt="outside" data-testid="outside-image" />
      </div>
      <ImageHoverPreview />
    </div>
  );
}

/** matchMedia를 hover 지원 환경으로 모킹한다. */
function mockHoverSupported(supported: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: supported && query === "(hover: hover)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe("ImageHoverPreview 통합 테스트", () => {
  beforeEach(() => {
    mockHoverSupported(true);
  });

  // ─────────────────────────────────────────────────────
  // 1. 이미지 hover 시 프리뷰 표시
  // ─────────────────────────────────────────────────────
  describe("프리뷰 표시", () => {
    test("prose 내 이미지에 마우스를 올리면 프리뷰가 표시된다", () => {
      renderWithProseImage("테스트 이미지");

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();

      const image = screen.getByTestId("prose-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      const preview = document.querySelector(".image-hover-preview");
      expect(preview).toBeInTheDocument();

      const previewImg = preview?.querySelector("img");
      expect(previewImg?.getAttribute("src")).toContain("test.png");
      expect(previewImg).toHaveAttribute("alt", "테스트 이미지");
    });

    test("마우스를 이미지에서 벗어나면 프리뷰가 사라진다", () => {
      renderWithProseImage();

      const image = screen.getByTestId("prose-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).toBeInTheDocument();

      act(() => {
        fireEvent.mouseOut(image);
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 필터링 - prose 외부 이미지
  // ─────────────────────────────────────────────────────
  describe("필터링", () => {
    test("prose 외부 이미지에서는 프리뷰가 표시되지 않는다", () => {
      renderWithProseImage();

      const outsideImage = screen.getByTestId("outside-image");

      act(() => {
        fireEvent.mouseOver(outsideImage, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();
    });

    test("Lightbox가 열려있을 때 hover 프리뷰가 표시되지 않는다", () => {
      renderWithProseImage();

      // Lightbox 오버레이가 존재하는 상태 시뮬레이션
      const overlay = document.createElement("div");
      overlay.className = "lightbox-overlay";
      document.body.appendChild(overlay);

      const image = screen.getByTestId("prose-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();

      document.body.removeChild(overlay);
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 비정상 프로토콜 이미지 필터링
  // ─────────────────────────────────────────────────────
  describe("프로토콜 검증", () => {
    test("data: URI 이미지에서는 프리뷰가 표시되지 않는다", () => {
      render(
        <div>
          <div className="prose">
            <img
              src="data:image/png;base64,iVBOR"
              alt="data uri"
              data-testid="data-image"
            />
          </div>
          <ImageHoverPreview />
        </div>
      );

      const image = screen.getByTestId("data-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();
    });

    test("blob: URI 이미지에서는 프리뷰가 표시되지 않는다", () => {
      render(
        <div>
          <div className="prose">
            <img
              src="blob:http://localhost/abc"
              alt="blob uri"
              data-testid="blob-image"
            />
          </div>
          <ImageHoverPreview />
        </div>
      );

      const image = screen.getByTestId("blob-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 프리뷰 해제 - scroll, Escape, visibilitychange
  // ─────────────────────────────────────────────────────
  describe("프리뷰 해제", () => {
    test("스크롤 시 프리뷰가 사라진다", () => {
      renderWithProseImage();

      const image = screen.getByTestId("prose-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).toBeInTheDocument();

      act(() => {
        fireEvent.scroll(window);
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();
    });

    test("Escape 키 입력 시 프리뷰가 사라진다", () => {
      renderWithProseImage();

      const image = screen.getByTestId("prose-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();
    });

    test("탭 전환(visibilitychange) 시 프리뷰가 사라진다", () => {
      renderWithProseImage();

      const image = screen.getByTestId("prose-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).toBeInTheDocument();

      act(() => {
        Object.defineProperty(document, "hidden", {
          writable: true,
          value: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();

      // cleanup
      Object.defineProperty(document, "hidden", {
        writable: true,
        value: false,
      });
    });
  });

  // ─────────────────────────────────────────────────────
  // 5. 모바일 환경 비활성화
  // ─────────────────────────────────────────────────────
  describe("모바일 환경", () => {
    test("hover 미지원 환경에서는 프리뷰가 표시되지 않는다", () => {
      mockHoverSupported(false);
      renderWithProseImage();

      const image = screen.getByTestId("prose-image");

      act(() => {
        fireEvent.mouseOver(image, { clientX: 200, clientY: 300 });
      });

      expect(
        document.querySelector(".image-hover-preview")
      ).not.toBeInTheDocument();
    });
  });
});
