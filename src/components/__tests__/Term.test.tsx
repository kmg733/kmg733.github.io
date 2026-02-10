import { render, screen, fireEvent } from "@testing-library/react";
import { Term } from "../glossary/Term";
import { GlossaryProvider } from "../glossary/GlossaryProvider";
import type { GlossaryEntry } from "@/types";

const mockEntries: GlossaryEntry[] = [
  {
    id: "closure",
    term: "클로저(Closure)",
    brief: "함수가 렉시컬 환경을 기억하는 현상",
    detail: "함수가 자신이 선언된 환경의 변수를 기억한다.",
  },
];

function renderWithProvider(ui: React.ReactElement, entries = mockEntries) {
  return render(<GlossaryProvider entries={entries}>{ui}</GlossaryProvider>);
}

describe("Term", () => {
  it("용어가 Context에 존재하면 abbr 태그로 렌더링한다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    expect(abbr.tagName).toBe("ABBR");
  });

  it("aria-describedby 속성이 올바르게 설정된다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    expect(abbr).toHaveAttribute("aria-describedby", "glossary-closure");
  });

  it("role=doc-noteref 속성이 설정된다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    expect(abbr).toHaveAttribute("role", "doc-noteref");
  });

  it("tabIndex=0으로 키보드 포커스가 가능하다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    expect(abbr).toHaveAttribute("tabindex", "0");
  });

  it("용어가 Context에 없으면 일반 span으로 렌더링한다", () => {
    renderWithProvider(<Term id="nonexistent">알 수 없는 용어</Term>);

    const span = screen.getByText("알 수 없는 용어");
    expect(span.tagName).toBe("SPAN");
  });

  it("호버 시 툴팁이 표시된다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.mouseEnter(abbr);

    expect(
      screen.getByText("함수가 렉시컬 환경을 기억하는 현상")
    ).toBeInTheDocument();
  });

  it("마우스 아웃 시 툴팁이 사라진다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.mouseEnter(abbr);
    fireEvent.mouseLeave(abbr);

    expect(
      screen.queryByText("함수가 렉시컬 환경을 기억하는 현상")
    ).not.toBeInTheDocument();
  });

  it("클릭 시 glossary 섹션으로 스크롤한다", () => {
    const mockScrollIntoView = jest.fn();
    const mockElement = { scrollIntoView: mockScrollIntoView };
    jest.spyOn(document, "getElementById").mockReturnValue(mockElement as unknown as HTMLElement);

    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.click(abbr);

    expect(document.getElementById).toHaveBeenCalledWith("glossary-closure");
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    jest.restoreAllMocks();
  });

  it("Enter 키 누르면 glossary 섹션으로 스크롤한다", () => {
    const mockScrollIntoView = jest.fn();
    const mockElement = { scrollIntoView: mockScrollIntoView };
    jest.spyOn(document, "getElementById").mockReturnValue(mockElement as unknown as HTMLElement);

    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.keyDown(abbr, { key: "Enter" });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    jest.restoreAllMocks();
  });
});
