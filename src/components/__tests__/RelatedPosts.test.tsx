import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Second Post")).toBeInTheDocument();
  });

  it("각 항목에 제목, 설명, 날짜가 표시된다", () => {
    const posts = [
      createPostMeta({
        slug: "test",
        title: "Test Title",
        description: "Test Desc",
        date: "2025-06-15",
      }),
    ];

    render(<RelatedPosts posts={posts} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Desc")).toBeInTheDocument();
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
