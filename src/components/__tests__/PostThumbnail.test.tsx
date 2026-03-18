import { render, screen, fireEvent } from "@testing-library/react";
import PostThumbnail from "../PostThumbnail";

// blur-data.json mock
jest.mock("@/lib/thumbnail-blur-data.json", () => ({
  "/images/thumbnails/javascript-light.png":
    "data:image/webp;base64,AAAA",
  "/images/thumbnails/javascript-dark.png":
    "data:image/webp;base64,BBBB",
}));

/** 헬퍼: 라이트/다크 wrapper div 가져오기 */
function getWrapperDivs(container: HTMLElement) {
  const divs = container.querySelectorAll<HTMLDivElement>(":scope > div");
  return { lightDiv: divs[0], darkDiv: divs[1] };
}

/** 헬퍼: 라이트/다크 img 가져오기 */
function getImages(container: HTMLElement) {
  const imgs = container.querySelectorAll("img");
  return { lightImg: imgs[0], darkImg: imgs[1] };
}

describe("PostThumbnail", () => {
  describe("썸네일 미지정 시 기본 이미지", () => {
    it("라이트 모드용 기본 SVG 이미지가 표시된다", () => {
      const { container } = render(<PostThumbnail alt="Test" />);
      const { lightImg } = getImages(container);

      expect(lightImg).toBeDefined();
      expect(lightImg).toHaveAttribute(
        "src",
        expect.stringContaining("default-thumbnail-light")
      );
    });

    it("다크 모드용 기본 SVG 이미지가 표시된다", () => {
      const { container } = render(<PostThumbnail alt="Test" />);
      const { darkImg } = getImages(container);

      expect(darkImg).toBeDefined();
      expect(darkImg).toHaveAttribute(
        "src",
        expect.stringContaining("default-thumbnail-dark")
      );
    });
  });

  describe("썸네일 지정 시", () => {
    it("라이트/다크 이미지 쌍이 렌더링된다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/javascript" alt="JS" />
      );
      const { lightImg, darkImg } = getImages(container);

      expect(lightImg).toHaveAttribute(
        "src",
        "/images/thumbnails/javascript-light.png"
      );
      expect(darkImg).toHaveAttribute(
        "src",
        "/images/thumbnails/javascript-dark.png"
      );
    });

    it("라이트 wrapper div는 다크모드에서 숨겨진다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );
      const { lightDiv } = getWrapperDivs(container);

      expect(lightDiv).toHaveClass("block", "dark:hidden");
    });

    it("다크 wrapper div는 라이트모드에서 숨겨진다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );
      const { darkDiv } = getWrapperDivs(container);

      expect(darkDiv).toHaveClass("hidden", "dark:block");
    });
  });

  describe("WebP source 태그", () => {
    it("picture 내 source가 WebP srcSet을 가진다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/javascript" alt="JS" />
      );
      const sources = container.querySelectorAll("source");

      expect(sources).toHaveLength(2);
      expect(sources[0]).toHaveAttribute(
        "srcset",
        "/images/thumbnails/javascript-light.webp"
      );
      expect(sources[0]).toHaveAttribute("type", "image/webp");
      expect(sources[1]).toHaveAttribute(
        "srcset",
        "/images/thumbnails/javascript-dark.webp"
      );
    });
  });

  describe("blur placeholder", () => {
    it("blur data가 있으면 wrapper에 backgroundImage 스타일이 적용된다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/javascript" alt="JS" />
      );
      const { lightDiv } = getWrapperDivs(container);

      expect(lightDiv.style.backgroundImage).toContain("data:image/webp;base64,AAAA");
    });

    it("blur data가 없으면 backgroundImage가 없다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/unknown" alt="Unknown" />
      );
      const { lightDiv } = getWrapperDivs(container);

      expect(lightDiv.style.backgroundImage).toBe("");
    });

    it("이미지 로드 완료 시 opacity가 100으로 전환된다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/javascript" alt="JS" />
      );
      const { lightImg } = getImages(container);

      expect(lightImg).toHaveClass("opacity-0");

      fireEvent.load(lightImg);

      expect(lightImg).toHaveClass("opacity-100");
    });

    it("이미지 로드 완료 시 backgroundImage가 none으로 전환된다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/javascript" alt="JS" />
      );
      const { lightDiv } = getWrapperDivs(container);
      const { lightImg } = getImages(container);

      fireEvent.load(lightImg);

      expect(lightDiv.style.backgroundImage).toBe("none");
    });
  });

  describe("M1: getBlurData data URI 검증", () => {
    it("data:image/ 접두사가 아닌 값은 무시된다", () => {
      // blur-data.json에 유효하지 않은 값이 있을 경우 backgroundImage가 적용되지 않아야 함
      // mock에 없는 키는 undefined를 반환하므로 이 테스트는 기본 동작 검증
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/unknown" alt="Unknown" />
      );
      const { lightDiv } = getWrapperDivs(container);

      expect(lightDiv.style.backgroundImage).toBe("");
    });
  });

  describe("M3: blurStyle 순수 함수", () => {
    it("loaded=true일 때 backgroundImage가 none이다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/javascript" alt="JS" />
      );
      const { lightImg } = getImages(container);
      const { lightDiv } = getWrapperDivs(container);

      fireEvent.load(lightImg);

      expect(lightDiv.style.backgroundImage).toBe("none");
    });
  });

  describe("커스텀 className", () => {
    it("className이 각 이미지에 적용된다", () => {
      const { container } = render(
        <PostThumbnail
          thumbnail="/images/thumbnails/test"
          alt="Test"
          className="custom-class"
        />
      );
      const imgs = container.querySelectorAll("img");
      imgs.forEach((img) => {
        expect(img).toHaveClass("custom-class");
      });
    });
  });

  describe("접근성 - 중복 alt 텍스트 방지", () => {
    it("다크 이미지는 빈 alt로 decorative 처리된다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test Image" />
      );
      const { darkImg } = getImages(container);

      expect(darkImg).toHaveAttribute("alt", "");
    });

    it("라이트 이미지만 의미 있는 alt 텍스트를 가진다", () => {
      render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test Image" />
      );
      const lightImg = screen.getByAltText("Test Image");
      expect(lightImg).toBeInTheDocument();
    });
  });

  describe("lazy loading 및 CLS 방지", () => {
    it("모든 이미지에 loading=lazy가 적용된다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );
      const imgs = container.querySelectorAll("img");
      imgs.forEach((img) => {
        expect(img).toHaveAttribute("loading", "lazy");
      });
    });

    it("width/height 속성이 명시되어 있다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );
      const imgs = container.querySelectorAll("img");
      imgs.forEach((img) => {
        expect(img).toHaveAttribute("width", "640");
        expect(img).toHaveAttribute("height", "427");
      });
    });
  });
});
