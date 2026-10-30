import { render, screen, within } from "@testing-library/react";
import type { Post, PostMeta } from "@/types";
import { remarkRehypeOptions } from "@/lib/mdx-options";

function createPostMeta(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    slug: "part-2",
    title: "2편 제목",
    date: "2025-01-15",
    description: "설명",
    category: "개발",
    tags: ["guide"],
    readingTime: "5 min read",
    series: "realtime-communication",
    seriesOrder: 2,
    seriesTitle: "실시간 통신",
    ...overrides,
  };
}

const currentPost: Post = { ...createPostMeta(), content: "## 들어가며\n\n본문" };
const seriesPosts: PostMeta[] = [
  createPostMeta({ slug: "part-1", title: "1편 제목", seriesOrder: 1 }),
  createPostMeta(),
];

const mockGetSeriesPosts = jest.fn((slug: string) => {
  void slug;
  return seriesPosts;
});

jest.mock("@/lib/container", () => ({
  postService: {
    getPostBySlug: () => currentPost,
    getAllPosts: () => seriesPosts,
    getRelatedPosts: () => [],
    getAdjacentPosts: () => ({ prev: null, next: null }),
    getSeriesPosts: (slug: string) => mockGetSeriesPosts(slug),
  },
}));

// MDX 컴파일러(ESM 전용)는 jest에서 돌리지 않고, 전달받은 옵션만 기록한다
const mockMdxRemote = jest.fn((props: unknown) => {
  void props;
  return null;
});
jest.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: (props: unknown) => mockMdxRemote(props),
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => undefined }));
jest.mock("rehype-slug", () => ({ __esModule: true, default: () => undefined }));
jest.mock("rehype-pretty-code", () => ({ __esModule: true, default: () => undefined }));

// 글 페이지 주변 클라이언트 컴포넌트는 이 테스트의 관심사가 아니다
jest.mock("@/components/BlogPostSidebar", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/TableOfContents", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/GiscusComments", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/BackButton", () => ({ __esModule: true, default: () => null }));

import BlogPostPage from "../page";

async function renderPage(slug: string) {
  const ui = await BlogPostPage({ params: Promise.resolve({ slug }) });
  return render(ui);
}

describe("BlogPostPage", () => {
  beforeEach(() => {
    mockGetSeriesPosts.mockClear();
    mockMdxRemote.mockClear();
  });

  it("글머리에 현재 글의 연재 목록을 보여 준다", async () => {
    await renderPage("part-2");

    expect(mockGetSeriesPosts).toHaveBeenCalledWith("part-2");
    const nav = screen.getByRole("navigation", { name: "연재 목록" });
    expect(within(nav).getByText("연재 · 실시간 통신")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "1편 제목" })).toHaveAttribute(
      "href",
      "/blog/part-1"
    );
    expect(within(nav).getByText("2편 제목")).toHaveAttribute("aria-current", "page");
  });

  it("MDX 변환에 한국어 각주 라벨 옵션을 넘긴다", async () => {
    await renderPage("part-2");

    expect(mockMdxRemote).toHaveBeenCalledTimes(1);
    const props = mockMdxRemote.mock.calls[0][0] as {
      options: { mdxOptions: { remarkRehypeOptions?: unknown } };
    };
    expect(props.options.mdxOptions.remarkRehypeOptions).toBe(remarkRehypeOptions);
  });
});
