import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HighlightedText from "../HighlightedText";

describe("HighlightedText", () => {
  it("쿼리가 없으면 원본 텍스트를 그대로 렌더링한다", () => {
    render(<HighlightedText text="Hello World" query="" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("텍스트가 없으면 빈 렌더링한다", () => {
    const { container } = render(<HighlightedText text="" query="test" />);
    expect(container.textContent).toBe("");
  });

  it("매치되는 부분을 mark 태그로 하이라이트한다", () => {
    const { container } = render(
      <HighlightedText text="Hello World" query="World" />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("World");
    expect(marks[0].className).toBe("search-highlight");
  });

  it("대소문자를 구분하지 않고 하이라이트한다", () => {
    const { container } = render(
      <HighlightedText text="Hello World" query="hello" />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("Hello");
  });

  it("여러 매치를 모두 하이라이트한다", () => {
    const { container } = render(
      <HighlightedText text="abc abc abc" query="abc" />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(3);
  });

  it("매치되지 않으면 mark 태그 없이 원본 텍스트를 렌더링한다", () => {
    const { container } = render(
      <HighlightedText text="Hello World" query="xyz" />
    );

    expect(container.querySelectorAll("mark")).toHaveLength(0);
    expect(container.textContent).toBe("Hello World");
  });

  it("HTML 특수문자가 이스케이프되어 안전하게 렌더링된다", () => {
    const { container } = render(
      <HighlightedText text="<script>alert('xss')</script>" query="script" />
    );

    // HTML 태그가 실행되지 않고 텍스트로 렌더링
    expect(container.innerHTML).not.toContain("<script>");
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2); // "script" 두 번 매치
  });
});
