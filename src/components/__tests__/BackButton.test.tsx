import { render, screen, fireEvent } from "@testing-library/react";
import BackButton from "../BackButton";

/**
 * BackButton 컴포넌트 테스트.
 *
 * - "목록으로" 텍스트와 좌측 화살표 SVG 아이콘을 표시
 * - same origin referrer가 있으면 router.back() 호출 (이전 페이지로 복귀)
 * - referrer가 없거나 외부 사이트이면 router.push("/blog") 호출 (목록으로)
 * - 접근성: aria-label="뒤로 가기"
 * - 스타일: text-sm, mb-6, transition-colors, duration-200
 */

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

describe("BackButton", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
  });

  // ─────────────────────────────────────────────────────
  // 1. 렌더링
  // ─────────────────────────────────────────────────────
  describe("렌더링", () => {
    test('"목록으로" 텍스트가 표시된다', () => {
      render(<BackButton />);

      expect(screen.getByText("목록으로")).toBeInTheDocument();
    });

    test("버튼 요소로 렌더링된다", () => {
      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      expect(button).toBeInTheDocument();
    });

    test("좌측 화살표 SVG 아이콘이 포함된다", () => {
      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 클릭 동작 (referrer 기반)
  // ─────────────────────────────────────────────────────
  describe("클릭 동작", () => {
    test("same origin referrer가 있을 때 클릭 시 router.back()이 호출된다", () => {
      Object.defineProperty(document, "referrer", {
        configurable: true,
        get: () => "http://localhost/blog",
      });

      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      fireEvent.click(button);

      expect(mockBack).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("referrer가 없을 때 (직접 접근) 클릭 시 router.push('/blog')가 호출된다", () => {
      Object.defineProperty(document, "referrer", {
        configurable: true,
        get: () => "",
      });

      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith("/blog");
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockBack).not.toHaveBeenCalled();
    });

    test("외부 사이트 referrer일 때 클릭 시 router.push('/blog')가 호출된다", () => {
      Object.defineProperty(document, "referrer", {
        configurable: true,
        get: () => "https://external-site.com/page",
      });

      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith("/blog");
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockBack).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 접근성
  // ─────────────────────────────────────────────────────
  describe("접근성", () => {
    test('aria-label이 "뒤로 가기"로 설정된다', () => {
      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      expect(button).toHaveAttribute("aria-label", "뒤로 가기");
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. 스타일
  // ─────────────────────────────────────────────────────
  describe("스타일", () => {
    test("text-sm 클래스가 적용된다", () => {
      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      expect(button).toHaveClass("text-sm");
    });

    test("mb-6 클래스가 적용된다", () => {
      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      expect(button).toHaveClass("mb-6");
    });

    test("transition-colors와 duration-200 클래스가 적용된다", () => {
      render(<BackButton />);

      const button = screen.getByRole("button", { name: "뒤로 가기" });
      expect(button).toHaveClass("transition-colors");
      expect(button).toHaveClass("duration-200");
    });
  });
});
