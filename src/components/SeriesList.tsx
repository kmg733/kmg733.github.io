import type { PostMeta } from "@/types";

export type SeriesListPost = Pick<
  PostMeta,
  "slug" | "title" | "series" | "seriesTitle"
>;

interface SeriesListProps {
  /** 같은 시리즈의 글 (seriesOrder 순서로 정렬된 상태) */
  posts: SeriesListPost[];
  currentSlug: string;
}

/**
 * 글머리에 보여 주는 연재 전체 목록
 *
 * 현재 글은 링크 없이 "(이 글)"로 표시하고, 2편 미만이면 렌더링하지 않는다.
 */
export default function SeriesList({ posts, currentSlug }: SeriesListProps) {
  if (posts.length < 2) {
    return null;
  }

  const seriesName = posts[0].seriesTitle ?? posts[0].series;

  return (
    <nav
      aria-label="연재 목록"
      className="mb-10 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          연재 · {seriesName}
        </span>
        <span className="text-xs text-zinc-500">전 {posts.length}편</span>
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm marker:text-zinc-400">
        {posts.map((post) => (
          <li key={post.slug}>
            {post.slug === currentSlug ? (
              <>
                <span
                  aria-current="page"
                  className="font-medium text-amber-700 dark:text-amber-400"
                >
                  {post.title}
                </span>
                <span className="ml-1 text-xs text-zinc-500">(이 글)</span>
              </>
            ) : (
              <a
                href={`/blog/${post.slug}`}
                className="text-zinc-600 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-400"
              >
                {post.title}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
