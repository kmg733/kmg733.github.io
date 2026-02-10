import { render, screen } from "@testing-library/react";
import { GlossarySection } from "../glossary/GlossarySection";
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

describe("GlossarySection", () => {
  it("용어 목록을 dl/dt/dd 태그로 렌더링한다", () => {
    const { container } = render(<GlossarySection entries={mockEntries} />);

    const dl = container.querySelector("dl");
    expect(dl).toBeInTheDocument();

    const dts = container.querySelectorAll("dt");
    expect(dts).toHaveLength(2);

    const dds = container.querySelectorAll("dd");
    expect(dds).toHaveLength(2);
  });

  it("각 용어에 올바른 id 앵커가 설정된다", () => {
    render(<GlossarySection entries={mockEntries} />);

    expect(document.getElementById("glossary-closure")).toBeInTheDocument();
    expect(document.getElementById("glossary-lexical-scope")).toBeInTheDocument();
  });

  it("용어 이름과 상세 설명이 표시된다", () => {
    render(<GlossarySection entries={mockEntries} />);

    expect(screen.getByText("클로저(Closure)")).toBeInTheDocument();
    expect(
      screen.getByText("함수가 자신이 선언된 환경의 변수를 기억한다.")
    ).toBeInTheDocument();
    expect(screen.getByText("렉시컬 스코프(Lexical Scope)")).toBeInTheDocument();
    expect(screen.getByText("정적 스코프라고도 한다.")).toBeInTheDocument();
  });

  it("빈 배열이면 null을 반환한다 (렌더링하지 않는다)", () => {
    const { container } = render(<GlossarySection entries={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("section에 role=doc-endnotes와 aria-label이 설정된다", () => {
    render(<GlossarySection entries={mockEntries} />);

    const section = screen.getByRole("doc-endnotes");
    expect(section).toHaveAttribute("aria-label", "용어 설명");
  });

  it("섹션 제목이 표시된다", () => {
    render(<GlossarySection entries={mockEntries} />);

    expect(screen.getByText("용어 설명")).toBeInTheDocument();
  });

  it("본문으로 돌아가기 링크가 각 용어에 포함된다", () => {
    render(<GlossarySection entries={mockEntries} />);

    const backLinks = screen.getAllByLabelText("본문으로 돌아가기");
    expect(backLinks).toHaveLength(2);
    expect(backLinks[0]).toHaveAttribute("href", "#term-closure");
    expect(backLinks[1]).toHaveAttribute("href", "#term-lexical-scope");
  });
});
