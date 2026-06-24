import { render, screen, within } from "@testing-library/react";
import CareerTimeline from "../CareerTimeline";
import type { CareerItem } from "@/types";

const multiCategoryItems: CareerItem[] = [
  { id: "a", title: "성능 작업", summary: "요약", category: "성능", date: "2025.09" },
  { id: "b", title: "보안 작업", summary: "요약", category: "보안", date: "2024.03" },
];

const singleCategoryItems: CareerItem[] = [
  {
    id: "p1",
    title: "프로젝트 1",
    summary: "요약",
    category: "프로젝트",
    date: "2021.05",
    repoUrl: "https://github.com/kmg733/BoT",
  },
  {
    id: "p2",
    title: "프로젝트 2",
    summary: "요약",
    category: "프로젝트",
    date: "2020.05",
  },
];

describe("CareerTimeline 필터 칩 노출", () => {
  it("유형이 2개 이상이면 필터 그룹을 렌더한다", () => {
    render(<CareerTimeline items={multiCategoryItems} />);

    expect(
      screen.getByRole("group", { name: "작업 유형 필터" })
    ).toBeInTheDocument();
  });

  it("유형이 1개뿐이면 필터 그룹을 렌더하지 않는다", () => {
    render(<CareerTimeline items={singleCategoryItems} />);

    expect(
      screen.queryByRole("group", { name: "작업 유형 필터" })
    ).not.toBeInTheDocument();
  });
});

describe("CareerTimeline GitHub 링크", () => {
  it("repoUrl이 있으면 해당 저장소로의 링크를 렌더한다", () => {
    render(<CareerTimeline items={singleCategoryItems} />);

    const card = screen.getByText("프로젝트 1").closest("li")!;
    const link = within(card).getByRole("link");

    expect(link).toHaveAttribute("href", "https://github.com/kmg733/BoT");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("repoUrl이 없으면 링크를 렌더하지 않는다", () => {
    render(<CareerTimeline items={singleCategoryItems} />);

    const card = screen.getByText("프로젝트 2").closest("li")!;

    expect(within(card).queryByRole("link")).not.toBeInTheDocument();
  });
});
