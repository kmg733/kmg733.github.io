import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlogListSkeleton from "../BlogListSkeleton";

describe("BlogListSkeleton", () => {
  it("스켈레톤 컨테이너를 렌더링한다", () => {
    const { container } = render(<BlogListSkeleton />);

    // flex gap-8 레이아웃 (BlogPageContent와 동일)
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("flex", "gap-8");
  });

  it("데스크톱 사이드바 스켈레톤을 렌더링한다", () => {
    render(<BlogListSkeleton />);

    const sidebar = screen.getByTestId("skeleton-sidebar");
    expect(sidebar).toHaveClass("hidden", "lg:block");
  });

  it("메인 콘텐츠 영역을 렌더링한다", () => {
    render(<BlogListSkeleton />);

    const main = screen.getByTestId("skeleton-main");
    expect(main).toHaveClass("min-w-0", "flex-1");
  });

  it("포스트 카드 스켈레톤을 3개 렌더링한다", () => {
    render(<BlogListSkeleton />);

    const cards = screen.getAllByTestId("skeleton-card");
    expect(cards).toHaveLength(3);
  });

  it("pulse 애니메이션 클래스가 적용되어 있다", () => {
    const { container } = render(<BlogListSkeleton />);

    const pulseElements = container.querySelectorAll(".animate-pulse");
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it("aria-hidden으로 접근성 트리에서 숨긴다", () => {
    const { container } = render(<BlogListSkeleton />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
  });
});
