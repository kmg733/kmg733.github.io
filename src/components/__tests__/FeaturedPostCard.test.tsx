import { render, screen } from "@testing-library/react";
import FeaturedPostCard from "../FeaturedPostCard";
import { POST_CARD_THEMES } from "@/lib/post-card-theme";
import type { PostMeta } from "@/types";

function createPost(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    slug: "spring-tx",
    title: "Spring 트랜잭션 전파",
    date: "2025-03-10",
    description: "REQUIRES_NEW 정리",
    category: "개발",
    subcategory: "Spring",
    tags: ["spring"],
    readingTime: "8 min read",
    ...overrides,
  };
}

function getCard(container: HTMLElement) {
  return container.querySelector('[data-testid="post-title-card"]');
}

describe("FeaturedPostCard", () => {
  it("제목·설명·날짜·읽기 시간과 글 링크를 표시한다", () => {
    render(<FeaturedPostCard post={createPost()} />);

    expect(
      screen.getByRole("heading", { name: "Spring 트랜잭션 전파" })
    ).toBeInTheDocument();
    expect(screen.getByText("REQUIRES_NEW 정리")).toBeInTheDocument();
    expect(screen.getByText(/2025년.*3월.*10일/)).toBeInTheDocument();
    expect(screen.getByText("8 min read")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/blog/spring-tx");
  });

  it("64px 칸에 이미지 대신 compact 제목 카드(색 블록 + 짧은 라벨)를 그린다", () => {
    const { container } = render(
      <FeaturedPostCard
        post={createPost({ series: "spring-tx", seriesOrder: 2 })}
      />
    );

    const card = getCard(container);
    expect(card).not.toBeNull();
    expect(card).toHaveAttribute("aria-hidden", "true");
    for (const cls of POST_CARD_THEMES.Spring.card.split(" ")) {
      expect(card).toHaveClass(cls);
    }
    // compact: 제목 없이 짧은 라벨만
    expect(card).toHaveTextContent(/^Spring$/);
    expect(card?.parentElement).toHaveClass("h-16", "w-16");
    expect(container.querySelector("img")).toBeNull();
  });
});
