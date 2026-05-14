import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import FeaturedPostCard from "@/components/FeaturedPostCard";
import type { PostMeta } from "@/types";

interface FeaturedPostsSectionProps {
  posts: PostMeta[];
}

export default function FeaturedPostsSection({
  posts,
}: FeaturedPostsSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section>
      <ScrollReveal direction="fade">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">추천글</h2>
          <Link
            href="/blog"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            모든 글 보기 →
          </Link>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {posts.map((post, index) => (
          <ScrollReveal key={post.slug} direction="up" index={index} staggerDelay={80}>
            <FeaturedPostCard post={post} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
