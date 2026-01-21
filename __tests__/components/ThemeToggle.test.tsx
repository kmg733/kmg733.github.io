import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThemeToggle from "@/components/ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    // localStorage 초기화
    localStorage.clear();
    // dark 클래스 제거
    document.documentElement.classList.remove("dark");
  });

  it("컴포넌트가 정상적으로 렌더링된다", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("마운트 후 버튼이 표시된다", async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("opacity-0");
    });
  });

  it("클릭 시 라이트모드에서 다크모드로 전환된다", async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("opacity-0");
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(localStorage.getItem("theme")).toBe("dark");
    });
  });

  it("클릭 시 다크모드에서 라이트모드로 전환된다", async () => {
    // 다크모드로 설정
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");

    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("opacity-0");
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
      expect(localStorage.getItem("theme")).toBe("light");
    });
  });

  it("localStorage에 저장된 테마를 불러온다", async () => {
    localStorage.setItem("theme", "dark");

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  it("저장된 테마가 없을 때 시스템 설정을 감지한다", async () => {
    // prefers-color-scheme 모킹
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  it("접근성 레이블이 올바르게 설정된다", async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label");
    });
  });
});
