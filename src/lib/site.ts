/**
 * 사이트 전역 메타데이터 (단일 출처)
 *
 * RSS/Atom 피드, 메타데이터 등 절대 URL이 필요한 곳에서 참조한다.
 * URL 리터럴은 constants.ts의 SITE_URL을 재사용한다(중복 정의 방지).
 */
import { SITE_URL } from "./constants";

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
  // 사이트 URL 리터럴의 단일 출처는 constants.ts의 SITE_URL이다.
  url: SITE_URL,
  title: "Manuel",
  description: "Manuel의 기술 블로그",
  author: {
    name: "Manuel",
    email: "mink906@gmail.com",
  },
  language: "ko",
} as const;
