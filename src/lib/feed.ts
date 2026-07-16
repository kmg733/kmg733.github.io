import { Feed } from "feed";
import type { PostMeta } from "@/types";
import { SITE, type SiteConfig } from "./site";

export interface FeedOutput {
  /** RSS 2.0 XML 문자열 */
  rss: string;
  /** Atom 1.0 XML 문자열 */
  atom: string;
}

/**
 * CDATA 조기 종료 방지용 정규화.
 *
 * feed 라이브러리는 title/description을 CDATA로 감싸지만, 내부 xml-js가
 * `]]>`를 첫 번째 발생만 이스케이프하는 버그가 있어 두 번째 `]]>`에서
 * CDATA가 깨진다. 입력에서 `]]>` 시퀀스 자체를 제거해 이 경로를 회피한다.
 */
function sanitizeCdata(value: string): string {
  return value.split("]]>").join("]] >");
}

/**
 * 포스트 목록으로 RSS 2.0 / Atom 1.0 피드를 생성한다.
 *
 * 순수 함수: 파일 시스템·네트워크에 접근하지 않으며 입력만으로 결과가 결정된다.
 * XML 이스케이프는 `feed` 라이브러리가 처리한다.
 *
 * @param posts 최신순으로 정렬된 포스트 메타데이터. 순서가 그대로 피드에 반영된다.
 * @param site 사이트 메타데이터 (절대 URL 생성용)
 */
export function buildFeeds(
  posts: PostMeta[],
  site: SiteConfig = SITE
): FeedOutput {
  const feedUrl = `${site.url}/feed.xml`;
  const atomUrl = `${site.url}/atom.xml`;

  const feed = new Feed({
    title: site.title,
    description: site.description,
    id: `${site.url}/`,
    link: `${site.url}/`,
    language: site.language,
    copyright: `© ${site.author.name}`,
    feedLinks: {
      rss: feedUrl,
      atom: atomUrl,
    },
    author: {
      name: site.author.name,
      email: site.author.email,
      link: `${site.url}/`,
    },
  });

  for (const post of posts) {
    const url = `${site.url}/blog/${post.slug}/`;

    feed.addItem({
      title: sanitizeCdata(post.title),
      id: url,
      link: url,
      description: sanitizeCdata(post.description),
      date: new Date(post.date),
      category: [{ name: post.category }],
    });
  }

  return {
    rss: feed.rss2(),
    atom: feed.atom1(),
  };
}
