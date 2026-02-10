/**
 * 블로그 포스트 메타데이터 (Domain Entity)
 */
export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  readingTime: string;
}

/**
 * 블로그 포스트 전체 데이터 (Domain Entity)
 */
export interface Post extends PostMeta {
  content: string;
  glossary?: import("./glossary").GlossaryEntry[];
}

/**
 * 포스트 Frontmatter 원시 데이터
 */
export interface PostFrontmatter {
  title?: string;
  date?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
}
