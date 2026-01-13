import Link from "next/link";
import { postService } from "@/lib/container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "기술 블로그 포스트 목록",
};

export default function BlogPage() {
  const posts = postService.getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <h1 className="mb-4 text-3xl font-bold">Blog</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          개발 경험과 학습 내용을 기록합니다.
        </p>
      </header>

      {posts.length > 0 ? (
        <div className="grid gap-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group border-b border-zinc-200 pb-8 last:border-0 dark:border-zinc-800"
            >
              <Link href={`/blog/${post.slug}`}>
                <time
                  dateTime={post.date}
                  className="text-sm text-zinc-500 dark:text-zinc-500"
                >
                  {new Date(post.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h2 className="mt-2 text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {post.title}
                </h2>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {post.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">
          아직 작성된 포스트가 없습니다.
        </p>
      )}
    </div>
  );
}
