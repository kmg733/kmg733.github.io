import Link from "next/link";
import { postService } from "@/lib/container";
import { HOME_DEFAULTS, DATE_FORMAT } from "@/lib/constants";
import ScrollReveal from "@/components/ScrollReveal";
import TypeWriter from "@/components/TypeWriter";
import FloatingParticles from "@/components/FloatingParticles";
import BlogStats from "@/components/BlogStats";

export default function Home() {
  const recentPosts = postService.getRecentPosts(HOME_DEFAULTS.RECENT_POSTS_COUNT);
  const allPosts = postService.getAllPosts();

  // 블로그 통계 계산
  const totalPosts = allPosts.length;
  const subcategories = new Set(
    allPosts.filter((p) => p.subcategory).map((p) => p.subcategory!)
  );
  const totalCategories = subcategories.size;
  const totalReadingMinutes = allPosts.reduce((sum, post) => {
    const minutes = parseInt(post.readingTime) || 0;
    return sum + minutes;
  }, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* Hero Section */}
      <section className="relative mb-16 min-h-[320px] text-center sm:min-h-[360px]">
        <FloatingParticles />
        <ScrollReveal direction="fade" duration={800}>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            안녕하세요,{" "}
            <span className="font-[family-name:var(--font-sacramento)]">
              <TypeWriter
                words={["Manuel", "풀스택 개발자", "기술 블로거"]}
                typingSpeed={100}
                deletingSpeed={50}
                pauseDuration={2500}
              />
            </span>{" "}
            입니다
          </h1>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={100}>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            소프트웨어 개발에 대한 경험과 지식을 공유하는 공간입니다.
          </p>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={200}>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/blog"
              className="btn-shimmer rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-lg dark:from-slate-600 dark:to-slate-700 dark:hover:from-slate-500 dark:hover:to-slate-600"
            >
              블로그 보기
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-amber-300 px-6 py-3 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              About Me
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Blog Stats */}
      <ScrollReveal direction="up" delay={100} className="mb-16">
        <BlogStats
          stats={[
            { label: "포스트", value: totalPosts },
            { label: "카테고리", value: totalCategories },
            { label: "읽기 시간", value: totalReadingMinutes, suffix: "분" },
          ]}
        />
      </ScrollReveal>

      {/* Recent Posts */}
      <section>
        <ScrollReveal direction="fade">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">최근 포스트</h2>
            <Link
              href="/blog"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              모든 글 보기 →
            </Link>
          </div>
        </ScrollReveal>

        {recentPosts.length > 0 ? (
          <div className="grid gap-6">
            {recentPosts.map((post, index) => (
              <ScrollReveal key={post.slug} direction="up" index={index} staggerDelay={100}>
                <article className="card-hover-accent group rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="mb-2 text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {post.title}
                    </h3>
                    <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString(
                          DATE_FORMAT.LOCALE,
                          DATE_FORMAT.OPTIONS
                        )}
                      </time>
                      <span>{post.readingTime}</span>
                    </div>
                  </Link>
                </article>
              </ScrollReveal>
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
