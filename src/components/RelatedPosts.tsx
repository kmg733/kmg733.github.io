import type { PostMeta } from "@/types";
import { DATE_FORMAT } from "@/lib/constants";

interface RelatedPostsProps {
  posts: PostMeta[];
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts }) => {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-700">
      <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        관련 글
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => {
          const formattedDate = new Date(post.date).toLocaleDateString(
            DATE_FORMAT.LOCALE,
            DATE_FORMAT.OPTIONS as Intl.DateTimeFormatOptions
          );

          return (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
            >
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 group-hover:text-amber-600 dark:text-zinc-100 dark:group-hover:text-amber-400">
                {post.title}
              </h3>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                {post.description}
              </p>
              <time className="text-xs text-zinc-500 dark:text-zinc-500">
                {formattedDate}
              </time>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedPosts;
