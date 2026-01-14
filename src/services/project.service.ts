import type { IProjectRepository } from "@/interfaces";
import type { Project } from "@/types";

/**
 * 프로젝트 서비스 (Application Layer)
 *
 * Single Responsibility: 프로젝트 관련 비즈니스 로직만 담당
 * Dependency Inversion: IProjectRepository 인터페이스에 의존
 */
export class ProjectService {
  constructor(private readonly projectRepository: IProjectRepository) {}

  /**
   * 모든 프로젝트를 조회합니다.
   */
  getAllProjects(): Project[] {
    return this.projectRepository.findAll();
  }

  /**
   * ID로 프로젝트를 조회합니다.
   * @param id 프로젝트 ID
   */
  getProjectById(id: string): Project | null {
    return this.projectRepository.findById(id);
  }

  /**
   * 태그로 프로젝트를 필터링합니다.
   * @param tag 태그
   */
  getProjectsByTag(tag: string): Project[] {
    return this.projectRepository
      .findAll()
      .filter((project) => project.tags.includes(tag));
  }
}
