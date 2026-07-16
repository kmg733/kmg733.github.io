import { buildSitemap, STATIC_ROUTES } from "../sitemap";
import type { PostMeta } from "@/types";

const SITE_URL = "https://example.com";

function createPost(overrides: Partial<PostMeta> = {}): PostMeta {
  return {
    slug: "test-post",
    title: "Test Post",
    date: "2025-01-01",
    description: "Test description",
    category: "dev",
    tags: ["javascript"],
    readingTime: "5 min read",
    ...overrides,
  };
}

describe("buildSitemap", () => {
  it("모든 정적 라우트를 포함한다", () => {
    const result = buildSitemap([], SITE_URL);
    const urls = result.map((e) => e.url);

    expect(urls).toContain(`${SITE_URL}/`);
    expect(urls).toContain(`${SITE_URL}/blog/`);
    expect(urls).toContain(`${SITE_URL}/about/`);
    expect(urls).toContain(`${SITE_URL}/career/`);
    expect(urls).toContain(`${SITE_URL}/projects/`);
    expect(result).toHaveLength(STATIC_ROUTES.length);
  });

  it("모든 포스트 URL을 후행 슬래시와 함께 포함한다", () => {
    const posts = [
      createPost({ slug: "post-a" }),
      createPost({ slug: "post-b" }),
    ];

    const result = buildSitemap(posts, SITE_URL);
    const urls = result.map((e) => e.url);

    expect(urls).toContain(`${SITE_URL}/blog/post-a/`);
    expect(urls).toContain(`${SITE_URL}/blog/post-b/`);
    expect(result).toHaveLength(STATIC_ROUTES.length + posts.length);
  });

  it("포스트의 lastModified는 frontmatter date를 사용한다", () => {
    const posts = [createPost({ slug: "dated", date: "2024-03-15" })];

    const result = buildSitemap(posts, SITE_URL);
    const entry = result.find((e) => e.url === `${SITE_URL}/blog/dated/`);

    expect(entry?.lastModified).toEqual(new Date("2024-03-15"));
  });

  it("홈/블로그의 lastModified는 최신 포스트 발행일을 사용한다", () => {
    const posts = [
      createPost({ slug: "old", date: "2024-01-01" }),
      createPost({ slug: "newest", date: "2025-06-30" }),
      createPost({ slug: "mid", date: "2024-12-01" }),
    ];

    const result = buildSitemap(posts, SITE_URL);
    const home = result.find((e) => e.url === `${SITE_URL}/`);
    const blog = result.find((e) => e.url === `${SITE_URL}/blog/`);

    expect(home?.lastModified).toEqual(new Date("2025-06-30"));
    expect(blog?.lastModified).toEqual(new Date("2025-06-30"));
  });

  it("정적 콘텐츠 페이지(about/career/projects)는 lastModified를 생략한다", () => {
    const result = buildSitemap([createPost()], SITE_URL);

    for (const path of ["about", "career", "projects"]) {
      const entry = result.find((e) => e.url === `${SITE_URL}/${path}/`);
      expect(entry?.lastModified).toBeUndefined();
    }
  });

  it("포스트가 없으면 홈/블로그도 lastModified를 생략한다", () => {
    const result = buildSitemap([], SITE_URL);
    const home = result.find((e) => e.url === `${SITE_URL}/`);

    expect(home?.lastModified).toBeUndefined();
  });

  it("홈은 priority 1, 포스트는 priority 0.7을 가진다", () => {
    const result = buildSitemap([createPost({ slug: "p" })], SITE_URL);

    const home = result.find((e) => e.url === `${SITE_URL}/`);
    const post = result.find((e) => e.url === `${SITE_URL}/blog/p/`);

    expect(home?.priority).toBe(1);
    expect(post?.priority).toBe(0.7);
  });

  it("siteUrl 끝에 슬래시가 있어도 URL이 중복 슬래시 없이 생성된다", () => {
    const result = buildSitemap([createPost({ slug: "p" })], "https://example.com/");
    const urls = result.map((e) => e.url);

    expect(urls).toContain("https://example.com/");
    expect(urls).toContain("https://example.com/blog/p/");
    expect(urls.every((u) => !u.includes("//blog"))).toBe(true);
  });
});
