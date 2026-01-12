import { FilePostRepository, StaticProjectRepository } from "@/repositories";
import { PostService, ProjectService } from "@/services";
import { projectsData } from "@/data/projects";

/**
 * 의존성 주입 컨테이너 (Composition Root)
 *
 * 애플리케이션의 모든 의존성을 한 곳에서 조립합니다.
 * Clean Architecture의 가장 바깥 계층에서 의존성을 연결합니다.
 */

// Repository 인스턴스 (Infrastructure Layer)
const postRepository = new FilePostRepository();
const projectRepository = new StaticProjectRepository(projectsData);

// Service 인스턴스 (Application Layer)
export const postService = new PostService(postRepository);
export const projectService = new ProjectService(projectRepository);
