import { render, screen } from "@testing-library/react";
import { POST_CARD_THEMES } from "@/lib/post-card-theme";
import RelatedPosts from "../RelatedPosts";
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
    ...overrides,
  };
}

describe("RelatedPosts", () => {
  it("추천 글이 있을 때 목록을 렌더링한다", () => {
    const posts = [
      createPostMeta({ slug: "post-1", title: "First Post" }),
      createPostMeta({ slug: "post-2", title: "Second Post" }),
    ];

    render(<RelatedPosts posts={posts} />);

    expect(screen.getByText("관련 글")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "First Post" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Second Post" })
    ).toBeInTheDocument();
  });

  it("각 항목에 제목, 날짜가 표시된다", () => {
    const posts = [
      createPostMeta({
        slug: "test",
        title: "Test Title",
        date: "2025-06-15",
      }),
    ];

    render(<RelatedPosts posts={posts} />);

    expect(
      screen.getByRole("heading", { name: "Test Title" })
    ).toBeInTheDocument();
    expect(screen.getByText(/2025년.*6월.*15일/)).toBeInTheDocument();
  });

  it("썸네일 자리에 이미지 대신 하위 카테고리 색의 제목 카드가 표시된다", () => {
    const posts = [
      createPostMeta({
        slug: "card-test",
        title: "Card Post",
        subcategory: "Java",
      }),
    ];

    const { container } = render(<RelatedPosts posts={posts} />);

    const card = container.querySelector('[data-testid="post-title-card"]');
    expect(card).not.toBeNull();
    expect(card).toHaveAttribute("aria-hidden", "true");
    for (const cls of POST_CARD_THEMES.Java.split(" ")) {
      expect(card).toHaveClass(cls);
    }
    expect(card).toHaveTextContent("Card Post");
    expect(container.querySelector("img")).toBeNull();
  });

  it("제목 카드는 h-36 틀 안에 있고 hover 시 확대된다", () => {
    const posts = [createPostMeta({ slug: "frame", title: "Frame Post" })];

    const { container } = render(<RelatedPosts posts={posts} />);

    const card = container.querySelector('[data-testid="post-title-card"]');
    expect(card).toHaveClass("group-hover:scale-105", "transition-transform");
    expect(card?.parentElement).toHaveClass("h-36", "overflow-hidden");
  });

  it("subcategory가 있으면 뱃지가 표시된다", () => {
    const posts = [
      createPostMeta({
        slug: "cat-test",
        title: "Cat Post",
        subcategory: "React",
      }),
    ];

    render(<RelatedPosts posts={posts} />);

    // 카드 라벨(aria-hidden)과 별개로 텍스트 영역에 뱃지가 있어야 한다
    const badges = screen
      .getAllByText("React")
      .filter((el) => !el.closest('[aria-hidden="true"]'));
    expect(badges).toHaveLength(1);
  });

  it("각 항목의 링크가 /blog/{slug}로 연결된다", () => {
    const posts = [
      createPostMeta({ slug: "my-post", title: "My Post" }),
    ];

    render(<RelatedPosts posts={posts} />);

    const link = screen.getByRole("link", { name: /My Post/i });
    expect(link).toHaveAttribute("href", "/blog/my-post");
  });

  it("빈 배열일 때 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<RelatedPosts posts={[]} />);

    expect(container.innerHTML).toBe("");
  });
});
