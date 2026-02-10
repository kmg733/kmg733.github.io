import { render, screen, fireEvent } from "@testing-library/react";
import { GlossarySection } from "../glossary/GlossarySection";
import { GlossaryProvider } from "../glossary/GlossaryProvider";
import type { GlossaryEntry } from "@/types";

const mockEntries: GlossaryEntry[] = [
  {
    id: "closure",
    term: "클로저(Closure)",
    brief: "함수가 렉시컬 환경을 기억하는 현상",
    detail: "함수가 자신이 선언된 환경의 변수를 기억한다.",
  },
  {
    id: "lexical-scope",
    term: "렉시컬 스코프(Lexical Scope)",
    brief: "선언 위치에 따라 스코프가 결정되는 규칙",
    detail: "정적 스코프라고도 한다.",
  },
];

function renderWithProvider(entries = mockEntries) {
  return render(
    <GlossaryProvider entries={entries}>
      <GlossarySection entries={entries} />
    </GlossaryProvider>
  );
}

describe("GlossarySection", () => {
  it("용어 목록을 dl/dt/dd 태그로 렌더링한다", () => {
    const { container } = renderWithProvider();

    const dl = container.querySelector("dl");
    expect(dl).toBeInTheDocument();

    const dts = container.querySelectorAll("dt");
    expect(dts).toHaveLength(2);

    const dds = container.querySelectorAll("dd");
    expect(dds).toHaveLength(2);
  });

  it("각 용어에 올바른 id 앵커가 설정된다", () => {
    renderWithProvider();

    expect(document.getElementById("glossary-closure")).toBeInTheDocument();
    expect(document.getElementById("glossary-lexical-scope")).toBeInTheDocument();
  });

  it("용어 이름과 상세 설명이 표시된다", () => {
    renderWithProvider();

    expect(screen.getByText("클로저(Closure)")).toBeInTheDocument();
    expect(
      screen.getByText("함수가 자신이 선언된 환경의 변수를 기억한다.")
    ).toBeInTheDocument();
    expect(screen.getByText("렉시컬 스코프(Lexical Scope)")).toBeInTheDocument();
    expect(screen.getByText("정적 스코프라고도 한다.")).toBeInTheDocument();
  });

  it("빈 배열이면 null을 반환한다 (렌더링하지 않는다)", () => {
    const { container } = render(
      <GlossaryProvider entries={[]}>
        <GlossarySection entries={[]} />
      </GlossaryProvider>
    );
    expect(container.querySelector(".glossary-section")).toBeNull();
  });

  it("section에 role=doc-endnotes와 aria-label이 설정된다", () => {
    renderWithProvider();

    const section = screen.getByRole("doc-endnotes");
    expect(section).toHaveAttribute("aria-label", "용어 설명");
  });

  it("섹션 제목이 표시된다", () => {
    renderWithProvider();

    expect(screen.getByText("용어 설명")).toBeInTheDocument();
  });

  it("본문으로 돌아가기 링크가 각 용어에 포함된다", () => {
    renderWithProvider();

    const backLinks = screen.getAllByLabelText("본문으로 돌아가기");
    expect(backLinks).toHaveLength(2);
    expect(backLinks[0]).toHaveAttribute("href", "#term-closure");
    expect(backLinks[1]).toHaveAttribute("href", "#term-lexical-scope");
  });

  it("토글 버튼이 존재하고 aria-expanded가 설정된다", () => {
    renderWithProvider();

    const toggleButton = screen.getByRole("button", {
      name: "용어 설명 접기/펼치기",
    });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
  });

  it("토글 버튼 클릭 시 용어 목록이 접힌다", () => {
    const { container } = renderWithProvider();

    const toggleButton = screen.getByRole("button", {
      name: "용어 설명 접기/펼치기",
    });
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    const list = container.querySelector(".glossary-list");
    expect(list).toHaveClass("glossary-list-closed");
  });

  it("접힌 상태에서 다시 클릭하면 펼쳐진다", () => {
    const { container } = renderWithProvider();

    const toggleButton = screen.getByRole("button", {
      name: "용어 설명 접기/펼치기",
    });
    fireEvent.click(toggleButton); // 접기
    fireEvent.click(toggleButton); // 펼치기

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    const list = container.querySelector(".glossary-list");
    expect(list).toHaveClass("glossary-list-open");
  });

  it("↑ 클릭 시 smooth scroll로 본문 용어 위치로 이동한다", () => {
    const mockScrollIntoView = jest.fn();
    const mockClassList = { add: jest.fn(), remove: jest.fn() };
    const mockElement = {
      scrollIntoView: mockScrollIntoView,
      classList: mockClassList,
    };
    jest.spyOn(document, "getElementById").mockReturnValue(mockElement as unknown as HTMLElement);

    renderWithProvider();

    const backLink = screen.getAllByLabelText("본문으로 돌아가기")[0];
    fireEvent.click(backLink);

    expect(document.getElementById).toHaveBeenCalledWith("term-closure");
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    jest.restoreAllMocks();
  });

  it("↑ 클릭 시 스크롤 완료 후 대상 Term에 강조 애니메이션을 적용한다", () => {
    Object.defineProperty(window, "onscrollend", {
      value: null,
      writable: true,
      configurable: true,
    });

    const mockClassList = { add: jest.fn(), remove: jest.fn() };
    const mockElement = {
      scrollIntoView: jest.fn(),
      classList: mockClassList,
    };
    jest.spyOn(document, "getElementById").mockReturnValue(mockElement as unknown as HTMLElement);

    renderWithProvider();

    const backLink = screen.getAllByLabelText("본문으로 돌아가기")[0];
    fireEvent.click(backLink);

    expect(mockClassList.add).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("scrollend"));

    expect(mockClassList.add).toHaveBeenCalledWith("glossary-highlight");

    delete (window as Record<string, unknown>)["onscrollend"];
    jest.restoreAllMocks();
  });
});
