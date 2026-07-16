import sitemap from "../sitemap";
import robots from "../robots";
import { SITE_URL } from "@/lib/constants";
import { STATIC_ROUTES } from "@/lib/sitemap";
import { postService } from "@/lib/container";

describe("robots", () => {
  it("모든 크롤러를 허용한다", () => {
    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
  });

  it("sitemap.xml 위치를 명시한다", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("host를 사이트 URL로 설정한다", () => {
    const result = robots();
    expect(result.host).toBe(SITE_URL);
  });
});

describe("sitemap 라우트", () => {
  it("정적 라우트와 실제 전체 포스트를 모두 포함한다", () => {
    const result = sitemap();
    const postCount = postService.getAllPosts().length;

    expect(result).toHaveLength(STATIC_ROUTES.length + postCount);
  });

  it("모든 URL이 사이트 URL로 시작하고 후행 슬래시로 끝난다", () => {
    const result = sitemap();

    for (const entry of result) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      expect(entry.url.endsWith("/")).toBe(true);
    }
  });

  it("실제 포스트 slug가 /blog/{slug}/ 형태로 포함된다", () => {
    const result = sitemap();
    const posts = postService.getAllPosts();
    const urls = new Set(result.map((e) => e.url));

    for (const post of posts) {
      expect(urls.has(`${SITE_URL}/blog/${post.slug}/`)).toBe(true);
    }
  });
});
