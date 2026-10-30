import { render, screen, fireEvent } from "@testing-library/react";
import { Term } from "../glossary/Term";
import { GlossaryProvider } from "../glossary/GlossaryProvider";
import { GlossarySection } from "../glossary/GlossarySection";
import type { GlossaryEntry } from "@/types";
import { TOC_SYNC_EVENT } from "@/lib/tocSync";

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

  it("기본 aria-describedby가 glossary 섹션을 가리킨다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    expect(abbr).toHaveAttribute("aria-describedby", "glossary-closure");
  });

  it("호버 시 aria-describedby가 툴팁으로 전환된다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.mouseEnter(abbr);

    expect(abbr).toHaveAttribute("aria-describedby", "tooltip-closure");
  });

  it("마우스 아웃 시 aria-describedby가 glossary로 복원된다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.mouseEnter(abbr);
    fireEvent.mouseLeave(abbr);

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

  it("역참조 앵커 타겟으로 사용할 id가 설정된다", () => {
    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    expect(abbr).toHaveAttribute("id", "term-closure");
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
    const mockClassList = { add: jest.fn(), remove: jest.fn() };
    const mockElement = { scrollIntoView: mockScrollIntoView, classList: mockClassList };
    jest.spyOn(document, "getElementById").mockReturnValue(mockElement as unknown as HTMLElement);

    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.click(abbr);

    expect(document.getElementById).toHaveBeenCalledWith("glossary-closure");
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    jest.restoreAllMocks();
  });

  it("스크롤 완료 후 대상 용어 설명 항목에 배경 강조를 적용한다", () => {
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

    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.click(abbr);

    expect(mockClassList.add).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("scrollend"));

    expect(mockClassList.add).toHaveBeenCalledWith("glossary-entry-highlight");

    delete (window as unknown as Record<string, unknown>)["onscrollend"];
    jest.restoreAllMocks();
  });

  it("Enter 키 누르면 glossary 섹션으로 스크롤한다", () => {
    const mockScrollIntoView = jest.fn();
    const mockClassList = { add: jest.fn(), remove: jest.fn() };
    const mockElement = { scrollIntoView: mockScrollIntoView, classList: mockClassList };
    jest.spyOn(document, "getElementById").mockReturnValue(mockElement as unknown as HTMLElement);

    renderWithProvider(<Term id="closure">클로저</Term>);

    const abbr = screen.getByText("클로저");
    fireEvent.keyDown(abbr, { key: "Enter" });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    jest.restoreAllMocks();
  });

  it("클릭 시 접힌 GlossarySection이 자동으로 열린다", () => {
    Element.prototype.scrollIntoView = jest.fn();

    render(
      <GlossaryProvider entries={mockEntries}>
        <Term id="closure">클로저</Term>
        <GlossarySection entries={mockEntries} />
      </GlossaryProvider>
    );

    // 섹션 접기
    const toggleButton = screen.getByRole("button", {
      name: "용어 설명 접기/펼치기",
    });
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    // Term 클릭 → 접힌 섹션이 자동으로 열려야 함
    const abbr = screen.getByText("클로저");
    fireEvent.click(abbr);

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
  });

  describe("주소 해시·목차 동기화", () => {
    let syncListener: jest.Mock;

    beforeEach(() => {
      Element.prototype.scrollIntoView = jest.fn();
      syncListener = jest.fn();
      window.addEventListener(TOC_SYNC_EVENT, syncListener);
    });

    afterEach(() => {
      window.removeEventListener(TOC_SYNC_EVENT, syncListener);
      window.history.replaceState(null, "", "/");
    });

    it("클릭 시 주소 해시를 용어 설명 항목으로 바꾸고 목차를 그 위치로 맞춘다", () => {
      render(
        <GlossaryProvider entries={mockEntries}>
          <Term id="closure">클로저</Term>
          <GlossarySection entries={mockEntries} />
        </GlossaryProvider>
      );

      fireEvent.click(screen.getByText("클로저"));

      expect(window.location.hash).toBe("#glossary-closure");
      expect((syncListener.mock.calls[0][0] as CustomEvent).detail).toBe(
        document.getElementById("glossary-closure")
      );
    });

    it("용어 설명 섹션이 없으면 해시를 바꾸지 않는다", () => {
      renderWithProvider(<Term id="closure">클로저</Term>);

      fireEvent.click(screen.getByText("클로저"));

      expect(window.location.hash).toBe("");
      expect(syncListener).not.toHaveBeenCalled();
    });
  });
});
