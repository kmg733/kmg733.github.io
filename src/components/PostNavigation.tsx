import type { PostMeta } from "@/types";

interface PostNavigationProps {
  prev: PostMeta | null;
  next: PostMeta | null;
}

const PostNavigation: React.FC<PostNavigationProps> = ({ prev, next }) => {
  if (!prev && !next) {
    return null;
  }

  return (
    <nav
      aria-label="시리즈 네비게이션"
      className="mt-10 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-700"
    >
      {prev ? (
        <a
          href={`/blog/${prev.slug}`}
          className="group flex flex-col rounded-lg border border-zinc-200 p-4 transition-colors hover:border-amber-500 dark:border-zinc-700 dark:hover:border-amber-400"
        >
          <span className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
            ← 이전 글
          </span>
          <span className="text-sm font-medium text-zinc-900 group-hover:text-amber-600 dark:text-zinc-100 dark:group-hover:text-amber-400">
            {prev.title}
          </span>
        </a>
      ) : (
        <div />
      )}

      {next ? (
        <a
          href={`/blog/${next.slug}`}
          className="group flex flex-col items-end rounded-lg border border-zinc-200 p-4 text-right transition-colors hover:border-amber-500 dark:border-zinc-700 dark:hover:border-amber-400"
        >
          <span className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
            다음 글 →
          </span>
          <span className="text-sm font-medium text-zinc-900 group-hover:text-amber-600 dark:text-zinc-100 dark:group-hover:text-amber-400">
            {next.title}
          </span>
        </a>
      ) : (
        <div />
      )}
    </nav>
  );
};

export default PostNavigation;
