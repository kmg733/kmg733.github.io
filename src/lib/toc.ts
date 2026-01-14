export interface TocItem {
  slug: string;
  text: string;
  level: number;
}

/**
 * 마크다운 콘텐츠에서 헤딩을 추출하여 목차 아이템 배열로 반환
 */
export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocItem[] = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .replace(/\s+/g, "-");

    headings.push({ slug, text, level });
  }

  return headings;
}
