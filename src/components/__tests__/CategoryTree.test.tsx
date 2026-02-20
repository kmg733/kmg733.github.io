import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CategoryTree from "../CategoryTree";
import type { CategoryTree as CategoryTreeType } from "@/types";

const mockSelectCategory = jest.fn();
const mockSelectSubcategory = jest.fn();
const mockClearFilter = jest.fn();
const mockToggleExpanded = jest.fn();
const mockIsExpanded = jest.fn().mockReturnValue(true);

const sampleTree: CategoryTreeType = [
  {
    name: "개발",
    count: 5,
    subcategories: [
      { name: "JavaScript", count: 2 },
      { name: "Next.js", count: 3 },
    ],
  },
  {
    name: "주식",
    count: 2,
    subcategories: [{ name: "분석", count: 2 }],
  },
];

const defaultProps = {
  tree: sampleTree,
  selectedCategory: null as string | null,
  selectedSubcategory: null as string | null,
  onSelectCategory: mockSelectCategory,
  onSelectSubcategory: mockSelectSubcategory,
  onClearFilter: mockClearFilter,
  toggleExpanded: mockToggleExpanded,
  isExpanded: mockIsExpanded,
  totalCount: 7,
};

describe("CategoryTree", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsExpanded.mockReturnValue(true);
  });

  it("카테고리 트리를 렌더링한다", () => {
    render(<CategoryTree {...defaultProps} />);

    expect(screen.getByText("개발")).toBeInTheDocument();
    expect(screen.getByText("주식")).toBeInTheDocument();
  });

  it("각 카테고리 옆에 글 개수를 표시한다", () => {
    render(<CategoryTree {...defaultProps} />);

    // "개발" 카테고리의 count 5가 표시
    expect(screen.getByText("5")).toBeInTheDocument();
    // "주식" 카테고리의 count가 표시 (여러 개의 "2"가 있으므로 getAllByText 사용)
    const twos = screen.getAllByText("2");
    expect(twos.length).toBeGreaterThanOrEqual(1);
  });

  it("서브카테고리를 표시한다", () => {
    render(<CategoryTree {...defaultProps} />);

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("분석")).toBeInTheDocument();
  });

  it("전체 버튼을 표시하고 전체 글 수를 보여준다", () => {
    render(<CategoryTree {...defaultProps} />);

    expect(screen.getByText("전체")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("카테고리 클릭 시 onSelectCategory를 호출한다", () => {
    render(<CategoryTree {...defaultProps} />);

    fireEvent.click(screen.getByText("개발"));
    expect(mockSelectCategory).toHaveBeenCalledWith("개발");
  });

  it("서브카테고리 클릭 시 onSelectSubcategory를 호출한다", () => {
    render(<CategoryTree {...defaultProps} />);

    fireEvent.click(screen.getByText("JavaScript"));
    expect(mockSelectSubcategory).toHaveBeenCalledWith("개발", "JavaScript");
  });

  it("전체 버튼 클릭 시 onClearFilter를 호출한다", () => {
    render(<CategoryTree {...defaultProps} />);

    fireEvent.click(screen.getByText("전체"));
    expect(mockClearFilter).toHaveBeenCalled();
  });

  it("선택된 카테고리를 강조 표시한다", () => {
    render(<CategoryTree {...defaultProps} selectedCategory="개발" />);

    const devButton = screen.getByText("개발").closest("button");
    expect(devButton?.className).toContain("category-item-active");
  });

  it("접힌 카테고리의 서브카테고리를 숨긴다", () => {
    mockIsExpanded.mockImplementation((name: string) => name !== "개발");

    render(<CategoryTree {...defaultProps} />);

    // 주식의 서브카테고리는 보임
    expect(screen.getByText("분석")).toBeInTheDocument();
    // 개발의 서브카테고리는 숨겨짐 (접힌 상태)
    expect(screen.queryByText("JavaScript")).not.toBeInTheDocument();
  });

  it("nav 요소에 aria-label을 설정한다", () => {
    render(<CategoryTree {...defaultProps} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "카테고리 필터");
  });
});
