import type { IPostRepository } from "@/interfaces";
import type { Post, PostMeta } from "@/types";
import { calculateRelevanceScore } from "@/lib/related-posts";

export interface AdjacentPosts {
  prev: PostMeta | null;
  next: PostMeta | null;
}

/**
 * 포스트 서비스 (Application Layer)
 *
 * Single Responsibility: 포스트 관련 비즈니스 로직만 담당
 * Dependency Inversion: IPostRepository 인터페이스에 의존 (구체 구현에 의존하지 않음)
 */
export class PostService {
  constructor(private readonly postRepository: IPostRepository) {}

  /**
   * 모든 포스트를 조회합니다.
   */
  getAllPosts(): PostMeta[] {
    return this.postRepository.findAll();
  }

  /**
   * 최근 포스트를 조회합니다.
   * @param count 조회할 포스트 수
   */
  getRecentPosts(count: number): PostMeta[] {
    return this.postRepository.findAll().slice(0, count);
  }

  /**
   * slug로 포스트를 조회합니다.
   * @param slug 포스트 slug
   */
  getPostBySlug(slug: string): Post | null {
    return this.postRepository.findBySlug(slug);
  }

  /**
   * 모든 포스트 slug를 조회합니다.
   * (정적 생성용)
   */
  getAllSlugs(): string[] {
    return this.postRepository.findAllSlugs();
  }

  /**
   * 태그로 포스트를 필터링합니다.
   * @param tag 태그
   */
  getPostsByTag(tag: string): PostMeta[] {
    return this.postRepository
      .findAll()
      .filter((post) => post.tags.includes(tag));
  }

  /**
   * 관련 포스트를 조회합니다.
   * 같은 subcategory 내에서 tags 기반 점수로 정렬하며,
   * 관련 글이 없으면 같은 subcategory 최신 글을 반환합니다.
   * @param slug 현재 포스트 slug
   * @param maxCount 최대 반환 개수
   */
  getRelatedPosts(slug: string, maxCount: number = 3): PostMeta[] {
    const currentPost = this.postRepository.findBySlug(slug);
    if (!currentPost?.subcategory) {
      return [];
    }

    const candidates = this.postRepository
      .findAll()
      .filter(
        (post) =>
          post.slug !== slug &&
          post.subcategory === currentPost.subcategory
      );

    if (candidates.length === 0) {
      return [];
    }

    const scored = candidates.map((post) => ({
      post,
      score: calculateRelevanceScore(currentPost, post),
    }));

    const hasRelated = scored.some((item) => item.score > 0);

    if (!hasRelated) {
      // fallback: 같은 서브카테고리 최신 글 순서 (findAll은 이미 날짜 내림차순)
      return candidates.slice(0, maxCount);
    }

    return scored
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
      })
      .slice(0, maxCount)
      .map((item) => item.post);
  }

  /**
   * 같은 시리즈의 이전/다음 포스트를 조회합니다.
   * @param slug 현재 포스트 slug
   */
  getAdjacentPosts(slug: string): AdjacentPosts {
    const currentPost = this.postRepository.findBySlug(slug);
    if (!currentPost?.series) {
      return { prev: null, next: null };
    }

    const seriesPosts = this.postRepository
      .findAll()
      .filter(
        (post) =>
          post.series === currentPost.series && post.seriesOrder != null
      )
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));

    const currentIndex = seriesPosts.findIndex(
      (post) => post.slug === slug
    );

    if (currentIndex === -1) {
      return { prev: null, next: null };
    }

    return {
      prev: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
      next:
        currentIndex < seriesPosts.length - 1
          ? seriesPosts[currentIndex + 1]
          : null,
    };
  }

  /**
   * 모든 태그를 조회합니다.
   */
  getAllTags(): string[] {
    const tags = this.postRepository
      .findAll()
      .flatMap((post) => post.tags);

    return [...new Set(tags)];
  }
}
