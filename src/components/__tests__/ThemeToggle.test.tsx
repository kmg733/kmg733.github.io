import { render, screen, fireEvent, act } from "@testing-library/react";
import ThemeToggle from "../ThemeToggle";

type ChangeListener = (e: MediaQueryListEvent) => void;

describe("ThemeToggle", () => {
  let systemListener: ChangeListener | null;
  let removeEventListener: jest.Mock;

  const favicon = () =>
    document.querySelector<HTMLLinkElement>("link#theme-favicon");

  beforeEach(() => {
    document.documentElement.className = "no-transition";
    document.head.innerHTML = "";
    localStorage.clear();
    systemListener = null;
    removeEventListener = jest.fn();

    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_type: string, listener: ChangeListener) => {
        systemListener = listener;
      },
      removeEventListener,
    }));
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("라이트 테마면 다크 모드 전환 버튼을 보여준다", () => {
    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "다크 모드로 전환" })
    ).toBeInTheDocument();
    expect(favicon()?.getAttribute("href")).toBe("/icon-light.svg");
  });

  it("인라인 스크립트가 적용한 다크 테마를 DOM에서 읽어 보여준다", () => {
    document.documentElement.classList.add("dark");

    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "라이트 모드로 전환" })
    ).toBeInTheDocument();
    expect(favicon()?.getAttribute("href")).toBe("/icon-dark.svg");
  });

  it("마운트 후 no-transition 클래스를 제거한다", () => {
    render(<ThemeToggle />);

    expect(document.documentElement.classList.contains("no-transition")).toBe(
      false
    );
  });

  it("클릭하면 테마를 바꾸고 localStorage와 favicon에 반영한다", () => {
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "다크 모드로 전환" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(favicon()?.getAttribute("href")).toBe("/icon-dark.svg");
    expect(
      screen.getByRole("button", { name: "라이트 모드로 전환" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "라이트 모드로 전환" }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("저장된 설정이 없으면 시스템 테마 변경을 따른다", () => {
    render(<ThemeToggle />);

    act(() => {
      systemListener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(
      screen.getByRole("button", { name: "라이트 모드로 전환" })
    ).toBeInTheDocument();
  });

  it("저장된 설정이 있으면 시스템 테마 변경을 무시한다", () => {
    localStorage.setItem("theme", "light");
    render(<ThemeToggle />);

    act(() => {
      systemListener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(
      screen.getByRole("button", { name: "다크 모드로 전환" })
    ).toBeInTheDocument();
  });

  it("언마운트하면 시스템 테마 리스너를 제거한다", () => {
    const { unmount } = render(<ThemeToggle />);

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("change", systemListener);
  });
});
