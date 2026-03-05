import { render, screen } from "@testing-library/react";
import PostThumbnail from "../PostThumbnail";

describe("PostThumbnail", () => {
  describe("썸네일 미지정 시 기본 이미지", () => {
    it("라이트 모드용 기본 이미지가 표시된다", () => {
      const { container } = render(<PostThumbnail alt="Test" />);

      const imgs = container.querySelectorAll("img");
      const lightImg = Array.from(imgs).find((img) =>
        img.getAttribute("src")?.includes("default-thumbnail-light")
      );
      expect(lightImg).toBeDefined();
      expect(lightImg).toHaveClass("block");
      expect(lightImg).toHaveClass("dark:hidden");
    });

    it("다크 모드용 기본 이미지가 표시된다", () => {
      const { container } = render(<PostThumbnail alt="Test" />);

      const imgs = container.querySelectorAll("img");
      const darkImg = Array.from(imgs).find((img) =>
        img.getAttribute("src")?.includes("default-thumbnail-dark")
      );
      expect(darkImg).toBeDefined();
      expect(darkImg).toHaveClass("hidden");
      expect(darkImg).toHaveClass("dark:block");
    });
  });

  describe("썸네일 지정 시", () => {
    it("라이트/다크 이미지 쌍이 렌더링된다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/javascript" alt="JS" />
      );

      const imgs = container.querySelectorAll("img");
      expect(imgs).toHaveLength(2);
      expect(imgs[0]).toHaveAttribute(
        "src",
        "/images/thumbnails/javascript-light.png"
      );
      expect(imgs[1]).toHaveAttribute(
        "src",
        "/images/thumbnails/javascript-dark.png"
      );
    });

    it("라이트 이미지는 다크모드에서 숨겨진다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );

      const imgs = container.querySelectorAll("img");
      expect(imgs[0]).toHaveClass("block", "dark:hidden");
    });

    it("다크 이미지는 라이트모드에서 숨겨진다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );

      const imgs = container.querySelectorAll("img");
      expect(imgs[1]).toHaveClass("hidden", "dark:block");
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

    it("기본 이미지에도 className이 적용된다", () => {
      const { container } = render(
        <PostThumbnail alt="Test" className="custom-class" />
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

      const imgs = container.querySelectorAll("img");
      const darkImg = Array.from(imgs).find((img) =>
        img.className.includes("dark:block")
      );
      expect(darkImg).toHaveAttribute("alt", "");
    });

    it("라이트 이미지만 의미 있는 alt 텍스트를 가진다", () => {
      render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test Image" />
      );

      const lightImg = screen.getByAltText("Test Image");
      expect(lightImg).toHaveClass("block", "dark:hidden");
    });
  });

  describe("lazy loading", () => {
    it("모든 이미지에 loading=lazy가 적용된다", () => {
      const { container } = render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );

      const imgs = container.querySelectorAll("img");
      imgs.forEach((img) => {
        expect(img).toHaveAttribute("loading", "lazy");
      });
    });
  });
});
