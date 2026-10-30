import type { PostMeta } from "@/types";

/**
 * 하위 카테고리 → 제목 카드 색 (배경 + 글자색, 라이트/다크)
 *
 * Tailwind 는 소스 파일을 스캔해 쓰인 클래스만 CSS 로 만든다.
 * 그래서 `bg-${color}-100` 처럼 조합하지 않고 완성된 문자열로 적는다.
 * 새 하위 카테고리를 쓰면 여기에 추가한다 (가드 테스트가 누락을 잡는다).
 */
export const POST_CARD_THEMES: Readonly<Record<string, string>> = {
  Java: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100",
  Spring:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  웹: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  JavaScript:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  Database:
    "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100",
  아키텍처:
    "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
};

/** 매핑에 없거나 하위 카테고리가 없는 글의 카드 색 */
export const DEFAULT_POST_CARD_THEME =
  "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100";

export type PostCardLabelSource = Pick<
  PostMeta,
  "category" | "subcategory" | "series" | "seriesOrder"
>;

export function getPostCardTheme(subcategory?: string): string {
  if (
    subcategory &&
    Object.prototype.hasOwnProperty.call(POST_CARD_THEMES, subcategory)
  ) {
    return POST_CARD_THEMES[subcategory];
  }
  return DEFAULT_POST_CARD_THEME;
}

/**
 * 카드 라벨
 * - 시리즈(series + seriesOrder): "{subcategory} · 시리즈 {N}편" (subcategory 없으면 "시리즈 {N}편")
 * - 그 외: subcategory, 없으면 category
 */
export function getPostCardLabel(post: PostCardLabelSource): string {
  if (post.series && typeof post.seriesOrder === "number") {
    const seriesLabel = `시리즈 ${post.seriesOrder}편`;
    return post.subcategory
      ? `${post.subcategory} · ${seriesLabel}`
      : seriesLabel;
  }
  return post.subcategory ?? post.category;
}
