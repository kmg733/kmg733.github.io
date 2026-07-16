import { buildFeeds } from "../feed";
import type { SiteConfig } from "../site";
import type { PostMeta } from "@/types";

const testSite: SiteConfig = {
  url: "https://example.com",
  title: "Test Blog",
  description: "Test blog description",
  author: { name: "Tester", email: "tester@example.com" },
  language: "ko",
};

function createPostMeta(overrides: Partial<PostMeta> = {}): PostMeta {
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

describe("buildFeeds", () => {
  describe("RSS 2.0 출력", () => {
    it("루트가 version 2.0의 <rss> 요소다", () => {
      const { rss } = buildFeeds([createPostMeta()], testSite);

      expect(rss).toContain("<rss");
      expect(rss).toContain('version="2.0"');
    });

    it("각 포스트가 <item>으로 포함된다", () => {
      const posts = [
        createPostMeta({ slug: "a", title: "First" }),
        createPostMeta({ slug: "b", title: "Second" }),
      ];

      const { rss } = buildFeeds(posts, testSite);

      const itemCount = (rss.match(/<item>/g) ?? []).length;
      expect(itemCount).toBe(2);
      expect(rss).toContain("First");
      expect(rss).toContain("Second");
    });

    it("링크가 사이트 URL 기반 절대 경로(/blog/{slug}/)다", () => {
      const { rss } = buildFeeds(
        [createPostMeta({ slug: "my-post" })],
        testSite
      );

      expect(rss).toContain("https://example.com/blog/my-post/");
    });

    it("category가 포함된다", () => {
      const { rss } = buildFeeds(
        [createPostMeta({ category: "backend" })],
        testSite
      );

      expect(rss).toContain("backend");
    });

    it("pubDate가 RFC-822(GMT) 형식이다", () => {
      const { rss } = buildFeeds(
        [createPostMeta({ date: "2025-03-15" })],
        testSite
      );

      // new Date("2025-03-15").toUTCString() === "Sat, 15 Mar 2025 00:00:00 GMT"
      expect(rss).toContain("Sat, 15 Mar 2025 00:00:00 GMT");
    });
  });

  describe("Atom 1.0 출력", () => {
    it("루트가 Atom 네임스페이스의 <feed> 요소다", () => {
      const { atom } = buildFeeds([createPostMeta()], testSite);

      expect(atom).toContain("<feed");
      expect(atom).toContain('xmlns="http://www.w3.org/2005/Atom"');
    });

    it("각 포스트가 <entry>로 포함된다", () => {
      const posts = [
        createPostMeta({ slug: "a" }),
        createPostMeta({ slug: "b" }),
      ];

      const { atom } = buildFeeds(posts, testSite);

      const entryCount = (atom.match(/<entry>/g) ?? []).length;
      expect(entryCount).toBe(2);
    });
  });

  describe("XML 이스케이프 (안전성)", () => {
    it("특수문자가 CDATA 밖에 원시 상태로 노출되지 않는다", () => {
      const { rss, atom } = buildFeeds(
        [createPostMeta({ title: "A & B < C" })],
        testSite
      );

      // feed 라이브러리는 제목/설명을 CDATA로 감싸 이스케이프한다.
      // CDATA 내부의 원시 &,< 는 유효하므로, CDATA 구간을 제거한 뒤
      // 원시 앰퍼샌드/부등호가 남아있지 않은지(=마크업 오염 없음)를 검증한다.
      const stripCdata = (xml: string) =>
        xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
      const rawAmp = /&(?!amp;|lt;|gt;|quot;|apos;|#)/;

      expect(rawAmp.test(stripCdata(rss))).toBe(false);
      expect(rawAmp.test(stripCdata(atom))).toBe(false);
      // 특수문자가 담긴 제목은 CDATA 안에 존재해야 한다.
      expect(rss).toContain("<![CDATA[A & B < C]]>");
      expect(atom).toContain("<![CDATA[A & B < C]]>");
    });

    it("제목/설명에 ]]> 가 여러 번 있어도 CDATA가 조기 종료되지 않는다", () => {
      // 근본 원인: feed가 감싸는 CDATA를 xml-js가 첫 번째 ]]> 만 이스케이프해
      // 두 번째 ]]> 에서 CDATA가 깨진다. 기술 블로그 특성상 제목에 ]]> 가
      // 들어갈 개연성이 있어 방어적 정규화가 필요하다.
      const { rss, atom } = buildFeeds(
        [
          createPostMeta({
            title: "before ]]> mid ]]> after",
            description: "desc ]]> tail ]]> end",
          }),
        ],
        testSite
      );

      const count = (xml: string, token: string) =>
        xml.split(token).length - 1;

      // CDATA 여는 태그 수와 닫는 시퀀스 수가 일치해야 문서가 유효하다.
      expect(count(rss, "<![CDATA[")).toBe(count(rss, "]]>"));
      expect(count(atom, "<![CDATA[")).toBe(count(atom, "]]>"));
      // 원시 ]]> 가 값 안에 남으면 안 된다.
      expect(rss).not.toContain("before ]]> mid ]]> after");
      expect(atom).not.toContain("before ]]> mid ]]> after");
    });
  });

  describe("경계 조건", () => {
    it("포스트가 없어도 유효한 RSS/Atom을 생성한다", () => {
      const { rss, atom } = buildFeeds([], testSite);

      expect(rss).toContain("<rss");
      expect((rss.match(/<item>/g) ?? []).length).toBe(0);
      expect(atom).toContain("<feed");
      expect((atom.match(/<entry>/g) ?? []).length).toBe(0);
    });

    it("입력 포스트 순서(최신순)를 그대로 유지한다", () => {
      const posts = [
        createPostMeta({ slug: "newest", title: "Newest", date: "2025-12-01" }),
        createPostMeta({ slug: "oldest", title: "Oldest", date: "2025-01-01" }),
      ];

      const { rss } = buildFeeds(posts, testSite);

      expect(rss.indexOf("Newest")).toBeLessThan(rss.indexOf("Oldest"));
    });
  });
});
