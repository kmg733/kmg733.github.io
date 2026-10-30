import { render, screen, within } from "@testing-library/react";
import SeriesList from "../SeriesList";
import type { PostMeta } from "@/types";

function createPostMeta(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    slug: "test-post",
    title: "Test Post",
    date: "2025-01-15",
    description: "Test description",
    category: "dev",
    tags: ["javascript"],
    readingTime: "5 min read",
    series: "realtime-communication",
    ...overrides,
  };
}

const seriesPosts = [
  createPostMeta({ slug: "part-1", title: "1편 제목", seriesOrder: 1, seriesTitle: "실시간 통신" }),
  createPostMeta({ slug: "part-2", title: "2편 제목", seriesOrder: 2, seriesTitle: "실시간 통신" }),
  createPostMeta({ slug: "part-3", title: "3편 제목", seriesOrder: 3, seriesTitle: "실시간 통신" }),
];

describe("SeriesList", () => {
  it("연재 글을 받은 순서대로 번호 목록으로 보여 준다", () => {
    render(<SeriesList posts={seriesPosts} currentSlug="part-2" />);

    const nav = screen.getByRole("navigation", { name: "연재 목록" });
    const items = within(nav).getAllByRole("listitem");

    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("1편 제목");
    expect(items[1]).toHaveTextContent("2편 제목");
    expect(items[2]).toHaveTextContent("3편 제목");
  });

  it("다른 편은 해당 글로 가는 링크로 보여 준다", () => {
    render(<SeriesList posts={seriesPosts} currentSlug="part-2" />);

    expect(screen.getByRole("link", { name: "1편 제목" })).toHaveAttribute(
      "href",
      "/blog/part-1"
    );
    expect(screen.getByRole("link", { name: "3편 제목" })).toHaveAttribute(
      "href",
      "/blog/part-3"
    );
  });

  it("현재 글은 링크 없이 '(이 글)'과 aria-current로 표시한다", () => {
    render(<SeriesList posts={seriesPosts} currentSlug="part-2" />);

    expect(screen.queryByRole("link", { name: "2편 제목" })).not.toBeInTheDocument();
    const current = screen.getByText("2편 제목");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.closest("li")).toHaveTextContent("(이 글)");
    expect(screen.getAllByText("(이 글)")).toHaveLength(1);
  });

  it("제목 줄에 seriesTitle과 전체 편수를 보여 준다", () => {
    render(<SeriesList posts={seriesPosts} currentSlug="part-1" />);

    expect(screen.getByText("연재 · 실시간 통신")).toBeInTheDocument();
    expect(screen.getByText("전 3편")).toBeInTheDocument();
  });

  it("seriesTitle이 없으면 series slug를 제목으로 쓴다", () => {
    const posts = seriesPosts.map((post) => ({ ...post, seriesTitle: undefined }));

    render(<SeriesList posts={posts} currentSlug="part-1" />);

    expect(screen.getByText("연재 · realtime-communication")).toBeInTheDocument();
  });

  it("연재 글이 2편 미만이면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(
      <SeriesList posts={[seriesPosts[0]]} currentSlug="part-1" />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
