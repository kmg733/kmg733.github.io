import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { IPostRepository } from "@/interfaces";
import type { Post, PostMeta, PostFrontmatter } from "@/types";
import { POST_DEFAULTS } from "@/lib/constants";
import { parseGlossary } from "@/lib/glossary";

/**
 * 파일 시스템 기반 포스트 Repository 구현체 (Infrastructure Layer)
 *
 * Single Responsibility: 파일 시스템에서 포스트 데이터를 읽는 것만 담당
 * Open/Closed: IPostRepository 인터페이스를 구현하여 확장 가능
 */
export class FilePostRepository implements IPostRepository {
  private readonly postsDirectory: string;

  constructor(postsDirectory?: string) {
    this.postsDirectory =
      postsDirectory ?? path.join(process.cwd(), POST_DEFAULTS.DIRECTORY);
  }

  findAll(): PostMeta[] {
    if (!this.directoryExists()) {
      return [];
    }

    const fileNames = this.getMarkdownFiles();
    const posts = fileNames.map((fileName) => this.parsePostMeta(fileName));

    return this.sortByDateDescending(posts);
  }

  findBySlug(slug: string): Post | null {
    const filePath = this.resolveFilePath(slug);

    if (!filePath) {
      return null;
    }

    return this.parsePost(slug, filePath);
  }

  findAllSlugs(): string[] {
    if (!this.directoryExists()) {
      return [];
    }

    return this.getMarkdownFiles().map((fileName) =>
      this.extractSlugFromFileName(fileName)
    );
  }

  // Private helper methods (Single Responsibility)

  private directoryExists(): boolean {
    return fs.existsSync(this.postsDirectory);
  }

  private getMarkdownFiles(): string[] {
    return fs
      .readdirSync(this.postsDirectory)
      .filter((fileName) => this.isMarkdownFile(fileName));
  }

  private isMarkdownFile(fileName: string): boolean {
    return fileName.endsWith(".md") || fileName.endsWith(".mdx");
  }

  private extractSlugFromFileName(fileName: string): string {
    return fileName.replace(/\.mdx?$/, "");
  }

  private resolveFilePath(slug: string): string | null {
    const mdxPath = path.join(this.postsDirectory, `${slug}.mdx`);
    const mdPath = path.join(this.postsDirectory, `${slug}.md`);

    if (fs.existsSync(mdxPath)) {
      return mdxPath;
    }

    if (fs.existsSync(mdPath)) {
      return mdPath;
    }

    return null;
  }

  private parsePostMeta(fileName: string): PostMeta {
    const slug = this.extractSlugFromFileName(fileName);
    const fullPath = path.join(this.postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return this.buildPostMeta(slug, data as PostFrontmatter, content);
  }

  private parsePost(slug: string, filePath: string): Post {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);
    const glossary = parseGlossary((data as Record<string, unknown>).glossary);

    return {
      ...this.buildPostMeta(slug, data as PostFrontmatter, content),
      content,
      ...(glossary.length > 0 && { glossary }),
    };
  }

  private buildPostMeta(
    slug: string,
    frontmatter: PostFrontmatter,
    content: string
  ): PostMeta {
    const stats = readingTime(content);

    return {
      slug,
      title: frontmatter.title ?? slug,
      date: frontmatter.date ?? new Date().toISOString(),
      description: frontmatter.description ?? POST_DEFAULTS.DESCRIPTION,
      category: frontmatter.category ?? POST_DEFAULTS.CATEGORY,
      subcategory: frontmatter.subcategory,
      tags: frontmatter.tags ?? [...POST_DEFAULTS.TAGS],
      readingTime: stats.text,
      ...(frontmatter.series && { series: frontmatter.series }),
      ...(frontmatter.seriesOrder != null && {
        seriesOrder: frontmatter.seriesOrder,
      }),
    };
  }

  private sortByDateDescending(posts: PostMeta[]): PostMeta[] {
    return posts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}
