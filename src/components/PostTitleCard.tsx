import type { PostMeta } from "@/types";
import {
  getPostCardLabel,
  getPostCardShortLabel,
  getPostCardTheme,
} from "@/lib/post-card-theme";

export type PostTitleCardPost = Pick<
  PostMeta,
  "title" | "category" | "subcategory" | "series" | "seriesOrder"
>;

interface PostTitleCardProps {
  post: PostTitleCardPost;
  /** default: 라벨 + 제목 + 빛 번짐, compact: 작은 칸(64px)용 색 블록 + 짧은 라벨 (빛 번짐 없음) */
  variant?: "default" | "compact";
  className?: string;
}

/**
 * 썸네일 자리를 채우는 제목 카드 (이미지 없음)
 *
 * 카드 옆에 제목·카테고리가 이미 텍스트로 있으므로 장식으로 취급해
 * 스크린 리더에서 숨긴다(aria-hidden).
 */
export default function PostTitleCard({
  post,
  variant = "default",
  className,
}: PostTitleCardProps) {
  const theme = getPostCardTheme(post.subcategory);
  const rootClass = (extra: string) =>
    [extra, "relative h-full w-full overflow-hidden", theme.card, className]
      .filter(Boolean)
      .join(" ");

  if (variant === "compact") {
    return (
      <div
        data-testid="post-title-card"
        aria-hidden="true"
        className={rootClass("flex items-center justify-center p-1.5")}
      >
        <span className="w-full truncate text-center text-[11px] font-semibold">
          {getPostCardShortLabel(post)}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="post-title-card"
      aria-hidden="true"
      className={rootClass("flex flex-col justify-between gap-3 p-5")}
    >
      {/* 빛 번짐: 루트가 aria-hidden 이라 따로 숨기지 않는다 */}
      <span
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl ${theme.glow}`}
      />
      <span className="relative text-xs font-semibold tracking-wide opacity-75">
        {getPostCardLabel(post)}
      </span>
      <p className="relative line-clamp-3 break-keep text-lg font-bold leading-snug">
        {post.title}
      </p>
    </div>
  );
}
