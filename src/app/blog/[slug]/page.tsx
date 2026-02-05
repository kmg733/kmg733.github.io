import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { postService } from "@/lib/container";
import { extractHeadings } from "@/lib/toc";
import { DATE_FORMAT } from "@/lib/constants";
import TableOfContents from "@/components/TableOfContents";
import RelatedPosts from "@/components/RelatedPosts";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = postService.getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = postService.getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = postService.getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content);
  const relatedPosts = postService.getRelatedPosts(slug, 3);

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-16">
      <div className="flex gap-8">
        {/* 본문 영역 */}
        <article className="min-w-0 flex-1">
          <header className="mb-12">
            <time
              dateTime={post.date}
              className="text-sm text-zinc-500 dark:text-zinc-500"
            >
              {new Date(post.date).toLocaleDateString(
                DATE_FORMAT.LOCALE,
                DATE_FORMAT.OPTIONS
              )}
            </time>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
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
            <div className="mt-4 text-sm text-zinc-500">{post.readingTime}</div>
          </header>

          <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-amber-700 hover:prose-a:text-amber-800 prose-code:rounded prose-code:bg-amber-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-amber-900 prose-code:before:content-none prose-code:after:content-none dark:prose-a:text-blue-400 dark:prose-code:bg-zinc-800 dark:prose-code:text-zinc-200">
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeSlug],
                },
              }}
            />
          </div>

          <RelatedPosts posts={relatedPosts} />
        </article>

        {/* 우측 목차 영역 */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <TableOfContents headings={headings} />
          </div>
        </aside>
      </div>
    </div>
  );
}
