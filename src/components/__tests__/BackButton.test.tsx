import { render, screen } from "@testing-library/react";
import BackButton from "../BackButton";

/**
 * BackButton 컴포넌트 테스트.
 *
 * - "목록으로" 텍스트와 좌측 화살표 SVG 아이콘을 표시
 * - 항상 /blog 로 이동하는 Link로 렌더링
 * - 접근성: aria-label="블로그 목록으로"
 * - 스타일: text-sm, mb-6, transition-colors, duration-200
 */

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("BackButton", () => {
  // ─────────────────────────────────────────────────────
  // 1. 렌더링
  // ─────────────────────────────────────────────────────
  describe("렌더링", () => {
    test('"목록으로" 텍스트가 표시된다', () => {
      render(<BackButton />);

      expect(screen.getByText("목록으로")).toBeInTheDocument();
    });

    test("링크 요소로 렌더링된다", () => {
      render(<BackButton />);

      const link = screen.getByRole("link", { name: "블로그 목록으로" });
      expect(link).toBeInTheDocument();
    });

    test("href가 /blog를 가리킨다", () => {
      render(<BackButton />);

      const link = screen.getByRole("link", { name: "블로그 목록으로" });
      expect(link).toHaveAttribute("href", "/blog");
    });

    test("좌측 화살표 SVG 아이콘이 포함된다", () => {
      render(<BackButton />);

      const link = screen.getByRole("link", { name: "블로그 목록으로" });
      const svg = link.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 접근성
  // ─────────────────────────────────────────────────────
  describe("접근성", () => {
    test('aria-label이 "블로그 목록으로"로 설정된다', () => {
      render(<BackButton />);

      const link = screen.getByRole("link", { name: "블로그 목록으로" });
      expect(link).toHaveAttribute("aria-label", "블로그 목록으로");
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 스타일
  // ─────────────────────────────────────────────────────
  describe("스타일", () => {
    test("text-sm 클래스가 적용된다", () => {
      render(<BackButton />);

      const link = screen.getByRole("link", { name: "블로그 목록으로" });
      expect(link).toHaveClass("text-sm");
    });

    test("mb-6 클래스가 적용된다", () => {
      render(<BackButton />);

      const link = screen.getByRole("link", { name: "블로그 목록으로" });
      expect(link).toHaveClass("mb-6");
    });

    test("transition-colors와 duration-200 클래스가 적용된다", () => {
      render(<BackButton />);

      const link = screen.getByRole("link", { name: "블로그 목록으로" });
      expect(link).toHaveClass("transition-colors");
      expect(link).toHaveClass("duration-200");
    });
  });
});
