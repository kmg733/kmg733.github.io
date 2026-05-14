import Link from "next/link";
import PostThumbnail from "@/components/PostThumbnail";
import { DATE_FORMAT } from "@/lib/constants";
import type { PostMeta } from "@/types";

interface FeaturedPostCardProps {
  post: PostMeta;
}

export default function FeaturedPostCard({ post }: FeaturedPostCardProps) {
  return (
    <article className="card-hover-accent group overflow-hidden rounded-md border border-zinc-200 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
      <Link href={`/blog/${post.slug}`} className="flex flex-row items-center gap-3 p-2.5">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
          <PostThumbnail thumbnail={post.thumbnail} alt={post.title} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="line-clamp-1 text-sm font-semibold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {post.title}
          </h3>
          <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
            {post.description}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString(
                DATE_FORMAT.LOCALE,
                DATE_FORMAT.OPTIONS
              )}
            </time>
            <span>{post.readingTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
