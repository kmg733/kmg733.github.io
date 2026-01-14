import type { Project } from "@/types";

/**
 * 프로젝트 Repository 인터페이스 (Dependency Inversion)
 */
export interface IProjectRepository {
  /**
   * 모든 프로젝트를 조회합니다.
   * @returns 프로젝트 목록
   */
  findAll(): Project[];

  /**
   * ID로 프로젝트를 조회합니다.
   * @param id 프로젝트 ID
   * @returns 프로젝트 또는 null
   */
  findById(id: string): Project | null;
}
