import { render, screen } from "@testing-library/react";
import GiscusComments from "../GiscusComments";

// @giscus/react 모킹
jest.mock("@giscus/react", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <div data-testid="giscus-widget" data-theme={props.theme as string} />
  ),
}));

// useTheme 훅 모킹
let mockTheme: "light" | "dark" = "light";
jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => mockTheme,
}));

describe("GiscusComments", () => {
  beforeEach(() => {
    mockTheme = "light";
  });

  // ─────────────────────────────────────────────────────
  // 1. 렌더링
  // ─────────────────────────────────────────────────────
  describe("렌더링", () => {
    test("giscus 위젯이 렌더링된다", () => {
      render(<GiscusComments />);

      expect(screen.getByTestId("giscus-widget")).toBeInTheDocument();
    });

    test("댓글 섹션 구분선이 표시된다", () => {
      const { container } = render(<GiscusComments />);

      expect(container.querySelector("hr")).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 테마 연동
  // ─────────────────────────────────────────────────────
  describe("테마 연동", () => {
    test("light 모드에서 light 테마가 전달된다", () => {
      mockTheme = "light";

      render(<GiscusComments />);

      expect(screen.getByTestId("giscus-widget")).toHaveAttribute(
        "data-theme",
        "light"
      );
    });

    test("dark 모드에서 dark_dimmed 테마가 전달된다", () => {
      mockTheme = "dark";

      render(<GiscusComments />);

      expect(screen.getByTestId("giscus-widget")).toHaveAttribute(
        "data-theme",
        "dark_dimmed"
      );
    });
  });
});
