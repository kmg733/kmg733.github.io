/**
 * 애플리케이션 전역 상수
 */

// 포스트 관련 상수
export const POST_DEFAULTS = {
  DIRECTORY: "content/posts",
  CATEGORY: "미분류",
  DESCRIPTION: "",
  TAGS: [] as readonly string[],
} as const;

// 홈페이지 관련 상수
export const HOME_DEFAULTS = {
  RECENT_POSTS_COUNT: 3,
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
