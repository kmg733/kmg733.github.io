import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TagChips from "../TagChips";
import type { TagCount } from "@/utils/tag";

const mockSelectTag = jest.fn();

const sampleTags: TagCount[] = [
  { name: "guide", count: 3 },
  { name: "beginner", count: 2 },
  { name: "tutorial", count: 1 },
];

const defaultProps = {
  tags: sampleTags,
  selectedTag: null as string | null,
  onSelectTag: mockSelectTag,
};

describe("TagChips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("태그 목록을 칩 형태로 렌더링한다", () => {
    render(<TagChips {...defaultProps} />);

    expect(screen.getByText("guide")).toBeInTheDocument();
    expect(screen.getByText("beginner")).toBeInTheDocument();
    expect(screen.getByText("tutorial")).toBeInTheDocument();
  });

  it("각 태그 옆에 포스트 수를 표시한다", () => {
    render(<TagChips {...defaultProps} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("태그 클릭 시 onSelectTag를 호출한다", () => {
    render(<TagChips {...defaultProps} />);

    fireEvent.click(screen.getByText("guide"));
    expect(mockSelectTag).toHaveBeenCalledWith("guide");
  });

  it("선택된 태그에 활성 스타일을 적용한다", () => {
    render(<TagChips {...defaultProps} selectedTag="guide" />);

    const guideButton = screen.getByText("guide").closest("button");
    expect(guideButton).toHaveAttribute("aria-pressed", "true");
  });

  it("선택되지 않은 태그에 비활성 상태를 표시한다", () => {
    render(<TagChips {...defaultProps} selectedTag="guide" />);

    const beginnerButton = screen.getByText("beginner").closest("button");
    expect(beginnerButton).toHaveAttribute("aria-pressed", "false");
  });

  it("빈 태그 목록이면 렌더링하지 않는다", () => {
    const { container } = render(
      <TagChips tags={[]} selectedTag={null} onSelectTag={mockSelectTag} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("태그가 1개뿐이면 렌더링하지 않는다", () => {
    const { container } = render(
      <TagChips
        tags={[{ name: "only", count: 1 }]}
        selectedTag={null}
        onSelectTag={mockSelectTag}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("접근성: 각 버튼에 aria-pressed 속성이 있다", () => {
    render(<TagChips {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-pressed");
    });
  });
});
