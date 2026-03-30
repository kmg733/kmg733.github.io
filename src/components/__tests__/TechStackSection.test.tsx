import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TechStackSection from "../TechStackSection";
import { techCategories } from "@/data/techStack";

// ScrollReveal mock — 자식만 렌더링
jest.mock("@/components/ScrollReveal", () => {
  return function MockScrollReveal({ children }: { children: React.ReactNode }) {
    return <div data-testid="scroll-reveal">{children}</div>;
  };
});

describe("TechStackSection", () => {
  it("섹션 타이틀을 렌더링한다", () => {
    render(<TechStackSection />);

    expect(screen.getByText("Tech Stack")).toBeInTheDocument();
  });

  it("모든 카테고리 라벨을 렌더링한다", () => {
    render(<TechStackSection />);

    for (const category of techCategories) {
      expect(screen.getByText(category.label)).toBeInTheDocument();
    }
  });

  it("모든 기술명을 렌더링한다", () => {
    render(<TechStackSection />);

    for (const category of techCategories) {
      for (const item of category.items) {
        expect(screen.getByText(item)).toBeInTheDocument();
      }
    }
  });

  it("카테고리별 이모지를 렌더링한다", () => {
    render(<TechStackSection />);

    for (const category of techCategories) {
      expect(
        screen.getByRole("img", { name: category.emojiLabel })
      ).toBeInTheDocument();
    }
  });

  it("ScrollReveal 애니메이션이 적용된다", () => {
    render(<TechStackSection />);

    const reveals = screen.getAllByTestId("scroll-reveal");
    expect(reveals.length).toBeGreaterThan(0);
  });

  it("section 요소로 렌더링된다", () => {
    render(<TechStackSection />);

    const section = screen.getByRole("region", { name: /tech stack/i });
    expect(section).toBeInTheDocument();
  });
});
