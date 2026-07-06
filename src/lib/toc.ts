import GithubSlugger from "github-slugger";

export interface TocItem {
  slug: string;
  text: string;
  level: number;
}

/**
 * 마크다운 콘텐츠에서 헤딩을 추출하여 목차 아이템 배열로 반환.
 *
 * slug는 실제 heading id를 생성하는 rehype-slug와 동일한 github-slugger로 만든다.
 * (수제 정규식으로 별도 생성하면 엠대시 등에서 규칙이 어긋나 목차 클릭이 깨졌다.)
 * slugger 인스턴스를 콘텐츠당 1개만 사용해야 중복 제목의 -1/-2 접미사까지 일치한다.
 */
export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  const slugger = new GithubSlugger();

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    headings.push({ slug: slugger.slug(text), text, level });
  }

  return headings;
}
