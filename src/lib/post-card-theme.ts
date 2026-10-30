import type { PostMeta } from "@/types";

/** 제목 카드 색: 카드 배경(그라데이션)·글자색과 오른쪽 위 빛 번짐 색 (라이트/다크) */
export interface PostCardTheme {
  card: string;
  glow: string;
}

/**
 * 하위 카테고리 → 제목 카드 색
 *
 * Tailwind 는 소스 파일을 스캔해 쓰인 클래스만 CSS 로 만든다.
 * 그래서 `from-${color}-50` 처럼 조합하지 않고 완성된 문자열로 적는다.
 * 새 하위 카테고리를 쓰면 여기에 추가한다 (가드 테스트가 누락을 잡는다).
 */
export const POST_CARD_THEMES: Readonly<Record<string, PostCardTheme>> = {
  Java: {
    card: "bg-linear-to-br from-rose-50 via-rose-100 to-orange-200 text-rose-950 dark:from-zinc-900 dark:via-rose-950 dark:to-orange-900 dark:text-rose-50",
    glow: "bg-white/50 dark:bg-orange-400/25",
  },
  Spring: {
    card: "bg-linear-to-br from-emerald-50 via-emerald-100 to-teal-200 text-emerald-950 dark:from-zinc-900 dark:via-emerald-950 dark:to-teal-900 dark:text-emerald-50",
    glow: "bg-white/50 dark:bg-teal-400/25",
  },
  웹: {
    card: "bg-linear-to-br from-sky-50 via-sky-100 to-blue-200 text-sky-950 dark:from-zinc-900 dark:via-sky-950 dark:to-blue-900 dark:text-sky-50",
    glow: "bg-white/50 dark:bg-blue-400/25",
  },
  JavaScript: {
    card: "bg-linear-to-br from-amber-50 via-amber-100 to-yellow-200 text-amber-950 dark:from-zinc-900 dark:via-amber-950 dark:to-yellow-900 dark:text-amber-50",
    glow: "bg-white/50 dark:bg-yellow-400/25",
  },
  Database: {
    card: "bg-linear-to-br from-indigo-50 via-indigo-100 to-violet-200 text-indigo-950 dark:from-zinc-900 dark:via-indigo-950 dark:to-violet-900 dark:text-indigo-50",
    glow: "bg-white/50 dark:bg-violet-400/25",
  },
  아키텍처: {
    card: "bg-linear-to-br from-violet-50 via-violet-100 to-fuchsia-200 text-violet-950 dark:from-zinc-900 dark:via-violet-950 dark:to-fuchsia-900 dark:text-violet-50",
    glow: "bg-white/50 dark:bg-fuchsia-400/25",
  },
};

/** 매핑에 없거나 하위 카테고리가 없는 글의 카드 색 */
export const DEFAULT_POST_CARD_THEME: PostCardTheme = {
  card: "bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-200 text-zinc-900 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 dark:text-zinc-100",
  glow: "bg-white/50 dark:bg-zinc-400/20",
};

export type PostCardLabelSource = Pick<
  PostMeta,
  "category" | "subcategory" | "series" | "seriesOrder"
>;

export function getPostCardTheme(subcategory?: string): PostCardTheme {
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

/**
 * compact 카드(64px 칸)용 줄임말
 *
 * 글자 영역이 약 52px 라 긴 이름은 잘린다. 긴 이름만 여기 적고 나머지는 그대로 쓴다.
 * 짧은 라벨이 6자를 넘는 하위 카테고리가 생기면 가드 테스트가 알려 준다.
 */
export const POST_CARD_SHORT_LABELS: Readonly<Record<string, string>> = {
  JavaScript: "JS",
  Database: "DB",
};

/** compact 카드 라벨: 줄임말이 있으면 줄임말, 없으면 subcategory, 그것도 없으면 category */
export function getPostCardShortLabel(
  post: Pick<PostMeta, "category" | "subcategory">
): string {
  const label = post.subcategory ?? post.category;
  if (Object.prototype.hasOwnProperty.call(POST_CARD_SHORT_LABELS, label)) {
    return POST_CARD_SHORT_LABELS[label];
  }
  return label;
}
