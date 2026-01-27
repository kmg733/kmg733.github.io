import { render, screen, fireEvent } from "@testing-library/react";
import SearchInput from "@/components/SearchInput";

/**
 * SearchInput 컴포넌트 테스트
 *
 * TDD: RED → GREEN → REFACTOR
 */

describe("SearchInput", () => {
  const mockOnChange = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("렌더링", () => {
    it("should render input element", () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should render search icon", () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      expect(screen.getByTestId("search-icon")).toBeInTheDocument();
    });

    it("should render with placeholder", () => {
      render(
        <SearchInput
          value=""
          onChange={mockOnChange}
          placeholder="검색어를 입력하세요"
        />
      );

      expect(
        screen.getByPlaceholderText("검색어를 입력하세요")
      ).toBeInTheDocument();
    });

    it("should render default placeholder when not provided", () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText("포스트 검색...")).toBeInTheDocument();
    });
  });

  describe("입력 동작", () => {
    it("should call onChange when typing", () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "React" } });

      expect(mockOnChange).toHaveBeenCalledWith("React");
    });

    it("should display current value", () => {
      render(<SearchInput value="TypeScript" onChange={mockOnChange} />);

      expect(screen.getByRole("searchbox")).toHaveValue("TypeScript");
    });
  });

  describe("클리어 버튼", () => {
    it("should not show clear button when value is empty", () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      expect(
        screen.queryByRole("button", { name: /클리어|지우기|clear/i })
      ).not.toBeInTheDocument();
    });

    it("should show clear button when value exists", () => {
      render(
        <SearchInput value="React" onChange={mockOnChange} onClear={mockOnClear} />
      );

      expect(screen.getByTestId("clear-button")).toBeInTheDocument();
    });

    it("should call onClear when clear button is clicked", () => {
      render(
        <SearchInput value="React" onChange={mockOnChange} onClear={mockOnClear} />
      );

      fireEvent.click(screen.getByTestId("clear-button"));

      expect(mockOnClear).toHaveBeenCalled();
    });
  });

  describe("검색 중 상태", () => {
    it("should show loading indicator when isSearching is true", () => {
      render(
        <SearchInput value="React" onChange={mockOnChange} isSearching={true} />
      );

      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });

    it("should not show loading indicator when isSearching is false", () => {
      render(
        <SearchInput value="React" onChange={mockOnChange} isSearching={false} />
      );

      expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
    });
  });

  describe("결과 개수 표시", () => {
    it("should show result count when provided", () => {
      render(
        <SearchInput
          value="React"
          onChange={mockOnChange}
          resultCount={5}
        />
      );

      expect(screen.getByText("5개")).toBeInTheDocument();
    });

    it("should not show result count when 0", () => {
      render(
        <SearchInput
          value="React"
          onChange={mockOnChange}
          resultCount={0}
        />
      );

      expect(screen.queryByText(/\d+개/)).not.toBeInTheDocument();
    });

    it("should not show result count when value is empty", () => {
      render(
        <SearchInput value="" onChange={mockOnChange} resultCount={5} />
      );

      expect(screen.queryByText(/\d+개/)).not.toBeInTheDocument();
    });
  });

  describe("접근성", () => {
    it("should have accessible label", () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      expect(screen.getByLabelText("포스트 검색")).toBeInTheDocument();
    });

    it("should have type=search for input", () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      expect(screen.getByRole("searchbox")).toHaveAttribute("type", "search");
    });

    it("should have clear button with accessible label", () => {
      render(
        <SearchInput value="React" onChange={mockOnChange} onClear={mockOnClear} />
      );

      const clearButton = screen.getByTestId("clear-button");
      expect(clearButton).toHaveAttribute("aria-label", "검색어 지우기");
    });
  });

  describe("스타일 클래스", () => {
    it("should apply custom className", () => {
      render(
        <SearchInput
          value=""
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      const container = screen.getByTestId("search-container");
      expect(container).toHaveClass("custom-class");
    });
  });
});
