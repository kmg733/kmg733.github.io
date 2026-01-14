import type { IProjectRepository } from "@/interfaces";
import type { Project } from "@/types";

/**
 * 정적 데이터 기반 프로젝트 Repository 구현체 (Infrastructure Layer)
 *
 * Single Responsibility: 정적 프로젝트 데이터 제공만 담당
 * Open/Closed: IProjectRepository 인터페이스를 구현하여 확장 가능
 *              (향후 DB나 CMS 연동 시 새로운 구현체 추가)
 */
export class StaticProjectRepository implements IProjectRepository {
  private readonly projects: Project[];

  constructor(projects: Project[]) {
    this.projects = projects;
  }

  findAll(): Project[] {
    return [...this.projects];
  }

  findById(id: string): Project | null {
    return this.projects.find((project) => project.id === id) ?? null;
  }
}
