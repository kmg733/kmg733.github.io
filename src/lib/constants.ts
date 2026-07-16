/**
 * 애플리케이션 전역 상수
 */

// 사이트 기본 정보
// export 시점에 후행 슬래시를 제거해, 값이 어떻게 바뀌든(예: 환경변수 전환)
// sitemap/robots의 URL 조합이 의존하는 "후행 슬래시 없음" 불변식을 단일 소스에서 강제한다.
export const SITE_URL = "https://kmg733.github.io".replace(/\/+$/, "");

// 포스트 관련 상수
export const POST_DEFAULTS = {
  DIRECTORY: "content/posts",
  CATEGORY: "미분류",
  DESCRIPTION: "",
  TAGS: [] as readonly string[],
} as const;

// 썸네일 관련 상수
export const THUMBNAIL_DEFAULTS = {
  DEFAULT_LIGHT: "/images/default-thumbnail-light.svg",
  DEFAULT_DARK: "/images/default-thumbnail-dark.svg",
} as const;

// 홈페이지 관련 상수
export const HOME_DEFAULTS = {
  RECENT_POSTS_COUNT: 3,
  FEATURED_POSTS_COUNT: 5,
} as const;

// 날짜 포맷 관련 상수
export const DATE_FORMAT = {
  LOCALE: "ko-KR",
  OPTIONS: {
    year: "numeric",
    month: "long",
    day: "numeric",
  } as const,
} as const;
