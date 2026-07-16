/**
 * 사이트 전역 메타데이터 (단일 출처)
 *
 * RSS/Atom 피드, 메타데이터 등 절대 URL이 필요한 곳에서 참조한다.
 */
export interface SiteConfig {
  /** 절대 URL (마지막 슬래시 없음) */
  url: string;
  title: string;
  description: string;
  author: {
    name: string;
    email?: string;
  };
  /** 피드 저작권/언어 */
  language: string;
}

export const SITE: SiteConfig = {
  url: "https://kmg733.github.io",
  title: "Manuel",
  description: "Manuel의 기술 블로그",
  author: {
    name: "Manuel",
    email: "mink906@gmail.com",
  },
  language: "ko",
} as const;
