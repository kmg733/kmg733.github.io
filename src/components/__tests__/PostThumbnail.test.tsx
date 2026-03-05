import { render, screen } from "@testing-library/react";
import PostThumbnail from "../PostThumbnail";

describe("PostThumbnail", () => {
  describe("썸네일 미지정 시 기본 이미지", () => {
    it("라이트 모드용 기본 이미지가 표시된다", () => {
      render(<PostThumbnail alt="Test" />);

      const imgs = screen.getAllByAltText("Test");
      const lightImg = imgs.find((img) =>
        img.getAttribute("src")?.includes("default-thumbnail-light")
      );
      expect(lightImg).toBeDefined();
      expect(lightImg).toHaveClass("block");
      expect(lightImg).toHaveClass("dark:hidden");
    });

    it("다크 모드용 기본 이미지가 표시된다", () => {
      render(<PostThumbnail alt="Test" />);

      const imgs = screen.getAllByAltText("Test");
      const darkImg = imgs.find((img) =>
        img.getAttribute("src")?.includes("default-thumbnail-dark")
      );
      expect(darkImg).toBeDefined();
      expect(darkImg).toHaveClass("hidden");
      expect(darkImg).toHaveClass("dark:block");
    });
  });

  describe("썸네일 지정 시", () => {
    it("라이트/다크 이미지 쌍이 렌더링된다", () => {
      render(
        <PostThumbnail thumbnail="/images/thumbnails/javascript" alt="JS" />
      );

      const imgs = screen.getAllByAltText("JS");
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
      render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );

      const imgs = screen.getAllByAltText("Test");
      expect(imgs[0]).toHaveClass("block", "dark:hidden");
    });

    it("다크 이미지는 라이트모드에서 숨겨진다", () => {
      render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );

      const imgs = screen.getAllByAltText("Test");
      expect(imgs[1]).toHaveClass("hidden", "dark:block");
    });
  });

  describe("커스텀 className", () => {
    it("className이 각 이미지에 적용된다", () => {
      render(
        <PostThumbnail
          thumbnail="/images/thumbnails/test"
          alt="Test"
          className="custom-class"
        />
      );

      const imgs = screen.getAllByAltText("Test");
      imgs.forEach((img) => {
        expect(img).toHaveClass("custom-class");
      });
    });

    it("기본 이미지에도 className이 적용된다", () => {
      render(<PostThumbnail alt="Test" className="custom-class" />);

      const imgs = screen.getAllByAltText("Test");
      imgs.forEach((img) => {
        expect(img).toHaveClass("custom-class");
      });
    });
  });

  describe("lazy loading", () => {
    it("모든 이미지에 loading=lazy가 적용된다", () => {
      render(
        <PostThumbnail thumbnail="/images/thumbnails/test" alt="Test" />
      );

      const imgs = screen.getAllByAltText("Test");
      imgs.forEach((img) => {
        expect(img).toHaveAttribute("loading", "lazy");
      });
    });
  });
});
