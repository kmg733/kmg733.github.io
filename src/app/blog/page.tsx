import { postService } from "@/lib/container";
import BlogPageClient from "@/components/BlogPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "기술 블로그 포스트 목록",
};

export default function BlogPage() {
  const posts = postService.getAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12">
        <h1 className="mb-4 text-3xl font-bold">Blog</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          개발 경험과 학습 내용을 기록합니다.
        </p>
      </header>

      <BlogPageClient posts={posts} />
    </div>
  );
}
