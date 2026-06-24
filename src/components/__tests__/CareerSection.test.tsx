import { render, screen, fireEvent } from "@testing-library/react";
import CareerSection from "../CareerSection";
import type { Company } from "@/types";

const company: Company = {
  name: "테스트회사",
  role: "풀스택 개발",
  period: "2022.06 ~ 재직 중",
  description: "테스트 회사 설명",
  items: [
    {
      id: "a",
      title: "성능 개선 작업",
      summary: "성능 요약",
      category: "성능",
      date: "2025.09",
    },
    {
      id: "b",
      title: "보안 강화 작업",
      summary: "보안 요약",
      category: "보안",
      date: "2024.03",
    },
  ],
};

/** 토글 버튼과 그것이 제어하는 접힘 영역을 함께 반환한다. */
function getToggleAndRegion() {
  const toggle = screen.getByRole("button", { name: /테스트회사/ });
  const regionId = toggle.getAttribute("aria-controls")!;
  const region = document.getElementById(regionId)!;
  return { toggle, region };
}

describe("CareerSection", () => {
  it("헤더 토글은 네이티브 button 요소다 (키보드 기본 지원)", () => {
    render(<CareerSection company={company} />);

    const { toggle } = getToggleAndRegion();
    expect(toggle.tagName).toBe("BUTTON");
  });

  it("기본 상태는 펼침 (aria-expanded=true, 영역 노출)", () => {
    render(<CareerSection company={company} />);

    const { toggle, region } = getToggleAndRegion();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText("성능 개선 작업")).toBeInTheDocument();
  });

  it("헤더 클릭 시 접힌다 (aria-expanded=false, 영역 숨김)", () => {
    render(<CareerSection company={company} />);

    const { toggle, region } = getToggleAndRegion();
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(region).toHaveAttribute("aria-hidden", "true");
  });

  it("재클릭 시 다시 펼쳐진다", () => {
    render(<CareerSection company={company} />);

    const { toggle, region } = getToggleAndRegion();
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region).toHaveAttribute("aria-hidden", "false");
  });

  it("접힘 영역은 toggle의 aria-controls 와 연결된다", () => {
    render(<CareerSection company={company} />);

    const { toggle, region } = getToggleAndRegion();
    expect(region).not.toBeNull();
    expect(toggle.getAttribute("aria-controls")).toBe(region.id);
  });

  it("회사명·역할·기간 헤더는 접힘 여부와 무관하게 보인다", () => {
    render(<CareerSection company={company} />);

    const { toggle } = getToggleAndRegion();
    fireEvent.click(toggle); // 접기

    expect(screen.getByText("테스트회사")).toBeInTheDocument();
    expect(screen.getByText("풀스택 개발")).toBeInTheDocument();
    expect(screen.getByText("2022.06 ~ 재직 중")).toBeInTheDocument();
  });

  it("defaultExpanded=false 이면 처음부터 접혀 있다", () => {
    render(<CareerSection company={company} defaultExpanded={false} />);

    const { toggle, region } = getToggleAndRegion();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(region).toHaveAttribute("aria-hidden", "true");
  });
});
