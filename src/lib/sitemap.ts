import type { MetadataRoute } from "next";
import type { PostMeta } from "@/types";

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

interface StaticRoute {
  readonly path: string;
  readonly changeFrequency: ChangeFrequency;
  readonly priority: number;
  /**
   * 포스트 목록에 의존하는 페이지(홈/블로그)는 최신 포스트 발행일을
   * lastModified로 사용한다. 그 외 정적 콘텐츠 페이지는 실제 변경일을
   * 추적할 수 없으므로 lastModified를 생략한다(부정확한 신호 방지).
   */
  readonly lastmodFromLatestPost?: boolean;
}

/**
 * 정적 라우트 목록 (SSG로 생성되는 독립 HTML 페이지).
 * 카테고리(/blog?category=...)는 쿼리파라미터 기반 클라이언트 필터로
 * 독립 페이지가 아니므로 sitemap에 포함하지 않는다.
 */
export const STATIC_ROUTES: readonly StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1, lastmodFromLatestPost: true },
  { path: "/blog", changeFrequency: "daily", priority: 0.9, lastmodFromLatestPost: true },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/career", changeFrequency: "monthly", priority: 0.5 },
  { path: "/projects", changeFrequency: "monthly", priority: 0.5 },
];

/**
 * siteUrl과 경로를 결합해 후행 슬래시가 붙은 정규 페이지 URL을 만든다.
 * next.config의 `trailingSlash: true` 설정과 일치시킨다.
 * 주의: 파일 URL(.xml 등)이 아닌 페이지 경로 전용이다.
 */
export function toUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/+$/, "");
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  return trimmed ? `${base}/${trimmed}/` : `${base}/`;
}

/**
 * 포스트 중 가장 최근 발행일을 반환한다. 포스트가 없으면 undefined.
 */
function latestPostDate(
  posts: Pick<PostMeta, "date">[]
): Date | undefined {
  if (posts.length === 0) return undefined;
  const latest = Math.max(...posts.map((p) => new Date(p.date).getTime()));
  return new Date(latest);
}

/**
 * 정적 라우트와 전체 포스트를 합쳐 sitemap 엔트리를 생성한다.
 * @param posts 포스트 메타 (slug, date만 사용)
 * @param siteUrl 사이트 기본 URL
 */
export function buildSitemap(
  posts: Pick<PostMeta, "slug" | "date">[],
  siteUrl: string
): MetadataRoute.Sitemap {
  const latest = latestPostDate(posts);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => {
    const entry = {
      url: toUrl(siteUrl, route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
    return route.lastmodFromLatestPost && latest
      ? { ...entry, lastModified: latest }
      : entry;
  });

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: toUrl(siteUrl, `/blog/${post.slug}`),
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries];
}
