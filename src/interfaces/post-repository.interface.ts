import type { Post, PostMeta } from "@/types";

/**
 * 포스트 Repository 인터페이스 (Dependency Inversion)
 *
 * Application Layer는 이 인터페이스에 의존하고,
 * Infrastructure Layer에서 구체적인 구현을 제공합니다.
 */
export interface IPostRepository {
  /**
   * 모든 포스트 메타데이터를 조회합니다.
   * @returns 날짜 내림차순으로 정렬된 포스트 목록
   */
  findAll(): PostMeta[];

  /**
   * slug로 포스트를 조회합니다.
   * @param slug 포스트 slug
   * @returns 포스트 또는 null
   */
  findBySlug(slug: string): Post | null;

  /**
   * 모든 포스트 slug를 조회합니다.
   * @returns slug 배열
   */
  findAllSlugs(): string[];
}
