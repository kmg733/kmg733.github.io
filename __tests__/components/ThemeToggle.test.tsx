import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThemeToggle from "@/components/ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.remove("no-transition");
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
    // 인라인 스크립트가 설정하는 DOM 상태를 시뮬레이션
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

  it("DOM에서 다크모드 상태를 읽어온다 (인라인 스크립트가 설정한 상태)", async () => {
    // 인라인 스크립트가 localStorage 기반으로 .dark 클래스를 미리 적용한 상태를 시뮬레이션
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
    });
  });

  it("DOM에 dark 클래스가 없으면 라이트모드로 동기화된다", async () => {
    // 인라인 스크립트가 라이트모드로 결정한 상태
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
    });
  });

  it("마운트 후 no-transition 클래스를 제거한다", async () => {
    // 인라인 스크립트가 설정하는 no-transition 상태를 시뮬레이션
    document.documentElement.classList.add("no-transition");

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("no-transition");
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
