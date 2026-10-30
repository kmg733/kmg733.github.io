import { render, screen } from "@testing-library/react";
import type { PostMeta } from "@/types";
import { POST_CARD_THEMES } from "@/lib/post-card-theme";

const recentPosts: PostMeta[] = [
  {
    slug: "pg-lock",
    title: "PostgreSQL 비관적 락",
    date: "2025-05-01",
    description: "FOR UPDATE 정리",
    category: "개발",
    subcategory: "Database",
    tags: ["postgresql"],
    readingTime: "6 min read",
  },
];

jest.mock("@/lib/container", () => ({
  postService: {
    getRecentPosts: () => recentPosts,
    getAllPosts: () => recentPosts,
    getFeaturedPosts: () => [],
  },
}));

// 홈 상단의 애니메이션·클라이언트 섹션은 이 테스트의 관심사가 아니다
jest.mock("@/components/ScrollReveal", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
jest.mock("@/components/TypeWriter", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/FloatingParticles", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/GradientOrbs", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/BlogStats", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/TechStackSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/FeaturedPostsSection", () => ({ __esModule: true, default: () => null }));

import Home from "../page";

describe("Home - 최근 포스트", () => {
  it("최근 글마다 이미지 대신 제목 카드를 3:2 틀 안에 그린다", () => {
    const { container } = render(<Home />);

    expect(
      screen.getByRole("heading", { name: "PostgreSQL 비관적 락" })
    ).toBeInTheDocument();

    const cards = container.querySelectorAll('[data-testid="post-title-card"]');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent("PostgreSQL 비관적 락");
    for (const cls of POST_CARD_THEMES.Database.card.split(" ")) {
      expect(cards[0]).toHaveClass(cls);
    }
    expect(cards[0].parentElement).toHaveClass("aspect-[3/2]", "sm:w-64");
    expect(container.querySelector("img")).toBeNull();
  });
});
