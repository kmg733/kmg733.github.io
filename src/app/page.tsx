import Link from "next/link";
import { postService } from "@/lib/container";

export default function Home() {
  const recentPosts = postService.getRecentPosts(3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          안녕하세요, <span className="font-[family-name:var(--font-sacramento)]">Manuel</span> 입니다
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          소프트웨어 개발에 대한 경험과 지식을 공유하는 공간입니다.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/blog"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            블로그 보기
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            About Me
          </Link>
        </div>
      </section>

      {/* Recent Posts */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">최근 포스트</h2>
          <Link
            href="/blog"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            모든 글 보기 →
          </Link>
        </div>

        {recentPosts.length > 0 ? (
          <div className="grid gap-6">
            {recentPosts.map((post) => (
              <article
                key={post.slug}
                className="group rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              >
                <Link href={`/blog/${post.slug}`}>
                  <h3 className="mb-2 text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {post.title}
                  </h3>
                  <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span>{post.readingTime}</span>
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
      </section>
    </div>
  );
}
