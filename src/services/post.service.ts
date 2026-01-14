import type { IPostRepository } from "@/interfaces";
import type { Post, PostMeta } from "@/types";

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
   * 모든 태그를 조회합니다.
   */
  getAllTags(): string[] {
    const tags = this.postRepository
      .findAll()
      .flatMap((post) => post.tags);

    return [...new Set(tags)];
  }
}
