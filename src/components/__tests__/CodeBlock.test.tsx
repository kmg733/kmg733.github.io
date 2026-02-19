import { render, screen, act, fireEvent } from "@testing-library/react";
import CodeBlock from "../CodeBlock";

// clipboard API mock
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

beforeEach(() => {
  mockWriteText.mockClear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("CodeBlock 컴포넌트", () => {
  // ─────────────────────────────────────────────────────
  // 1. 기본 렌더링
  // ─────────────────────────────────────────────────────
  describe("기본 렌더링", () => {
    test("children이 pre 태그 내부에 렌더링된다", () => {
      render(
        <CodeBlock>
          <code>console.log(&quot;hello&quot;)</code>
        </CodeBlock>
      );

      const pre = screen.getByRole("code").closest("pre");
      expect(pre).toBeInTheDocument();
      expect(screen.getByText('console.log("hello")')).toBeInTheDocument();
    });

    test("data-language 속성이 있으면 언어 라벨이 표시된다", () => {
      render(
        <CodeBlock data-language="javascript">
          <code>const x = 1;</code>
        </CodeBlock>
      );

      expect(screen.getByText("javascript")).toBeInTheDocument();
    });

    test("data-language 속성이 없으면 언어 라벨이 표시되지 않는다", () => {
      render(
        <CodeBlock>
          <code>plain text</code>
        </CodeBlock>
      );

      // 헤더 영역 자체가 없어야 함
      expect(
        document.querySelector(".code-block-header")
      ).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 2. 복사 버튼
  // ─────────────────────────────────────────────────────
  describe("복사 버튼", () => {
    test("복사 버튼이 표시된다", () => {
      render(
        <CodeBlock data-language="js">
          <code>const x = 1;</code>
        </CodeBlock>
      );

      expect(
        screen.getByRole("button", { name: "Copy code" })
      ).toBeInTheDocument();
    });

    test("복사 버튼 클릭 시 코드가 클립보드에 복사된다", async () => {
      render(
        <CodeBlock data-language="js">
          <code>const x = 1;</code>
        </CodeBlock>
      );

      const copyButton = screen.getByRole("button", { name: "Copy code" });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(mockWriteText).toHaveBeenCalledWith("const x = 1;");
    });

    test("복사 성공 후 아이콘이 체크 표시로 변경된다", async () => {
      render(
        <CodeBlock data-language="js">
          <code>const x = 1;</code>
        </CodeBlock>
      );

      const copyButton = screen.getByRole("button", { name: "Copy code" });

      // 복사 전: CopyIcon 표시
      expect(copyButton.querySelector(".icon-copy")).toBeInTheDocument();
      expect(
        copyButton.querySelector(".icon-check")
      ).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(copyButton);
      });

      // 복사 후: CheckIcon 표시
      expect(
        copyButton.querySelector(".icon-copy")
      ).not.toBeInTheDocument();
      expect(copyButton.querySelector(".icon-check")).toBeInTheDocument();
    });

    test("복사 후 2초 뒤에 원래 아이콘으로 복원된다", async () => {
      render(
        <CodeBlock data-language="js">
          <code>const x = 1;</code>
        </CodeBlock>
      );

      const copyButton = screen.getByRole("button", { name: "Copy code" });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      // 체크 아이콘 상태
      expect(copyButton.querySelector(".icon-check")).toBeInTheDocument();

      // 2초 후 원래 아이콘으로 복원
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(copyButton.querySelector(".icon-copy")).toBeInTheDocument();
      expect(
        copyButton.querySelector(".icon-check")
      ).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────
  // 3. 언어 라벨이 없는 경우 플로팅 복사 버튼
  // ─────────────────────────────────────────────────────
  describe("언어 라벨 없는 코드 블록", () => {
    test("data-language가 없으면 플로팅 복사 버튼이 표시된다", () => {
      render(
        <CodeBlock>
          <code>echo hello</code>
        </CodeBlock>
      );

      const copyButton = screen.getByRole("button", { name: "Copy code" });
      expect(copyButton).toHaveClass("code-copy-button-floating");
    });

    test("플로팅 복사 버튼 클릭 시에도 코드가 복사된다", async () => {
      render(
        <CodeBlock>
          <code>echo hello</code>
        </CodeBlock>
      );

      const copyButton = screen.getByRole("button", { name: "Copy code" });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(mockWriteText).toHaveBeenCalledWith("echo hello");
    });
  });

  // ─────────────────────────────────────────────────────
  // 4. props 전달
  // ─────────────────────────────────────────────────────
  describe("props 전달", () => {
    test("추가 props가 pre 태그에 전달된다", () => {
      render(
        <CodeBlock data-language="ts" data-theme="one-dark-pro">
          <code>type X = string;</code>
        </CodeBlock>
      );

      const pre = document.querySelector("pre");
      expect(pre).toHaveAttribute("data-theme", "one-dark-pro");
    });
  });
});
